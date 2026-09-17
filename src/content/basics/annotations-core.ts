import type { AnnotationEntry } from './types';

/** Core container annotations, and configuration & Spring Boot. */
export const coreAnnotations: AnnotationEntry[] = [
  /* ------------------------------------------------------------ core & DI */
  {
    name: 'Component',
    category: 'core',
    pkg: 'org.springframework.stereotype',
    summary: 'Marks a class as a bean that component scanning should create.',
    mechanism:
      'Component scanning finds the class under a scanned package and registers a singleton bean named after the class (taskService for TaskService). It is the meta-annotation behind @Service, @Repository, @Controller and @Configuration.',
    useWhen: 'A class is a Spring-managed collaborator and none of the more specific stereotypes fits.',
    avoidWhen:
      'The class belongs to a library you do not own, or needs construction logic — declare it with @Bean instead.',
    pitfall:
      'A @Component outside the packages under your @SpringBootApplication class is silently never created. The symptom is a NoSuchBeanDefinitionException that names the bean you can see in your editor.',
    example: {
      lang: 'java',
      code: `@Component
public class SlugGenerator {
    public String slugFor(String title) {
        return title.toLowerCase().replaceAll("[^a-z0-9]+", "-");
    }
}`,
    },
    related: ['Service', 'Repository', 'Bean', 'ComponentScan'],
    lessons: ['spring-core/ioc-container', 'foundations/project-anatomy'],
  },
  {
    name: 'Service',
    category: 'core',
    pkg: 'org.springframework.stereotype',
    summary: 'A @Component that holds business logic.',
    mechanism:
      'Functionally identical to @Component — Spring adds no behaviour. Its value is documentation, and as a pointcut target for your own aspects.',
    useWhen: 'The class coordinates domain logic and transactions — the layer controllers call.',
    pitfall:
      'Expecting @Service to make methods transactional. It does not; that needs @Transactional.',
    example: {
      lang: 'java',
      code: `@Service
public class TaskService {
    private final TaskRepository tasks;

    public TaskService(TaskRepository tasks) {   // no @Autowired needed
        this.tasks = tasks;
    }
}`,
    },
    related: ['Component', 'Transactional'],
    lessons: ['spring-core/ioc-container'],
  },
  {
    name: 'Repository',
    category: 'core',
    pkg: 'org.springframework.stereotype',
    summary: 'A @Component for data access, with persistence exception translation.',
    mechanism:
      'Unlike @Service, it does add behaviour: PersistenceExceptionTranslationPostProcessor wraps the bean so vendor exceptions (SQLException, HibernateException) become Spring DataAccessException subclasses.',
    useWhen: 'You write a data-access class by hand — JdbcClient, JdbcTemplate or EntityManager code.',
    avoidWhen:
      'Spring Data repository interfaces. They are detected and translated already; the annotation adds nothing.',
    example: {
      lang: 'java',
      code: `@Repository
public class ReportQueries {
    private final JdbcClient db;

    public ReportQueries(JdbcClient db) { this.db = db; }
}`,
    },
    related: ['Component', 'Transactional'],
    lessons: ['data/jpa-fundamentals'],
  },
  {
    name: 'Configuration',
    category: 'core',
    pkg: 'org.springframework.context.annotation',
    summary: 'A class that declares beans with @Bean methods.',
    mechanism:
      'By default (proxyBeanMethods = true) Spring subclasses the class with CGLIB so that one @Bean method calling another returns the existing singleton rather than a new instance. That is "full" mode; @Bean methods in a plain @Component run in "lite" mode and a direct call really does create a second object.',
    useWhen: 'Wiring beans you cannot annotate yourself, or whose construction needs logic.',
    avoidWhen:
      'Set proxyBeanMethods = false when no @Bean method calls another — it skips the CGLIB subclass and starts faster, which is what Boot does in its own auto-configuration.',
    pitfall:
      'A final @Configuration class cannot be subclassed, so full mode fails at startup.',
    example: {
      lang: 'java',
      code: `@Configuration(proxyBeanMethods = false)
public class ClockConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}`,
    },
    related: ['Bean', 'Import', 'Component'],
    lessons: ['spring-core/configuration-classes'],
  },
  {
    name: 'Bean',
    category: 'core',
    pkg: 'org.springframework.context.annotation',
    summary: 'Declares that a method’s return value is a Spring bean.',
    mechanism:
      'The method is called once (for singleton scope) and the result is registered under the method name. Method parameters are resolved from the container exactly like constructor parameters.',
    useWhen:
      'Third-party types (a Clock, an ObjectMapper customiser, a client), or when you need to choose between implementations at startup.',
    pitfall:
      'Declaring a BeanFactoryPostProcessor with a non-static @Bean method forces its configuration class to be created too early, which disables things like @Value in it. Make such methods static.',
    example: {
      lang: 'java',
      code: `@Bean
RestClient catalogClient(RestClient.Builder builder) {   // inject the builder
    return builder.baseUrl("http://catalog").build();
}`,
    },
    related: ['Configuration', 'Primary', 'Qualifier', 'Scope'],
    lessons: ['spring-core/configuration-classes'],
  },
  {
    name: 'Autowired',
    category: 'core',
    pkg: 'org.springframework.beans.factory.annotation',
    summary: 'Asks the container to inject a dependency.',
    mechanism:
      'Resolves by type. If several beans match it narrows by @Qualifier, then by @Primary, then by matching the field or parameter name against bean names; if one bean still is not chosen, startup fails with NoUniqueBeanDefinitionException.',
    useWhen:
      'A class has several constructors and you must say which one Spring should use, or on a setter for a genuinely optional collaborator.',
    avoidWhen:
      'A class with a single constructor — Spring uses it automatically and the annotation is noise. Avoid field injection entirely: it hides dependencies and makes tests need reflection.',
    pitfall:
      '@Autowired(required = false) leaves a null field when the bean is absent, which surfaces as a NullPointerException far from the cause. Prefer Optional<T> or ObjectProvider<T>.',
    example: {
      lang: 'java',
      code: `// Preferred: constructor injection, no annotation.
public NotificationService(List<MessageSender> senders) { … }

// Only when there are several constructors:
@Autowired
public ReportService(ReportRepository reports) { … }`,
    },
    related: ['Qualifier', 'Primary', 'Lazy', 'Value'],
    lessons: ['spring-core/dependency-injection'],
  },
  {
    name: 'Qualifier',
    category: 'core',
    pkg: 'org.springframework.beans.factory.annotation',
    summary: 'Picks one bean by name when several have the same type.',
    mechanism:
      'Narrows the candidate set at the injection point. It can also be placed on a bean definition to give it a qualifier value, or used as a meta-annotation to build your own type-safe qualifier.',
    useWhen: 'Two or more beans of one type exist and this injection point needs a specific one.',
    pitfall:
      'A typo in the qualifier string fails at startup, which is good — but string qualifiers are easy to mistype across a codebase. A custom annotation meta-annotated with @Qualifier is safer.',
    example: {
      lang: 'java',
      code: `public NotificationService(@Qualifier("smsSender") MessageSender sender) {
    this.sender = sender;
}`,
    },
    related: ['Primary', 'Autowired', 'Bean'],
    lessons: ['spring-core/dependency-injection'],
  },
  {
    name: 'Primary',
    category: 'core',
    pkg: 'org.springframework.context.annotation',
    summary: 'Makes one bean the default when several match a type.',
    mechanism:
      'Used only when an injection point has no @Qualifier. More than one @Primary of the same type is itself an ambiguity error.',
    useWhen:
      'There is a genuine default and the alternatives are rare exceptions — typically overriding an auto-configured bean.',
    avoidWhen:
      'In application code, prefer @Qualifier at the injection point: @Primary makes it invisible at the call site which bean arrives.',
    example: {
      lang: 'java',
      code: `@Bean @Primary
MessageSender emailSender() { return new EmailSender(); }

@Bean
MessageSender smsSender() { return new SmsSender(); }`,
    },
    related: ['Qualifier', 'Bean', 'ConditionalOnMissingBean'],
    lessons: ['spring-core/dependency-injection'],
  },
  {
    name: 'Lazy',
    category: 'core',
    pkg: 'org.springframework.context.annotation',
    summary: 'Defers creating a bean, or resolving a dependency, until first use.',
    mechanism:
      'On a bean definition it skips creation at startup. On an injection point it injects a proxy that looks the real bean up on the first method call.',
    useWhen: 'An expensive bean is rarely used, or to break a circular dependency you cannot yet remove.',
    avoidWhen:
      'As a routine fix for circular dependencies — it hides a design problem, and moves startup failures to the first request.',
    pitfall:
      'Lazy beans fail on first use instead of at startup, so a misconfiguration ships and surfaces in production.',
    example: {
      lang: 'java',
      code: `public ReportService(@Lazy PdfRenderer renderer) {
    this.renderer = renderer;   // a proxy until first call
}`,
    },
    related: ['Autowired', 'Scope'],
    lessons: ['spring-core/dependency-injection', 'spring-core/bean-lifecycle'],
  },
  {
    name: 'Scope',
    category: 'core',
    pkg: 'org.springframework.context.annotation',
    summary: 'Sets how many instances of a bean exist and for how long.',
    mechanism:
      'singleton (default, one per container), prototype (new instance per injection or lookup), and in web apps request, session and application. A shorter-lived bean injected into a singleton needs proxyMode, or the singleton keeps the first instance forever.',
    useWhen: 'State genuinely belongs to a request, a session or a single use.',
    pitfall:
      'Injecting a prototype into a singleton gives the singleton one prototype instance for its whole life. Use ObjectProvider<T>, a scoped proxy, or @Lookup.',
    example: {
      lang: 'java',
      code: `@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestContext {
    private String tenantId;
}`,
    },
    related: ['Lazy', 'PostConstruct', 'PreDestroy'],
    lessons: ['spring-core/bean-lifecycle'],
  },
  {
    name: 'Value',
    category: 'core',
    pkg: 'org.springframework.beans.factory.annotation',
    summary: 'Injects a single property or SpEL expression.',
    mechanism:
      '${…} resolves a property placeholder from the Environment; #{…} evaluates a SpEL expression. A default goes after a colon: ${app.timeout:5s}.',
    useWhen: 'One or two scalar values in a class that is not otherwise configuration.',
    avoidWhen:
      'Groups of related settings — use @ConfigurationProperties, which is typed, validated and documented.',
    pitfall:
      'A missing property without a default fails at startup; a misspelled one with a default silently uses the default forever.',
    example: {
      lang: 'java',
      code: `public Mailer(@Value("\${mail.from:no-reply@example.com}") String from) {
    this.from = from;
}`,
    },
    related: ['ConfigurationProperties', 'Profile'],
    lessons: ['boot-essentials/configuration-properties', 'boot-essentials/typed-config'],
  },
  {
    name: 'PostConstruct',
    category: 'core',
    pkg: 'jakarta.annotation',
    summary: 'Runs a method once, after the bean is constructed and injected.',
    mechanism:
      'Called by CommonAnnotationBeanPostProcessor after dependency injection and before the bean is handed to anyone — but before proxies such as @Transactional are applied to it.',
    useWhen: 'Validating configuration or warming a local cache that depends on injected collaborators.',
    avoidWhen:
      'Work that needs the application to be fully started (other beans ready, transactions) — listen for ApplicationReadyEvent instead.',
    pitfall:
      'Calling a @Transactional method of the same bean from @PostConstruct runs without a transaction: the call goes to the raw object, not the proxy.',
    example: {
      lang: 'java',
      code: `@PostConstruct
void checkConfiguration() {
    if (properties.retries() < 0) {
        throw new IllegalStateException("retries must be >= 0");
    }
}`,
    },
    related: ['PreDestroy', 'EventListener'],
    lessons: ['spring-core/bean-lifecycle'],
  },
  {
    name: 'PreDestroy',
    category: 'core',
    pkg: 'jakarta.annotation',
    summary: 'Runs a method when the container shuts the bean down.',
    mechanism:
      'Called on graceful context close for singletons. Prototype beans are never destroyed by the container — you own their cleanup.',
    useWhen: 'Releasing resources the bean opened itself: a thread pool, a file handle, a client.',
    pitfall:
      'Never runs on kill -9 or an OOM kill, so it cannot be the only place important state is flushed.',
    example: {
      lang: 'java',
      code: `@PreDestroy
void close() {
    executor.shutdown();
}`,
    },
    related: ['PostConstruct', 'Scope'],
    lessons: ['spring-core/bean-lifecycle', 'production/zero-downtime'],
  },
  {
    name: 'DependsOn',
    category: 'core',
    pkg: 'org.springframework.context.annotation',
    summary: 'Forces other beans to be created before this one.',
    mechanism:
      'Changes creation order only. Normal injection already orders creation; this is for dependencies that are not visible as injection, such as a bean that must run a migration first.',
    useWhen: 'An implicit ordering dependency you cannot express by injecting the other bean.',
    avoidWhen: 'Controlling the order of beans in an injected List — that is @Order.',
    example: {
      lang: 'java',
      code: `@Bean
@DependsOn("flyway")
CacheWarmer cacheWarmer(TaskRepository tasks) { … }`,
    },
    related: ['Order', 'Bean'],
    lessons: ['spring-core/bean-lifecycle'],
  },
  {
    name: 'Order',
    category: 'core',
    pkg: 'org.springframework.core.annotation',
    summary: 'Orders beans within an injected collection, filters and aspects.',
    mechanism:
      'Lower values come first. It affects List<T> injection, filter chains, advice ordering and event listeners — not the order in which beans are created.',
    useWhen: 'Several implementations run in sequence and the sequence matters.',
    pitfall:
      'Expecting @Order to control startup order. It does not; use @DependsOn or plain injection.',
    example: {
      lang: 'java',
      code: `@Component
@Order(1)
public class AuthenticationCheck implements RequestCheck { … }`,
    },
    related: ['DependsOn', 'EnableWebSecurity'],
    lessons: ['spring-core/aop-proxies', 'security/filter-chain'],
  },
  {
    name: 'ComponentScan',
    category: 'core',
    pkg: 'org.springframework.context.annotation',
    summary: 'Tells Spring which packages to scan for components.',
    mechanism:
      'Scans the annotated class’s package and below by default. @SpringBootApplication already includes it.',
    useWhen: 'Rarely in a Boot application — only to include packages outside the main class’s package.',
    avoidWhen:
      'Moving the main class to the root package is almost always the better fix than adding scan paths.',
    example: {
      lang: 'java',
      code: `@SpringBootApplication
@ComponentScan(basePackages = { "dev.acme.app", "dev.acme.shared" })
public class App { … }`,
    },
    related: ['SpringBootApplication', 'Component', 'Import'],
    lessons: ['foundations/first-application', 'foundations/project-anatomy'],
  },
  {
    name: 'Import',
    category: 'core',
    pkg: 'org.springframework.context.annotation',
    summary: 'Pulls another configuration class into this one explicitly.',
    mechanism:
      'Registers the named classes as configuration regardless of scanning. It is also how @Enable… annotations bring in their infrastructure.',
    useWhen: 'Composing configuration from a module that is not component-scanned, or in tests.',
    example: {
      lang: 'java',
      code: `@Configuration
@Import({ ClockConfig.class, SecurityConfig.class })
public class AppConfig { }`,
    },
    related: ['Configuration', 'ComponentScan'],
    lessons: ['spring-core/configuration-classes'],
  },
  {
    name: 'Profile',
    category: 'core',
    pkg: 'org.springframework.context.annotation',
    summary: 'Registers a bean only when a profile is active.',
    mechanism:
      'Evaluated against spring.profiles.active. Supports expressions: "!prod", "cloud & eu", "dev | test".',
    useWhen: 'An environment genuinely needs a different implementation — a fake payment gateway in local development.',
    avoidWhen:
      'Differences that are only values. Put those in application-{profile}.yml; one bean with different configuration beats two beans.',
    pitfall:
      'Profile-gated beans are not exercised by tests that run without the profile, so a prod-only bean can be broken for months.',
    example: {
      lang: 'java',
      code: `@Bean
@Profile("!prod")
PaymentGateway fakeGateway() { return new FakePaymentGateway(); }`,
    },
    related: ['ConditionalOnProperty', 'ActiveProfiles', 'Value'],
    lessons: ['boot-essentials/configuration-properties', 'cloud-native/config-secrets'],
  },

  /* --------------------------------------------------- config & Spring Boot */
  {
    name: 'SpringBootApplication',
    category: 'config',
    pkg: 'org.springframework.boot.autoconfigure',
    summary: 'The single annotation on a Boot application’s main class.',
    mechanism:
      'Shorthand for @SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan. Its package becomes the root of component scanning and of JPA entity scanning.',
    useWhen: 'Exactly once, on the class with main(), in the root package.',
    pitfall:
      'Putting the main class in a sub-package means sibling packages are never scanned — beans and entities simply do not exist.',
    example: {
      lang: 'java',
      code: `@SpringBootApplication
public class TasklyApplication {
    public static void main(String[] args) {
        SpringApplication.run(TasklyApplication.class, args);
    }
}`,
    },
    related: ['EnableAutoConfiguration', 'ComponentScan', 'ConfigurationPropertiesScan'],
    lessons: ['foundations/first-application'],
  },
  {
    name: 'EnableAutoConfiguration',
    category: 'config',
    pkg: 'org.springframework.boot.autoconfigure',
    summary: 'Turns on Spring Boot’s conditional auto-configuration.',
    mechanism:
      'Loads the auto-configuration classes listed in META-INF/spring/…AutoConfiguration.imports; each is guarded by @Conditional annotations, so only those whose conditions hold contribute beans.',
    useWhen: 'Included by @SpringBootApplication — you use it directly only to exclude something.',
    example: {
      lang: 'java',
      code: `@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class BatchApp { … }`,
    },
    related: ['SpringBootApplication', 'ConditionalOnClass', 'ConditionalOnMissingBean'],
    lessons: ['boot-essentials/auto-configuration'],
  },
  {
    name: 'ConfigurationProperties',
    category: 'config',
    pkg: 'org.springframework.boot.context.properties',
    summary: 'Binds a group of properties to a typed object.',
    mechanism:
      'Binds every property under the prefix using relaxed binding (retry-count, retryCount and RETRY_COUNT all match). With a record the binding uses its constructor, so the object is immutable. Add @Validated to validate on startup.',
    useWhen: 'Any configuration with more than one or two values, or that belongs to a feature.',
    pitfall:
      'Forgetting to register it: it needs @ConfigurationPropertiesScan or @EnableConfigurationProperties, otherwise nothing is bound and the bean does not exist.',
    example: {
      lang: 'java',
      code: `@Validated
@ConfigurationProperties(prefix = "notifications")
public record NotificationProperties(
        @NotBlank String from,
        @DefaultValue("3") int retries,
        Duration timeout) { }`,
    },
    related: ['Value', 'ConfigurationPropertiesScan', 'EnableConfigurationProperties', 'Validated'],
    lessons: ['boot-essentials/typed-config', 'boot-essentials/configuration-properties'],
  },
  {
    name: 'ConfigurationPropertiesScan',
    category: 'config',
    pkg: 'org.springframework.boot.context.properties',
    summary: 'Registers every @ConfigurationProperties class under a package.',
    mechanism: 'Scans like component scanning, but only for @ConfigurationProperties types.',
    useWhen: 'On the main class, so new properties classes are picked up without extra wiring.',
    example: {
      lang: 'java',
      code: `@SpringBootApplication
@ConfigurationPropertiesScan
public class App { … }`,
    },
    related: ['ConfigurationProperties', 'EnableConfigurationProperties'],
    lessons: ['boot-essentials/typed-config'],
  },
  {
    name: 'EnableConfigurationProperties',
    category: 'config',
    pkg: 'org.springframework.boot.context.properties',
    summary: 'Registers specific @ConfigurationProperties classes by name.',
    mechanism: 'Explicit registration, which is what auto-configuration classes use.',
    useWhen: 'In a library or auto-configuration, where scanning is not appropriate.',
    example: {
      lang: 'java',
      code: `@AutoConfiguration
@EnableConfigurationProperties(NotificationProperties.class)
public class NotificationAutoConfiguration { … }`,
    },
    related: ['ConfigurationProperties', 'ConfigurationPropertiesScan'],
    lessons: ['boot-essentials/auto-configuration'],
  },
  {
    name: 'ConditionalOnProperty',
    category: 'config',
    pkg: 'org.springframework.boot.autoconfigure.condition',
    summary: 'Registers a bean only when a property has a given value.',
    mechanism:
      'Checks the Environment at startup. matchIfMissing decides what happens when the property is absent.',
    useWhen: 'Feature switches that change which beans exist.',
    pitfall:
      'It is evaluated once at startup — flipping the property at runtime changes nothing.',
    example: {
      lang: 'java',
      code: `@Bean
@ConditionalOnProperty(name = "notifications.sms.enabled", havingValue = "true")
SmsSender smsSender() { … }`,
    },
    related: ['Profile', 'ConditionalOnMissingBean', 'ConditionalOnClass'],
    lessons: ['boot-essentials/auto-configuration'],
  },
  {
    name: 'ConditionalOnMissingBean',
    category: 'config',
    pkg: 'org.springframework.boot.autoconfigure.condition',
    summary: 'Registers a bean only if the user has not defined one.',
    mechanism:
      'The mechanism that makes every Boot default overridable: define your own ObjectMapper and Boot’s backs off.',
    useWhen: 'In auto-configuration, to provide a default the application can replace.',
    pitfall:
      'Only reliable in auto-configuration classes, which are processed after user configuration. In ordinary @Configuration the result depends on registration order.',
    example: {
      lang: 'java',
      code: `@Bean
@ConditionalOnMissingBean
Clock clock() { return Clock.systemUTC(); }`,
    },
    related: ['ConditionalOnClass', 'Primary', 'EnableAutoConfiguration'],
    lessons: ['boot-essentials/auto-configuration'],
  },
  {
    name: 'ConditionalOnClass',
    category: 'config',
    pkg: 'org.springframework.boot.autoconfigure.condition',
    summary: 'Registers configuration only when a class is on the classpath.',
    mechanism:
      'Why adding a starter changes behaviour: the new jar makes a condition true and a whole auto-configuration switches on.',
    useWhen: 'Configuration that integrates with an optional library.',
    example: {
      lang: 'java',
      code: `@AutoConfiguration
@ConditionalOnClass(name = "io.micrometer.tracing.Tracer")
public class TracingSupport { … }`,
    },
    related: ['ConditionalOnMissingBean', 'EnableAutoConfiguration'],
    lessons: ['boot-essentials/auto-configuration', 'boot-essentials/starters-dependencies'],
  },
];
