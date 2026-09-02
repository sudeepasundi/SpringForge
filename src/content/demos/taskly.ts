import type { DemoProject } from '@/lib/types';
import { tasklySupportFiles } from './taskly-support';

/**
 * Taskly — the monolith that grows through modules 02–06.
 * Spring Boot 3.4 on Java 21. Every file here is real, compilable source.
 */
export const taskly: DemoProject = {
  id: 'taskly-api',
  name: 'Taskly API',
  tagline: 'A single-service Spring Boot application done properly',
  description:
    'A task-tracking REST API built the way a competent team would build it: package-by-feature, records as DTOs, constructor injection, ProblemDetail errors, Flyway migrations, and slice tests. It is the reference implementation for the core modules.',
  stack: [
    'Spring Boot 3.4',
    'Java 21',
    'Spring Data JPA',
    'PostgreSQL',
    'Flyway',
    'Redis',
    'Spring Security',
    'Testcontainers',
  ],
  files: [
    ...tasklySupportFiles,
    {
      path: 'pom.xml',
      lang: 'xml',
      note: 'The parent POM supplies versions for every Spring-managed dependency, so none are pinned here.',
      code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.1</version>
    <relativePath/>
  </parent>

  <groupId>dev.springforge</groupId>
  <artifactId>taskly-api</artifactId>
  <version>1.0.0</version>

  <properties>
    <java.version>21</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-database-postgresql</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>

    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-testcontainers</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.testcontainers</groupId>
      <artifactId>postgresql</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/TasklyApplication.java',
      lang: 'java',
      note: 'The entire bootstrap. Everything else is discovered from this package downwards.',
      code: `package dev.springforge.taskly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TasklyApplication {

    public static void main(String[] args) {
        SpringApplication.run(TasklyApplication.class, args);
    }
}`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/task/Task.java',
      lang: 'java',
      note: 'A JPA entity with a business-key equals/hashCode that survives the persistence lifecycle.',
      code: `package dev.springforge.taskly.task;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Version
    private long version;

    protected Task() {
        // Required by JPA. Not for application use.
    }

    public Task(String title, String description, Instant dueAt) {
        this.id = UUID.randomUUID();
        this.title = title;
        this.description = description;
        this.dueAt = dueAt;
        this.status = TaskStatus.OPEN;
        this.createdAt = Instant.now();
    }

    public void rename(String title) {
        this.title = Objects.requireNonNull(title, "title");
    }

    public void complete() {
        if (status == TaskStatus.COMPLETED) {
            throw new IllegalStateException("Task %s is already completed".formatted(id));
        }
        this.status = TaskStatus.COMPLETED;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public TaskStatus getStatus() { return status; }
    public Instant getDueAt() { return dueAt; }
    public Instant getCreatedAt() { return createdAt; }

    // The id is assigned in the constructor, never by the database, so it is
    // stable from the moment the object exists — which is what makes this safe.
    @Override
    public boolean equals(Object other) {
        return other instanceof Task task && id.equals(task.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/task/TaskStatus.java',
      lang: 'java',
      code: `package dev.springforge.taskly.task;

public enum TaskStatus {
    OPEN,
    IN_PROGRESS,
    COMPLETED
}`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/task/TaskRepository.java',
      lang: 'java',
      note: 'Spring Data derives the query from the method name; the explicit @Query shows the escape hatch.',
      code: `package dev.springforge.taskly.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    Page<Task> findByStatus(TaskStatus status, Pageable pageable);

    @Query("""
           select t from Task t
           where t.status <> dev.springforge.taskly.task.TaskStatus.COMPLETED
             and t.dueAt < :cutoff
           order by t.dueAt asc
           """)
    Page<Task> findOverdue(@Param("cutoff") Instant cutoff, Pageable pageable);
}`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/task/TaskService.java',
      lang: 'java',
      note: 'Transaction boundaries live here — not on the controller, and not on the repository.',
      code: `package dev.springforge.taskly.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository repository;

    // Constructor injection: the dependency is final, the object is never
    // half-built, and the class is trivially testable without Spring.
    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    public Page<Task> list(TaskStatus status, Pageable pageable) {
        return status == null
                ? repository.findAll(pageable)
                : repository.findByStatus(status, pageable);
    }

    public Task get(UUID id) {
        return repository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
    }

    @Transactional
    public Task create(CreateTaskRequest request) {
        return repository.save(new Task(request.title(), request.description(), request.dueAt()));
    }

    @Transactional
    public Task complete(UUID id) {
        Task task = get(id);
        task.complete();
        // No save() call: the entity is managed, so the flush at commit
        // writes the change. Calling save() here would be a no-op.
        return task;
    }
}`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/task/TaskController.java',
      lang: 'java',
      note: 'The controller only translates HTTP to method calls. No business rules, no entities on the wire.',
      code: `package dev.springforge.taskly.task;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public Page<TaskResponse> list(
            @RequestParam(required = false) TaskStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return service.list(status, pageable).map(TaskResponse::from);
    }

    @GetMapping("/{id}")
    public TaskResponse get(@PathVariable UUID id) {
        return TaskResponse.from(service.get(id));
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @Valid @RequestBody CreateTaskRequest request,
            UriComponentsBuilder uri) {
        Task created = service.create(request);
        URI location = uri.path("/api/tasks/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).body(TaskResponse.from(created));
    }

    @PostMapping("/{id}/completion")
    public TaskResponse complete(@PathVariable UUID id) {
        return TaskResponse.from(service.complete(id));
    }
}`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/task/CreateTaskRequest.java',
      lang: 'java',
      code: `package dev.springforge.taskly.task;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateTaskRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @Future Instant dueAt) {
}`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/task/TaskResponse.java',
      lang: 'java',
      note: 'A separate response type means renaming an entity field never breaks a client.',
      code: `package dev.springforge.taskly.task;

