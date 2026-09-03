import type { DemoFile } from '@/lib/types';

/**
 * The platform half of ShopFlow: the edge, the Kafka and resilience
 * configuration, and everything needed to actually run it.
 */
export const shopflowPlatformFiles: DemoFile[] = [
  {
    path: 'gateway/src/main/resources/application.yml',
    lang: 'yaml',
    note: 'Routing, edge rate limiting and per-route circuit breaking. No business logic.',
    code: `spring:
  application:
    name: gateway

  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: \${OIDC_ISSUER_URI}
          audiences: shopflow-api        # without this, any client's token is accepted

  cloud:
    gateway:
      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Origin, RETAIN_UNIQUE
      routes:
        - id: orders
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - name: CircuitBreaker
              args:
                name: orders
                fallbackUri: forward:/fallback/orders
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 20
                redis-rate-limiter.burstCapacity: 40
                key-resolver: "#{@userKeyResolver}"

        - id: catalog
          uri: lb://catalog-service
          predicates:
            - Path=/api/catalog/**
          filters:
            # Catalog data is public and changes rarely, so it is worth caching
            # at the edge rather than in every client.
            - name: LocalResponseCache
              args:
                timeToLive: 60s
                size: 50MB

      globalcors:
        cors-configurations:
          '[/api/**]':
            allowedOrigins: \${ALLOWED_ORIGINS}   # never a wildcard with credentials
            allowedMethods: [GET, POST, PUT, PATCH, DELETE]
            allowedHeaders: [Authorization, Content-Type, Idempotency-Key]
            allowCredentials: true
            maxAge: 3600

management:
  server:
    port: 8081                  # not the traffic port; not exposed at the ingress
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,gateway`,
  },
  {
    path: 'order-service/src/main/resources/application.yml',
    lang: 'yaml',
    note: 'acks=all with idempotence, manual offset commits, and resilience policies per dependency.',
    code: `spring:
  application:
    name: order-service

  datasource:
    url: \${DB_URL}
    username: \${DB_USER}
    password: \${DB_PASSWORD}          # no default: startup fails if unset
    hikari:
      maximum-pool-size: 10           # sized against the database, not the CPU count
      leak-detection-threshold: 20000

  jpa:
    open-in-view: false               # never hold the persistence context into the view
    hibernate:
      ddl-auto: validate              # Flyway owns the schema
    properties:
      hibernate:
        default_batch_fetch_size: 25  # turns 1+N into 1+1 across the whole application
        jdbc.batch_size: 50

  threads:
    virtual:
      enabled: true

  kafka:
    bootstrap-servers: \${KAFKA_BROKERS}
    producer:
      acks: all                       # only as strong as min.insync.replicas on the topic
      properties:
        enable.idempotence: true      # broker-side dedup of producer retries
        delivery.timeout.ms: 120000
        linger.ms: 10
        compression.type: snappy
    consumer:
      group-id: order-service
      auto-offset-reset: earliest
      enable-auto-commit: false       # commit after processing, never on a timer
      properties:
        isolation.level: read_committed
        max.poll.interval.ms: 300000
    listener:
      ack-mode: RECORD
      concurrency: 3                  # at most one thread per partition

resilience4j:
  circuitbreaker:
    configs:
      default:
        sliding-window-size: 50
        minimum-number-of-calls: 20   # do not judge on a meaningless sample
        failure-rate-threshold: 50
        slow-call-duration-threshold: 2s
        slow-call-rate-threshold: 80  # a slow success is the dangerous case
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 5
        automatic-transition-from-open-to-half-open-enabled: true
        ignore-exceptions:
          - dev.springforge.shopflow.order.ProductNotFoundException
    instances:
      catalog:
        base-config: default
      payment:
        base-config: default
        failure-rate-threshold: 30    # money: trip earlier
        wait-duration-in-open-state: 30s

  retry:
    configs:
      default:
        max-attempts: 3
        wait-duration: 200ms
        exponential-backoff-multiplier: 2
        randomized-wait-factor: 0.5   # jitter: never omit this
        ignore-exceptions:
          - org.springframework.web.client.HttpClientErrorException   # all 4xx
    instances:
      catalog:
        base-config: default
      payment:
        max-attempts: 1               # never retry a charge without an idempotency key

  bulkhead:
    instances:
      catalog:
        max-concurrent-calls: 20
        max-wait-duration: 0          # reject rather than queue for a slow dependency

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
        # Readiness includes what we cannot serve without.
        readiness:
          include: db, readinessState
        # Liveness deliberately excludes downstreams: a database blip must not
        # restart every pod in the fleet.
        liveness:
          include: livenessState
  tracing:
    sampling:
      probability: 0.1

server:
  shutdown: graceful

logging:
  structured:
    format:
      console: ecs`,
  },
  {
    path: 'docker-compose.yml',
    lang: 'yaml',
    note: 'One command to run the whole system locally, including Kafka, Postgres and the observability stack.',
    code: `services:
  postgres-orders:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: shopflow
      POSTGRES_PASSWORD: local
    healthcheck:
      # Services wait on this rather than racing the database at startup.
      test: ["CMD-SHELL", "pg_isready -U shopflow -d orders"]
      interval: 5s
      retries: 10

  kafka:
    image: confluentinc/cp-kafka:7.7.1
    environment:
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_NODE_ID: 1
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      CLUSTER_ID: shopflow-local-cluster
    healthcheck:
      test: ["CMD", "kafka-topics", "--bootstrap-server", "localhost:9092", "--list"]
      interval: 10s
      retries: 10

  order-service:
    build: ./order-service
    environment:
      DB_URL: jdbc:postgresql://postgres-orders:5432/orders
      DB_USER: shopflow
      DB_PASSWORD: local
      KAFKA_BROKERS: kafka:9092
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
    depends_on:
      postgres-orders:
        condition: service_healthy    # wait for readiness, not just for the container
      kafka:
        condition: service_healthy

  gateway:
    build: ./gateway
    ports:
      - "8080:8080"
    environment:
      OIDC_ISSUER_URI: http://keycloak:8080/realms/shopflow
      ALLOWED_ORIGINS: http://localhost:3000
    depends_on:
      - order-service

  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.115.1
    command: ["--config=/etc/otel/config.yaml"]
    volumes:
      - ./observability/otel-collector.yaml:/etc/otel/config.yaml:ro

  grafana:
    image: grafana/grafana:11.4.0
    ports:
      - "3001:3000"`,
  },
  {
    path: 'k8s/order-service.yaml',
    lang: 'yaml',
    note: 'A startup probe covers the slow JVM boot, so liveness can stay tight without false restarts.',
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0          # never reduce capacity during a rollout
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      # Give the JVM time to finish in-flight requests and deregister.
      terminationGracePeriodSeconds: 45
      containers:
        - name: order-service
          image: ghcr.io/acme/order-service:1.4.2   # never :latest
          ports:
            - containerPort: 8080
            - containerPort: 8081  # management, not exposed through the ingress
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: order-db
                  key: password
            - name: JAVA_TOOL_OPTIONS
              # Percentage, not a fixed size: the JVM then respects the cgroup limit.
              value: "-XX:MaxRAMPercentage=70 -XX:+UseG1GC"

          resources:
            requests:
              cpu: 250m
              memory: 768Mi
            limits:
              # No CPU limit: throttling a JVM causes latency spikes that look
              # like application bugs. The memory limit is a hard ceiling.
              memory: 768Mi

          startupProbe:
            httpGet: { path: /actuator/health/liveness, port: 8081 }
            failureThreshold: 30
            periodSeconds: 2       # up to 60s to boot, without loosening liveness

          livenessProbe:
            httpGet: { path: /actuator/health/liveness, port: 8081 }
            periodSeconds: 10
            failureThreshold: 3

          readinessProbe:
            httpGet: { path: /actuator/health/readiness, port: 8081 }
            periodSeconds: 5
            failureThreshold: 2

          lifecycle:
            preStop:
              # Let the endpoint removal propagate before the JVM starts shutting
              # down, or in-flight requests are routed to a closing pod.
              exec: { command: ["sh", "-c", "sleep 5"] }
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: order-service
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: order-service`,
  },
  {
    path: 'order-service/src/test/java/dev/springforge/shopflow/order/OrderSagaIT.java',
    lang: 'java',
    note: 'The compensation path, tested deliberately — it is the code most likely to run first in production.',
    code: `package dev.springforge.shopflow.order;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

class OrderSagaIT extends IntegrationTest {

    @Autowired OrderService orders;
    @Autowired SagaStateRepository sagas;
    @Autowired TestEventBus events;

    @Test
    void a_declined_payment_releases_stock_and_cancels_the_order() {
        OrderResponse order = orders.place(aPlaceOrderCommand());

        // The order is PENDING, not CONFIRMED: the saga has not finished.
        assertThat(order.status()).isEqualTo(OrderStatus.PENDING);

        events.emit(new StockReserved(order.id(), order.items()));
        events.emit(new PaymentFailed(order.id(), "card_declined"));

        await().untilAsserted(() -> {
            // Compensation ran in reverse: stock released, then order cancelled.
            assertThat(events.published()).contains(new StockReleased(order.id()));
            assertThat(orders.get(order.id()).status()).isEqualTo(OrderStatus.CANCELLED);
        });
    }

    @Test
    void a_redelivered_event_does_not_advance_the_saga_twice() {
        OrderResponse order = orders.place(aPlaceOrderCommand());
        StockReserved event = new StockReserved(order.id(), order.items());

        events.emit(event);
        events.emit(event);            // at-least-once delivery: the same event again

        await().untilAsserted(() ->
                // Exactly one CapturePayment, not two. The state machine is the dedup.
                assertThat(events.publishedOfType(CapturePayment.class)).hasSize(1));
    }

    @Test
    void a_saga_that_stalls_is_reported() {
        OrderResponse order = orders.place(aPlaceOrderCommand());
        sagas.load(order.id()).backdateTo(java.time.Instant.now().minusSeconds(1200));

        assertThat(sagas.findUnterminatedBefore(java.time.Instant.now().minusSeconds(900)))
                .extracting(SagaState::orderId)
                .contains(order.id());
    }

    private PlaceOrderCommand aPlaceOrderCommand() {
        return new PlaceOrderCommand(UUID.randomUUID(), someItems(), Money.ofMinor(4999));
    }
}`,
  },
];
