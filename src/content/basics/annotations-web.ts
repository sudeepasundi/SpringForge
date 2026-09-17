import type { AnnotationEntry } from './types';

/** Web & REST, and Bean Validation. */
export const webAnnotations: AnnotationEntry[] = [
  /* ----------------------------------------------------------- web & REST */
  {
    name: 'RestController',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'A controller whose return values are written straight to the response body.',
    mechanism:
      '@Controller + @ResponseBody. Return values go through an HttpMessageConverter (Jackson for JSON) instead of being treated as view names.',
    useWhen: 'Any JSON or HTTP API endpoint.',
    avoidWhen: 'Server-rendered pages — use @Controller and return a view name.',
    pitfall:
      'Business logic accumulating in the controller. It should translate HTTP into a method call and back, nothing more.',
    example: {
      lang: 'java',
      code: `@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService tasks;

    public TaskController(TaskService tasks) { this.tasks = tasks; }
}`,
    },
    related: ['RequestMapping', 'GetMapping', 'RestControllerAdvice'],
    lessons: ['web-rest/rest-controllers', 'web-rest/request-lifecycle'],
  },
  {
    name: 'RequestMapping',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'Maps a path (and optionally method, headers, media types) to a handler.',
    mechanism:
      'On a class it sets a prefix for every method. It can narrow by consumes and produces, which is how two handlers can share a path.',
    useWhen: 'On the class, for the common path prefix.',
    avoidWhen: 'On methods — the method-specific shortcuts (@GetMapping, @PostMapping…) are clearer.',
    example: {
      lang: 'java',
      code: `@RestController
@RequestMapping(path = "/api/tasks", produces = MediaType.APPLICATION_JSON_VALUE)
public class TaskController { … }`,
    },
    related: ['GetMapping', 'RestController'],
    lessons: ['web-rest/rest-controllers'],
  },
  {
    name: 'GetMapping',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'Maps an HTTP GET. Siblings: @PostMapping, @PutMapping, @PatchMapping, @DeleteMapping.',
    mechanism: 'A @RequestMapping with the method fixed.',
    useWhen: 'On every handler method — one annotation per HTTP method.',
    pitfall:
      'Using GET for something that changes state. Crawlers, prefetchers and retries all assume GET is safe.',
    example: {
      lang: 'java',
      code: `@GetMapping("/{id}")
public TaskResponse get(@PathVariable UUID id) {
    return TaskResponse.from(tasks.get(id));
}

@PostMapping
public ResponseEntity<TaskResponse> create(@Valid @RequestBody CreateTaskRequest request) { … }`,
    },
    related: ['RequestMapping', 'PathVariable', 'RequestBody'],
    lessons: ['web-rest/rest-controllers', 'web-rest/api-design'],
  },
  {
    name: 'PathVariable',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'Binds a {placeholder} in the URL to a parameter.',
    mechanism:
      'Converted to the declared type; a value that will not convert (not-a-uuid for a UUID) is a 400 you did not have to write.',
    useWhen: 'Identifying a specific resource.',
    pitfall:
      'Declaring it as String and parsing by hand — you lose the free 400 and duplicate the conversion.',
    example: {
      lang: 'java',
      code: `@GetMapping("/{taskId}/comments/{commentId}")
public CommentResponse comment(@PathVariable UUID taskId, @PathVariable long commentId) { … }`,
    },
    related: ['RequestParam', 'GetMapping'],
    lessons: ['web-rest/rest-controllers'],
  },
  {
    name: 'RequestParam',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'Binds a query-string or form parameter.',
    mechanism:
      'Required by default — a missing parameter is a 400. Use required = false with a nullable or Optional type, or defaultValue.',
    useWhen: 'Filtering, sorting and optional modifiers.',
    pitfall:
      'Unbounded page sizes. Prefer Pageable with spring.data.web.pageable.max-page-size set.',
    example: {
      lang: 'java',
      code: `@GetMapping
public Page<TaskResponse> list(
        @RequestParam(required = false) TaskStatus status,
        Pageable pageable) { … }`,
    },
    related: ['PathVariable', 'RequestHeader'],
    lessons: ['web-rest/rest-controllers'],
  },
  {
    name: 'RequestBody',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'Deserialises the request body into a parameter.',
    mechanism:
      'An HttpMessageConverter reads the body based on Content-Type. Combined with @Valid, constraint violations become MethodArgumentNotValidException, which Spring maps to 400.',
    useWhen: 'Accepting JSON on POST, PUT and PATCH.',
    pitfall:
      'Binding straight to a JPA entity. Clients can then set fields they should never control (id, owner, status) — use a request DTO.',
    example: {
      lang: 'java',
      code: `@PostMapping
public ResponseEntity<TaskResponse> create(@Valid @RequestBody CreateTaskRequest request) { … }`,
    },
    related: ['Valid', 'GetMapping', 'ExceptionHandler'],
    lessons: ['web-rest/rest-controllers', 'web-rest/validation-errors'],
  },
  {
    name: 'RequestHeader',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'Binds an HTTP header to a parameter.',
    mechanism: 'Required by default, like @RequestParam.',
    useWhen: 'Protocol-level inputs: Idempotency-Key, If-Match, a tenant header.',
    example: {
      lang: 'java',
      code: `@PostMapping("/payments")
public PaymentResponse pay(@RequestHeader("Idempotency-Key") UUID key,
                           @Valid @RequestBody PaymentRequest request) { … }`,
    },
    related: ['RequestParam'],
    lessons: ['web-rest/api-design', 'event-driven/idempotency'],
  },
  {
    name: 'ResponseStatus',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'Sets the HTTP status for a handler or an exception type.',
    mechanism:
      'On a handler it fixes the success status. On an exception class it sets the status whenever that exception escapes a controller.',
    useWhen: 'A handler whose status never varies — 204 for a delete.',
    avoidWhen:
      'When the status or headers depend on runtime state — return ResponseEntity instead. For errors, prefer an @RestControllerAdvice returning ProblemDetail.',
    example: {
      lang: 'java',
      code: `@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void delete(@PathVariable UUID id) { tasks.delete(id); }`,
    },
    related: ['ExceptionHandler', 'RestControllerAdvice'],
    lessons: ['web-rest/rest-controllers', 'web-rest/validation-errors'],
  },
  {
    name: 'ExceptionHandler',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'Turns an exception into an HTTP response.',
    mechanism:
      'Local to its controller when declared there; applies to every controller when declared in an @RestControllerAdvice. The most specific exception type wins.',
    useWhen: 'Inside an @RestControllerAdvice, so error shape is decided once.',
    example: {
      lang: 'java',
      code: `@ExceptionHandler(TaskNotFoundException.class)
public ProblemDetail onNotFound(TaskNotFoundException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
}`,
    },
    related: ['RestControllerAdvice', 'ResponseStatus'],
    lessons: ['web-rest/validation-errors'],
  },
  {
    name: 'RestControllerAdvice',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'A class of exception handlers applied across all controllers.',
    mechanism: '@ControllerAdvice + @ResponseBody. Can be narrowed with basePackages or assignableTypes.',
    useWhen: 'Always — one place that decides the error format for the whole API.',
    pitfall:
      'Several advice classes with overlapping handlers and no @Order: which one wins is not what you expect.',
    example: {
      lang: 'java',
      code: `@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail onValidation(MethodArgumentNotValidException ex) { … }
}`,
    },
    related: ['ExceptionHandler', 'RestController'],
    lessons: ['web-rest/validation-errors'],
  },
  {
    name: 'CrossOrigin',
    category: 'web',
    pkg: 'org.springframework.web.bind.annotation',
    summary: 'Allows cross-origin browser requests to a handler.',
    mechanism: 'Adds CORS response headers for matching requests, including preflight OPTIONS.',
    useWhen: 'Quick local experiments.',
    avoidWhen:
      'Production — configure CORS once, centrally, in the security configuration, so the policy is reviewable in one place.',
    pitfall:
      'With Spring Security, CORS must be enabled in the filter chain too, or preflight requests are rejected before reaching the controller.',
    example: {
      lang: 'java',
      code: `@CrossOrigin(origins = "http://localhost:5173")
@GetMapping("/api/ping")
public String ping() { return "pong"; }`,
    },
    related: ['EnableWebSecurity'],
    lessons: ['security/security-hardening'],
  },

  /* ----------------------------------------------------------- validation */
  {
    name: 'Valid',
    category: 'validation',
    pkg: 'jakarta.validation',
    summary: 'Triggers Bean Validation on a parameter or a nested object.',
    mechanism:
      'On a @RequestBody it validates before the handler runs. On a field it cascades validation into the nested object — without it, constraints inside the nested object are ignored.',
    useWhen: 'Every request body with constraints, and every nested object whose constraints should apply.',
    pitfall:
      'Constraints on a DTO without @Valid at the call site are documentation only — nothing checks them.',
    example: {
      lang: 'java',
      code: `public record OrderRequest(
        @NotEmpty List<@Valid OrderLine> lines,   // cascade into each line
        @Valid Address shipping) { }`,
    },
    related: ['Validated', 'NotBlank', 'RequestBody'],
    lessons: ['web-rest/validation-errors'],
  },
  {
    name: 'Validated',
    category: 'validation',
    pkg: 'org.springframework.validation.annotation',
    summary: 'Spring’s variant of @Valid: supports groups, and enables method validation on a class.',
    mechanism:
      'On a class, it makes Spring proxy the bean so constraints on method parameters and return values are checked (ConstraintViolationException). On @ConfigurationProperties it validates at startup. Controllers on Spring Framework 6.1+ validate constrained parameters without it.',
    useWhen: 'Validation groups, validating a service method’s arguments, or validating configuration.',
    pitfall:
      'Method validation is proxy-based, so it does not apply to calls from inside the same class.',
    example: {
      lang: 'java',
      code: `@Service
@Validated
public class ReportService {
    public Report monthly(@Min(1) @Max(12) int month) { … }
}`,
    },
    related: ['Valid', 'ConfigurationProperties'],
    lessons: ['web-rest/validation-errors', 'boot-essentials/typed-config'],
  },
  {
    name: 'NotBlank',
    category: 'validation',
    pkg: 'jakarta.validation.constraints',
    summary: 'A string must be non-null and contain a non-whitespace character.',
    mechanism:
      'The three look alike and differ: @NotNull rejects only null; @NotEmpty also rejects "" (and empty collections); @NotBlank also rejects "   ". @NotBlank applies to CharSequence only.',
    useWhen: 'Any required text input.',
    pitfall:
      'Using @NotNull on a string field and accepting "" or whitespace as a valid name.',
    example: {
      lang: 'java',
      code: `public record CreateTaskRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull TaskStatus status,
        @NotEmpty List<String> tags) { }`,
    },
    related: ['NotNull', 'Size', 'Valid'],
    lessons: ['web-rest/validation-errors'],
  },
  {
    name: 'NotNull',
    category: 'validation',
    pkg: 'jakarta.validation.constraints',
    summary: 'The value must not be null. Nothing more.',
    mechanism: 'Empty strings and empty collections pass. Most other constraints treat null as valid, so pair them with @NotNull.',
    useWhen: 'Required non-text values: enums, numbers, dates, nested objects.',
    example: {
      lang: 'java',
      code: `public record PaymentRequest(
        @NotNull @Positive BigDecimal amount,
        @NotNull Currency currency) { }`,
    },
    related: ['NotBlank', 'Size'],
    lessons: ['web-rest/validation-errors'],
  },
  {
    name: 'Size',
    category: 'validation',
    pkg: 'jakarta.validation.constraints',
    summary: 'Bounds the length of a string or the size of a collection.',
    mechanism: 'null is valid — combine with @NotNull or @NotBlank if the value is required.',
    useWhen: 'Every free-text field. Unbounded input is a storage and abuse problem.',
    pitfall: 'A limit that disagrees with the database column, so validation passes and the insert fails.',
    example: {
      lang: 'java',
      code: `@Size(max = 2000) String description`,
    },
    related: ['NotBlank', 'Pattern'],
    lessons: ['web-rest/validation-errors'],
  },
  {
    name: 'Pattern',
    category: 'validation',
    pkg: 'jakarta.validation.constraints',
    summary: 'A string must match a regular expression.',
    mechanism: 'The whole string must match — the regex is anchored implicitly. null is valid.',
    useWhen: 'Formats with a precise shape: codes, slugs, E.164 phone numbers.',
    avoidWhen: 'Email addresses — use @Email; hand-written email regexes are always wrong somewhere.',
    example: {
      lang: 'java',
      code: `@Pattern(regexp = "\\\\+[1-9][0-9]{7,14}", message = "must be E.164")
String phone`,
    },
    related: ['Size', 'NotBlank'],
    lessons: ['web-rest/validation-errors'],
  },
  {
    name: 'Email',
    category: 'validation',
    pkg: 'jakarta.validation.constraints',
    summary: 'The string must be a syntactically plausible email address.',
    mechanism:
      'Checks syntax only, and permissively. It says nothing about whether the mailbox exists — only a confirmation email does.',
    useWhen: 'Any email input, together with @NotBlank if required.',
    example: {
      lang: 'java',
      code: `@NotBlank @Email String email`,
    },
    related: ['Pattern', 'NotBlank'],
    lessons: ['web-rest/validation-errors'],
  },
  {
    name: 'Future',
    category: 'validation',
    pkg: 'jakarta.validation.constraints',
    summary: 'A date or time must be in the future. Siblings: @Past, @FutureOrPresent, @PastOrPresent.',
    mechanism: 'Compared against the validator’s clock at validation time. null is valid.',
    useWhen: 'Due dates, scheduled times, birth dates (@Past).',
    pitfall:
      'Tests that pass today and fail tomorrow because a fixture date slid into the past. Inject a ClockProvider in tests.',
    example: {
      lang: 'java',
      code: `@Future Instant dueAt`,
    },
    related: ['NotNull'],
    lessons: ['web-rest/validation-errors'],
  },
  {
    name: 'Min',
    category: 'validation',
    pkg: 'jakarta.validation.constraints',
    summary: 'Numeric lower bound. Siblings: @Max, @Positive, @PositiveOrZero, @DecimalMin.',
    mechanism: '@Min and @Max take a long; use @DecimalMin/@DecimalMax for fractional bounds on BigDecimal.',
    useWhen: 'Quantities, page sizes, percentages.',
    example: {
      lang: 'java',
      code: `@Min(1) @Max(100) int quantity`,
    },
    related: ['NotNull', 'Validated'],
    lessons: ['web-rest/validation-errors'],
  },
];
