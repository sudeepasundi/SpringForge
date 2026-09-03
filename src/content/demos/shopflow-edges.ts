import type { DemoFile } from '@/lib/types';

/**
 * The two services at the ends of the checkout flow.
 *
 * Catalog is upstream of everything and synchronously depended on by nobody —
 * it publishes, and consumers keep projections. Shipping is the terminal step,
 * and the one that cannot be compensated.
 */
export const shopflowEdgeFiles: DemoFile[] = [
  {
    path: 'catalog-service/src/main/java/dev/springforge/shopflow/catalog/CatalogService.java',
    lang: 'java',
    note: 'Publishes state, not deltas — so a consumer applying an event twice reaches the same result.',
    code: `package dev.springforge.shopflow.catalog;

import dev.springforge.shopflow.common.outbox.DomainEvents;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private final ProductRepository products;
    private final DomainEvents events;

    public CatalogService(ProductRepository products, DomainEvents events) {
        this.products = products;
        this.events = events;
    }

    @Transactional
    public ProductView rename(UUID productId, String newName) {
        Product product = products.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        product.rename(newName);

        // The event carries the resulting name and a version, not "the name
        // changed". An absolute value is idempotent by construction, and the
        // version lets a consumer ignore an event older than what it already has.
        events.publish("catalog", productId.toString(),
                new ProductRenamed(productId, product.getName(), product.getVersion()));

        return ProductView.from(product);
    }

    @Transactional
    public ProductView reprice(UUID productId, Money newPrice) {
        Product product = products.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        product.reprice(newPrice);

        events.publish("catalog", productId.toString(),
                new ProductRepriced(productId, product.getPrice(), product.getVersion()));

        return ProductView.from(product);
    }

    /**
     * Note what this does NOT do: nothing here calls order-service, inventory or
     * anything else. Catalog is upstream of the whole system and depends on none
     * of it, which is why its outage degrades consumers rather than stopping them.
     */
    public ProductView byId(UUID productId) {
        return products.findById(productId)
                .map(ProductView::from)
                .orElseThrow(() -> new ProductNotFoundException(productId));
    }
}`,
  },
  {
    path: 'catalog-service/src/main/java/dev/springforge/shopflow/catalog/CatalogTopicConfig.java',
    lang: 'java',
    note: 'Compaction is what makes a consumer projection rebuildable — default retention is not history.',
    code: `package dev.springforge.shopflow.catalog;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

import java.util.Map;

@Configuration
public class CatalogTopicConfig {

    /**
     * Compacted, not time-retained. Consumers build projections from this topic
     * and must be able to rebuild them from scratch — with the default seven-day
     * retention, a rebuild would silently produce a projection missing every
     * product that has not changed this week.
     *
     * Compaction keeps the latest record per key forever, so replaying the topic
     * from the beginning reconstructs current state for every product.
     */
    @Bean
    NewTopic catalogEvents() {
        return TopicBuilder.name("shopflow.catalog.events")
                .partitions(12)          // over-provisioned: repartitioning breaks key routing
                .replicas(3)
                .configs(Map.of(
                        "cleanup.policy", "compact",
                        "min.insync.replicas", "2",   // or acks=all can be met by the leader alone
                        "min.cleanable.dirty.ratio", "0.1",
                        "segment.ms", "3600000"))
                .build();
    }
}`,
  },
  {
    path: 'order-service/src/main/java/dev/springforge/shopflow/order/ProductProjection.java',
    lang: 'java',
    note: 'Data the order service owns. Not a cache — there is no fallback call when catalog is down.',
    code: `package dev.springforge.shopflow.order;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * A local read model fed by catalog's events.
 *
 * The distinction from a cache matters: a cache miss falls back to calling
 * catalog, so the dependency is still there. This has no such path — when
 * catalog is down the order list keeps working and simply stops learning about
 * renames until it recovers.
 */
@Component
public class ProductProjection {

    private final ProductProjectionRepository repository;

    public ProductProjection(ProductProjectionRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = "shopflow.catalog.events", groupId = "order-service-catalog-projection")
    @Transactional
    public void on(CatalogEvent event) {
        switch (event) {
            // Upsert by primary key: applying the same event twice produces the
            // same row, so no dedup table is needed for this projection.
            case ProductRenamed e ->
                    repository.upsertName(e.productId(), e.name(), e.version());

            case ProductRepriced e ->
                    repository.upsertPrice(e.productId(), e.priceMinor(), e.version());

            default -> { }   // events this projection does not care about
        }
    }

    public java.util.Optional<ProductView> find(UUID productId) {
        return repository.find(productId);
    }
}`,
  },
  {
    path: 'order-service/src/main/resources/db/migration/V3__create_product_projection.sql',
    lang: 'sql',
    note: 'The version guard makes the projection safe against out-of-order delivery.',
    code: `create table product_projection (
    product_id  uuid         primary key,
    name        varchar(300) not null,
    price_minor bigint       not null,
    currency    varchar(3)   not null default 'GBP',
    version     bigint       not null,
    updated_at  timestamptz  not null default now()
);

comment on table product_projection is
    'Owned by order-service, fed by shopflow.catalog.events. Never queried by '
    'catalog, and never used to make a decision — display only.';

-- The upsert used by ProductProjection. The version guard is what makes this
-- safe when events arrive out of order: an older event updates zero rows
-- instead of overwriting fresher data.
--
--   insert into product_projection (product_id, name, price_minor, version)
--   values (?, ?, ?, ?)
--   on conflict (product_id) do update
--       set name = excluded.name,
--           price_minor = excluded.price_minor,
--           version = excluded.version,
--           updated_at = now()
--   where product_projection.version < excluded.version;`,
  },
  {
    path: 'shipping-service/src/main/java/dev/springforge/shopflow/shipping/ShipmentConsumer.java',
    lang: 'java',
    note: 'The terminal step. Nothing after this can be compensated, which is why the saga puts it last.',
    code: `package dev.springforge.shopflow.shipping;

import dev.springforge.shopflow.common.idempotency.ProcessedEvents;
import dev.springforge.shopflow.common.outbox.DomainEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * The last step of the checkout saga, and the irreversible one.
 *
 * Booking a courier collection and emailing a customer "your order has shipped"
 * cannot be undone — there is no compensating action that unsends an email. That
 * is precisely why the saga orders this after stock and payment: by the time it
 * runs, nothing else can fail and require it to be reversed.
 */
@Component
public class ShipmentConsumer {

    private static final Logger log = LoggerFactory.getLogger(ShipmentConsumer.class);

    private final ShipmentService shipments;
    private final CourierClient courier;
    private final ProcessedEvents processed;
    private final DomainEvents events;

    public ShipmentConsumer(ShipmentService shipments,
                            CourierClient courier,
                            ProcessedEvents processed,
                            DomainEvents events) {
        this.shipments = shipments;
        this.courier = courier;
        this.processed = processed;
        this.events = events;
    }

    @KafkaListener(topics = "shopflow.order.events", groupId = "shipping-service")
    @Transactional
    public void onOrderConfirmed(OrderConfirmed event) {
        // Idempotency matters more here than anywhere else in the system: a
        // redelivery would book a second collection and send a second email,
        // and neither can be taken back.
        if (!processed.markProcessed(event.eventId(), "shipping-service")) {
            log.debug("Duplicate {}, shipment already booked", event.eventId());
            return;
        }

        Shipment shipment = shipments.create(event.orderId(), event.items());

        // The courier booking is an external side effect, so it carries the
        // shipment id as an idempotency key — a retry after a timeout must not
        // book a second collection.
        String trackingCode = courier.book(shipment.getId(), shipment.address());
        shipment.assignTracking(trackingCode);

        events.publish("shipping", event.orderId().toString(),
                new OrderShipped(event.orderId(), shipment.getId(), trackingCode));
    }
}`,
  },
  {
    path: 'shipping-service/src/main/resources/application.yml',
    lang: 'yaml',
    note: 'A dead-letter topic with an owner and an alert — an unwatched DLT is silently undelivered orders.',
    code: `spring:
  application:
    name: shipping-service

  kafka:
    bootstrap-servers: \${KAFKA_BROKERS}
    consumer:
      group-id: shipping-service
      auto-offset-reset: earliest
      enable-auto-commit: false
      properties:
        isolation.level: read_committed
    listener:
      ack-mode: RECORD

resilience4j:
  retry:
    instances:
      courier:
        max-attempts: 3
        wait-duration: 500ms
        exponential-backoff-multiplier: 2
        randomized-wait-factor: 0.5
  circuitbreaker:
    instances:
      courier:
        sliding-window-size: 50
        minimum-number-of-calls: 20
        failure-rate-threshold: 50
        slow-call-duration-threshold: 3s
        slow-call-rate-threshold: 80

shopflow:
  shipping:
    # A record that always fails blocks its partition forever. After the retries
    # are exhausted it goes here — and this topic has a named owner, an alert on
    # depth > 0, and a documented replay procedure. A dead-letter topic nobody
    # watches is a queue of orders that were silently never shipped.
    dead-letter-topic: shopflow.order.events.DLT
    dead-letter-alert-threshold: 1

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true
      group:
        readiness:
          include: db, readinessState
        liveness:
          include: livenessState`,
  },
];
