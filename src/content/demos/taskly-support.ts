import type { DemoFile } from '@/lib/types';

/**
 * The cross-cutting half of Taskly — security, caching, migrations and the test
 * base class. Kept in its own module so the feature code in `taskly.ts` stays
 * readable; both are spread into one project.
 */
export const tasklySupportFiles: DemoFile[] = [
  {
    path: 'src/main/java/dev/springforge/taskly/support/SecurityConfig.java',
    lang: 'java',
    note: 'Two chains: actuator first, then the API. Both end with a catch-all so a forgotten path fails loudly.',
    code: `package dev.springforge.taskly.support;

import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    /**
     * Actuator, on its own management port. Health is public so probes work
     * without credentials; everything else requires a role.
     */
    @Bean
    @Order(1)
    SecurityFilterChain actuatorSecurity(HttpSecurity http) throws Exception {
        return http
                .securityMatcher(EndpointRequest.toAnyEndpoint())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()
                        .anyRequest().hasRole("ACTUATOR"))
                .httpBasic(Customizer.withDefaults())
                // No cookies on this chain, so there is no CSRF surface.
                .csrf(CsrfConfigurer::disable)
                .build();
    }

    /**
     * The API. Stateless bearer tokens, so no session and no CSRF token.
     * Rules run top to bottom: the most specific first, catch-all last.
     */
    @Bean
    @Order(2)
    SecurityFilterChain apiSecurity(HttpSecurity http) throws Exception {
        return http
                .securityMatcher("/api/**")
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/tasks/**")
                            .hasAuthority("SCOPE_tasks.read")
                        .requestMatchers("/api/tasks/**")
                            .hasAuthority("SCOPE_tasks.write")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(CsrfConfigurer::disable)
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000)))
                .build();
    }

    /** The current user's id, for auditing and tenant scoping. */
    public static String currentSubject(Jwt jwt) {
        return jwt.getSubject();
    }
}`,
  },
  {
    path: 'src/main/java/dev/springforge/taskly/support/CacheConfig.java',
    lang: 'java',
    note: 'Every cache has a TTL — the backstop for when eviction logic has a bug.',
    code: `package dev.springforge.taskly.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    RedisCacheManager cacheManager(RedisConnectionFactory factory, ObjectMapper objectMapper) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                // A cached "not found" outlives the creation of the thing.
                .disableCachingNullValues()
                // JSON rather than JDK serialisation: inspectable in redis-cli,
                // and it does not require every cached type to be Serializable.
                .serializeValuesWith(SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer(objectMapper)));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaults)
                // Task data changes often; reference data does not.
                .withCacheConfiguration("tasks", defaults.entryTtl(Duration.ofMinutes(2)))
                .withCacheConfiguration("permissions", defaults.entryTtl(Duration.ofMinutes(30)))
                .build();
    }
}`,
  },
  {
    path: 'src/main/java/dev/springforge/taskly/task/TaskEvents.java',
    lang: 'java',
    note: 'The slow work happens after commit, so it never runs for a transaction that rolled back.',
    code: `package dev.springforge.taskly.task;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

/** Published by TaskService inside the transaction; handled after it commits. */
public record TaskCompleted(UUID taskId, UUID accountId) {

    @Component
    static class Listener {

        private static final Logger log = LoggerFactory.getLogger(Listener.class);

        private final CacheManager cacheManager;
        private final NotificationClient notifications;

        Listener(CacheManager cacheManager, NotificationClient notifications) {
            this.cacheManager = cacheManager;
            this.notifications = notifications;
        }

        /**
         * AFTER_COMMIT, for two reasons: the network call is not holding a
         * database connection or row locks, and it cannot fire for work that
         * rolled back.
         */
        @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
        void onCompleted(TaskCompleted event) {
            // Evict here rather than with @CacheEvict — that would run before
            // the commit, leaving a window for a concurrent read to repopulate
            // the cache with the pre-commit value.
            var cache = cacheManager.getCache("tasks");
            if (cache != null) {
                cache.evict(event.taskId());
            }

            try {
                notifications.taskCompleted(event.taskId(), event.accountId());
            } catch (RuntimeException e) {
                // The transaction has already committed. Failing here must not
                // lose the task — log, and let a retry mechanism own delivery.
                log.error("Notification failed for task {}", event.taskId(), e);
            }
        }
    }
}`,
  },
  {
    path: 'src/main/resources/db/migration/V2__add_task_assignee.sql',
    lang: 'sql',
    note: 'Nullable, so instances still running the previous version are unaffected during the rollout.',
    code: `-- Expand phase: the column is nullable and nothing reads it yet, so this is
-- safe to apply while the previous version of the application is still serving.
alter table tasks add column assignee_id uuid;

alter table tasks
    add constraint fk_tasks_assignee
    foreign key (assignee_id) references users (id);

-- Supports the assignee filter without a second index: the leading column
-- also serves queries that filter on status alone.
create index idx_tasks_status_assignee on tasks (status, assignee_id);

-- Idempotency keys for safe POST retries. The unique constraint is what makes
-- a concurrent double-submit resolvable rather than a race.
create table task_idempotency_keys (
    key        varchar(200) primary key,
    task_id    uuid         not null references tasks (id) on delete cascade,
    created_at timestamptz  not null default now()
);`,
  },
  {
    path: 'src/test/java/dev/springforge/taskly/IntegrationTest.java',
    lang: 'java',
    note: 'One base class, one Spring context, one set of containers for the whole suite.',
    code: `package dev.springforge.taskly;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Every integration test extends this. Because the configuration is identical
 * across them, Spring loads one context for the entire suite instead of one
 * per test class.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
public abstract class IntegrationTest {

    // static: started once per JVM. An instance field would start and stop a
    // container for every single test method.
    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")   // pinned to what we deploy
                    .withReuse(true);

    @Container
    @ServiceConnection
    static final GenericContainer<?> REDIS =
            new GenericContainer<>("redis:7-alpine")
                    .withExposedPorts(6379)
                    .withReuse(true);
}`,
  },
  {
    path: 'src/test/java/dev/springforge/taskly/TestTasklyApplication.java',
    lang: 'java',
    note: '`./mvnw spring-boot:test-run` starts these containers and runs the app against them — no local database install.',
    code: `package dev.springforge.taskly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;

@TestConfiguration(proxyBeanMethods = false)
public class TestTasklyApplication {

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgres() {
        return new PostgreSQLContainer<>("postgres:16-alpine");
    }

    @Bean
    @ServiceConnection
    GenericContainer<?> redis() {
        return new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);
    }

    public static void main(String[] args) {
        SpringApplication.from(TasklyApplication::main)
                .with(TestTasklyApplication.class)
                .run(args);
    }
}`,
  },
];
