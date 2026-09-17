import type { Chapter, ChapterBook } from '@/content/chapters/types';

const CORE = 'tally-core/src/main/java/dev/springforge/tally';
const CORE_TEST = 'tally-core/src/test/java/dev/springforge/tally';
const APP = 'tally-app/src/main/java/dev/springforge/tally/app';

/** In reading order, part by part. Levels never go backwards within a part. */
const chapters: Chapter[] = [
  // ── Part 1 — Object-Oriented Programming ─────────────────────────────
  {
    slug: 'classes-and-objects',
    title: 'Classes, Objects and Constructors',
    summary:
      'State and behaviour, constructors and this, overloading, static versus instance members, and the order in which an object is initialised.',
    minutes: 14,
    level: 'beginner',
    group: 'oop',
    lessons: [],
    demoFiles: [`${CORE}/account/Account.java`],
  },
  {
    slug: 'encapsulation-and-immutability',
    title: 'Encapsulation and Immutability',
    summary:
      'Access modifiers, protecting invariants, defensive copies, and how to write a class whose instances can never change.',
    minutes: 13,
    level: 'beginner',
    group: 'oop',
    lessons: [],
    demoFiles: [`${CORE}/money/Money.java`, `${CORE}/account/Account.java`],
  },
  {
    slug: 'inheritance',
    title: 'Inheritance',
    summary:
      'extends and super, constructor chaining, the rules for overriding, final, and why deep hierarchies break when the base class changes.',
    minutes: 14,
    level: 'beginner',
    group: 'oop',
    lessons: [],
    demoFiles: [
      `${CORE}/account/Account.java`,
      `${CORE}/account/CheckingAccount.java`,
      `${CORE}/account/SavingsAccount.java`,
    ],
  },
  {
    slug: 'polymorphism',
    title: 'Polymorphism',
    summary:
      'Dynamic dispatch, overloading versus overriding, upcasting and downcasting, covariant return types, and what static and private methods do differently.',
    minutes: 13,
    level: 'beginner',
    group: 'oop',
    lessons: [],
    demoFiles: [`${CORE}/account/CheckingAccount.java`, `${CORE}/account/SavingsAccount.java`],
  },
  {
    slug: 'abstract-classes-and-interfaces',
    title: 'Abstraction: Abstract Classes vs Interfaces',
    summary:
      'Abstract methods, default, static and private interface methods, the diamond problem, functional interfaces, and how to choose between the two.',
    minutes: 15,
    level: 'intermediate',
    group: 'oop',
    lessons: ['spring-core/dependency-injection'],
    demoFiles: [`${CORE}/account/Account.java`, `${CORE}/categorize/Categorizer.java`],
  },
  {
    slug: 'equals-hashcode-comparable',
    title: 'equals, hashCode, toString and Comparable',
    summary:
      'The contracts behind object equality and ordering, what breaks in a HashSet when they are wrong, and Comparator chains.',
    minutes: 14,
    level: 'intermediate',
    group: 'oop',
    lessons: ['data/entity-mapping'],
    demoFiles: [`${CORE}/money/Money.java`, `${CORE_TEST}/money/MoneyTest.java`],
  },
  {
    slug: 'composition-and-solid',
    title: 'Composition, SOLID and Good Object Design',
    summary:
      'Composition over inheritance, then each SOLID principle as a before-and-after, with the coupling each one removes.',
    minutes: 17,
    level: 'intermediate',
    group: 'oop',
    lessons: ['spring-core/dependency-injection', 'spring-core/ioc-container'],
    demoFiles: [`${CORE}/categorize/Rules.java`, `${CORE}/budget/BudgetMonitor.java`],
  },
  {
    slug: 'nested-classes-and-enums',
    title: 'Nested Classes and Enums',
    summary:
      'Static nested, inner, local and anonymous classes and what each captures, then enums with fields, behaviour and per-constant methods.',
    minutes: 13,
    level: 'intermediate',
    group: 'oop',
    lessons: [],
    demoFiles: [`${CORE}/account/AccountType.java`, `${CORE}/txn/Category.java`],
  },

  // ── Part 2 — Java 8 in Depth ──────────────────────────────────────────
  {
    slug: 'lambdas-and-functional-interfaces',
    title: 'Lambdas and Functional Interfaces',
    summary:
      'Lambda syntax, effectively final captures, @FunctionalInterface, and the java.util.function toolkit including composition and primitive variants.',
    minutes: 15,
    level: 'intermediate',
    group: 'java8',
    lessons: [],
    demoFiles: [`${CORE}/categorize/Categorizer.java`, `${CORE}/budget/BudgetMonitor.java`],
  },
  {
    slug: 'method-references',
    title: 'Method References',
    summary:
      'Static, bound, unbound and constructor references, how each maps to a functional interface, and when a lambda reads better.',
    minutes: 9,
    level: 'intermediate',
    group: 'java8',
    lessons: [],
    demoFiles: [`${CORE}/report/Reports.java`],
  },
  {
    slug: 'streams-pipeline',
    title: 'Streams I: The Pipeline',
    summary:
      'Sources, intermediate and terminal operations, laziness and short-circuiting, and map, filter, flatMap, sorted, distinct and limit.',
    minutes: 15,
    level: 'intermediate',
    group: 'java8',
    lessons: [],
    demoFiles: [`${CORE}/report/Reports.java`],
  },
  {
    slug: 'streams-collectors',
    title: 'Streams II: Collectors',
    summary:
      'toList, toMap and its duplicate-key trap, groupingBy with downstream collectors, partitioningBy, joining, teeing and reduce.',
    minutes: 16,
    level: 'intermediate',
    group: 'java8',
    lessons: [],
    demoFiles: [`${CORE}/report/Reports.java`, `${CORE_TEST}/report/ReportsTest.java`],
  },
  {
    slug: 'streams-pitfalls-and-parallel',
    title: 'Streams III: Pitfalls and Parallel Streams',
    summary:
      'Side effects, reusing a stream, boxing and primitive streams, checked exceptions in lambdas, and when parallel streams help or hurt.',
    minutes: 13,
    level: 'intermediate',
    group: 'java8',
    lessons: [],
    demoFiles: [`${CORE}/report/Reports.java`],
  },
  {
    slug: 'optional',
    title: 'Optional Done Right',
    summary:
      'Creating and unwrapping Optionals, map, flatMap, filter, orElse versus orElseGet, and where Optional does not belong.',
    minutes: 11,
    level: 'intermediate',
    group: 'java8',
    lessons: [],
    demoFiles: [`${CORE}/repo/InMemoryRepository.java`, `${CORE}/categorize/Rules.java`],
  },
  {
    slug: 'default-methods-and-date-time',
    title: 'Default Methods, java.time and the Rest of Java 8',
    summary:
      'Why default methods exist, LocalDate, Instant, ZonedDateTime, Duration and Period, formatting and parsing, and a first look at CompletableFuture.',
    minutes: 14,
    level: 'intermediate',
    group: 'java8',
    lessons: [],
    demoFiles: [`${CORE}/report/Reports.java`, `${APP}/io/CsvImporter.java`],
  },

  // ── Part 3 — Core Java ────────────────────────────────────────────────
  {
    slug: 'strings',
    title: 'Strings, Immutability and the String Pool',
    summary:
      'Why String is immutable, the pool and intern, == versus equals, StringBuilder, formatting, and the useful newer String methods.',
    minutes: 11,
    level: 'intermediate',
    group: 'core',
    lessons: [],
    demoFiles: [`${CORE}/report/ReportExporter.java`],
  },
  {
    slug: 'generics',
    title: 'Generics',
    summary:
      'Generic classes and methods, bounded types, wildcards and PECS, type erasure and the restrictions it causes.',
    minutes: 16,
    level: 'intermediate',
    group: 'core',
    lessons: [],
    demoFiles: [
      `${CORE}/repo/Identifiable.java`,
      `${CORE}/repo/Repository.java`,
      `${CORE}/repo/InMemoryRepository.java`,
    ],
  },
  {
    slug: 'collections-lists-sets-queues',
    title: 'Collections I: Lists, Sets and Queues',
    summary:
      'The collection hierarchy, ArrayList versus LinkedList, the three Sets, ArrayDeque and PriorityQueue, and their costs in one table.',
    minutes: 15,
    level: 'intermediate',
    group: 'core',
    lessons: [],
    demoFiles: [`${CORE}/budget/BudgetMonitor.java`],
  },
  {
    slug: 'hashmap-internals',
    title: 'Collections II: How HashMap Works',
    summary:
      'Buckets, hashing and spreading, collisions and treeification, resizing, LinkedHashMap and TreeMap, fail-fast iterators, and immutable collections.',
    minutes: 16,
    level: 'intermediate',
    group: 'core',
    lessons: [],
    demoFiles: [`${CORE}/repo/InMemoryRepository.java`, `${CORE}/money/Money.java`],
  },
  {
    slug: 'exceptions',
    title: 'Exceptions',
    summary:
      'The Throwable hierarchy, checked versus unchecked, try-with-resources and suppressed exceptions, custom exceptions, and handling rules that hold up.',
    minutes: 14,
    level: 'intermediate',
    group: 'core',
    lessons: ['web-rest/validation-errors'],
    demoFiles: [
      `${CORE}/error/TallyException.java`,
      `${CORE}/error/InsufficientFundsException.java`,
      `${APP}/io/CsvImporter.java`,
    ],
  },

  // ── Part 4 — Modern Java ──────────────────────────────────────────────
  {
    slug: 'var-records-text-blocks',
    title: 'var, Records and Text Blocks',
    summary:
      'Local type inference and where it hurts, records with compact constructors and their limits, and multi-line text blocks.',
    minutes: 13,
    level: 'intermediate',
    group: 'modern',
    lessons: ['boot-essentials/typed-config'],
    demoFiles: [`${CORE}/txn/Transaction.java`, `${APP}/TallyApp.java`],
  },
  {
    slug: 'sealed-types-and-pattern-matching',
    title: 'Sealed Types, Switch Expressions and Pattern Matching',
    summary:
      'Switch expressions, pattern matching for instanceof and switch, record patterns, guards, and sealed hierarchies that make switches exhaustive.',
    minutes: 16,
    level: 'intermediate',
    group: 'modern',
    lessons: [],
    demoFiles: [`${CORE}/txn/Transaction.java`, `${CORE}/report/Reports.java`],
  },
  {
    slug: 'modern-java-additions',
    title: 'Other Modern Additions Worth Knowing',
    summary:
      'Immutable collection factories, Stream.toList, sequenced collections, HttpClient, the module system in brief, and a feature-by-version table.',
    minutes: 12,
    level: 'intermediate',
    group: 'modern',
    lessons: ['resilience/http-clients'],
    demoFiles: [`${APP}/TallyApp.java`],
  },

  // ── Part 5 — Concurrency ──────────────────────────────────────────────
  {
    slug: 'threads-and-memory-model',
    title: 'Threads and the Java Memory Model',
    summary:
      'Creating threads, the thread lifecycle, race conditions, synchronized, volatile, wait and notify, and deadlock.',
    minutes: 17,
    level: 'advanced',
    group: 'concurrency',
    lessons: [],
    demoFiles: [`${APP}/stats/RunningTotals.java`],
  },
  {
    slug: 'executors-and-completablefuture',
    title: 'Executors, Futures and CompletableFuture',
    summary:
      'Thread pools and how to size them, Future, composing asynchronous work with CompletableFuture, timeouts and error handling.',
    minutes: 16,
    level: 'advanced',
    group: 'concurrency',
    lessons: ['spring-core/aop-proxies'],
    demoFiles: [`${APP}/io/StatementImporter.java`],
  },
  {
    slug: 'locks-atomics-concurrent-collections',
    title: 'Locks, Atomics and Concurrent Collections',
    summary:
      'ReentrantLock and ReadWriteLock, atomic variables and LongAdder, ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue and latches.',
    minutes: 15,
    level: 'advanced',
    group: 'concurrency',
    lessons: ['redis-ops/distributed-locks'],
    demoFiles: [`${APP}/stats/RunningTotals.java`, `${CORE}/budget/BudgetMonitor.java`],
  },
  {
    slug: 'virtual-threads',
    title: 'Virtual Threads and Structured Concurrency',
    summary:
      'How virtual threads work, what they change for blocking code and Spring Boot, pinning, ThreadLocal, and structured concurrency.',
    minutes: 13,
    level: 'advanced',
    group: 'concurrency',
    lessons: ['production/virtual-threads'],
    demoFiles: [`${APP}/io/StatementImporter.java`],
  },

  // ── Part 6 — The JVM and Design Patterns ─────────────────────────────
  {
    slug: 'jvm-internals',
    title: 'Inside the JVM',
    summary:
      'From source to bytecode, class loading, heap, stack and metaspace, the garbage collectors, the JIT, tuning flags, and heap and thread dumps.',
    minutes: 18,
    level: 'advanced',
    group: 'jvm',
    lessons: ['production/jvm-memory', 'production/performance-tuning'],
    demoFiles: [],
  },
  {
    slug: 'design-patterns',
    title: 'Design Patterns in Java and in Spring',
    summary:
      'Singleton, factory, builder, strategy, template method, observer, proxy and decorator — each in plain Java and where Spring uses it.',
    minutes: 18,
    level: 'advanced',
    group: 'jvm',
    lessons: ['spring-core/aop-proxies', 'spring-core/configuration-classes'],
    demoFiles: [
      `${CORE}/txn/TransactionBuilder.java`,
      `${CORE}/account/AccountType.java`,
      `${CORE}/categorize/Rules.java`,
      `${CORE}/report/ReportExporter.java`,
      `${CORE}/budget/BudgetMonitor.java`,
    ],
  },
];

