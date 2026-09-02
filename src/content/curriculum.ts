import type { LessonRef, Module } from '@/lib/types';

/**
 * The single source of truth for the learning path.
 *
 * Every entry here must have a matching MDX file at
 * `src/content/modules/{module.id}-{module.slug}/{lesson.slug}.mdx`.
 * `tests/curriculum.test.ts` enforces that in both directions.
 */
export const modules: Module[] = [
  {
    id: '00',
    slug: 'foundations',
    title: 'Foundations',
    tagline: 'Get oriented and get running',
    description:
      'What Spring actually is, how Boot changed it, and how to get a working project on your machine in under ten minutes.',
    track: 'foundation',
    lessons: [
      {
        slug: 'what-is-spring',
        title: 'What Spring Actually Is',
        summary:
          'The problem Spring was invented to solve, how Boot changed the deal, and a map of the ecosystem.',
        minutes: 12,
        level: 'beginner',
        objectives: [
          'Explain the difference between the Spring Framework, Spring Boot, and Spring Cloud',
          'Describe the problem inversion of control solves',
          'Navigate the ecosystem without getting lost in project names',
        ],
        tags: ['spring', 'boot', 'ecosystem', 'history'],
      },
      {
        slug: 'environment-setup',
        title: 'Setting Up Your Environment',
        summary:
          'JDK 21, Maven vs Gradle, IDE configuration, and the toolchain choices that matter.',
        minutes: 10,
        level: 'beginner',
        objectives: [
          'Install and verify a JDK 21 toolchain',
          'Choose between Maven and Gradle with real criteria',
          'Configure an IDE for fast Spring feedback loops',
        ],
        tags: ['jdk', 'maven', 'gradle', 'setup'],
      },
      {
        slug: 'first-application',
        title: 'Your First Application, Line by Line',
        summary:
          'Generate, run, and then read every single line of a Spring Boot application until nothing is magic.',
        minutes: 15,
        level: 'beginner',
        objectives: [
          'Generate a project with Spring Initializr and understand each choice',
          'Explain what @SpringBootApplication expands to',
          'Trace what happens between main() and "Started Application in 1.2s"',
        ],
        tags: ['initializr', 'main', 'startup'],
      },
      {
        slug: 'project-anatomy',
        title: 'Anatomy of a Real Project',
        summary:
          'Package layout, layering, and the folder structure that survives contact with a growing team.',
        minutes: 12,
        level: 'beginner',
        objectives: [
          'Lay out packages by feature rather than by technical layer',
          'Decide what belongs in controller, service, and repository',
          'Recognise structures that will hurt you in six months',
        ],
        tags: ['structure', 'layering', 'packages'],
      },
    ],
  },
  {
    id: '01',
    slug: 'spring-core',
    title: 'Spring Core',
    tagline: 'The container, and everything built on it',
    description:
      'The IoC container is the engine under every Spring feature you will ever use. Understand it once and the rest of the framework stops being magic.',
    track: 'core',
    lessons: [
      {
        slug: 'ioc-container',
        title: 'The IoC Container',
        summary:
          'What the ApplicationContext really is, and what it does between startup and shutdown.',
        minutes: 16,
        level: 'beginner',
        objectives: [
          'Describe the container lifecycle from BeanDefinition to singleton',
          'Explain BeanFactory vs ApplicationContext',
          'Inspect the live bean registry of a running application',
        ],
        tags: ['ioc', 'applicationcontext', 'beans'],
      },
      {
        slug: 'dependency-injection',
        title: 'Dependency Injection Done Right',
        summary:
          'Constructor, setter, and field injection — why exactly one of them is the correct default.',
        minutes: 14,
        level: 'beginner',
        objectives: [
          'Justify constructor injection over field injection with concrete failure modes',
          'Resolve ambiguity with @Qualifier, @Primary, and typed collections',
          'Break circular dependencies instead of papering over them',
        ],
        tags: ['di', 'constructor-injection', 'qualifier'],
      },
      {
        slug: 'bean-lifecycle',
        title: 'Bean Scopes and Lifecycle',
        summary:
          'Singleton, prototype, request scope, and the callbacks that fire in between — with the ordering diagram.',
        minutes: 16,
        level: 'intermediate',
        objectives: [
          'Order the lifecycle callbacks from instantiation to destruction',
          'Choose the right scope and know when scoped proxies are required',
          'Avoid the classic singleton-holding-a-prototype bug',
        ],
        tags: ['scopes', 'lifecycle', 'postconstruct'],
      },
      {
        slug: 'configuration-classes',
        title: '@Configuration and Bean Proxying',
        summary:
          'Why @Configuration classes are subclassed at runtime, and what breaks when they are not.',
        minutes: 14,
        level: 'intermediate',
        objectives: [
          'Explain the difference between full and lite @Configuration mode',
          'Predict how many instances an inter-bean method call creates',
          'Use @Import, @Conditional, and factory beans deliberately',
        ],
        tags: ['configuration', 'cglib', 'proxying'],
      },
      {
        slug: 'aop-proxies',
        title: 'AOP, Proxies, and Self-Invocation',
        summary:
          'How @Transactional and @Cacheable actually work — and the one mistake that silently disables both.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Trace a method call through a JDK dynamic proxy and a CGLIB proxy',
          'Explain precisely why self-invocation bypasses advice',
          'Write a custom aspect with correct pointcut and ordering',
        ],
        tags: ['aop', 'proxy', 'transactional', 'pitfall'],
      },
    ],
  },
  {
    id: '02',
    slug: 'boot-essentials',
    title: 'Spring Boot Essentials',
    tagline: 'Auto-configuration, demystified',
    description:
      'Boot is a very well-organised pile of conditional configuration. Once you can read it, you can predict and override anything it does.',
    track: 'core',
    lessons: [
      {
        slug: 'auto-configuration',
        title: 'Auto-Configuration, Traced End to End',
        summary:
          'Follow a single auto-configuration from the classpath scan to the bean it registers.',
        minutes: 20,
        level: 'intermediate',
        objectives: [
          'Read AutoConfiguration.imports and the @Conditional family',
          'Use the condition evaluation report to debug missing beans',
          'Override or exclude any auto-configuration on purpose',
        ],
        tags: ['autoconfiguration', 'conditional', 'debugging'],
      },
      {
        slug: 'starters-dependencies',
        title: 'Starters and Dependency Management',
        summary:
          'What a starter contains, how the BOM pins versions, and how to build your own company starter.',
        minutes: 14,
        level: 'intermediate',
        objectives: [
          'Explain how spring-boot-dependencies removes version guesswork',
          'Diagnose and resolve a transitive dependency conflict',
          'Package shared company configuration as a reusable starter',
        ],
        tags: ['starters', 'bom', 'maven'],
      },
      {
        slug: 'configuration-properties',
        title: 'External Configuration and Profiles',
        summary:
          'The full property precedence order, profile activation, and config that behaves the same locally and in production.',
        minutes: 16,
        level: 'intermediate',
        objectives: [
          'Recite the property source precedence order and use it deliberately',
          'Structure profiles without creating a combinatorial mess',
          'Keep secrets out of application.yml for good',
        ],
        tags: ['properties', 'profiles', 'yaml', 'config'],
      },
      {
        slug: 'typed-config',
        title: 'Type-Safe Configuration',
        summary:
          '@ConfigurationProperties with records, validation, and metadata that your IDE can autocomplete.',
        minutes: 12,
        level: 'intermediate',
        objectives: [
          'Bind configuration to immutable records with constructor binding',
          'Fail fast at startup with @Validated configuration',
          'Generate configuration metadata for IDE support',
        ],
        tags: ['configurationproperties', 'records', 'validation'],
      },
      {
        slug: 'actuator-logging',
        title: 'Actuator and Structured Logging',
        summary:
          'Health checks that mean something, metrics endpoints, and logs a machine can actually parse.',
        minutes: 16,
        level: 'intermediate',
        objectives: [
          'Design liveness and readiness probes that reflect real health',
          'Expose the right actuator endpoints without leaking internals',
          'Emit JSON logs with correlation identifiers',
        ],
        tags: ['actuator', 'health', 'logging', 'observability'],
      },
    ],
  },
  {
    id: '03',
    slug: 'web-rest',
    title: 'Web and REST APIs',
    tagline: 'From socket to response body',
    description:
      'Everything that happens between a TCP connection arriving and JSON leaving — and how to design APIs that clients enjoy.',
    track: 'core',
    lessons: [
      {
        slug: 'request-lifecycle',
        title: 'The Request Lifecycle',
        summary:
          'The complete DispatcherServlet flow: filters, handler mapping, argument resolvers, message converters.',
        minutes: 20,
        level: 'intermediate',
        objectives: [
          'Name every stage a request passes through, in order',
          'Explain where filters differ from interceptors and when to use each',
          'Debug a 404 or 415 by reasoning about the pipeline',
        ],
        tags: ['dispatcherservlet', 'mvc', 'lifecycle', 'diagram'],
      },
      {
        slug: 'rest-controllers',
        title: 'Building REST Controllers',
        summary:
          'Mapping, binding, content negotiation, and DTOs that keep your entities out of your API.',
        minutes: 18,
        level: 'beginner',
        objectives: [
          'Map requests precisely with the @RequestMapping family',
          'Separate DTOs from entities and justify the cost',
          'Return correct status codes and representations',
        ],
        tags: ['rest', 'controller', 'dto'],
      },
      {
        slug: 'validation-errors',
        title: 'Validation and Error Contracts',
        summary:
          'Bean Validation, @ControllerAdvice, and RFC 9457 problem details that clients can act on.',
        minutes: 18,
        level: 'intermediate',
        objectives: [
          'Validate request bodies, params, and nested objects correctly',
          'Centralise exception handling without swallowing failures',
          'Return machine-readable errors using ProblemDetail',
        ],
        tags: ['validation', 'exceptions', 'problemdetail'],
      },
      {
        slug: 'api-design',
        title: 'API Design That Ages Well',
        summary:
          'Versioning strategies, pagination, filtering, idempotent writes, and OpenAPI as a contract.',
        minutes: 20,
        level: 'advanced',
        objectives: [
          'Pick a versioning strategy and understand its migration cost',
          'Implement keyset pagination and know why offset pagination degrades',
          'Publish an OpenAPI document that stays in sync with the code',
        ],
        tags: ['api-design', 'versioning', 'pagination', 'openapi'],
      },
      {
        slug: 'reactive-intro',
        title: 'WebFlux vs MVC',
        summary:
          'Where reactive genuinely pays off, where it costs you, and how virtual threads changed the calculus.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Compare the thread models of MVC, WebFlux, and virtual threads',
          'Identify workloads where reactive is worth the complexity',
          'Avoid blocking calls inside a reactive pipeline',
        ],
        tags: ['webflux', 'reactive', 'virtual-threads'],
      },
    ],
  },
  {
    id: '04',
    slug: 'data',
    title: 'Data Access',
    tagline: 'Where most production incidents are born',
    description:
      'JPA is powerful and full of traps. This module is about writing data access that stays fast when the table has fifty million rows.',
    track: 'core',
    lessons: [
      {
        slug: 'jpa-fundamentals',
        title: 'Spring Data JPA Fundamentals',
        summary:
          'Repositories, derived queries, the persistence context, and what actually hits the database.',
        minutes: 18,
        level: 'beginner',
        objectives: [
          'Explain the persistence context and entity states',
          'Use derived, JPQL, and native queries appropriately',
          'Turn on SQL logging and read what Hibernate emits',
        ],
        tags: ['jpa', 'hibernate', 'repository'],
      },
      {
        slug: 'entity-mapping',
        title: 'Entity Mapping and Relationships',
        summary:
          'Associations, fetch types, cascades, and equals/hashCode for entities without shooting yourself.',
        minutes: 20,
        level: 'intermediate',
        objectives: [
          'Model one-to-many and many-to-many without surprise queries',
          'Choose fetch and cascade settings deliberately',
          'Implement equals/hashCode that survives the persistence lifecycle',
        ],
        tags: ['entities', 'relationships', 'fetch', 'cascade'],
      },
      {
        slug: 'n-plus-one',
        title: 'Killing the N+1 Problem',
        summary:
          'The single most common performance bug in Spring applications — how to see it, fix it, and prevent it in CI.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Reproduce and measure an N+1 query',
          'Fix it with join fetch, entity graphs, and projections',
          'Add an automated guard so it never comes back',
        ],
        tags: ['performance', 'n+1', 'entitygraph', 'pitfall'],
      },
      {
        slug: 'transactions',
        title: 'Transactions in Depth',
        summary:
          'Propagation, isolation, rollback rules, and the read-committed anomalies that bite in production.',
        minutes: 22,
        level: 'advanced',
        objectives: [
          'Predict behaviour for every propagation type',
          'Choose an isolation level from the anomalies you must prevent',
          'Handle optimistic and pessimistic locking correctly',
        ],
        tags: ['transactions', 'propagation', 'isolation', 'locking'],
      },
      {
        slug: 'migrations',
        title: 'Schema Migrations with Flyway',
        summary:
          'Versioned migrations, expand-contract for zero-downtime schema change, and rollback that actually works.',
        minutes: 16,
        level: 'intermediate',
        objectives: [
          'Set up repeatable, versioned migrations',
          'Apply the expand–migrate–contract pattern for live schema changes',
          'Avoid the ddl-auto trap in production',
        ],
        tags: ['flyway', 'migrations', 'zero-downtime'],
      },
      {
        slug: 'caching-redis',
        title: 'Caching Strategies and Redis',
        summary:
          'Cache-aside, TTLs, stampede protection, and invalidation that does not corrupt your data.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Apply the Spring Cache abstraction with Redis',
          'Choose a caching pattern from the consistency you need',
          'Protect against cache stampedes and hot keys',
        ],
        tags: ['caching', 'redis', 'performance'],
      },
    ],
  },
  {
    id: '05',
    slug: 'security',
    title: 'Security',
    tagline: 'The filter chain and everything it protects',
    description:
      'Spring Security looks impenetrable until you see the filter chain. Then it becomes the most predictable part of your stack.',
    track: 'core',
    lessons: [
      {
        slug: 'filter-chain',
        title: 'The Security Filter Chain',
        summary: 'Every filter, in order, with the diagram that makes Spring Security click.',
        minutes: 18,
        level: 'intermediate',
        objectives: [
          'Order the default filters and explain what each contributes',
          'Configure SecurityFilterChain beans for multiple path groups',
          'Debug why a request is being rejected',
        ],
        tags: ['security', 'filters', 'diagram'],
      },
      {
        slug: 'authentication',
        title: 'Authentication and Credentials',
        summary:
          'AuthenticationManager, providers, password hashing, and account lifecycle done safely.',
        minutes: 18,
        level: 'intermediate',
        objectives: [
          'Trace an authentication request through provider and manager',
          'Store passwords with a modern adaptive hash',
          'Implement custom authentication without weakening defaults',
        ],
        tags: ['authentication', 'passwords', 'bcrypt'],
      },
      {
        slug: 'authorization',
        title: 'Authorization Models',
        summary:
          'Roles, authorities, method security, and attribute-based rules for multi-tenant systems.',
        minutes: 16,
        level: 'advanced',
        objectives: [
          'Distinguish roles from authorities and model them coherently',
          'Apply method security with @PreAuthorize safely',
          'Enforce tenant isolation at the data layer',
        ],
        tags: ['authorization', 'rbac', 'method-security', 'multi-tenancy'],
      },
      {
        slug: 'jwt-oauth2',
        title: 'JWT and OAuth2 Resource Servers',
        summary:
          'Token validation, JWK rotation, scopes, and why you should almost never hand-roll JWT parsing.',
        minutes: 22,
        level: 'advanced',
        objectives: [
          'Configure a resource server against an OIDC provider',
          'Validate signatures, issuers, audiences, and expiry correctly',
          'Propagate identity across service boundaries',
        ],
        tags: ['jwt', 'oauth2', 'oidc', 'tokens'],
      },
      {
        slug: 'security-hardening',
        title: 'Hardening for Production',
        summary:
          'CORS, CSRF, security headers, secret management, and dependency scanning in CI.',
        minutes: 16,
        level: 'advanced',
        objectives: [
          'Configure CORS and CSRF correctly for your client type',
          'Set the security headers that actually matter',
          'Keep secrets and vulnerable dependencies out of your images',
        ],
        tags: ['cors', 'csrf', 'headers', 'secrets'],
      },
    ],
  },
  {
    id: '06',
    slug: 'testing',
    title: 'Testing',
    tagline: 'Confidence that scales with the codebase',
    description:
      'Tests that catch real bugs, run fast, and do not shatter every time you rename a method.',
    track: 'core',
    lessons: [
      {
        slug: 'testing-strategy',
        title: 'A Testing Strategy That Scales',
        summary:
          'What to test at which level, what never to mock, and how to keep the suite under two minutes.',
        minutes: 16,
        level: 'intermediate',
        objectives: [
          'Allocate coverage across unit, slice, and integration tests',
          'Recognise tests that assert implementation instead of behaviour',
          'Keep feedback loops fast as the suite grows',
        ],
        tags: ['testing', 'strategy', 'pyramid'],
      },
      {
        slug: 'slice-tests',
        title: 'Slice Tests',
        summary: '@WebMvcTest, @DataJpaTest, @JsonTest — loading only the context you need.',
        minutes: 16,
        level: 'intermediate',
        objectives: [
          'Choose the right slice annotation for each test',
          'Use MockMvc and @MockitoBean effectively',
          'Avoid context reloads that quietly triple your build time',
        ],
        tags: ['webmvctest', 'datajpatest', 'mockmvc'],
      },
      {
        slug: 'testcontainers',
        title: 'Integration Testing with Testcontainers',
        summary:
          'Real Postgres, real Kafka, real Redis in your test suite — reproducibly and fast.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Run integration tests against real infrastructure',
          'Share containers across tests without cross-contamination',
          'Use @ServiceConnection to remove configuration boilerplate',
        ],
        tags: ['testcontainers', 'integration', 'docker'],
      },
      {
        slug: 'contract-testing',
        title: 'Contract Testing Across Services',
        summary:
          'How to change a shared API without a coordinated deployment and a war room.',
        minutes: 18,
        level: 'expert',
        objectives: [
          'Explain consumer-driven contracts and what they guarantee',
          'Wire contract verification into CI for both sides',
          'Evolve a contract without breaking consumers',
        ],
        tags: ['contract-testing', 'pact', 'microservices'],
      },
    ],
  },
  {
    id: '07',
    slug: 'microservices-fundamentals',
    title: 'Microservices Fundamentals',
    tagline: 'Distribution is a cost — buy it deliberately',
    description:
      'When to split a system, where to draw the lines, and the platform pieces every distributed system ends up needing.',
    track: 'microservices',
    lessons: [
      {
        slug: 'why-microservices',
        title: 'Monolith, Modular Monolith, Microservices',
        summary:
          'The honest trade-off table — and why the modular monolith is the right default for most teams.',
        minutes: 18,
        level: 'intermediate',
        objectives: [
          'State the specific problems microservices solve and the ones they create',
          'Recognise when a system genuinely needs to be split',
          'Design a modular monolith that can be split later cheaply',
        ],
        tags: ['architecture', 'monolith', 'trade-offs'],
      },
      {
        slug: 'decomposition',
        title: 'Decomposition with Bounded Contexts',
        summary:
          'Using DDD to find service boundaries that do not require distributed transactions to cross.',
        minutes: 22,
        level: 'advanced',
        objectives: [
          'Identify bounded contexts from language and business capability',
          'Test a proposed boundary against coupling and change-frequency',
          'Map context relationships and anti-corruption layers',
        ],
        tags: ['ddd', 'bounded-context', 'decomposition'],
      },
      {
        slug: 'communication-styles',
        title: 'Synchronous vs Asynchronous',
        summary:
          'Request/response, events, and commands — and how each choice propagates failure.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Choose a communication style from coupling and latency requirements',
          'Explain how synchronous chains multiply unavailability',
          'Design a read path that survives a downstream outage',
        ],
        tags: ['messaging', 'coupling', 'availability'],
      },
      {
        slug: 'api-gateway',
        title: 'The API Gateway',
        summary:
          'Spring Cloud Gateway: routing, filters, rate limiting, and where the gateway must not become a monolith.',
        minutes: 20,
        level: 'advanced',
        objectives: [
          'Configure routes, predicates, and filters',
          'Terminate authentication at the edge and propagate identity',
          'Avoid turning the gateway into a shared point of coupling',
        ],
        tags: ['gateway', 'spring-cloud', 'routing'],
      },
      {
        slug: 'service-discovery',
        title: 'Service Discovery and Load Balancing',
        summary:
          'Eureka, Consul, and Kubernetes DNS — plus client-side load balancing with Spring Cloud LoadBalancer.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Compare client-side and server-side discovery',
          'Decide when Kubernetes services make a discovery server redundant',
          'Handle instance churn and stale registrations',
        ],
        tags: ['discovery', 'eureka', 'loadbalancer', 'kubernetes'],
      },
      {
        slug: 'config-management',
        title: 'Centralised Configuration',
        summary:
          'Spring Cloud Config, ConfigMaps, refresh scope, and safe runtime reconfiguration.',
        minutes: 16,
        level: 'advanced',
        objectives: [
          'Externalise configuration across many services safely',
          'Understand what @RefreshScope can and cannot re-bind',
          'Decide between a config server and platform-native config',
        ],
        tags: ['config-server', 'configmap', 'refresh'],
      },
    ],
  },
  {
    id: '08',
    slug: 'resilience',
    title: 'Resilience and Communication',
    tagline: 'Design for the failure you will definitely have',
    description:
      'Networks partition, dependencies get slow, and retries make outages worse. This module is about surviving all three.',
    track: 'microservices',
    lessons: [
      {
        slug: 'failure-modes',
        title: 'How Distributed Systems Fail',
        summary:
          'Cascading failure, retry storms, thread pool exhaustion, and the fallacies of distributed computing.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Explain how a single slow dependency takes down a healthy service',
          'Recognise retry amplification before it causes an outage',
          'Map the failure domains in your own architecture',
        ],
        tags: ['failure', 'cascading', 'reliability'],
      },
      {
        slug: 'circuit-breakers',
        title: 'Circuit Breakers with Resilience4j',
        summary:
          'State machine, sliding windows, tuning thresholds, and fallbacks that degrade gracefully.',
        minutes: 20,
        level: 'advanced',
        objectives: [
          'Trace the closed → open → half-open state machine',
          'Tune window size and failure thresholds from real traffic',
          'Write fallbacks that degrade rather than lie',
        ],
        tags: ['resilience4j', 'circuit-breaker', 'fallback'],
      },
      {
        slug: 'retries-timeouts',
        title: 'Retries, Timeouts, and Budgets',
        summary:
          'Exponential backoff with jitter, timeout budgets across a call chain, and when never to retry.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Set timeouts that shrink down a call chain',
          'Apply backoff with jitter and a retry budget',
          'Identify operations that must never be retried',
        ],
        tags: ['retry', 'timeout', 'backoff', 'jitter'],
      },
      {
        slug: 'bulkheads-ratelimits',
        title: 'Bulkheads and Rate Limiting',
        summary: 'Isolating resource pools and shedding load before the system falls over.',
        minutes: 16,
        level: 'advanced',
        objectives: [
          'Isolate dependencies with thread-pool and semaphore bulkheads',
          'Choose between token bucket and sliding window rate limiting',
          'Shed load deliberately instead of failing randomly',
        ],
        tags: ['bulkhead', 'rate-limiting', 'load-shedding'],
      },
      {
        slug: 'http-clients',
        title: 'Feign, RestClient, and gRPC',
        summary:
          'Choosing a client, wiring resilience into it, and propagating context across the wire.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Compare RestClient, WebClient, OpenFeign, and HTTP interfaces',
          'Attach resilience and observability to every outbound call',
          'Decide when gRPC earns its schema overhead',
        ],
        tags: ['feign', 'restclient', 'grpc', 'http'],
      },
    ],
  },
  {
    id: '09',
    slug: 'event-driven',
    title: 'Event-Driven Architecture',
    tagline: 'Consistency without distributed transactions',
    description:
      'Kafka, the outbox pattern, and sagas — the toolkit for keeping data correct across services that cannot share a transaction.',
    track: 'microservices',
    lessons: [
      {
        slug: 'messaging-foundations',
        title: 'Messaging Foundations',
        summary:
          'Kafka concepts that matter to application developers: partitions, keys, offsets, consumer groups, ordering.',
        minutes: 22,
        level: 'advanced',
        objectives: [
          'Explain partitioning, keys, and the ordering guarantee you actually get',
          'Configure consumer groups, offsets, and acknowledgement correctly',
          'Handle poison messages with retry topics and a DLQ',
        ],
        tags: ['kafka', 'messaging', 'partitions', 'consumer-groups'],
      },
      {
        slug: 'outbox-pattern',
        title: 'The Transactional Outbox',
        summary:
          'The dual-write problem, and the pattern that solves it without two-phase commit.',
        minutes: 20,
        level: 'expert',
        objectives: [
          'Explain precisely why writing to a DB and a broker cannot be atomic',
          'Implement an outbox table with a reliable relay',
          'Compare polling relays with change data capture',
        ],
        tags: ['outbox', 'dual-write', 'cdc', 'debezium'],
      },
      {
        slug: 'saga-pattern',
        title: 'Sagas: Choreography vs Orchestration',
        summary:
          'Long-running business transactions, compensating actions, and picking a coordination style.',
        minutes: 24,
        level: 'expert',
        objectives: [
          'Model a multi-service workflow as a saga with compensations',
          'Choose choreography or orchestration from concrete criteria',
          'Handle partial failure and stuck sagas operationally',
        ],
        tags: ['saga', 'compensation', 'orchestration', 'choreography'],
      },
      {
        slug: 'cqrs',
        title: 'CQRS and Read Models',
        summary:
          'Splitting reads from writes, projections, and the eventual consistency your UI must handle.',
        minutes: 20,
        level: 'expert',
        objectives: [
          'Decide whether CQRS is justified for a given subsystem',
          'Build and rebuild a projection safely',
          'Design a UI that tolerates read-after-write lag',
        ],
        tags: ['cqrs', 'projections', 'eventual-consistency'],
      },
      {
        slug: 'idempotency',
        title: 'Idempotency and Delivery Guarantees',
        summary:
          'Why exactly-once delivery is a myth, and how idempotent consumers give you the same outcome.',
        minutes: 20,
        level: 'expert',
        objectives: [
          'Distinguish at-most-once, at-least-once, and effectively-once',
          'Implement an idempotent consumer with a dedup store',
          'Design idempotent HTTP writes with idempotency keys',
        ],
        tags: ['idempotency', 'exactly-once', 'deduplication'],
      },
    ],
  },
  {
    id: '10',
    slug: 'observability',
    title: 'Observability',
    tagline: 'You cannot fix what you cannot see',
    description:
      'Metrics, logs, and traces wired together so that a 3am page leads to a root cause in minutes, not hours.',
    track: 'production',
    lessons: [
      {
        slug: 'observability-model',
        title: 'The Three Signals',
        summary:
          'Metrics, logs, and traces — what each answers, what none of them answers, and how they link.',
        minutes: 16,
        level: 'intermediate',
        objectives: [
          'Choose the right signal for a given question',
          'Correlate all three with trace and span identifiers',
          'Control cardinality before it destroys your metrics bill',
        ],
        tags: ['observability', 'metrics', 'logs', 'traces'],
      },
      {
        slug: 'micrometer-metrics',
        title: 'Metrics with Micrometer',
        summary:
          'Counters, gauges, timers, percentiles, and the RED/USE dashboards worth building.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Instrument business and technical metrics correctly',
          'Understand histograms, percentiles, and why averages lie',
          'Build a dashboard from the RED method',
        ],
        tags: ['micrometer', 'prometheus', 'grafana', 'metrics'],
      },
      {
        slug: 'distributed-tracing',
        title: 'Distributed Tracing',
        summary:
          'OpenTelemetry, context propagation across HTTP and Kafka, and reading a flame graph.',
        minutes: 20,
        level: 'advanced',
        objectives: [
          'Propagate trace context across every hop, including async',
          'Add meaningful spans and attributes without noise',
          'Diagnose latency from a trace waterfall',
        ],
        tags: ['opentelemetry', 'tracing', 'context-propagation'],
      },
      {
        slug: 'slos-alerting',
        title: 'SLOs and Alerting',
        summary:
          'Error budgets, symptom-based alerts, and pages that a human can actually act on.',
        minutes: 18,
        level: 'expert',
        objectives: [
          'Define an SLI and SLO for a real service',
          'Alert on symptoms and burn rate rather than causes',
          'Write a runbook that shortens time to resolution',
        ],
        tags: ['slo', 'sli', 'alerting', 'oncall'],
      },
    ],
  },
  {
    id: '11',
    slug: 'cloud-native',
    title: 'Cloud Native Delivery',
    tagline: 'From jar to running pod',
    description:
      'Containers, Kubernetes, native images, and pipelines that ship safely many times a day.',
    track: 'production',
    lessons: [
      {
        slug: 'containerising',
        title: 'Containerising Spring Boot Properly',
        summary: 'Layered jars, buildpacks, image size, non-root users, and startup time.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Build a layered image that caches dependencies across builds',
          'Choose between Dockerfile, buildpacks, and jib with real criteria',
          'Harden an image for production',
        ],
        tags: ['docker', 'layered-jar', 'buildpacks'],
      },
      {
        slug: 'kubernetes',
        title: 'Running on Kubernetes',
        summary:
          'Deployments, probes, resource limits, HPA, and the settings that decide whether rollouts hurt.',
        minutes: 22,
        level: 'advanced',
        objectives: [
          'Map liveness, readiness, and startup probes to actuator endpoints',
          'Set requests and limits from real measurements',
          'Configure rolling updates and pod disruption budgets',
        ],
        tags: ['kubernetes', 'probes', 'hpa', 'deployment'],
      },
      {
        slug: 'native-images',
        title: 'GraalVM Native Images',
        summary:
          'Ahead-of-time compilation, reflection hints, and the trade-offs nobody mentions in the demo.',
        minutes: 18,
        level: 'expert',
        objectives: [
          'Explain AOT processing and closed-world assumptions',
          'Supply hints for reflection, resources, and proxies',
          'Decide whether native compilation is worth it for your workload',
        ],
        tags: ['graalvm', 'native', 'aot', 'startup'],
      },
      {
        slug: 'cicd',
        title: 'CI/CD Pipelines',
        summary:
          'Build once, promote everywhere — plus the quality gates worth blocking a release on.',
        minutes: 18,
        level: 'advanced',
        objectives: [
          'Design a pipeline that builds an artifact once and promotes it',
          'Choose blocking quality gates that catch real defects',
          'Automate database migrations safely in the pipeline',
        ],
        tags: ['cicd', 'pipeline', 'github-actions'],
      },
      {
        slug: 'config-secrets',
        title: 'Twelve-Factor Config and Secrets',
        summary:
          'Environment parity, secret rotation, and never shipping a credential in an image again.',
        minutes: 16,
        level: 'advanced',
        objectives: [
          'Apply twelve-factor configuration to a Spring Boot service',
          'Integrate a secret manager with rotation',
          'Detect leaked credentials before they reach a registry',
        ],
        tags: ['12-factor', 'secrets', 'vault', 'config'],
      },
    ],
  },
  {
    id: '12',
    slug: 'production',
    title: 'Production Hardening',
    tagline: 'Fast, cheap, and boring at 3am',
    description:
      'Tuning, concurrency, safe deploys, and the operational habits that separate a demo from a system people depend on.',
    track: 'production',
    lessons: [
      {
        slug: 'performance-tuning',
        title: 'Performance Tuning and Profiling',
        summary: 'Finding the real bottleneck with profilers and load tests instead of guessing.',
        minutes: 20,
        level: 'expert',
        objectives: [
          'Run a load test that reflects real traffic shape',
          'Read a flame graph and find the actual hot path',
          'Tune connection pools and thread pools from measurements',
        ],
        tags: ['performance', 'profiling', 'load-testing', 'hikari'],
      },
      {
        slug: 'jvm-memory',
        title: 'JVM Memory and Garbage Collection',
        summary: 'Heap, metaspace, off-heap, GC choice, and container memory limits that kill pods.',
        minutes: 20,
        level: 'expert',
        objectives: [
          'Explain the JVM memory regions and what lives in each',
          'Choose and tune a collector for latency or throughput',
          'Size a container so the JVM never gets OOM-killed',
        ],
        tags: ['jvm', 'gc', 'memory', 'oom'],
      },
      {
        slug: 'virtual-threads',
        title: 'Virtual Threads and Concurrency',
        summary: 'Project Loom in Spring Boot: what gets faster, what pins, and what to change.',
        minutes: 18,
        level: 'expert',
        objectives: [
          'Enable virtual threads and know what they change',
          'Identify pinning caused by synchronized blocks and native calls',
          'Rethink pool sizing when threads are effectively free',
        ],
        tags: ['loom', 'virtual-threads', 'concurrency'],
      },
      {
        slug: 'zero-downtime',
        title: 'Zero-Downtime Deployments',
        summary:
          'Graceful shutdown, connection draining, backward-compatible changes, and safe rollout strategies.',
        minutes: 18,
        level: 'expert',
        objectives: [
          'Configure graceful shutdown end to end',
          'Ship backward-compatible API and schema changes',
          'Choose between rolling, blue-green, and canary releases',
        ],
        tags: ['deployment', 'graceful-shutdown', 'canary'],
      },
      {
        slug: 'chaos-cost',
        title: 'Chaos, Capacity, and Cost',
        summary:
          'Proving resilience on purpose, planning capacity, and keeping the cloud bill honest.',
        minutes: 16,
        level: 'expert',
        objectives: [
          'Design a safe chaos experiment with a hypothesis',
          'Plan capacity from headroom and growth, not vibes',
          'Find the architectural decisions driving your cloud spend',
        ],
        tags: ['chaos', 'capacity', 'cost', 'finops'],
      },
    ],
  },
  {
    id: '13',
    slug: 'capstone',
    title: 'Capstone and Interview Prep',
    tagline: 'Put it all together',
    description:
      'A complete production-shaped system, a migration case study, and the questions you will be asked about both.',
    track: 'production',
    lessons: [
      {
        slug: 'shopflow-walkthrough',
        title: 'ShopFlow: A Complete System',
        summary:
          'Six services, Kafka, saga-based checkout, gateway, and full observability — walked through end to end.',
        minutes: 30,
        level: 'expert',
        objectives: [
          'Follow one order through every service and message hop',
          'See how each pattern from this course fits into one system',
          'Identify the trade-offs baked into the design',
        ],
        tags: ['capstone', 'architecture', 'demo'],
      },
      {
        slug: 'monolith-migration',
        title: 'Case Study: Strangling a Monolith',
        summary:
          'A realistic, incremental migration plan with the sequencing that keeps the business running.',
        minutes: 24,
        level: 'expert',
        objectives: [
          'Apply the strangler fig pattern to a real codebase',
          'Sequence extractions to reduce risk at every step',
          'Handle shared data during a migration',
        ],
        tags: ['migration', 'strangler-fig', 'refactoring'],
      },
      {
        slug: 'architecture-decisions',
        title: 'Making Architecture Decisions',
        summary: 'ADRs, trade-off analysis, and defending a design without hand-waving.',
        minutes: 16,
        level: 'advanced',
        objectives: [
          'Write an architecture decision record worth reading',
          'Structure a trade-off analysis around quality attributes',
          'Present a design under hostile questioning',
        ],
        tags: ['adr', 'architecture', 'decisions'],
      },
      {
        slug: 'interview-prep',
        title: 'Interview Question Bank',
        summary: 'The questions senior Spring roles actually ask, with answers that show depth.',
        minutes: 30,
        level: 'expert',
        objectives: [
          'Answer core Spring questions from first principles',
          'Discuss distributed-systems trade-offs credibly',
          'Recognise the follow-up question behind the question',
        ],
        tags: ['interview', 'questions', 'review'],
      },
    ],
  },
];

