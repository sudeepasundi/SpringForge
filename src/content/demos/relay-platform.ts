import type { DemoFile } from '@/lib/types';

/**
 * The registry and the local environment.
 *
 * Relay runs on docker-compose rather than Kubernetes, and that is deliberate:
 * module 07 argues that a Kubernetes Service already solves discovery and that
 * running Eureka on top means two sources of truth about which instances are
 * alive. Off-platform is exactly where Eureka still earns its place.
 */
export const relayPlatformFiles: DemoFile[] = [
  {
    path: 'discovery-server/src/main/java/dev/springforge/relay/discovery/DiscoveryServerApplication.java',
    lang: 'java',
    note: 'The whole registry is one annotation. Everything interesting is in the configuration beside it.',
    code: `package dev.springforge.relay.discovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * A Eureka server is a Spring Boot application with one annotation on it. The
 * registry itself is in-memory: it is a cache of heartbeats, not a database,
 * and it is designed to lose data on restart.
 *
 * That is the property that makes peers matter. A single registry that restarts
 * comes back empty and, for the next lease interval, tells every client that
 * nothing exists.
 */
@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServerApplication.class, args);
    }
}`,
  },
  {
    path: 'discovery-server/src/main/resources/application.yml',
    lang: 'yaml',
    note: 'Self-preservation is on, and the comment explains why turning it off in production is the wrong instinct.',
    code: `server:
  port: 8761

spring:
  application:
    name: discovery-server

eureka:
  instance:
    hostname: discovery-server
  client:
    # A registry is a client of its peers, not of itself. With one node there is
    # nothing to register with, so both are false; with two, each points at the
    # other and they replicate.
    register-with-eureka: false
    fetch-registry: false
    service-url:
      defaultZone: http://discovery-server:8761/eureka/

  server:
    # Self-preservation: when renewals drop below the expected rate, Eureka stops
    # evicting instances. It assumes it has lost the network rather than that
    # every service died at once — which is almost always the correct assumption.
    #
    # Turning this off "because stale entries annoy me in dev" is the usual
    # mistake. In production it is what stops a network blip from emptying the
    # registry and taking every caller down with it.
    enable-self-preservation: true
    renewal-percent-threshold: 0.85

    # How often eviction runs. The default 60s is why a dead instance can stay
    # in the registry for over a minute — see the lease arithmetic in the lesson.
    eviction-interval-timer-in-ms: 15000

    # Clients cache the registry; this bounds how stale that cache can be.
    response-cache-update-interval-ms: 5000

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always`,
  },
  {
    path: 'platform/docker-compose.yml',
    lang: 'yaml',
    note: 'Start order matters less than you think — every service retries its registration. depends_on only sequences the start, not readiness.',
    code: `# Relay, end to end, on one machine.
#
#   docker compose -f platform/docker-compose.yml up -d
#   ./platform/create-topics.sh
#
# There is no Kubernetes here on purpose. Eureka is the discovery mechanism
# precisely because the platform does not provide one.
name: relay

services:
  kafka:
    image: confluentinc/cp-kafka:7.7.1
    container_name: relay-kafka
    ports: ['9092:9092']
    environment:
      # KRaft: a single broker acting as its own controller. Fine for a laptop,
      # never for production — see module 14 for what a real cluster needs.
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      CLUSTER_ID: relay-local-cluster-0001
    healthcheck:
      test: ['CMD', 'kafka-broker-api-versions', '--bootstrap-server', 'localhost:9092']
      interval: 10s
      retries: 12

  postgres:
    image: postgres:16-alpine
    container_name: relay-postgres
    ports: ['5432:5432']
    environment:
      POSTGRES_DB: relay
      POSTGRES_USER: relay
      POSTGRES_PASSWORD: relay
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U relay']
      interval: 5s
      retries: 10

  discovery-server:
    build: ../discovery-server
    ports: ['8761:8761']
    healthcheck:
      test: ['CMD', 'curl', '-fs', 'http://localhost:8761/actuator/health']
      interval: 5s
      retries: 20

  dispatch-orchestrator:
    build: ../dispatch-orchestrator
    depends_on:
      kafka: { condition: service_healthy }
      postgres: { condition: service_healthy }
      discovery-server: { condition: service_healthy }
    environment:
      EUREKA_URL: http://discovery-server:8761/eureka/
      KAFKA_BOOTSTRAP: kafka:9092
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/relay

  preference-service:
    build: ../preference-service
    depends_on:
      postgres: { condition: service_healthy }
      discovery-server: { condition: service_healthy }
    environment:
      EUREKA_URL: http://discovery-server:8761/eureka/
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/relay

  email-service:
    build: ../email-service
    # Two instances, so the client-side load balancing in the orchestrator has
    # something to balance across. This is the one thing compose gives you that
    # is awkward to see on a single-replica Kubernetes Deployment.
    deploy:
      replicas: 2
    depends_on:
      discovery-server: { condition: service_healthy }
    environment:
      EUREKA_URL: http://discovery-server:8761/eureka/

  sms-service:
    build: ../sms-service
    depends_on:
      discovery-server: { condition: service_healthy }
    environment:
      EUREKA_URL: http://discovery-server:8761/eureka/`,
  },
  {
    path: 'platform/create-topics.sh',
    lang: 'bash',
    note: 'Topics are created explicitly because auto-creation gives you a topic with defaults nobody chose.',
    code: `#!/usr/bin/env bash
set -euo pipefail

# Auto-creation is disabled on purpose (module 14): a typo in a producer config
# should fail loudly, not silently create a live topic with one partition and
# whatever retention the broker happened to default to.

KAFKA="docker exec relay-kafka kafka-topics --bootstrap-server localhost:9092"

create() {
  local name=$1 partitions=$2
  # shellcheck disable=SC2086
  $KAFKA --create --if-not-exists --topic "$name" --partitions "$partitions" --replication-factor 1
  echo "  ok  $name  ($partitions partitions)"
}

echo "Creating Relay topics..."

# Partitioned by recipient id, so every notification for one user is ordered.
# Four is enough for a laptop; size it from throughput in production.
create notifications.requested.v1 4

# @RetryableTopic creates these itself at startup. Creating them up front means
# the names are reviewed rather than discovered in production, and it makes the
# backoff ladder visible to anyone reading this file.
create notifications.requested.v1-retry-0 4
create notifications.requested.v1-retry-1 4
create notifications.requested.v1-retry-2 4

# Nothing retries out of here. A message lands in the DLT when it is undeliverable
# or when the recipient's data is wrong — both need a human, not another attempt.
create notifications.requested.v1-dlt 4

# Emitted after a provider confirms or rejects. Consumed by anything that wants
# delivery analytics; the orchestrator does not read its own output.
create notifications.delivered.v1 4

echo "Done. Registry: http://localhost:8761"`,
  },
];
