import type { DemoFile } from '@/lib/types';

/**
 * How the orchestrator calls the other services.
 *
 * The same three clients appear twice: once with OpenFeign, once as Spring HTTP
 * interfaces. Feign is what most existing Spring Cloud codebases use; HTTP
 * interfaces are what the framework recommends for new code. Module 08 states
 * that preference, and the two files here make the difference concrete rather
 * than theoretical.
 */
export const relayClientFiles: DemoFile[] = [
  {
    path: 'dispatch-orchestrator/src/main/java/dev/springforge/relay/dispatch/FeignClients.java',
    lang: 'java',
    note: 'A Feign client resolves its name through Eureka — "email-service" is a registry key, not a host.',
    code: `package dev.springforge.relay.dispatch;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

/**
 * The declarative style, with OpenFeign.
 *
 * The value of the name attribute is a Eureka registry key, not a hostname. Spring Cloud
 * LoadBalancer resolves it to the live instances at call time and round-robins
 * across them — which is why running two email-service replicas in compose is
 * worth doing: you can watch the calls alternate.
 *
 * Note there are no @CircuitBreaker or @Retry annotations here. Module 08's rule
 * is that resilience belongs in a gateway component you own (ChannelGateway),
 * not on the interface: the interface describes the remote API, and the policy
 * for calling it is a separate decision that changes independently.
 */
public final class FeignClients {

    private FeignClients() {}

    @FeignClient(name = "preference-service", configuration = ChannelClientConfig.class)
    public interface PreferenceClient {

        @GetMapping("/api/preferences/{recipientId}")
        RecipientPreferences byRecipient(@PathVariable UUID recipientId);
    }

    @FeignClient(name = "email-service", configuration = ChannelClientConfig.class)
    public interface EmailClient {

        @PostMapping("/api/emails")
        DeliveryReceipt send(@RequestBody EmailRequest request);
    }

    @FeignClient(name = "sms-service", configuration = ChannelClientConfig.class)
    public interface SmsClient {

        @PostMapping("/api/messages")
        DeliveryReceipt send(@RequestBody SmsRequest request);
    }
}`,
  },
  {
    path: 'dispatch-orchestrator/src/main/java/dev/springforge/relay/dispatch/HttpInterfaceClients.java',
    lang: 'java',
    note: 'The same three clients with no Feign dependency. This is what the migration looks like.',
    code: `package dev.springforge.relay.dispatch;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.client.RestClient;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import java.time.Duration;
import java.util.UUID;

/**
 * The same three clients, written with Spring's own HTTP interfaces.
 *
 * OpenFeign has been feature-complete since Spring Cloud 2022.0.0 and the Spring
 * team's recommended migration path is exactly this. For new code it is the
 * better default: one fewer dependency, the annotations are core Spring, and the
 * underlying RestClient is the same one used everywhere else in the application.
 *
 * What you give up: Feign's error decoder and per-client configuration through
 * spring.cloud.openfeign.* properties. Both are replaced below by ordinary
 * builder configuration, which is more code but is code you can read.
 */
@Configuration
public class HttpInterfaceClients {

    @HttpExchange("/api/preferences")
    public interface PreferenceApi {
        @GetExchange("/{recipientId}")
        RecipientPreferences byRecipient(@PathVariable UUID recipientId);
    }

    @HttpExchange("/api/emails")
    public interface EmailApi {
        @PostExchange
        DeliveryReceipt send(@RequestBody EmailRequest request);
    }

    @HttpExchange("/api/messages")
    public interface SmsApi {
        @PostExchange
        DeliveryReceipt send(@RequestBody SmsRequest request);
    }

    /**
     * @LoadBalanced is what makes "http://email-service" resolve through the
     * registry, exactly as Feign's name attribute does. Without it the URL is
     * treated literally and DNS fails.
     *
     * Inject the builder rather than calling RestClient.create(): the injected
     * one carries the observation registry, so these calls appear in traces and
     * in http.client.requests metrics. A hand-built client silently does not.
     */
    @Bean
    @LoadBalanced
    RestClient.Builder loadBalancedRestClient(RestClient.Builder builder) {
        return builder.requestFactory(ClientFactories.timeouts(
                Duration.ofSeconds(2),   // connect
                Duration.ofSeconds(5))); // read
    }

    private static <T> T proxy(RestClient.Builder builder, String service, Class<T> api) {
        RestClient client = builder.clone()
                .baseUrl("http://" + service)
                .defaultStatusHandler(new ChannelStatusHandler(service))
                .build();

        return HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(client))
                .build()
                .createClient(api);
    }

    @Bean
    PreferenceApi preferenceApi(RestClient.Builder builder) {
        return proxy(builder, "preference-service", PreferenceApi.class);
    }

    @Bean
    EmailApi emailApi(RestClient.Builder builder) {
        return proxy(builder, "email-service", EmailApi.class);
    }

    @Bean
    SmsApi smsApi(RestClient.Builder builder) {
        return proxy(builder, "sms-service", SmsApi.class);
    }
}`,
  },
  {
    path: 'dispatch-orchestrator/src/main/java/dev/springforge/relay/dispatch/ChannelGateway.java',
    lang: 'java',
    note: 'Every resilience policy lives here, not on the client interfaces. One place to reason about what happens when a provider is down.',
    code: `package dev.springforge.relay.dispatch;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * The boundary between the orchestrator's decisions and the network.
 *
 * Module 08's rule, applied: the client interfaces describe the remote APIs and
 * this class decides what happens when they misbehave. Keeping the two separate
 * means swapping Feign for HTTP interfaces changes the interfaces only — the
 * retry, breaker and fallback policy above is untouched.
 */
@Component
public class ChannelGateway {

    private static final Logger log = LoggerFactory.getLogger(ChannelGateway.class);

    private final FeignClients.PreferenceClient preferences;
    private final FeignClients.EmailClient email;
    private final FeignClients.SmsClient sms;

    public ChannelGateway(FeignClients.PreferenceClient preferences,
                          FeignClients.EmailClient email,
                          FeignClients.SmsClient sms) {
        this.preferences = preferences;
        this.email = email;
        this.sms = sms;
    }

    /**
     * Retry wraps the breaker, so a retry against an open breaker fails in
     * microseconds rather than re-testing a dependency already known to be down.
     */
    @CircuitBreaker(name = "preference-service", fallbackMethod = "conservativeDefaults")
    @Retry(name = "preference-service")
    public RecipientPreferences preferencesFor(UUID recipientId) {
        return preferences.byRecipient(recipientId);
    }

    /**
     * Not sending a password reset is worse than sending it to the channel the
     * recipient would not have picked first. So the fallback is email-only with
     * quiet hours OFF — deliberately conservative in the direction of delivery.
     *
     * The opposite choice would be defensible for marketing traffic, which is
     * why severity, not the gateway, decides whether this path is acceptable.
     */
    RecipientPreferences conservativeDefaults(UUID recipientId, Exception cause) {
        log.warn("Preference service unavailable for {}; using defaults", recipientId, cause);
        return RecipientPreferences.emailOnly(recipientId);
    }

    @CircuitBreaker(name = "email-service")
    @Retry(name = "email-service")
    public DeliveryReceipt send(Channel channel, NotificationRequest request, RecipientPreferences prefs) {
        return switch (channel) {
            case EMAIL -> email.send(EmailRequest.from(request, prefs));
            case SMS -> sms.send(SmsRequest.from(request, prefs));
        };
    }

    // No fallback method on send(): there is nothing safe to return. A failure
    // here must propagate so the orchestrator can try the next channel, and if
    // none work, so the record reaches the retry topic. Returning a fake receipt
    // would record a delivery that never happened.
}`,
  },
  {
    path: 'dispatch-orchestrator/src/main/java/dev/springforge/relay/dispatch/ChannelClientConfig.java',
    lang: 'java',
    note: 'Mapping HTTP status onto domain exceptions is what lets the orchestrator distinguish "try the next channel" from "give up".',
    code: `package dev.springforge.relay.dispatch;

import feign.Response;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;

/**
 * Feign's default ErrorDecoder turns every non-2xx into a FeignException, which
 * tells the orchestrator nothing useful: it cannot distinguish a provider that
 * is temporarily down from a recipient whose phone number is invalid. One is
 * worth a fallback and a retry; the other will fail identically forever.
 *
 * This class is not a @Configuration on purpose — an @FeignClient configuration
 * class must NOT be picked up by component scanning, or its beans apply to every
 * Feign client in the application instead of the one that named it.
 */
public class ChannelClientConfig {

    @Bean
    public ErrorDecoder channelErrorDecoder() {
        return (methodKey, response) -> switch (response.status()) {

            // The provider rejected the recipient, not the request. Retrying
            // and falling back are both pointless; this needs the data fixed.
            case 400, 422 -> new MalformedRequestException(methodKey, body(response));
            case 404 -> new UnknownRecipientException(methodKey);

            // The provider is rate limiting us. Falling back to another channel
            // is right; hammering this one is not.
            case 429 -> new ChannelUnavailableException(methodKey, "rate limited");

            // Anything 5xx is the provider's problem and may well clear.
            case 500, 502, 503, 504 -> new ChannelUnavailableException(methodKey, "provider error");

            default -> new ChannelUnavailableException(methodKey, "unexpected " + response.status());
        };
    }

    private static String body(Response response) {
        try {
            return response.body() == null ? "" : new String(response.body().asInputStream().readAllBytes());
        } catch (Exception e) {
            return "";
        }
    }
}`,
  },
];