import java.time.Instant;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String title,
        String description,
        TaskStatus status,
        Instant dueAt,
        Instant createdAt) {

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getDueAt(),
                task.getCreatedAt());
    }
}`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/task/TaskNotFoundException.java',
      lang: 'java',
      code: `package dev.springforge.taskly.task;

import java.util.UUID;

public class TaskNotFoundException extends RuntimeException {

    private final UUID id;

    public TaskNotFoundException(UUID id) {
        super("Task %s does not exist".formatted(id));
        this.id = id;
    }

    public UUID getId() {
        return id;
    }
}`,
    },
    {
      path: 'src/main/java/dev/springforge/taskly/support/ApiExceptionHandler.java',
      lang: 'java',
      note: 'One place that turns exceptions into RFC 9457 problem documents. Clients get a stable error shape.',
      code: `package dev.springforge.taskly.support;

import dev.springforge.taskly.task.TaskNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(TaskNotFoundException.class)
    public ProblemDetail onNotFound(TaskNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Task not found");
        problem.setType(URI.create("https://taskly.dev/problems/task-not-found"));
        problem.setProperty("taskId", ex.getId());
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail onValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "One or more fields are invalid");
        problem.setTitle("Validation failed");
        problem.setType(URI.create("https://taskly.dev/problems/validation"));
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail onConflict(IllegalStateException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Operation not allowed in the current state");
        return problem;
    }
}`,
    },
    {
      path: 'src/main/resources/application.yml',
      lang: 'yaml',
      note: 'No credentials here. Local values come from the dev profile; production values come from the environment.',
      code: `spring:
  application:
    name: taskly-api
  datasource:
    url: \${DB_URL:jdbc:postgresql://localhost:5432/taskly}
    username: \${DB_USER:taskly}
    password: \${DB_PASSWORD:}
  jpa:
    open-in-view: false        # never leave the persistence context open in the view layer
    hibernate:
      ddl-auto: validate       # Flyway owns the schema; Hibernate only checks it
    properties:
      hibernate.jdbc.batch_size: 50
  flyway:
    enabled: true
  threads:
    virtual:
      enabled: true            # Java 21: one virtual thread per request

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when-authorized

server:
  shutdown: graceful

logging:
  level:
    dev.springforge.taskly: INFO`,
    },
    {
      path: 'src/main/resources/db/migration/V1__create_tasks.sql',
      lang: 'sql',
      code: `create table tasks (
    id          uuid         primary key,
    title       varchar(200) not null,
    description varchar(2000),
    status      varchar(20)  not null,
    due_at      timestamptz,
    created_at  timestamptz  not null,
    version     bigint       not null default 0
);

-- Supports both the status filter and the overdue query without a second index.
create index idx_tasks_status_due_at on tasks (status, due_at);`,
    },
    {
      path: 'src/test/java/dev/springforge/taskly/task/TaskControllerTest.java',
      lang: 'java',
      note: 'A slice test: the web layer only, with the service mocked. Fast, and it fails for exactly one reason.',
      code: `package dev.springforge.taskly.task;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.endsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    TaskService service;

    @Test
    void returns_problem_detail_when_task_is_missing() throws Exception {
        UUID id = UUID.randomUUID();
        given(service.get(id)).willThrow(new TaskNotFoundException(id));

        mockMvc.perform(get("/api/tasks/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Task not found"))
                .andExpect(jsonPath("$.taskId").value(id.toString()));
    }

    @Test
    void rejects_a_blank_title() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                 { "title": "  ", "description": "no title" }
                                 """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    void creates_a_task_and_returns_its_location() throws Exception {
        Task task = new Task("Write the migration", null, null);
        given(service.create(any())).willReturn(task);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                 { "title": "Write the migration" }
                                 """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", endsWith("/api/tasks/" + task.getId())))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }
}`,
    },
    {
      path: 'src/test/java/dev/springforge/taskly/task/TaskRepositoryIT.java',
      lang: 'java',
      note: '@ServiceConnection wires the container to the datasource — no @DynamicPropertySource needed.',
      code: `package dev.springforge.taskly.task;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.PageRequest;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TaskRepositoryIT {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    TaskRepository repository;

    @Test
    void finds_only_overdue_tasks_that_are_not_completed() {
        Instant past = Instant.now().minus(2, ChronoUnit.DAYS);
        Instant future = Instant.now().plus(2, ChronoUnit.DAYS);

        Task overdue = repository.save(new Task("Overdue", null, past));
        repository.save(new Task("Upcoming", null, future));

        Task alreadyDone = new Task("Done but late", null, past);
        alreadyDone.complete();
        repository.save(alreadyDone);

        var result = repository.findOverdue(Instant.now(), PageRequest.of(0, 10));

        assertThat(result.getContent()).containsExactly(overdue);
    }
}`,
    },
    {
      path: 'Dockerfile',
      lang: 'docker',
      note: 'Layered jar extraction: dependencies land in their own layer, so a code change rebuilds only the last one.',
      code: `# --- build -------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /build

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -q -DskipTests package && \\
    java -Djarmode=tools -jar target/taskly-api-1.0.0.jar extract --layers --destination extracted

# --- run ---------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build /build/extracted/dependencies/ ./
COPY --from=build /build/extracted/spring-boot-loader/ ./
COPY --from=build /build/extracted/snapshot-dependencies/ ./
COPY --from=build /build/extracted/application/ ./

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "org.springframework.boot.loader.launch.JarLauncher"]`,
    },
  ],
};
