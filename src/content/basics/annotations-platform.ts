import type { AnnotationEntry } from './types';

/** Security, testing, messaging & scheduling, and cloud & resilience. */
export const platformAnnotations: AnnotationEntry[] = [
  /* -------------------------------------------------------------- security */
  {
    name: 'EnableWebSecurity',
    category: 'security',
    pkg: 'org.springframework.security.config.annotation.web.configuration',
    summary: 'Marks the configuration that defines your SecurityFilterChain beans.',
    mechanism:
      'Boot already enables web security when Spring Security is on the classpath; declaring your own SecurityFilterChain bean replaces Boot’s default chain.',
    useWhen: 'On the security configuration class, for clarity.',
    pitfall:
      'Several filter chains without @Order and securityMatcher: only the first matching chain handles a request, so rules in the others are silently ignored.',
    example: {
      lang: 'java',
      code: `@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
                .authorizeHttpRequests(a -> a.anyRequest().authenticated())
                .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
                .build();
    }
}`,
    },
    related: ['EnableMethodSecurity', 'Order'],
    lessons: ['security/filter-chain', 'security/authentication'],
  },
  {
    name: 'EnableMethodSecurity',
    category: 'security',
    pkg: 'org.springframework.security.config.annotation.method.configuration',
    summary: 'Enables @PreAuthorize and friends on bean methods.',
    mechanism:
      'Proxy-based, like @Transactional. prePostEnabled is on by default. It replaces the deprecated @EnableGlobalMethodSecurity.',
    useWhen: 'Authorisation rules that depend on the method’s arguments or the domain object.',
    pitfall: 'Self-invocation bypasses the check — an internal call to a @PreAuthorize method is not authorised.',
    example: {
      lang: 'java',
      code: `@Configuration
@EnableMethodSecurity
public class MethodSecurityConfig { }`,
    },
    related: ['PreAuthorize', 'EnableWebSecurity'],
    lessons: ['security/authorization'],
  },
  {
    name: 'PreAuthorize',
    category: 'security',
    pkg: 'org.springframework.security.access.prepost',
    summary: 'Checks a SpEL expression before a method runs.',
    mechanism:
      'Evaluated by the method-security proxy. Expressions can use the Authentication and the method parameters by name. A failure throws AccessDeniedException (403).',
    useWhen: 'Ownership and argument-dependent rules that URL patterns cannot express.',
    pitfall:
      'Complex business rules written as long SpEL strings. Call a bean instead: @PreAuthorize("@taskAccess.canEdit(#id, authentication)").',
    example: {
      lang: 'java',
      code: `@PreAuthorize("hasAuthority('SCOPE_tasks.write') and @taskAccess.isOwner(#id, authentication)")
public void delete(UUID id) { … }`,
    },
    related: ['EnableMethodSecurity', 'AuthenticationPrincipal'],
    lessons: ['security/authorization'],
  },
  {
    name: 'AuthenticationPrincipal',
    category: 'security',
    pkg: 'org.springframework.security.core.annotation',
    summary: 'Injects the current user’s principal into a controller method.',
    mechanism: 'Resolved from the SecurityContext. With a JWT resource server the principal is a Jwt.',
    useWhen: 'A handler needs the caller’s identity.',
    avoidWhen: 'Deep in the service layer — pass the id explicitly rather than reading the security context everywhere.',
    example: {
      lang: 'java',
      code: `@GetMapping("/me/tasks")
public List<TaskResponse> mine(@AuthenticationPrincipal Jwt jwt) {
    return tasks.ownedBy(jwt.getSubject());
}`,
    },
    related: ['PreAuthorize'],
    lessons: ['security/jwt-oauth2'],
  },

  /* --------------------------------------------------------------- testing */
  {
    name: 'SpringBootTest',
    category: 'testing',
    pkg: 'org.springframework.boot.test.context',
    summary: 'Starts the whole application context for an integration test.',
    mechanism:
      'Loads the full configuration. Contexts are cached across test classes with identical configuration, so a shared base class keeps the suite fast. webEnvironment = RANDOM_PORT starts a real server.',
    useWhen: 'Testing wiring across layers with real infrastructure.',
    avoidWhen: 'Testing one layer — a slice (@WebMvcTest, @DataJpaTest) is much faster.',
    pitfall:
      'Every distinct combination of @MockitoBean, properties and profiles creates a new cached context. A suite with dozens of variations spends most of its time starting Spring.',
    example: {
      lang: 'java',
      code: `@SpringBootTest
@Testcontainers
abstract class IntegrationTest {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
}`,
    },
    related: ['WebMvcTest', 'DataJpaTest', 'ServiceConnection', 'MockitoBean'],
    lessons: ['testing/testing-strategy', 'testing/testcontainers'],
  },
  {
    name: 'WebMvcTest',
    category: 'testing',
    pkg: 'org.springframework.boot.test.autoconfigure.web.servlet',
    summary: 'A test slice that starts only the MVC layer.',
    mechanism:
      'Loads controllers, advice, converters, filters and security — not services or repositories — and provides a MockMvc. Collaborators are replaced with @MockitoBean.',
    useWhen: 'Testing mapping, validation, error format and status codes.',
    pitfall: 'Omitting the controller class, which loads every controller and their dependencies.',
    example: {
      lang: 'java',
      code: `@WebMvcTest(TaskController.class)
class TaskControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean TaskService tasks;
}`,
    },
    related: ['MockitoBean', 'SpringBootTest', 'DataJpaTest'],
    lessons: ['testing/slice-tests'],
  },
  {
    name: 'DataJpaTest',
    category: 'testing',
    pkg: 'org.springframework.boot.test.autoconfigure.orm.jpa',
    summary: 'A test slice for JPA repositories.',
    mechanism:
      'Loads entities, repositories and a DataSource, and runs each test in a transaction that rolls back. By default it replaces your DataSource with an embedded database.',
    useWhen: 'Testing queries and mappings.',
    pitfall:
      'Testing against H2 when production is Postgres. Use @AutoConfigureTestDatabase(replace = NONE) with Testcontainers.',
    example: {
      lang: 'java',
      code: `@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TaskRepositoryIT { … }`,
    },
    related: ['WebMvcTest', 'ServiceConnection'],
    lessons: ['testing/slice-tests', 'testing/testcontainers'],
  },
  {
    name: 'MockitoBean',
    category: 'testing',
    pkg: 'org.springframework.test.context.bean.override.mockito',
    summary: 'Replaces a bean in the test context with a Mockito mock.',
    mechanism:
      'Part of Spring Framework 6.2’s bean-override support. The mock is reset after each test. @MockitoSpyBean is the spy equivalent.',
    useWhen: 'In slice tests, to replace the layer below the one under test.',
    pitfall: 'Mocking in @SpringBootTest classes with differing mocks multiplies cached contexts.',
    example: {
      lang: 'java',
      code: `@MockitoBean
TaskService tasks;

@Test
void returns_404() throws Exception {
    given(tasks.get(any())).willThrow(new TaskNotFoundException(id));
    mvc.perform(get("/api/tasks/{id}", id)).andExpect(status().isNotFound());
}`,
    },
    related: ['MockBean', 'WebMvcTest'],
    lessons: ['testing/slice-tests'],
  },
  {
    name: 'MockBean',
    category: 'testing',
    pkg: 'org.springframework.boot.test.mock.mockito',
    summary: 'The older Spring Boot annotation for replacing a bean with a mock.',
    mechanism: 'Same idea as @MockitoBean, implemented by Spring Boot rather than the framework.',
    useWhen: 'Existing code only.',
    deprecated: 'Deprecated in Spring Boot 3.4 — use @MockitoBean (and @MockitoSpyBean instead of @SpyBean).',
    example: {
      lang: 'java',
      code: `// Before
@MockBean TaskService tasks;

// After
@MockitoBean TaskService tasks;`,
    },
    related: ['MockitoBean'],
    lessons: ['testing/slice-tests'],
  },
  {
    name: 'ServiceConnection',
    category: 'testing',
    pkg: 'org.springframework.boot.testcontainers.service.connection',
    summary: 'Wires a Testcontainers container into Spring Boot’s connection properties.',
    mechanism:
      'Boot reads the host, port and credentials from the container and supplies them as connection details — no property plumbing.',
    useWhen: 'Every container that Boot has connection details for: Postgres, Kafka, Redis, and more.',
    pitfall: 'A non-static @Container field starts a new container per test method.',
    example: {
      lang: 'java',
      code: `@Container
@ServiceConnection
static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");`,
    },
    related: ['DynamicPropertySource', 'SpringBootTest'],
    lessons: ['testing/testcontainers'],
  },
  {
    name: 'DynamicPropertySource',
    category: 'testing',
    pkg: 'org.springframework.test.context',
    summary: 'Adds properties to the test Environment from code.',
    mechanism: 'A static method receiving a registry; values are suppliers, so they can read a container’s runtime port.',
    useWhen: 'Properties that @ServiceConnection does not cover.',
    example: {
      lang: 'java',
      code: `@DynamicPropertySource
static void props(DynamicPropertyRegistry registry) {
    registry.add("partner.api.url", () -> wiremock.baseUrl());
}`,
    },
    related: ['ServiceConnection'],
    lessons: ['testing/testcontainers'],
  },
  {
    name: 'ActiveProfiles',
    category: 'testing',
    pkg: 'org.springframework.test.context',
    summary: 'Activates profiles for a test class.',
    mechanism: 'Part of the context cache key — different profiles mean a different cached context.',
    useWhen: 'Tests that need profile-specific configuration.',
    example: {
      lang: 'java',
      code: `@SpringBootTest
@ActiveProfiles("test")
class CheckoutIT { … }`,
    },
    related: ['Profile', 'SpringBootTest'],
    lessons: ['testing/testcontainers'],
  },
  {
    name: 'JdbcTest',
    category: 'testing',
    pkg: 'org.springframework.boot.test.autoconfigure.jdbc',
    summary: 'A test slice for plain JDBC code: JdbcTemplate, JdbcClient and repositories built on them.',
    mechanism:
      'Starts the DataSource, JdbcTemplate, NamedParameterJdbcTemplate, JdbcClient, Flyway or Liquibase, and a transaction manager — nothing else. Each test runs in a transaction that is rolled back. Like @DataJpaTest it swaps in an embedded database unless told not to.',
    useWhen: 'Testing SQL and row mapping against a real database.',
    pitfall:
      'Forgetting @AutoConfigureTestDatabase(replace = NONE), so the test runs against H2 and proves nothing about MySQL. Your own repositories are not scanned — add them with @Import.',
    example: {
      lang: 'java',
      code: `@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(BookRepository.class)
class BookRepositoryTest {
    @Container @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4");
}`,
    },
    related: ['DataJpaTest', 'Sql', 'ServiceConnection'],
    lessons: ['testing/slice-tests', 'testing/testcontainers'],
  },
  {
    name: 'Sql',
    category: 'testing',
    pkg: 'org.springframework.test.context.jdbc',
    summary: 'Runs SQL scripts before or after a test.',
    mechanism:
      'Executes the scripts on the test DataSource — by default before each test method, inside the test’s transaction when there is one, so the data is rolled back too. executionPhase = AFTER_TEST_METHOD runs clean-up scripts instead.',
    useWhen: 'Loading fixture data for repository and integration tests.',
    pitfall:
      'Fixture ids that collide with seed data from migrations. Use ids well away from anything a migration inserts.',
    example: {
      lang: 'java',
      code: `@Test
@Sql("/books-fixture.sql")
@Sql(scripts = "/cleanup.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
void finds_books_by_author() { … }`,
    },
    related: ['JdbcTest', 'DataJpaTest'],
    lessons: ['testing/testcontainers'],
  },
  {
    name: 'TestConfiguration',
    category: 'testing',
    pkg: 'org.springframework.boot.test.context',
    summary: 'Extra beans for tests that are not picked up by component scanning.',
    mechanism: 'Excluded from scanning; include it with @Import or as a nested static class.',
    useWhen: 'A fixed Clock, a fake gateway, test data builders.',
    example: {
      lang: 'java',
      code: `@TestConfiguration
static class FixedClock {
    @Bean Clock clock() { return Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC); }
}`,
    },
    related: ['Import', 'SpringBootTest'],
    lessons: ['testing/testing-strategy'],
  },

  /* -------------------------------------------- messaging, scheduling, async */
  {
    name: 'KafkaListener',
    category: 'messaging',
    pkg: 'org.springframework.kafka.annotation',
    summary: 'Consumes records from Kafka topics.',
    mechanism:
      'The listener container polls, calls the method, and commits the offset after it returns (ack-mode RECORD or BATCH). Delivery is at-least-once: the method will see duplicates.',
    useWhen: 'Event-driven consumers.',
    pitfall:
      'A slow call inside the listener exceeding max.poll.interval.ms: the consumer is evicted, the partition rebalances, and the same record is processed again elsewhere.',
    example: {
      lang: 'java',
      code: `@KafkaListener(topics = "orders.placed.v1", groupId = "inventory-service", concurrency = "3")
public void onOrderPlaced(OrderPlaced event) {
    if (processed.contains(event.id())) return;   // at-least-once
    stock.reserve(event);
}`,
    },
    related: ['RetryableTopic', 'Transactional'],
    lessons: ['event-driven/messaging-foundations', 'event-driven/idempotency'],
  },
  {
    name: 'RetryableTopic',
    category: 'messaging',
    pkg: 'org.springframework.kafka.annotation',
    summary: 'Non-blocking retries through retry topics, ending in a dead-letter topic.',
    mechanism:
      'A failed record is republished to a retry topic and the original offset committed, so the partition keeps moving. A @DltHandler method receives records that exhaust the attempts.',
    useWhen: 'Independent records where a stalled partition costs more than ordering.',
    avoidWhen: 'Consumers applying ordered state changes per key — retried records arrive out of order.',
    example: {
      lang: 'java',
      code: `@RetryableTopic(attempts = "4", backoff = @Backoff(delay = 2000, multiplier = 4.0),
        exclude = MalformedRequestException.class)
@KafkaListener(topics = "notifications.requested.v1")
public void onRequest(NotificationRequest request) { … }

@DltHandler
public void onDeadLetter(NotificationRequest request) { … }`,
    },
    related: ['KafkaListener'],
    lessons: ['build-notifications/delivering-reliably', 'event-driven/messaging-foundations'],
  },
  {
    name: 'EventListener',
    category: 'messaging',
    pkg: 'org.springframework.context.event',
    summary: 'Handles an in-process application event.',
    mechanism:
      'Synchronous by default: the publisher waits, and runs in the listener’s exception path. Add @Async to decouple, or use @TransactionalEventListener to wait for commit.',
    useWhen: 'Decoupling modules inside one application.',
    pitfall: 'Assuming it is asynchronous. A slow listener slows the publisher, and its exception fails the publisher.',
    example: {
      lang: 'java',
      code: `@EventListener(ApplicationReadyEvent.class)
void warmUp() { cache.preload(); }`,
    },
    related: ['TransactionalEventListener', 'Async'],
    lessons: ['data/transactions'],
  },
  {
    name: 'Async',
    category: 'messaging',
    pkg: 'org.springframework.scheduling.annotation',
    summary: 'Runs a method on another thread.',
    mechanism:
      'Proxy-based; needs @EnableAsync. Boot provides the applicationTaskExecutor (virtual threads when spring.threads.virtual.enabled is true). Return void or CompletableFuture.',
    useWhen: 'Fire-and-forget work that can be lost on restart.',
    avoidWhen: 'Work that must not be lost — use a message broker or an outbox instead.',
    pitfall:
      'Self-invocation runs synchronously; exceptions from void methods vanish unless you configure an AsyncUncaughtExceptionHandler; the security and transaction context do not propagate.',
    example: {
      lang: 'java',
      code: `@Async
public CompletableFuture<Report> build(UUID id) {
    return CompletableFuture.completedFuture(renderer.render(id));
}`,
    },
    related: ['EnableAsync', 'Transactional', 'EventListener'],
    lessons: ['spring-core/aop-proxies', 'production/virtual-threads'],
  },
  {
    name: 'EnableAsync',
    category: 'messaging',
    pkg: 'org.springframework.scheduling.annotation',
    summary: 'Turns on @Async processing.',
    mechanism: 'Registers the async advisor. Not enabled by default in Boot.',
    useWhen: 'Once, on a configuration class, if you use @Async.',
    pitfall: 'Forgetting it: @Async methods then run synchronously and nothing complains.',
    example: {
      lang: 'java',
      code: `@Configuration
@EnableAsync
public class AsyncConfig { }`,
    },
    related: ['Async'],
    lessons: ['spring-core/aop-proxies'],
  },
  {
    name: 'Scheduled',
    category: 'messaging',
    pkg: 'org.springframework.scheduling.annotation',
    summary: 'Runs a method on a timer.',
    mechanism:
      'fixedRate measures start to start; fixedDelay measures end to start; cron uses a six-field expression. Needs @EnableScheduling. Boot’s scheduler has a single thread by default, so one slow job delays all others.',
    useWhen: 'Periodic housekeeping.',
    pitfall:
      'Every instance runs the job — three replicas run it three times. Use ShedLock (@SchedulerLock) or a database arbiter.',
    example: {
      lang: 'java',
      code: `@Scheduled(fixedDelay = 60_000)
@SchedulerLock(name = "outboxRelay", lockAtMostFor = "PT4M")
public void relay() { … }`,
    },
    related: ['EnableScheduling', 'SchedulerLock'],
    lessons: ['event-driven/outbox-pattern', 'redis-ops/distributed-locks'],
  },
  {
    name: 'EnableScheduling',
    category: 'messaging',
    pkg: 'org.springframework.scheduling.annotation',
    summary: 'Turns on @Scheduled processing.',
    mechanism: 'Registers the scheduling post-processor. Pool size is spring.task.scheduling.pool.size (default 1).',
    useWhen: 'Once, if you use @Scheduled.',
    example: {
      lang: 'java',
      code: `@Configuration
@EnableScheduling
public class SchedulingConfig { }`,
    },
    related: ['Scheduled'],
    lessons: ['event-driven/outbox-pattern'],
  },
  {
    name: 'SchedulerLock',
    category: 'messaging',
    pkg: 'net.javacrumbs.shedlock.spring.annotation',
    summary: 'ShedLock: runs a scheduled job on only one instance at a time.',
    mechanism:
      'Takes a lock row (or key) before running. lockAtMostFor bounds a crashed holder; lockAtLeastFor stops a fast job running twice when clocks differ.',
    useWhen: 'Any @Scheduled job in an application with more than one replica.',
    pitfall: 'A job that outlives lockAtMostFor can run concurrently with the next one.',
    example: {
      lang: 'java',
      code: `@Scheduled(cron = "0 */5 * * * *")
@SchedulerLock(name = "importRelay", lockAtMostFor = "PT4M", lockAtLeastFor = "PT30S")
public void runImport() { … }`,
    },
    related: ['Scheduled'],
    lessons: ['redis-ops/distributed-locks'],
  },

  /* ------------------------------------------------------ cloud & resilience */
  {
    name: 'CircuitBreaker',
    category: 'cloud',
    pkg: 'io.github.resilience4j.circuitbreaker.annotation',
    summary: 'Resilience4j: stops calling a failing dependency for a while.',
    mechanism:
      'Proxy-based. After the failure rate crosses the threshold the breaker opens and calls fail immediately (or go to fallbackMethod) until the wait duration passes.',
    useWhen: 'Every remote call, in a gateway component you own rather than on the client interface.',
    pitfall:
      'A fallbackMethod with the wrong signature fails at runtime, not compile time: same parameters plus the exception, same return type.',
    example: {
      lang: 'java',
      code: `@CircuitBreaker(name = "catalog", fallbackMethod = "fromCache")
@Retry(name = "catalog")
public ProductView byId(UUID id) { return catalog.byId(id); }

ProductView fromCache(UUID id, Exception cause) { … }`,
    },
    related: ['Retry', 'Bulkhead', 'FeignClient'],
    lessons: ['resilience/circuit-breakers', 'resilience/http-clients'],
  },
  {
    name: 'Retry',
    category: 'cloud',
    pkg: 'io.github.resilience4j.retry.annotation',
    summary: 'Resilience4j: retries a failing call with backoff.',
    mechanism:
      'Retry wraps the circuit breaker, so retries against an open breaker fail fast. Configure retryable exceptions — retrying a 400 is pointless.',
    useWhen: 'Idempotent calls that fail transiently.',
    avoidWhen: 'Non-idempotent operations without an idempotency key.',
    pitfall: 'Retries at several layers multiply: three layers of three attempts is 27 calls during an outage.',
    example: {
      lang: 'java',
      code: `@Retry(name = "payments")
public Receipt charge(Charge charge) { … }`,
    },
    related: ['CircuitBreaker', 'Bulkhead'],
    lessons: ['resilience/retries-timeouts'],
  },
  {
    name: 'Bulkhead',
    category: 'cloud',
    pkg: 'io.github.resilience4j.bulkhead.annotation',
    summary: 'Resilience4j: limits concurrent calls to one dependency.',
    mechanism: 'Semaphore (default) or thread-pool isolation; calls beyond the limit wait briefly, then are rejected.',
    useWhen: 'Protecting your thread pool from one slow dependency.',
    example: {
      lang: 'java',
      code: `@Bulkhead(name = "reports")
public Report render(UUID id) { … }`,
    },
    related: ['CircuitBreaker', 'Retry'],
    lessons: ['resilience/bulkheads-ratelimits'],
  },
  {
    name: 'FeignClient',
    category: 'cloud',
    pkg: 'org.springframework.cloud.openfeign',
    summary: 'OpenFeign: a declarative HTTP client from an interface.',
    mechanism:
      'name is a service-discovery key resolved by Spring Cloud LoadBalancer. Needs @EnableFeignClients. OpenFeign has been feature-complete since Spring Cloud 2022.0.0.',
    useWhen: 'Existing Spring Cloud codebases that already use it.',
    avoidWhen: 'New code — Spring HTTP interfaces (@HttpExchange) are the recommended successor.',
    pitfall: 'Default timeouts of 10s connect and 60s read, which stall any caller holding a thread or a Kafka partition.',
    example: {
      lang: 'java',
      code: `@FeignClient(name = "email-service")
public interface EmailClient {
    @PostMapping("/api/emails")
    DeliveryReceipt send(@RequestBody EmailRequest request);
}`,
    },
    related: ['HttpExchange', 'LoadBalanced', 'EnableFeignClients', 'CircuitBreaker'],
    lessons: ['build-notifications/calling-services-by-name', 'resilience/http-clients'],
  },
  {
    name: 'EnableFeignClients',
    category: 'cloud',
    pkg: 'org.springframework.cloud.openfeign',
    summary: 'Scans for @FeignClient interfaces and creates their proxies.',
    mechanism: 'Scans the annotated class’s package by default.',
    useWhen: 'Once, if you use Feign.',
    example: {
      lang: 'java',
      code: `@SpringBootApplication
@EnableFeignClients
public class DispatchApplication { … }`,
    },
    related: ['FeignClient'],
    lessons: ['build-notifications/calling-services-by-name'],
  },
  {
    name: 'HttpExchange',
    category: 'cloud',
    pkg: 'org.springframework.web.service.annotation',
    summary: 'Spring HTTP interfaces: a declarative client in core Spring. Siblings: @GetExchange, @PostExchange.',
    mechanism:
      'An HttpServiceProxyFactory builds the implementation over a RestClient (or WebClient). All the real configuration — timeouts, observation, status handling — lives on that client.',
    useWhen: 'New declarative clients.',
    pitfall: 'Building the RestClient with RestClient.create() instead of the injected builder loses tracing and metrics.',
    example: {
      lang: 'java',
      code: `@HttpExchange("/api/emails")
public interface EmailApi {
    @PostExchange
    DeliveryReceipt send(@RequestBody EmailRequest request);
}`,
    },
    related: ['FeignClient', 'LoadBalanced'],
    lessons: ['resilience/http-clients', 'build-notifications/calling-services-by-name'],
  },
  {
    name: 'LoadBalanced',
    category: 'cloud',
    pkg: 'org.springframework.cloud.client.loadbalancer',
    summary: 'Makes a RestClient.Builder or WebClient.Builder resolve service names.',
    mechanism: 'Adds an interceptor that replaces http://service-name with a live instance chosen by Spring Cloud LoadBalancer.',
    useWhen: 'Calling services registered in Eureka (or another discovery client) by name.',
    pitfall: 'Without it, http://email-service is treated as a hostname and DNS fails.',
    example: {
      lang: 'java',
      code: `@Bean
@LoadBalanced
RestClient.Builder loadBalanced(RestClient.Builder builder) {
    return builder;
}`,
    },
    related: ['HttpExchange', 'FeignClient', 'EnableEurekaServer'],
    lessons: ['microservices-fundamentals/service-discovery'],
  },
  {
    name: 'EnableEurekaServer',
    category: 'cloud',
    pkg: 'org.springframework.cloud.netflix.eureka.server',
    summary: 'Turns a Boot application into a Eureka service registry.',
    mechanism:
      'An in-memory registry of heartbeats. Clients register, renew leases, and cache the registry locally.',
    useWhen: 'Service discovery off Kubernetes — VMs, ECS without discovery, hybrid estates.',
    avoidWhen: 'On Kubernetes, where a Service already provides discovery.',
    pitfall: 'Disabling self-preservation, so a network blip evicts every instance.',
    example: {
      lang: 'java',
      code: `@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication { … }`,
    },
    related: ['LoadBalanced', 'FeignClient'],
    lessons: ['build-notifications/the-discovery-server', 'microservices-fundamentals/service-discovery'],
  },
  {
    name: 'Observed',
    category: 'cloud',
    pkg: 'io.micrometer.observation.annotation',
    summary: 'Micrometer: records a timer and a span for a method.',
    mechanism: 'Needs an ObservedAspect bean (and AOP on the classpath). One observation produces both metrics and a trace span.',
    useWhen: 'Business operations worth measuring that are not already HTTP or messaging calls.',
    pitfall: 'High-cardinality tags (user ids) explode the metric series count.',
    example: {
      lang: 'java',
      code: `@Observed(name = "checkout.place-order", contextualName = "place-order")
public Order place(Cart cart) { … }`,
    },
    related: ['Async'],
    lessons: ['observability/micrometer-metrics', 'observability/distributed-tracing'],
  },
];
