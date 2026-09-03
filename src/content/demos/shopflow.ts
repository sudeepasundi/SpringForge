import type { DemoFile } from '@/lib/types';

/**
 * The order side of ShopFlow: the write model, the transactional outbox, and
 * the saga orchestrator that coordinates checkout across four services.
 */
export const shopflowOrderFiles: DemoFile[] = [
  {
    path: 'order-service/src/main/java/dev/springforge/shopflow/order/OrderService.java',
    lang: 'java',
    note: 'One transaction covers the order and its outbox row — no dual write.',
    code: `package dev.springforge.shopflow.order;

import dev.springforge.shopflow.common.outbox.DomainEvents;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orders;
    private final DomainEvents events;
    private final OrderSaga saga;

    public OrderService(OrderRepository orders, DomainEvents events, OrderSaga saga) {
        this.orders = orders;
        this.events = events;
        this.saga = saga;
    }

    /**
     * The order is created PENDING. Nothing downstream has happened yet — the
     * saga drives that, and the order only becomes CONFIRMED once every step
     * has succeeded.
     */
    @Transactional
    public OrderResponse place(PlaceOrderCommand command) {
        Order order = orders.save(Order.pending(
                command.customerId(), command.items(), command.total()));

        // Written to the outbox table in this same transaction. If the commit
        // fails, no event exists; if it succeeds, the event is durable and the
        // relay will publish it. There is no window where one exists without
        // the other.
        events.publish("order", order.getId().toString(),
                new OrderPlaced(
                        order.getId(),
                        order.getCustomerId(),
                        order.getItems(),
                        order.getTotal(),
                        order.getPlacedAt()));

        saga.start(order.getId(), order.getItems(), order.getTotal());

        return OrderResponse.from(order);
    }

    public OrderResponse get(UUID orderId) {
        return orders.findById(orderId)
                .map(OrderResponse::from)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
    }
}`,
  },
  {
    path: 'order-service/src/main/java/dev/springforge/shopflow/order/Order.java',
    lang: 'java',
    note: 'PENDING is a first-class state: a saga in flight is a promise, not a fact.',
    code: `package dev.springforge.shopflow.order;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    private UUID id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
    private List<OrderItem> items;

    @Column(name = "total_minor", nullable = false)
    private long totalMinor;

    @Column(name = "placed_at", nullable = false, updatable = false)
    private Instant placedAt;

    @Column(name = "failure_reason")
    private String failureReason;

    @Version
    private long version;

    protected Order() {
        // JPA
    }

    public static Order pending(UUID customerId, List<OrderItem> items, Money total) {
        Order order = new Order();
        // Assigned here, not by the database, so the id is stable from creation
        // and equals/hashCode are safe for the object's whole life.
        order.id = UUID.randomUUID();
        order.customerId = customerId;
        order.items = List.copyOf(items);
        order.totalMinor = total.minor();
        order.status = OrderStatus.PENDING;
        order.placedAt = Instant.now();
        return order;
    }

    void confirm() {
        requireStatus(OrderStatus.PENDING);
        this.status = OrderStatus.CONFIRMED;
    }

    void cancel(String reason) {
        requireStatus(OrderStatus.PENDING);
        this.status = OrderStatus.CANCELLED;
        this.failureReason = reason;
    }

    /** Compensation itself failed. A human has to look at this one. */
    void markFailed(String reason) {
        this.status = OrderStatus.FAILED;
        this.failureReason = reason;
    }

    private void requireStatus(OrderStatus expected) {
        if (status != expected) {
            throw new IllegalStateException(
                    "Order %s is %s, expected %s".formatted(id, status, expected));
        }
    }

    public UUID getId() { return id; }
    public UUID getCustomerId() { return customerId; }
    public OrderStatus getStatus() { return status; }
    public List<OrderItem> getItems() { return items; }
    public Money getTotal() { return Money.ofMinor(totalMinor); }
    public Instant getPlacedAt() { return placedAt; }

    @Override
    public boolean equals(Object other) {
        return other instanceof Order order && id.equals(order.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}`,
  },
  {
    path: 'order-service/src/main/java/dev/springforge/shopflow/order/OrderSaga.java',
    lang: 'java',
    note: 'Orchestration: the whole checkout flow, including every compensation, in one file.',
    code: `package dev.springforge.shopflow.order;

import dev.springforge.shopflow.common.outbox.DomainEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Six participants would make choreography unreadable, so checkout is
 * orchestrated: one state machine, persisted, queryable when an order is stuck.
 */
@Component
public class OrderSaga {

    private static final Logger log = LoggerFactory.getLogger(OrderSaga.class);
    private static final Duration STUCK_AFTER = Duration.ofMinutes(15);

    private final SagaStateRepository sagas;
    private final OrderRepository orders;
    private final DomainEvents events;

    public OrderSaga(SagaStateRepository sagas, OrderRepository orders, DomainEvents events) {
        this.sagas = sagas;
        this.orders = orders;
        this.events = events;
    }

    @Transactional
    public void start(UUID orderId, List<OrderItem> items, Money total) {
        sagas.save(SagaState.started(orderId, items, total));
        // Reserving stock is trivially reversible, so it goes first. Capturing
        // payment is not, so it goes second.
        events.publish("order", orderId.toString(), new ReserveStock(orderId, items));
    }

    @KafkaListener(topics = "shopflow.inventory.events", groupId = "order-saga")
    @Transactional
    public void onStockReserved(StockReserved event) {
        SagaState saga = sagas.load(event.orderId());
        // The state machine is the dedup: an event that does not advance it is
        // a redelivery, and doing nothing is the correct response.
        if (!saga.advanceTo(SagaStep.STOCK_RESERVED)) {
            return;
        }
        events.publish("order", saga.orderId().toString(),
                new CapturePayment(saga.orderId(), saga.total()));
    }

    @KafkaListener(topics = "shopflow.payment.events", groupId = "order-saga")
    @Transactional
    public void onPaymentCaptured(PaymentCaptured event) {
        SagaState saga = sagas.load(event.orderId());
        if (!saga.advanceTo(SagaStep.PAYMENT_CAPTURED)) {
            return;
        }

        Order order = orders.findById(saga.orderId()).orElseThrow();
        order.confirm();
        saga.advanceTo(SagaStep.CONFIRMED);

        // Shipping is last precisely because a dispatch notification cannot be
        // recalled. Nothing after this point needs compensating.
        events.publish("order", order.getId().toString(),
                new OrderConfirmed(order.getId(), order.getItems(), order.getTotal()));
    }

    @KafkaListener(topics = "shopflow.payment.events", groupId = "order-saga")
    @Transactional
    public void onPaymentFailed(PaymentFailed event) {
        SagaState saga = sagas.load(event.orderId());
        if (!saga.advanceTo(SagaStep.COMPENSATING)) {
            return;
        }

        log.warn("Payment failed for order {}: {}", event.orderId(), event.reason());
        saga.recordFailure(event.reason());

        // Compensate completed steps in reverse order.
        saga.completedSteps().reversed()
                .forEach(step -> events.publish("order", saga.orderId().toString(),
                        compensationFor(step, saga)));
    }

    @KafkaListener(topics = "shopflow.inventory.events", groupId = "order-saga")
    @Transactional
    public void onStockReleased(StockReleased event) {
        SagaState saga = sagas.load(event.orderId());
        saga.markCompensated(SagaStep.STOCK_RESERVED);

        if (saga.fullyCompensated()) {
            orders.findById(saga.orderId()).orElseThrow().cancel(saga.failureReason());
            saga.advanceTo(SagaStep.CANCELLED);
        }
    }

    /**
     * A saga that has not reached a terminal state in time is stuck. Alerting on
     * it is what turns a silent hang into an operational event.
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional(readOnly = true)
    public void reportStuckSagas() {
        sagas.findUnterminatedBefore(Instant.now().minus(STUCK_AFTER))
                .forEach(saga -> log.error(
                        "Saga stuck: order={} step={} since={}",
                        saga.orderId(), saga.currentStep(), saga.updatedAt()));
    }

    private Object compensationFor(SagaStep step, SagaState saga) {
        return switch (step) {
            case STOCK_RESERVED -> new ReleaseStock(saga.orderId(), saga.items());
            case PAYMENT_CAPTURED -> new RefundPayment(saga.orderId(), saga.total());
            default -> throw new IllegalStateException("No compensation for " + step);
        };
    }
}`,
  },
  {
    path: 'order-service/src/main/java/dev/springforge/shopflow/common/outbox/DomainEvents.java',
    lang: 'java',
    note: 'The assertion turns "someone published outside a transaction" into a failing test.',
    code: `package dev.springforge.shopflow.common.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.Assert;

@Component
public class DomainEvents {

    private final OutboxRepository outbox;
    private final ObjectMapper objectMapper;

    public DomainEvents(OutboxRepository outbox, ObjectMapper objectMapper) {
        this.outbox = outbox;
        this.objectMapper = objectMapper;
    }

    /**
     * Records an event in the outbox table. Must be called inside a transaction:
     * joining the caller's transaction is the entire point of the pattern, and
     * publishing outside one silently reintroduces the dual-write problem.
     */
    public void publish(String aggregateType, String aggregateId, Object event) {
        Assert.state(TransactionSynchronizationManager.isActualTransactionActive(),
                "Domain events must be published inside a transaction");

        outbox.save(new OutboxRecord(
                aggregateType,
                aggregateId,                          // becomes the Kafka key
                event.getClass().getSimpleName(),
                objectMapper.valueToTree(event)));
    }
}`,
  },
  {
    path: 'order-service/src/main/java/dev/springforge/shopflow/common/outbox/OutboxRelay.java',
    lang: 'java',
    note: 'SKIP LOCKED lets several instances relay concurrently; the break preserves per-aggregate ordering.',
    code: `package dev.springforge.shopflow.common.outbox;

import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class OutboxRelay {

    private static final Logger log = LoggerFactory.getLogger(OutboxRelay.class);
    private static final int BATCH_SIZE = 100;

    private final OutboxRepository outbox;
    private final KafkaTemplate<String, Object> kafka;

    public OutboxRelay(OutboxRepository outbox, KafkaTemplate<String, Object> kafka) {
        this.outbox = outbox;
        this.kafka = kafka;
    }

    @Scheduled(fixedDelay = 500)
    @SchedulerLock(name = "outboxRelay", lockAtMostFor = "PT30S")
    @Transactional
    public void publishPending() {
        // SELECT ... FOR UPDATE SKIP LOCKED: several instances can work the
        // table at once without contending on the same rows.
        List<OutboxRecord> pending = outbox.findUnpublishedForUpdate(BATCH_SIZE);

        for (OutboxRecord record : pending) {
            try {
                kafka.send(topicFor(record), record.getAggregateId(), record.getPayload())
                        .get(5, TimeUnit.SECONDS);   // synchronous: we must know it landed
                record.markPublished(Instant.now());
            } catch (Exception e) {
                // Stop rather than skip. Continuing would publish a later event
                // for this aggregate before an earlier one, breaking the ordering
                // the Kafka key was chosen to guarantee.
                log.warn("Outbox publish failed for {}; retrying next tick", record.getId(), e);
                break;
            }
        }
    }

    private String topicFor(OutboxRecord record) {
        return "shopflow." + record.getAggregateType() + ".events";
    }
}`,
  },
  {
    path: 'order-service/src/main/resources/db/migration/V2__create_outbox.sql',
    lang: 'sql',
    note: 'A partial index keeps the relay query fast no matter how large the table grows.',
    code: `create table outbox (
    id             uuid         primary key default gen_random_uuid(),
    aggregate_type varchar(100) not null,
    aggregate_id   varchar(100) not null,
    event_type     varchar(150) not null,
    payload        jsonb        not null,
    created_at     timestamptz  not null default now(),
    published_at   timestamptz
);

-- The relay only ever asks for unpublished rows, oldest first. A partial index
-- stays small even when the table holds millions of published rows.
create index idx_outbox_unpublished
    on outbox (created_at)
    where published_at is null;

create table saga_state (
    order_id        uuid         primary key,
    current_step    varchar(40)  not null,
    completed_steps varchar(400) not null default '',
    total_minor     bigint       not null,
    failure_reason  varchar(500),
    created_at      timestamptz  not null default now(),
    updated_at      timestamptz  not null default now()
);

-- Supports the stuck-saga sweep: non-terminal sagas older than a threshold.
create index idx_saga_state_unterminated
    on saga_state (updated_at)
    where current_step not in ('CONFIRMED', 'CANCELLED', 'FAILED');`,
  },
];

