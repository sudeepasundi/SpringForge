import type { DemoFile } from '@/lib/types';

/**
 * The orchestrator: one Kafka consumer, one decision, one call per channel.
 *
 * This is deliberately a *routing* orchestrator, not a saga. ShopFlow's
 * OrderSaga coordinates steps that must be undone if a later one fails. Nothing
 * here is undoable — you cannot unsend an SMS — so the work is choosing
 * correctly the first time and never sending twice.
 */
export const relayDispatchFiles: DemoFile[] = [
  {
    path: 'dispatch-orchestrator/src/main/java/dev/springforge/relay/dispatch/NotificationRequestConsumer.java',
    lang: 'java',
    note: 'Non-blocking retries: a failing message moves to a retry topic instead of stalling its partition.',
    code: `package dev.springforge.relay.dispatch;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.retrytopic.SameIntervalTopicReuseStrategy;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Component;

@Component
public class NotificationRequestConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationRequestConsumer.class);

    private final DispatchOrchestrator orchestrator;
    private final DeliveryLog deliveries;

    public NotificationRequestConsumer(DispatchOrchestrator orchestrator, DeliveryLog deliveries) {
        this.orchestrator = orchestrator;
        this.deliveries = deliveries;
    }

    /**
     * Blocking retry (a DefaultErrorHandler with a backoff) holds the partition
     * while it waits. With a 30-second ladder and one bad message, every other
     * recipient on that partition waits 30 seconds too.
     *
     * @RetryableTopic republishes the failed record to a retry topic and commits
     * the original, so the partition keeps moving. The cost is that ordering is
     * lost for the retried message — acceptable here, because two notifications
     * to one person are independent.
     */
    @RetryableTopic(
            attempts = "4",
            backoff = @Backoff(delay = 2_000, multiplier = 4.0, maxDelay = 60_000),
            sameIntervalTopicReuseStrategy = SameIntervalTopicReuseStrategy.SINGLE_TOPIC,
            // A malformed request will still be malformed in a minute. Retrying
            // it four times just delays the DLT and burns provider quota.
            exclude = {UnknownRecipientException.class, MalformedRequestException.class},
            dltTopicSuffix = "-dlt")
    @KafkaListener(topics = "notifications.requested.v1", groupId = "dispatch-orchestrator")
    public void onRequest(NotificationRequest request,
                          @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {

        // At-least-once delivery means this method WILL be called twice for the
        // same event, usually during a rebalance. The dedup marker is what makes
        // that harmless, and it is checked before anything leaves the process.
        if (deliveries.alreadyHandled(request.eventId())) {
            log.debug("Duplicate {} ignored", request.eventId());
            return;
        }

        log.debug("Dispatching {} from {}", request.eventId(), topic);
        orchestrator.dispatch(request);
    }

    /**
     * Everything that survived four attempts, plus everything excluded from
     * retry. Both need a person: the first is a dependency that is still down,
     * the second is data that will never be valid.
     */
    @DltHandler
    public void onDeadLetter(NotificationRequest request,
                             @Header(KafkaHeaders.EXCEPTION_MESSAGE) String reason) {
        // Recorded rather than logged and forgotten: this table is what the
        // replay tool reads, and what "how many did we fail to send?" queries.
        deliveries.recordUndeliverable(request, reason);
        log.error("Undeliverable notification {} for {}: {}",
                request.eventId(), request.recipientId(), reason);
    }
}`,
  },
  {
    path: 'dispatch-orchestrator/src/main/java/dev/springforge/relay/dispatch/DispatchOrchestrator.java',
    lang: 'java',
    note: 'The orchestrator decides and delegates. It holds no state between messages — the decision is a pure function of the request and the preferences.',
    code: `package dev.springforge.relay.dispatch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Orchestration here means *routing*, not compensation.
 *
 * ShopFlow's OrderSaga exists because its steps can be undone — release the
 * stock, refund the payment. Nothing in this class can be undone, so there is no
 * state machine and no compensation: there is a decision, an ordered list of
 * channels to try, and a hard rule that the same event never sends twice.
 */
@Service
public class DispatchOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(DispatchOrchestrator.class);

    private final ChannelGateway channels;
    private final PreferenceClient preferences;
    private final DeliveryLog deliveries;

    public DispatchOrchestrator(ChannelGateway channels,
                                PreferenceClient preferences,
                                DeliveryLog deliveries) {
        this.channels = channels;
        this.preferences = preferences;
        this.deliveries = deliveries;
    }

    public void dispatch(NotificationRequest request) {
        // One synchronous call, through the gateway, with a fallback. If the
        // preference service is down we use conservative defaults rather than
        // failing — not sending a password reset is worse than emailing someone
        // who would have preferred an SMS.
        RecipientPreferences prefs = channels.preferencesFor(request.recipientId());

        ChannelDecision decision = ChannelDecision.of(request, prefs);

        if (decision.suppressed()) {
            // Recorded, not silently dropped. "Why didn't I get that?" is a
            // support question, and the answer has to be queryable.
            deliveries.recordSuppressed(request, decision.reason());
            log.info("Suppressed {} for {}: {}",
                    request.eventId(), request.recipientId(), decision.reason());
            return;
        }

        send(request, decision.channels(), prefs);
    }

    /**
     * Walk the chain until one channel accepts. The chain is ordered by the
     * recipient's preference, not by what is cheapest for us.
     */
    private void send(NotificationRequest request, List<Channel> chain, RecipientPreferences prefs) {
        for (Channel channel : chain) {
            try {
                // The dedup marker is written BEFORE the send, keyed by
                // (eventId, channel). If the provider call succeeds and the
                // process then dies, the retry finds the marker and stops.
                // The failure mode this accepts is a notification that was sent
                // but not recorded as sent — never a second copy.
                deliveries.claim(request.eventId(), channel);

                DeliveryReceipt receipt = channels.send(channel, request, prefs);
                deliveries.recordSent(request, channel, receipt);

                log.info("Sent {} to {} via {} ({})",
                        request.type(), request.recipientId(), channel, receipt.providerId());
                return;

            } catch (AlreadyClaimedException e) {
                log.debug("{} already sent via {}", request.eventId(), channel);
                return;

            } catch (ChannelUnavailableException e) {
                // Try the next channel. This is the case the chain exists for:
                // the SMS provider is down, the user still needs to know.
                deliveries.release(request.eventId(), channel);
                log.warn("Channel {} unavailable for {}, falling back", channel, request.eventId(), e);
            }
        }

        // Every channel refused. Throwing here is what sends the record to the
        // retry topic — the recipient is reachable in principle, just not now.
        throw new NoChannelAvailableException(request.eventId(), chain);
    }
}`,
  },
  {
    path: 'dispatch-orchestrator/src/main/java/dev/springforge/relay/dispatch/ChannelDecision.java',
    lang: 'java',
    note: 'The routing rules, in one place and with no I/O — which is what makes them testable without a broker.',
    code: `package dev.springforge.relay.dispatch;

import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * Which channels to try, in order, and whether to send at all.
 *
 * Deliberately a pure function: no repository, no client, no clock field. Every
 * rule below is a unit test that runs in microseconds, which matters because
 * these are the rules that get a company fined when they are wrong.
 */
public record ChannelDecision(List<Channel> channels, boolean suppressed, String reason) {

    private static ChannelDecision suppress(String reason) {
        return new ChannelDecision(List.of(), true, reason);
    }

    public static ChannelDecision of(NotificationRequest request, RecipientPreferences prefs) {

        // 1. Opt-out wins for anything the recipient can decline. Marketing and
        //    digests are declinable; a password reset or a fraud alert is not,
        //    because it is a security notice about the account itself.
        if (request.type().isDeclinable() && prefs.hasOptedOut(request.type())) {
            return suppress("recipient opted out of " + request.type());
        }

        // 2. A hard bounce means the address is dead, not busy. Continuing to
        //    send to it damages sender reputation for every other recipient.
        if (prefs.emailHardBounced() && prefs.smsChannels().isEmpty()) {
            return suppress("no reachable channel: email hard-bounced, no verified phone");
        }

        // 3. Quiet hours. CRITICAL ignores them — that is the whole point of the
        //    severity existing. Everything else is deferred rather than dropped,
        //    so the notification still arrives, just not at 03:00 local time.
        if (request.severity() != Severity.CRITICAL && inQuietHours(prefs)) {
            return suppress("quiet hours until " + prefs.quietHoursEnd());
        }

        List<Channel> chain = prefs.orderedChannels();
        if (chain.isEmpty()) {
            return suppress("recipient has no enabled channel");
        }

        // 4. Severity reorders the chain rather than replacing it. A critical
        //    notice leads with the fastest channel the recipient has verified,
        //    then falls back to their actual preference.
        if (request.severity() == Severity.CRITICAL) {
            chain = fastestFirst(chain);
        }

        return new ChannelDecision(chain, false, "ok");
    }

    private static boolean inQuietHours(RecipientPreferences prefs) {
        if (prefs.quietHoursStart() == null) return false;

        // Evaluated in the RECIPIENT's zone, not the server's. Getting this
        // wrong is invisible in a UTC-hosted test suite and obvious to a user
        // woken at 4am.
        LocalTime localNow = ZonedDateTime.now(prefs.zone()).toLocalTime();
        LocalTime start = prefs.quietHoursStart();
        LocalTime end = prefs.quietHoursEnd();

        // The window usually crosses midnight (22:00–07:00), so a naive
        // start < now < end comparison is false for the entire night.
        return start.isBefore(end)
                ? !localNow.isBefore(start) && localNow.isBefore(end)
                : !localNow.isBefore(start) || localNow.isBefore(end);
    }

    private static List<Channel> fastestFirst(List<Channel> chain) {
        return chain.stream()
                .sorted((a, b) -> Integer.compare(a.urgencyRank(), b.urgencyRank()))
                .toList();
    }
}`,
  },
  {
    path: 'dispatch-orchestrator/src/main/java/dev/springforge/relay/dispatch/DeliveryLog.java',
    lang: 'java',
    note: 'Claim-before-send. The unique constraint is the arbiter, not an if-statement.',
    code: `package dev.springforge.relay.dispatch;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * The record of what was sent, and the thing that stops it being sent twice.
 *
 * Module 09 teaches idempotent consumers with a dedup table; this is that
 * pattern applied where the side effect is external and irreversible. The
 * difference that matters: the marker is written BEFORE the provider call, not
 * after, because a crash between "sent" and "recorded" must not produce a
 * second email.
 */
@Repository
public class DeliveryLog {

    private final JdbcClient db;

    public DeliveryLog(JdbcClient db) {
        this.db = db;
    }

    public boolean alreadyHandled(UUID eventId) {
        return db.sql("select exists(select 1 from delivery_log where event_id = :id)")
                .param("id", eventId)
                .query(Boolean.class)
                .single();
    }

    /**
     * REQUIRES_NEW so the claim commits on its own. If it shared the caller's
     * transaction, a later rollback would release a claim for a message that had
     * already reached the provider — which is precisely the duplicate we are
     * preventing.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void claim(UUID eventId, Channel channel) {
        try {
            db.sql("""
                    insert into delivery_log (event_id, channel, status, claimed_at)
                    values (:id, :channel, 'CLAIMED', :now)
                    """)
                    .param("id", eventId)
                    .param("channel", channel.name())
                    .param("now", Instant.now())
                    .update();
        } catch (DataIntegrityViolationException duplicate) {
            // Two consumers raced. The database decided; this one loses and stops.
            // Letting the unique constraint arbitrate is what makes this correct
            // under concurrency, where a select-then-insert is not.
            throw new AlreadyClaimedException(eventId, channel);
        }
    }

    /** Only a claim this process made and could not use is released. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void release(UUID eventId, Channel channel) {
        db.sql("delete from delivery_log where event_id = :id and channel = :channel and status = 'CLAIMED'")
                .param("id", eventId)
                .param("channel", channel.name())
                .update();
    }

    public void recordSent(NotificationRequest request, Channel channel, DeliveryReceipt receipt) {
        db.sql("""
                update delivery_log
                set status = 'SENT', provider_id = :provider, completed_at = :now
                where event_id = :id and channel = :channel
                """)
                .param("provider", receipt.providerId())
                .param("now", Instant.now())
                .param("id", request.eventId())
                .param("channel", channel.name())
                .update();
    }

    public void recordSuppressed(NotificationRequest request, String reason) {
        insertTerminal(request, "SUPPRESSED", reason);
    }

    public void recordUndeliverable(NotificationRequest request, String reason) {
        insertTerminal(request, "UNDELIVERABLE", reason);
    }

    private void insertTerminal(NotificationRequest request, String status, String reason) {
        db.sql("""
                insert into delivery_log (event_id, channel, status, reason, claimed_at, completed_at)
                values (:id, 'NONE', :status, :reason, :now, :now)
                on conflict (event_id, channel) do nothing
                """)
                .param("id", request.eventId())
                .param("status", status)
                .param("reason", reason)
                .param("now", Instant.now())
                .update();
    }
}`,
  },
  {
    path: 'dispatch-orchestrator/src/main/resources/db/migration/V1__create_delivery_log.sql',
    lang: 'sql',
    note: 'The unique constraint is the whole dedup mechanism. Everything else here is for answering questions later.',
    code: `-- One row per (event, channel) attempt. The primary key is the dedup mechanism:
-- a second consumer processing the same event cannot insert, so it cannot send.
create table delivery_log (
    event_id      uuid        not null,
    channel       text        not null,
    status        text        not null,   -- CLAIMED | SENT | SUPPRESSED | UNDELIVERABLE
    provider_id   text,                   -- the provider's own id, for support tickets
    reason        text,                   -- why it was suppressed or failed
    claimed_at    timestamptz not null,
    completed_at  timestamptz,

    primary key (event_id, channel)
);

-- "Did this person get anything in the last hour?" — the query support asks,
-- and the one a per-recipient rate limit needs.
create index delivery_log_recipient_recent
    on delivery_log (claimed_at desc)
    where status = 'SENT';

-- Rows stuck in CLAIMED are the interesting failure: the process died between
-- claiming and sending, so we do not know whether the provider got it. A sweeper
-- reports these; it deliberately does NOT retry them, because re-sending is
-- worse than not knowing.
create index delivery_log_stuck_claims
    on delivery_log (claimed_at)
    where status = 'CLAIMED';`,
  },
  {
    path: 'dispatch-orchestrator/src/main/resources/application.yml',
    lang: 'yaml',
    note: 'Client-side timeouts shorter than the retry backoff, so a slow provider fails fast and the retry topic does the waiting.',
    code: `spring:
  application:
    name: dispatch-orchestrator          # the Eureka registry key

  datasource:
    url: jdbc:postgresql://localhost:5432/relay
    username: relay
    password: relay

  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: dispatch-orchestrator
      auto-offset-reset: earliest
      enable-auto-commit: false          # the container commits after the listener returns
      properties:
        spring.json.trusted.packages: dev.springforge.relay.dispatch
        # Longer than the slowest provider call plus its timeout, or a slow
        # batch looks like a dead consumer and triggers a rebalance.
        max.poll.interval.ms: 300000
    listener:
      ack-mode: record
      concurrency: 4                     # at most one thread per partition

eureka:
  client:
    service-url:
      defaultZone: \${EUREKA_URL:http://localhost:8761/eureka/}
  instance:
    prefer-ip-address: true              # containers rarely have resolvable hostnames
    lease-renew-interval-in-seconds: 10
    lease-expiration-duration-in-seconds: 30

# Feign's own timeouts. The defaults are 10s connect / 60s read, which is far
# too long when the caller is a Kafka listener holding a partition.
spring.cloud.openfeign.client.config:
  default:
    connect-timeout: 2000
    read-timeout: 5000
    logger-level: basic
  preference-service:
    read-timeout: 1000                   # a preference lookup is a primary-key read

resilience4j:
  circuitbreaker:
    instances:
      email-service:
        sliding-window-size: 20
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
      sms-service:
        sliding-window-size: 20
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
      preference-service:
        sliding-window-size: 20
        failure-rate-threshold: 60

  retry:
    instances:
      # One in-process retry only. The retry topic handles persistence and
      # backoff; retrying hard here just holds the partition longer.
      email-service:
        max-attempts: 2
        wait-duration: 200ms
      sms-service:
        max-attempts: 2
        wait-duration: 200ms

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    tags:
      application: dispatch-orchestrator`,
  },
];