/* --------------------------- derived lookups --------------------------- */

export const flatLessons: LessonRef[] = modules
  .flatMap((module) =>
    module.lessons.map((lesson) => ({
      module,
      lesson,
      path: `${module.slug}/${lesson.slug}`,
      index: 0,
    })),
  )
  .map((ref, index) => ({ ...ref, index }));

const byPath = new Map(flatLessons.map((ref) => [ref.path, ref]));
const moduleBySlug = new Map(modules.map((m) => [m.slug, m]));

export const totalLessons = flatLessons.length;

export const totalMinutes = flatLessons.reduce((sum, ref) => sum + ref.lesson.minutes, 0);

export function getModule(slug: string | undefined): Module | undefined {
  return slug ? moduleBySlug.get(slug) : undefined;
}

export function getLessonRef(
  moduleSlug: string | undefined,
  lessonSlug: string | undefined,
): LessonRef | undefined {
  if (!moduleSlug || !lessonSlug) return undefined;
  return byPath.get(`${moduleSlug}/${lessonSlug}`);
}

export function neighbours(path: string): { prev?: LessonRef; next?: LessonRef } {
  const ref = byPath.get(path);
  if (!ref) return {};
  return { prev: flatLessons[ref.index - 1], next: flatLessons[ref.index + 1] };
}

/** `03-web-rest` — the MDX directory name for a module. */
export function moduleDir(module: Module): string {
  return `${module.id}-${module.slug}`;
}

export function lessonPathsOf(module: Module): string[] {
  return module.lessons.map((l) => `${module.slug}/${l.slug}`);
}

export const tracks: Record<Module['track'], { label: string; blurb: string }> = {
  foundation: { label: 'Foundation', blurb: 'Orientation and setup' },
  core: { label: 'Core Spring', blurb: 'The framework itself, in depth' },
  microservices: { label: 'Microservices', blurb: 'Distributed system design' },
  production: { label: 'Production', blurb: 'Operating it for real' },
};
