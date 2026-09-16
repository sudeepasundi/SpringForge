import type { DemoFile } from '@/lib/types';

/**
 * The three services the orchestrator calls.
 *
 * Each registers with Eureka under its spring.application.name, which is the
 * name the orchestrator's clients use. None of them knows the orchestrator
 * exists — they are ordinary REST services that happen to be discovered.
 */
export const relayChannelFiles: DemoFile[] = [
  {
    path: 'email-service/src/main/java/dev/springforge/relay/email/EmailController.java',
    lang: 'java',
    note: 'The idempotency key is the contract: the same key always yields the same receipt, never a second email.',
    code: `package dev.springforge.relay.email;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/emails")
public class EmailController {

    private final EmailSender sender;

    public EmailController(EmailSender sender) {
        this.sender = sender;
    }

    /**
     * The orchestrator claims before it calls, so it will not deliberately send
     * the same request twice — but a network timeout looks identical to a
     * failure, and a retry after one is exactly how duplicates happen.
     *
     * So this endpoint is idempotent on its own terms: the request carries a key
     * and a repeat of that key returns the original receipt without sending
     * anything. Two independent guards, because either alone has a window.
     */
    @PostMapping
    public ResponseEntity<DeliveryReceipt> send(@Valid @RequestBody EmailRequest request) {
        SendOutcome outcome = sender.send(request);

        // 200 for a replay, 201 for a send. A client that cares can tell them
        // apart; one that does not is unaffected.
        return outcome.wasReplayed()
                ? ResponseEntity.ok(outcome.receipt())
                : ResponseEntity.status(201).body(outcome.receipt());
    }
}`,
  },
  {
    path: 'email-service/src/main/java/dev/springforge/relay/email/EmailSender.java',
    lang: 'java',
    note: 'The provider is behind a port. Swapping SES for SendGrid is a new adapter, not a change to this class.',
    code: `package dev.springforge.relay.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Rendering and sending, with the provider behind a port.
 *
 * The port exists for two reasons that are not "testability": providers fail
 * independently, so a second adapter is a real failover option, and their APIs
 * disagree about almost everything — SES wants raw MIME, SendGrid wants JSON,
 * SMTP wants a conversation. Keeping that behind an interface means the retry
 * and idempotency logic above it is written once.
 */
@Service
public class EmailSender {

    private static final Logger log = LoggerFactory.getLogger(EmailSender.class);

    private final EmailProvider provider;
    private final TemplateRenderer templates;
    private final SentEmailRepository sent;

    public EmailSender(EmailProvider provider, TemplateRenderer templates, SentEmailRepository sent) {
        this.provider = provider;
        this.templates = templates;
        this.sent = sent;
    }

    @Transactional
    public SendOutcome send(EmailRequest request) {
        // A replay returns the original receipt. The caller cannot tell whether
        // its first attempt reached us, and this is how it finds out safely.
        return sent.findByIdempotencyKey(request.idempotencyKey())
                .map(existing -> SendOutcome.replayed(existing.receipt()))
                .orElseGet(() -> dispatch(request));
    }

    private SendOutcome dispatch(EmailRequest request) {
        RenderedEmail rendered = templates.render(request.template(), request.locale(), request.model());

        // Rendering happens before the send and inside the transaction, so a
        // template that references a missing variable fails here — where it is a
        // 400 the orchestrator can route past — rather than producing an email
        // that says "Hello null".
        ProviderReceipt receipt = provider.send(
                request.to(),
                rendered.subject(),
                rendered.html(),
                rendered.text());          // multipart: some clients still refuse HTML

        sent.save(SentEmail.of(request.idempotencyKey(), request.to(), receipt));

        log.info("Sent template={} to={} provider={} id={}",
                request.template(), request.to().masked(), provider.name(), receipt.id());

        return SendOutcome.sent(DeliveryReceipt.from(receipt, provider.name()));
    }
}`,
  },
  {
    path: 'email-service/src/main/resources/application.yml',
    lang: 'yaml',
    note: 'Registers under the name the orchestrator calls. Everything else is provider configuration.',
    code: `server:
  port: 0                                # ephemeral: two replicas, no port clash

spring:
  application:
    name: email-service                  # the name FeignClients.EmailClient resolves

eureka:
  client:
    service-url:
      defaultZone: \${EUREKA_URL:http://localhost:8761/eureka/}
  instance:
    prefer-ip-address: true
    # With server.port=0 the instance id would collide between replicas, so it
    # is made unique explicitly. Without this the second replica silently
    # replaces the first in the registry and you never see it load balance.
    instance-id: \${spring.application.name}:\${random.uuid}
    lease-renew-interval-in-seconds: 10
    lease-expiration-duration-in-seconds: 30

relay:
  email:
    provider: ses                        # ses | sendgrid | smtp
    from: "Relay <no-reply@relay.dev>"
    # Providers rate limit per second, and exceeding it gets you throttled
    # rather than queued. Staying under our own limit is cheaper than handling
    # theirs.
    max-sends-per-second: 40
    ses:
      region: eu-west-1
      configuration-set: relay-tracking  # bounces and complaints come back here

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus`,
  },
  {
    path: 'sms-service/src/main/java/dev/springforge/relay/sms/SmsController.java',
    lang: 'java',
    note: 'Segment counting matters: an SMS is billed per 160 characters, and one emoji silently halves that.',
    code: `package dev.springforge.relay.sms;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class SmsController {

    private final SmsSender sender;

    public SmsController(SmsSender sender) {
        this.sender = sender;
    }

    @PostMapping
    public ResponseEntity<DeliveryReceipt> send(@Valid @RequestBody SmsRequest request) {
        // Segments are computed and returned, not just billed silently. A body
        // that is 161 GSM-7 characters costs two segments; one emoji switches
        // the whole message to UCS-2 and the limit drops from 160 to 70.
        //
        // Surfacing it here is what lets a caller notice that a template change
        // tripled the SMS bill, instead of finding out from finance.
        SendOutcome outcome = sender.send(request);

        return outcome.wasReplayed()
                ? ResponseEntity.ok(outcome.receipt())
                : ResponseEntity.status(201).body(outcome.receipt());
    }
}`,
  },
  {
    path: 'sms-service/src/main/java/dev/springforge/relay/sms/SmsSender.java',
    lang: 'java',
    note: 'A rejected number is permanent; a throttled provider is not. The exception type is what tells the caller which.',
    code: `package dev.springforge.relay.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SmsSender {

    private static final Logger log = LoggerFactory.getLogger(SmsSender.class);

    private final SmsProvider provider;
    private final SentMessageRepository sent;

    public SmsSender(SmsProvider provider, SentMessageRepository sent) {
        this.provider = provider;
        this.sent = sent;
    }

    @Transactional
    public SendOutcome send(SmsRequest request) {
        return sent.findByIdempotencyKey(request.idempotencyKey())
                .map(existing -> SendOutcome.replayed(existing.receipt()))
                .orElseGet(() -> dispatch(request));
    }

    private SendOutcome dispatch(SmsRequest request) {
        PhoneNumber to = request.to();

        // E.164 or nothing. A provider will accept "07700 900123" and deliver
        // it to whoever holds that number in whichever country it guesses.
        if (!to.isE164()) {
            throw new InvalidRecipientException(to.masked(), "not in E.164 format");
        }

        Segments segments = Segments.of(request.body());
        if (segments.count() > 3) {
            // Long messages are concatenated by the handset and arrive out of
            // order often enough to matter. Truncating with a link is what most
            // providers recommend, and it is a product decision, not a technical
            // one — so it fails loudly rather than being silently truncated here.
            throw new MessageTooLongException(segments.count());
        }

        ProviderReceipt receipt = provider.send(to, request.body(), request.senderId());
        sent.save(SentMessage.of(request.idempotencyKey(), to, segments, receipt));

        log.info("Sent sms to={} segments={} encoding={} provider={} id={}",
                to.masked(), segments.count(), segments.encoding(), provider.name(), receipt.id());

        return SendOutcome.sent(DeliveryReceipt.from(receipt, provider.name()));
    }
}`,
  },
  {
    path: 'sms-service/src/main/resources/application.yml',
    lang: 'yaml',
    note: 'Quiet-hour enforcement is duplicated here on purpose — the orchestrator decides, this service refuses.',
    code: `server:
  port: 0

spring:
  application:
    name: sms-service

eureka:
  client:
    service-url:
      defaultZone: \${EUREKA_URL:http://localhost:8761/eureka/}
  instance:
    prefer-ip-address: true
    instance-id: \${spring.application.name}:\${random.uuid}
    lease-renew-interval-in-seconds: 10
    lease-expiration-duration-in-seconds: 30

relay:
  sms:
    provider: twilio                     # twilio | sns | messagebird
    sender-id: RELAY
    # The orchestrator already applies quiet hours. This is a second, dumber
    # check at the boundary that actually touches a person's phone.
    #
    # Duplicated rules are usually a smell. This one is deliberate: the cost of
    # the orchestrator having a bug is somebody woken at 4am, and a service that
    # can only be wrong in one direction is worth the duplication.
    hard-quiet-hours:
      enabled: true
      start: "22:00"
      end: "07:00"
      # CRITICAL still gets through. The point is to catch a routing mistake,
      # not to override a deliberate decision.
      bypass-severity: CRITICAL
    max-segments: 3

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus`,
  },
  {
    path: 'preference-service/src/main/java/dev/springforge/relay/preference/PreferenceController.java',
    lang: 'java',
    note: 'Read-heavy and tiny. Every notification in the system starts with one call to this endpoint.',
    code: `package dev.springforge.relay.preference;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/preferences")
public class PreferenceController {

    private final PreferenceService preferences;

    public PreferenceController(PreferenceService preferences) {
        this.preferences = preferences;
    }

    /**
     * Called once per notification, so it is the hottest endpoint in Relay and
     * the one whose latency is added to every send. It is a primary-key read
     * behind a short cache — which is why the orchestrator sets a 1s read
     * timeout on this client specifically.
     */
    @GetMapping("/{recipientId}")
    public RecipientPreferences byRecipient(@PathVariable UUID recipientId) {
        // A recipient with no row is not an error. Defaults are returned so a
        // brand-new user still gets their order confirmation — the alternative
        // is a 404 that the orchestrator would have to special-case anyway.
        return preferences.forRecipient(recipientId);
    }

    @PutMapping("/{recipientId}")
    public RecipientPreferences update(@PathVariable UUID recipientId,
                                       @RequestBody PreferenceUpdate update) {
        // Opt-outs are append-only in the audit table behind this. Proving when
        // somebody unsubscribed is a regulatory question, not a product one.
        return preferences.update(recipientId, update);
    }
}`,
  },
  {
    path: 'preference-service/src/main/java/dev/springforge/relay/preference/PreferenceService.java',
    lang: 'java',
    note: 'Defaults are opt-in for anything declinable and opt-out for nothing transactional.',
    code: `package dev.springforge.relay.preference;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PreferenceService {

    private final PreferenceRepository repository;
    private final OptOutAuditRepository audit;

    public PreferenceService(PreferenceRepository repository, OptOutAuditRepository audit) {
        this.repository = repository;
        this.audit = audit;
    }

    /**
     * Cached for 60 seconds. A preference change taking a minute to take effect
     * is acceptable; an unsubscribe taking a minute is not — so update() evicts
     * rather than relying on the TTL.
     */
    @Cacheable(cacheNames = "preferences", key = "#recipientId")
    @Transactional(readOnly = true)
    public RecipientPreferences forRecipient(UUID recipientId) {
        return repository.findById(recipientId)
                .map(RecipientPreferences::from
                )
                .orElseGet(() -> RecipientPreferences.defaultsFor(recipientId));
    }

    @CacheEvict(cacheNames = "preferences", key = "#recipientId")
    @Transactional
    public RecipientPreferences update(UUID recipientId, PreferenceUpdate update) {
        Preference row = repository.findById(recipientId)
                .orElseGet(() -> Preference.defaultsFor(recipientId));

        // Every opt-out is written to an append-only audit table before the
        // current state changes. "Prove this person unsubscribed on the 3rd" is
        // a question the current row cannot answer, and the one that matters
        // when a complaint arrives.
        update.optOuts().forEach(type -> audit.record(recipientId, type, update.source()));

        row.apply(update);
        return RecipientPreferences.from(repository.save(row));
    }
}`,
  },
  {
    path: 'preference-service/src/main/resources/application.yml',
    lang: 'yaml',
    note: 'A short cache TTL, and an eviction on write so an unsubscribe is immediate.',
    code: `server:
  port: 0

spring:
  application:
    name: preference-service

  datasource:
    url: \${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/relay}
    username: relay
    password: relay

  cache:
    type: caffeine
    caffeine:
      # 60s is a deliberate ceiling on how stale a preference read can be.
      # Unsubscribes do not wait for it — update() evicts the entry directly.
      spec: maximumSize=50000,expireAfterWrite=60s

eureka:
  client:
    service-url:
      defaultZone: \${EUREKA_URL:http://localhost:8761/eureka/}
  instance:
    prefer-ip-address: true
    instance-id: \${spring.application.name}:\${random.uuid}
    lease-renew-interval-in-seconds: 10
    lease-expiration-duration-in-seconds: 30

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus`,
  },
];
