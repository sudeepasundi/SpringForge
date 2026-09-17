import type { JavaQuestion } from './question-types';

/** Core Java and modern Java. Answers are plain text; `backticks` mark inline code. */
export const questionsCoreModern: JavaQuestion[] = [
  // ── Core Java ──────────────────────────────────────────────────────────
  {
    id: 'string-immutable',
    topic: 'core',
    difficulty: 'basic',
    question: "Why is `String` immutable?",
    answer:
      "So that strings can be shared safely: pooled literals can be reused, a string can be used as a map key because its hash never changes (and is cached), it is thread-safe without locking, and security-sensitive values like class names and file paths cannot be changed after they are checked.",
    chapter: 'strings',
  },
  {
    id: 'string-pool',
    topic: 'core',
    difficulty: 'basic',
    question: "What is the string pool, and why does `==` sometimes work for strings?",
    answer:
      "The JVM keeps one shared instance of each distinct string literal (and compile-time constant) in the string pool. Two identical literals are the same object, so `==` returns true — by accident. Strings created at run time (`new String`, concatenation of variables, input) are separate objects. Always compare with `equals`; `intern()` returns the pooled instance.",
    code: {
      lang: 'java',
      code: `String a = "java", b = "java", c = new String("java");
a == b;          // true  (same pooled object)
a == c;          // false
a.equals(c);     // true`,
    },
    chapter: 'strings',
  },
  {
    id: 'stringbuilder-vs-stringbuffer',
    topic: 'core',
    difficulty: 'basic',
    question: "`String`, `StringBuilder` or `StringBuffer`?",
    answer:
      "`String` is immutable — use it for almost everything. `StringBuilder` is a mutable buffer for building text, especially in loops, where `+=` would copy the whole string each time. `StringBuffer` is the old synchronized version; you almost never share a builder between threads, so prefer `StringBuilder`.",
    chapter: 'strings',
  },
  {
    id: 'type-erasure',
    topic: 'core',
    difficulty: 'intermediate',
    question: "What is type erasure, and what does it prevent you from doing?",
    answer:
      "Generics are checked at compile time and then erased: at run time `List<String>` and `List<Integer>` are the same class. So you cannot write `new T()`, create a `T[]`, test `instanceof List<String>`, use primitives as type arguments, or overload methods that differ only by type argument. Pass a `Class<T>` token when code needs the type at run time.",
    chapter: 'generics',
  },
  {
    id: 'pecs',
    topic: 'core',
    difficulty: 'intermediate',
    question: "What does PECS mean?",
    answer:
      "Producer Extends, Consumer Super. If a parameter produces values you read, declare it `? extends T`; if it consumes values you write into, declare it `? super T`. `Collections.copy(List<? super T> dest, List<? extends T> src)` is the classic example. Generics are invariant — a `List<Integer>` is not a `List<Number>` — and wildcards add back the flexibility that is safe.",
    chapter: 'generics',
  },
  {
    id: 'arraylist-vs-linkedlist',
    topic: 'core',
    difficulty: 'basic',
    question: "`ArrayList` or `LinkedList`?",
    answer:
      "`ArrayList` almost always. It has O(1) random access and amortised O(1) appends, and its contiguous array is cache-friendly. `LinkedList` has O(1) insertion at the ends but O(n) access by index, extra memory per element and poor locality, so it loses most real benchmarks. For a queue or stack use `ArrayDeque`.",
    chapter: 'collections-lists-sets-queues',
  },
  {
    id: 'set-implementations',
    topic: 'core',
    difficulty: 'basic',
    question: "Compare `HashSet`, `LinkedHashSet` and `TreeSet`.",
    answer:
      "`HashSet`: no order, O(1) average operations, uses `hashCode` and `equals`. `LinkedHashSet`: same, plus insertion order. `TreeSet`: sorted by natural order or a `Comparator`, O(log n), uses `compareTo` for uniqueness, no nulls, and supports range queries like `floor` and `headSet`.",
    chapter: 'collections-lists-sets-queues',
  },
  {
    id: 'fail-fast',
    topic: 'core',
    difficulty: 'intermediate',
    question: "What is a fail-fast iterator? How do you remove elements safely while iterating?",
    answer:
      "Most collections count structural modifications; if the collection changes during iteration other than through the iterator, the next `next()` throws `ConcurrentModificationException`. It is a best-effort bug detector, not thread safety. Remove with `removeIf(...)` or `iterator.remove()`. Concurrent collections instead have weakly consistent iterators that never throw.",
    chapter: 'collections-lists-sets-queues',
  },
  {
    id: 'hashmap-internals',
    topic: 'core',
    difficulty: 'intermediate',
    question: "How does `HashMap` work internally?",
    answer:
      "It is an array of buckets. `put` spreads the key's `hashCode` (`h ^ (h >>> 16)`), masks it with `length - 1` to choose a bucket, then compares stored hashes and `equals` to find an existing key; if none matches it appends a node. When a bucket reaches 8 nodes (and the table has at least 64 buckets) it becomes a red-black tree, so the worst case is O(log n). When size exceeds capacity × load factor (16 × 0.75 by default), the table doubles and entries are redistributed.",
    points: [
      "Why is the capacity a power of two?",
      "What happens with a `hashCode` that always returns 1?",
      "Why must keys be immutable?",
    ],
    chapter: 'hashmap-internals',
  },
  {
    id: 'hashmap-vs-hashtable-vs-chm',
    topic: 'core',
    difficulty: 'intermediate',
    question: "`HashMap`, `Hashtable` or `ConcurrentHashMap`?",
    answer:
      "`HashMap` is not thread-safe and allows one null key and null values. `Hashtable` is legacy: every method synchronized on one lock, no nulls — do not use it. `ConcurrentHashMap` is the thread-safe choice: fine-grained locking and CAS, lock-free reads, atomic `compute`/`merge`/`putIfAbsent`, weakly consistent iterators, and no null keys or values.",
    chapter: 'hashmap-internals',
  },
  {
    id: 'unmodifiable-vs-immutable',
    topic: 'core',
    difficulty: 'intermediate',
    question: "What is the difference between `Collections.unmodifiableList` and `List.of`?",
    answer:
      "`Collections.unmodifiableList(x)` is a read-only view: you cannot modify it, but it reflects any change made to `x`. `List.of` and `List.copyOf` create truly immutable lists that never change, and they reject nulls. `stream.toList()` is also unmodifiable but allows nulls. `Arrays.asList` is fixed-size but allows `set`.",
    chapter: 'hashmap-internals',
  },
  {
    id: 'linkedhashmap-lru',
    topic: 'core',
    difficulty: 'advanced',
    question: "How would you build a simple LRU cache in Java?",
    answer:
      "Extend `LinkedHashMap` with access order enabled (the third constructor argument `true`), and override `removeEldestEntry` to return true when the size exceeds the limit. Every `get` moves the entry to the end, so the eldest entry is the least recently used. For concurrent production use, prefer a library such as Caffeine.",
    code: {
      lang: 'java',
      code: `class Lru<K, V> extends LinkedHashMap<K, V> {
    private final int max;
    Lru(int max) { super(16, 0.75f, true); this.max = max; }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> e) {
        return size() > max;
    }
}`,
    },
    chapter: 'hashmap-internals',
  },
  {
    id: 'checked-vs-unchecked',
    topic: 'core',
    difficulty: 'basic',
    question: "Checked versus unchecked exceptions — what is the difference and when do you use each?",
    answer:
      "Checked exceptions (subclasses of `Exception` but not `RuntimeException`) must be caught or declared; they are meant for expected, recoverable conditions such as I/O failures. Unchecked exceptions (`RuntimeException` and subclasses) need no declaration and signal programming errors or broken rules. Modern code and frameworks, including Spring, lean towards unchecked exceptions and translate checked ones at boundaries.",
    chapter: 'exceptions',
  },
  {
    id: 'try-with-resources',
    topic: 'core',
    difficulty: 'basic',
    question: "What does try-with-resources do, and what are suppressed exceptions?",
    answer:
      "Resources declared in the `try (...)` header must implement `AutoCloseable` and are closed automatically, in reverse order, however the block exits. If the body throws and `close()` also throws, the body's exception propagates and the close failure is attached to it as a suppressed exception (`getSuppressed()`), instead of replacing it.",
    chapter: 'exceptions',
  },
  {
    id: 'finally-return',
    topic: 'core',
    difficulty: 'intermediate',
    question: "Does `finally` always run? What happens if it contains `return`?",
    answer:
      "It runs after normal completion, a `return`, or an exception — but not if the JVM exits (`System.exit`), the thread is killed, or the machine dies. A `return` in `finally` overrides the try block's return value and silently discards any exception in flight. Never return or throw from `finally`.",
    chapter: 'exceptions',
  },
  {
    id: 'exception-best-practices',
    topic: 'core',
    difficulty: 'intermediate',
    question: "What are good practices for exception handling?",
    answer:
      "Catch only what you can handle; never swallow exceptions; keep the cause when wrapping (`new XException(msg, e)`); log or rethrow, not both; do not catch `Exception` or `Throwable` except at boundaries, and never `Error`; do not use exceptions for normal control flow; validate arguments early; restore the interrupt flag if you catch `InterruptedException` without rethrowing; and translate exceptions at layer boundaries.",
    chapter: 'exceptions',
  },
  {
    id: 'error-vs-exception',
    topic: 'core',
    difficulty: 'basic',
    question: "What is the difference between `Error` and `Exception`?",
    answer:
      "Both extend `Throwable`. `Error` signals serious problems in the JVM itself — `OutOfMemoryError`, `StackOverflowError` — which an application generally cannot recover from and should not catch. `Exception` covers conditions an application may reasonably handle.",
    chapter: 'exceptions',
  },

  // ── Modern Java ────────────────────────────────────────────────────────
  {
    id: 'var-usage',
    topic: 'modern',
    difficulty: 'basic',
    question: "What is `var`, and when should you avoid it?",
    answer:
      "`var` (Java 10) infers a local variable's static type from its initialiser; the variable is still strongly typed. It works only for local variables with an initialiser, loop variables, try-with-resources and lambda parameters. Avoid it when the type is not obvious from the right-hand side, with the diamond (`var list = new ArrayList<>()` is `ArrayList<Object>`), and with numeric literals whose type matters.",
    chapter: 'var-records-text-blocks',
  },
  {
    id: 'records',
    topic: 'modern',
    difficulty: 'basic',
    question: "What is a record, and what does the compiler generate?",
    answer:
      "A record (Java 16) is a transparent, immutable data carrier. From `record Point(int x, int y)` the compiler generates private final fields, a canonical constructor, accessors `x()` and `y()`, and `equals`, `hashCode` and `toString` based on all components. Records are final, extend `java.lang.Record`, may implement interfaces, and cannot declare instance fields.",
    points: [
      "What is a compact constructor for?",
      "Can a record be a JPA entity? (No — entities need a no-arg constructor, mutable state and proxies.)",
    ],
    chapter: 'var-records-text-blocks',
  },
  {
    id: 'record-vs-lombok',
    topic: 'modern',
    difficulty: 'intermediate',
    question: "Record or a class with Lombok `@Value` / `@Data`?",
    answer:
      "Records are a language feature with a fixed, well-understood contract: immutable, all components in `equals`, accessors named after components, and support for record patterns and deconstruction. Lombok works through annotation processing and supports mutable classes, builders and inheritance. Use records for DTOs, value objects and query results; use a class when you need mutability, inheritance or JPA.",
    chapter: 'var-records-text-blocks',
  },
  {
    id: 'sealed-classes',
    topic: 'modern',
    difficulty: 'intermediate',
    question: "What are sealed classes and why are they useful?",
    answer:
      "A sealed class or interface (Java 17) lists exactly which types may extend it with `permits`. Each permitted type must be `final`, `sealed` or `non-sealed`. Because the compiler knows the complete set, a pattern-matching `switch` over a sealed type can be exhaustive without `default` — and adding a new subtype turns every unhandled switch into a compile error.",
    chapter: 'sealed-types-and-pattern-matching',
  },
  {
    id: 'pattern-matching-switch',
    topic: 'modern',
    difficulty: 'intermediate',
    question: "What does pattern matching for `switch` add in Java 21?",
    answer:
      "Cases can match types (`case Integer i`), deconstruct records (`case Point(var x, var y)`), use guards (`case Integer i when i > 100`), and handle `null` explicitly (`case null`). Cases are checked in order, and the compiler rejects dominated cases and requires exhaustiveness.",
    code: {
      lang: 'java',
      code: `return switch (shape) {
    case Circle c -> Math.PI * c.r() * c.r();
    case Square(double side) -> side * side;
};   // no default: Shape is sealed`,
    },
    chapter: 'sealed-types-and-pattern-matching',
  },
  {
    id: 'switch-expression',
    topic: 'modern',
    difficulty: 'basic',
    question: "How is a switch expression different from a switch statement?",
    answer:
      "A switch expression (Java 14) produces a value, uses `->` arrows with no fall-through, allows several labels per case, uses `yield` inside block cases, and must be exhaustive. The old statement form falls through unless you remember `break`.",
    chapter: 'sealed-types-and-pattern-matching',
  },
  {
    id: 'text-blocks',
    topic: 'modern',
    difficulty: 'basic',
    question: "What are text blocks?",
    answer:
      "Multi-line string literals delimited by triple quotes (Java 15). Incidental indentation — determined by the least-indented line, including the closing delimiter — is removed, trailing spaces are stripped, and line endings are normalised. They suit SQL, JSON and templates, often with `.formatted(...)`.",
    chapter: 'var-records-text-blocks',
  },
  {
    id: 'lts-versions',
    topic: 'modern',
    difficulty: 'basic',
    question: "Which Java versions are LTS, and which does Spring Boot 3 need?",
    answer:
      "Long-term-support releases are 8, 11, 17, 21 and 25. Spring Boot 3 requires Java 17 or later; Java 21 adds virtual threads, record patterns and pattern matching for switch, which Boot 3.2+ can use (virtual threads via `spring.threads.virtual.enabled`).",
    chapter: 'modern-java-additions',
  },
  {
    id: 'sequenced-collections',
    topic: 'modern',
    difficulty: 'intermediate',
    question: "What are sequenced collections?",
    answer:
      "Java 21 interfaces — `SequencedCollection`, `SequencedSet`, `SequencedMap` — for collections with a defined encounter order. They add uniform `getFirst`, `getLast`, `addFirst`, `addLast`, `removeFirst`, `removeLast` and `reversed()` to `List`, `Deque`, `LinkedHashSet`, `SortedSet`, `LinkedHashMap` and `SortedMap`.",
    chapter: 'modern-java-additions',
  },
  {
    id: 'modules',
    topic: 'modern',
    difficulty: 'advanced',
    question: "What does the Java module system provide, and do Spring Boot applications use it?",
    answer:
      "Modules (Java 9) declare in `module-info.java` which modules they require and which packages they export. That gives reliable configuration, strong encapsulation (non-exported packages are inaccessible even if public) and smaller runtimes with `jlink`. Most Spring Boot applications still run on the classpath without a module descriptor; what affects everyone is that JDK internals are encapsulated, which is why old libraries may need `--add-opens`.",
    chapter: 'modern-java-additions',
  },
];