export const javaBook: ChapterBook = {
  id: 'java',
  basePath: '/java',
  title: 'Java',
  intro:
    'The Java that every Spring lesson assumes, in depth: object-oriented design, Java 8’s lambdas and streams, the core library, modern Java up to 21, concurrency, the JVM, and the design patterns Spring is built from.',
  tags: 'java core-java',
  groups: [
    { id: 'oop', label: 'Part 1 · Object-Oriented Programming', blurb: 'Classes, the four pillars, object contracts and design' },
    { id: 'java8', label: 'Part 2 · Java 8 in Depth', blurb: 'Lambdas, method references, streams, Optional and java.time' },
    { id: 'core', label: 'Part 3 · Core Java', blurb: 'Strings, generics, collections and exceptions' },
    { id: 'modern', label: 'Part 4 · Modern Java (9–21)', blurb: 'Records, sealed types, pattern matching and more' },
    { id: 'concurrency', label: 'Part 5 · Concurrency', blurb: 'Threads, executors, locks and virtual threads' },
    { id: 'jvm', label: 'Part 6 · The JVM and Design Patterns', blurb: 'What runs your code, and the patterns Spring is made of' },
  ],
  chapters,
  demo: {
    id: 'tally',
    name: 'Tally',
    blurb:
      'A small expense tracker in plain Java 21 — no Spring. Accounts, a sealed transaction hierarchy, stream reports, generics, and a concurrent importer. The chapters walk through its files.',
  },
};
