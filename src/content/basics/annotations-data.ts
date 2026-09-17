import type { AnnotationEntry } from './types';

/** Data & JPA, transactions, and caching. */
export const dataAnnotations: AnnotationEntry[] = [
  /* ------------------------------------------------------------ data & JPA */
  {
    name: 'Entity',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'Marks a class as a JPA entity mapped to a table.',
    mechanism:
      'Hibernate manages its instances: changes to a managed entity are detected at flush time and written without an explicit save. It needs an @Id and a no-argument constructor (protected is fine).',
    useWhen: 'Persistent domain objects.',
    avoidWhen: 'As an API request or response type — map to DTOs at the service boundary.',
    pitfall:
      'Lombok @Data on an entity: its equals/hashCode touch lazy associations and change when the id is assigned, breaking Set membership.',
    example: {
      lang: 'java',
      code: `@Entity
@Table(name = "tasks")
public class Task {
    @Id
    private UUID id = UUID.randomUUID();

    protected Task() { }   // for JPA
}`,
    },
    related: ['Table', 'Id', 'Column', 'Transactional'],
    lessons: ['data/jpa-fundamentals', 'data/entity-mapping'],
  },
  {
    name: 'Table',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'Names the table (and indexes, unique constraints) for an entity.',
    mechanism: 'Without it the table name comes from the naming strategy — Boot’s default turns TaskItem into task_item.',
    useWhen: 'Whenever the table name differs from the default, or to document constraints next to the mapping.',
    pitfall:
      'Declaring indexes here and expecting them to exist. With Flyway, the migration is the source of truth; @Table indexes only matter if Hibernate generates the schema.',
    example: {
      lang: 'java',
      code: `@Entity
@Table(name = "tasks", uniqueConstraints = @UniqueConstraint(columnNames = { "owner_id", "slug" }))
public class Task { … }`,
    },
    related: ['Entity', 'Column'],
    lessons: ['data/entity-mapping', 'data/migrations'],
  },
  {
    name: 'Id',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'Marks the primary key field.',
    mechanism:
      'Its placement (field or getter) sets the access type for the whole entity. Hibernate treats an entity with a null id as new.',
    useWhen: 'Exactly once per entity (or use @EmbeddedId for composite keys).',
    pitfall:
      'Assigning a UUID in the constructor makes Spring Data’s save() treat new entities as existing and issue a SELECT first — implement Persistable or use @Version to tell it otherwise.',
    example: {
      lang: 'java',
      code: `@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE)
private Long id;`,
    },
    related: ['GeneratedValue', 'Version', 'Entity'],
    lessons: ['data/entity-mapping'],
  },
  {
    name: 'GeneratedValue',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'Lets the database or Hibernate generate the id.',
    mechanism:
      'IDENTITY uses an auto-increment column; SEQUENCE uses a database sequence and can pre-allocate ids; UUID generates in the application.',
    useWhen: 'Surrogate keys.',
    pitfall:
      'IDENTITY silently disables JDBC batch inserts in Hibernate, because the id is only known after each insert. Prefer SEQUENCE with an allocation size for bulk writes.',
    example: {
      lang: 'java',
      code: `@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "task_seq")
@SequenceGenerator(name = "task_seq", allocationSize = 50)
private Long id;`,
    },
    related: ['Id'],
    lessons: ['data/entity-mapping', 'production/performance-tuning'],
  },
  {
    name: 'Column',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'Customises how a field maps to a column.',
    mechanism: 'name, nullable, length, precision, updatable and insertable. nullable and length only affect generated DDL, not runtime validation.',
    useWhen: 'Names that differ from the default, or fields that must never be updated (updatable = false).',
    pitfall: 'Relying on nullable = false for validation — it is only checked if Hibernate generated the schema.',
    example: {
      lang: 'java',
      code: `@Column(name = "created_at", nullable = false, updatable = false)
private Instant createdAt;`,
    },
    related: ['Entity', 'Enumerated'],
    lessons: ['data/entity-mapping'],
  },
  {
    name: 'Enumerated',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'Chooses how an enum is stored.',
    mechanism: 'The default is ORDINAL — the enum’s position number.',
    useWhen: 'On every enum field, with EnumType.STRING.',
    pitfall:
      'ORDINAL storage: inserting a new constant in the middle of the enum silently changes the meaning of every existing row.',
    example: {
      lang: 'java',
      code: `@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)
private TaskStatus status;`,
    },
    related: ['Column'],
    lessons: ['data/entity-mapping'],
  },
  {
    name: 'ManyToOne',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'The owning side of a many-to-one association.',
    mechanism: 'Maps a foreign key column. Its default fetch type is EAGER.',
    useWhen: 'A child row references its parent.',
    pitfall:
      'The EAGER default loads the parent for every child — often the root of an N+1. Always set fetch = FetchType.LAZY and fetch explicitly when needed.',
    example: {
      lang: 'java',
      code: `@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "project_id")
private Project project;`,
    },
    related: ['OneToMany', 'JoinColumn', 'EntityGraph'],
    lessons: ['data/entity-mapping', 'data/n-plus-one'],
  },
  {
    name: 'OneToMany',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'The inverse side of a one-to-many association.',
    mechanism:
      'Lazy by default. mappedBy names the field on the child that owns the foreign key; without it Hibernate creates a join table.',
    useWhen: 'The parent genuinely manages its children’s lifecycle — an order and its lines.',
    avoidWhen:
      'Unbounded collections (a user’s events). Query the child side with a paged repository method instead.',
    pitfall:
      'Forgetting mappedBy, and getting an unexpected join table plus extra writes.',
    example: {
      lang: 'java',
      code: `@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
private List<OrderLine> lines = new ArrayList<>();`,
    },
    related: ['ManyToOne', 'JoinColumn', 'EntityGraph'],
    lessons: ['data/entity-mapping', 'data/n-plus-one'],
  },
  {
    name: 'JoinColumn',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'Names the foreign key column of an association.',
    mechanism: 'Placed on the owning side (@ManyToOne, or a unidirectional @OneToMany).',
    useWhen: 'Whenever the column name differs from the default field_id.',
    example: {
      lang: 'java',
      code: `@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "assignee_id")
private User assignee;`,
    },
    related: ['ManyToOne', 'OneToMany'],
    lessons: ['data/entity-mapping'],
  },
  {
    name: 'Version',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'Enables optimistic locking.',
    mechanism:
      'Hibernate adds WHERE version = ? to every update and increments it. If another transaction changed the row first, zero rows match and the update fails with an optimistic locking exception.',
    useWhen: 'Any entity that can be edited concurrently — which is most of them.',
    pitfall:
      'Catching the exception and retrying blindly. The right response is usually to reload and let the user (or the logic) decide again.',
    example: {
      lang: 'java',
      code: `@Version
private long version;`,
    },
    related: ['Transactional', 'Id'],
    lessons: ['data/transactions', 'redis-ops/distributed-locks'],
  },
  {
    name: 'Transient',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'Excludes a field from persistence.',
    mechanism: 'Hibernate ignores the field. Not the same as Java’s transient keyword, which affects serialisation.',
    useWhen: 'Derived or cached values on an entity.',
    example: {
      lang: 'java',
      code: `@Transient
private boolean overdue;`,
    },
    related: ['Column'],
    lessons: ['data/entity-mapping'],
  },
  {
    name: 'Embeddable',
    category: 'data',
    pkg: 'jakarta.persistence',
    summary: 'A value type whose fields are stored in the owning entity’s table.',
    mechanism: 'Mark the value class @Embeddable and the field @Embedded. It has no identity or table of its own.',
    useWhen: 'Value objects: Money, Address, a date range.',
    example: {
      lang: 'java',
      code: `@Embeddable
public record Money(BigDecimal amount, String currency) { }

@Embedded
private Money total;`,
    },
    related: ['Entity', 'Column'],
    lessons: ['data/entity-mapping'],
  },
  {
    name: 'Query',
    category: 'data',
    pkg: 'org.springframework.data.jpa.repository',
    summary: 'Declares the JPQL or SQL for a repository method.',
    mechanism: 'JPQL by default; nativeQuery = true for SQL. Named parameters bind by :name. Validated at startup for JPQL.',
    useWhen: 'The derived-method name would be unreadable, or you need a join fetch or projection.',
    pitfall:
      'Paging a query that join-fetches a collection: Hibernate applies the limit in memory after loading everything (with a HHH90003004 warning).',
    example: {
      lang: 'java',
      code: `@Query("""
       select t from Task t
       where t.dueAt < :now and t.status <> 'DONE'
       """)
Page<Task> findOverdue(Instant now, Pageable pageable);`,
    },
    related: ['Modifying', 'EntityGraph'],
    lessons: ['data/jpa-fundamentals', 'data/n-plus-one'],
  },
  {
    name: 'Modifying',
    category: 'data',
    pkg: 'org.springframework.data.jpa.repository',
    summary: 'Marks an @Query as an update or delete.',
    mechanism:
      'Executes a bulk statement that bypasses the persistence context, so already-loaded entities keep stale values unless clearAutomatically = true. Requires a transaction.',
    useWhen: 'Bulk updates that should not load every entity first.',
    pitfall:
      'Bulk updates skip @Version checks, entity callbacks and cascades.',
    example: {
      lang: 'java',
      code: `@Modifying(clearAutomatically = true)
@Query("update Task t set t.status = 'ARCHIVED' where t.completedAt < :cutoff")
int archiveBefore(Instant cutoff);`,
    },
    related: ['Query', 'Transactional'],
    lessons: ['data/jpa-fundamentals'],
  },
  {
    name: 'EntityGraph',
    category: 'data',
    pkg: 'org.springframework.data.jpa.repository',
    summary: 'Fetches named associations in the same query.',
    mechanism: 'Turns the listed lazy associations into joins for this query only.',
    useWhen: 'Fixing an N+1 for one use case without changing the mapping.',
    pitfall: 'Fetching two collections at once produces a cartesian product (or MultipleBagFetchException).',
    example: {
      lang: 'java',
      code: `@EntityGraph(attributePaths = { "assignee", "project" })
List<Task> findByStatus(TaskStatus status);`,
    },
    related: ['ManyToOne', 'Query'],
    lessons: ['data/n-plus-one'],
  },

  /* ---------------------------------------------------------- transactions */
  {
    name: 'Transactional',
    category: 'transactions',
    pkg: 'org.springframework.transaction.annotation',
    summary: 'Runs a method inside a database transaction.',
    mechanism:
      'Applied by a proxy: the transaction starts when a caller enters the proxied method and commits when it returns. It rolls back on RuntimeException and Error only — checked exceptions commit unless rollbackFor says otherwise.',
    useWhen: 'On service methods that must succeed or fail as a unit. readOnly = true on queries.',
    avoidWhen:
      'On controllers, and around slow remote calls — a transaction held open during an HTTP call holds a database connection for its whole duration.',
    pitfall:
      'Self-invocation: calling a @Transactional method from another method of the same class bypasses the proxy, so no transaction starts. Same for private methods.',
    example: {
      lang: 'java',
      code: `@Transactional
public Task complete(UUID id) {
    Task task = tasks.findById(id).orElseThrow();
    task.complete();          // no save() needed: dirty checking at commit
    return task;
}

@Transactional(readOnly = true)
public Page<Task> list(Pageable page) { … }`,
    },
    related: ['TransactionalEventListener', 'Version', 'Async'],
    lessons: ['data/transactions', 'spring-core/aop-proxies'],
  },
  {
    name: 'TransactionalEventListener',
    category: 'transactions',
    pkg: 'org.springframework.transaction.event',
    summary: 'Handles an application event only after the publishing transaction commits.',
    mechanism:
      'The default phase is AFTER_COMMIT. If the transaction rolls back the listener never runs; if no transaction is active the event is dropped unless fallbackExecution = true.',
    useWhen: 'Side effects that must not happen for work that was rolled back: sending an email, publishing a message.',
    pitfall:
      'Writing to the database in an AFTER_COMMIT listener: the transaction is finished, so the write needs @Transactional(propagation = REQUIRES_NEW). And a crash after commit loses the event — for guaranteed delivery use an outbox.',
    example: {
      lang: 'java',
      code: `@TransactionalEventListener
void onCompleted(TaskCompleted event) {
    notifications.sendCompletion(event.taskId());
}`,
    },
    related: ['EventListener', 'Transactional'],
    lessons: ['data/transactions', 'event-driven/outbox-pattern'],
  },
  {
    name: 'EnableTransactionManagement',
    category: 'transactions',
    pkg: 'org.springframework.transaction.annotation',
    summary: 'Turns on annotation-driven transactions.',
    mechanism: 'Spring Boot enables it automatically when a transaction manager is present.',
    useWhen: 'Only outside Spring Boot, or to change proxy mode.',
    example: {
      lang: 'java',
      code: `@Configuration
@EnableTransactionManagement
public class TxConfig { }`,
    },
    related: ['Transactional'],
    lessons: ['data/transactions'],
  },

  /* ---------------------------------------------------------------- caching */
  {
    name: 'Cacheable',
    category: 'data',
    pkg: 'org.springframework.cache.annotation',
    summary: 'Returns a cached result instead of calling the method.',
    mechanism:
      'Proxy-based. The key defaults to the method arguments; on a miss the method runs and the result is stored. sync = true lets only one caller compute a missing value.',
    useWhen: 'Expensive, read-mostly lookups whose results can be slightly stale.',
    pitfall:
      'Self-invocation bypasses the cache, and a mutable returned object can be changed by one caller and seen by all.',
    example: {
      lang: 'java',
      code: `@Cacheable(cacheNames = "tasks", key = "#id", sync = true)
public TaskView find(UUID id) { … }`,
    },
    related: ['CacheEvict', 'EnableCaching', 'Transactional'],
    lessons: ['data/caching-redis'],
  },
  {
    name: 'CacheEvict',
    category: 'data',
    pkg: 'org.springframework.cache.annotation',
    summary: 'Removes entries from a cache. Sibling: @CachePut updates one.',
    mechanism: 'Runs after the method by default; beforeInvocation = true evicts first. allEntries clears the whole cache.',
    useWhen: 'On every write path that changes cached data.',
    pitfall:
      'Evicting inside a transaction that later rolls back — or evicting before commit so a concurrent read re-caches the old value.',
    example: {
      lang: 'java',
      code: `@CacheEvict(cacheNames = "tasks", key = "#id")
@Transactional
public void rename(UUID id, String title) { … }`,
    },
    related: ['Cacheable', 'EnableCaching'],
    lessons: ['data/caching-redis'],
  },
  {
    name: 'EnableCaching',
    category: 'data',
    pkg: 'org.springframework.cache.annotation',
    summary: 'Turns on Spring’s annotation-driven cache abstraction.',
    mechanism: 'Registers the caching interceptor. Unlike transactions, Boot does not enable it for you.',
    useWhen: 'Once, on a configuration class, when you use @Cacheable.',
    pitfall: 'Forgetting it: @Cacheable then does nothing, silently.',
    example: {
      lang: 'java',
      code: `@Configuration
@EnableCaching
public class CacheConfig { … }`,
    },
    related: ['Cacheable', 'CacheEvict'],
    lessons: ['data/caching-redis'],
  },
];