/**
 * The downstream half: consumers that must tolerate at-least-once delivery, and
 * the idempotency machinery that makes that safe.
 */
export const shopflowConsumerFiles: DemoFile[] = [
  {
    path: 'inventory-service/src/main/java/dev/springforge/shopflow/inventory/StockConsumer.java',
    lang: 'java',
    note: 'A business failure is published as an event, not thrown — throwing would leave the saga stuck.',
    code: `package dev.springforge.shopflow.inventory;

import dev.springforge.shopflow.common.idempotency.ProcessedEvents;
import dev.springforge.shopflow.common.outbox.DomainEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class StockConsumer {

    private static final Logger log = LoggerFactory.getLogger(StockConsumer.class);

    private final StockService stock;
    private final ProcessedEvents processed;
    private final DomainEvents events;

    public StockConsumer(StockService stock, ProcessedEvents processed, DomainEvents events) {
        this.stock = stock;
        this.processed = processed;
        this.events = events;
    }

    @KafkaListener(topics = "shopflow.order.events", groupId = "inventory-service")
    @Transactional
    public void onReserveStock(ReserveStock command) {
        // Kafka is at-least-once. markProcessed inserts first and lets a unique
        // constraint arbitrate, so two concurrent redeliveries cannot both pass.
        if (!processed.markProcessed(command.eventId(), "inventory-service")) {
            log.debug("Duplicate {}, skipping", command.eventId());
            return;
        }

        try {
            stock.reserve(command.orderId(), command.items());
            events.publish("inventory", command.orderId().toString(),
                    new StockReserved(command.orderId(), command.items()));
        } catch (InsufficientStockException e) {
            // A business outcome, not a transient error. Throwing here would
            // retry the message, eventually dead-letter it, and leave the saga
            // waiting forever for a reply that never comes.
            events.publish("inventory", command.orderId().toString(),
                    new StockReservationFailed(command.orderId(), e.getMessage()));
        }
    }

    @KafkaListener(topics = "shopflow.order.events", groupId = "inventory-service")
    @Transactional
    public void onReleaseStock(ReleaseStock command) {
        if (!processed.markProcessed(command.eventId(), "inventory-service")) {
            return;
        }
        // Compensation must be idempotent in its own right: releasing stock that
        // was never reserved, or already released, is a no-op rather than an error.
        stock.releaseIfReserved(command.orderId());
        events.publish("inventory", command.orderId().toString(),
                new StockReleased(command.orderId()));
    }
}`,
  },
  {
    path: 'inventory-service/src/main/java/dev/springforge/shopflow/common/idempotency/ProcessedEvents.java',
    lang: 'java',
    note: 'Insert-then-catch, not check-then-act: the unique constraint is what makes it race-free.',
    code: `package dev.springforge.shopflow.common.idempotency;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class ProcessedEvents {

    private final JdbcTemplate jdbc;

    public ProcessedEvents(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Records an event as processed.
     *
     * @return true if this is the first time; false if it was already processed.
     *
     * The insert happens first deliberately. A SELECT-then-INSERT is a race that
     * two concurrent redeliveries can both pass; letting the primary key reject
     * the second is atomic. The caller runs this inside the same transaction as
     * the work, so a marker can never exist for work that rolled back.
     */
    public boolean markProcessed(UUID eventId, String consumer) {
        try {
            jdbc.update("""
                    insert into processed_events (event_id, consumer, processed_at)
                    values (?, ?, ?)
                    """, eventId, consumer, Instant.now());
            return true;
        } catch (DataIntegrityViolationException alreadyProcessed) {
            return false;
        }
    }
}`,
  },
  {
    path: 'payment-service/src/main/java/dev/springforge/shopflow/payment/PaymentService.java',
    lang: 'java',
    note: 'The request-hash check catches a reused key with a different body — a client bug, not a retry.',
    code: `package dev.springforge.shopflow.payment;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class PaymentService {

    private final PaymentGateway gateway;
    private final IdempotencyRepository keys;

    public PaymentService(PaymentGateway gateway, IdempotencyRepository keys) {
        this.gateway = gateway;
        this.keys = keys;
    }

    @Transactional
    public PaymentResult charge(ChargeRequest request, String idempotencyKey) {
        String requestHash = hash(request);

        Optional<IdempotencyRecord> existing = keys.find(idempotencyKey);
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            // Same key, different body: the client has reused a key by mistake.
            // Returning the original result would silently discard this charge
            // and tell the caller it succeeded.
            if (!record.requestHash().equals(requestHash)) {
                throw new IdempotencyKeyReusedException(idempotencyKey);
            }
            return record.result();
        }

        try {
            PaymentResult result = gateway.charge(request.orderId(), request.amount());
            // Recorded in the same transaction as the charge record, so the two
            // cannot diverge.
            keys.save(new IdempotencyRecord(idempotencyKey, requestHash, result));
            return result;
        } catch (DataIntegrityViolationException concurrentRetry) {
            // Two retries raced past the check above. The unique constraint means
            // exactly one performed the charge; return what it recorded.
            return keys.find(idempotencyKey)
                    .map(IdempotencyRecord::result)
                    .orElseThrow(() -> concurrentRetry);
        }
    }
}`,
  },
  {
    path: 'order-service/src/main/java/dev/springforge/shopflow/order/CatalogGateway.java',
    lang: 'java',
    note: 'The fallback serves an event-fed projection the service owns — not a cache, so there is no fallback call.',
    code: `package dev.springforge.shopflow.order;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CatalogGateway {

    private static final Logger log = LoggerFactory.getLogger(CatalogGateway.class);

    private final CatalogApi catalog;
    private final ProductProjectionRepository projection;

    public CatalogGateway(CatalogApi catalog, ProductProjectionRepository projection) {
        this.catalog = catalog;
        this.projection = projection;
    }

    // Retry wraps the breaker, so retries against an open breaker fail in
    // microseconds rather than testing a dependency that is known to be down.
    @CircuitBreaker(name = "catalog", fallbackMethod = "fromProjection")
    @Retry(name = "catalog")
    @Bulkhead(name = "catalog")
    public ProductView byId(UUID productId) {
        return catalog.byId(productId);
    }

    /**
     * Fallback signature: same parameters, plus the exception, same return type.
     * Getting it wrong fails at runtime rather than at compile time.
     */
    ProductView fromProjection(UUID productId, Exception cause) {
        log.warn("Catalog unavailable for {}; serving local projection", productId, cause);

        return projection.find(productId)
                .map(ProductView::stale)      // marked, so the caller knows it is not current
                // No safe answer: fail rather than invent a default that could be
                // written back into an order.
                .orElseThrow(() -> new CatalogUnavailableException(productId, cause));
    }
}`,
  },
];
