import type { JavaQuestion } from './question-types';

/** Concurrency, the JVM and design patterns. Answers are plain text; `backticks` mark inline code. */
export const questionsConcurrencyJvm: JavaQuestion[] = [
  // ── Concurrency ────────────────────────────────────────────────────────
  {
    id: 'start-vs-run',
    topic: 'concurrency',
    difficulty: 'basic',
    question: "What is the difference between `Thread.start()` and `Thread.run()`?",
    answer:
      "`start()` creates a new thread and runs `run()` on it. Calling `run()` directly just executes the method on the current thread, like any other call — no concurrency at all. Calling `start()` twice throws `IllegalThreadStateException`.",
    chapter: 'threads-and-memory-model',
  },
  {
    id: 'runnable-vs-callable',
    topic: 'concurrency',
    difficulty: 'basic',
    question: "`Runnable` or `Callable`?",
    answer:
      "`Runnable.run()` returns nothing and cannot throw checked exceptions. `Callable.call()` returns a value and may throw checked exceptions. Submitting either to an `ExecutorService` gives a `Future`; for a `Callable` it holds the result.",
    chapter: 'executors-and-completablefuture',
  },
  {
    id: 'thread-states',
    topic: 'concurrency',
    difficulty: 'basic',
    question: "What states can a thread be in?",
    answer:
      "`NEW` (created, not started), `RUNNABLE` (running or ready — including blocking I/O), `BLOCKED` (waiting to enter a `synchronized` block), `WAITING` (in `wait`, `join` or `park` without timeout), `TIMED_WAITING` (`sleep` or a timed wait), and `TERMINATED`.",
    chapter: 'threads-and-memory-model',
  },
  {
    id: 'race-condition',
    topic: 'concurrency',
    difficulty: 'basic',
    question: "What is a race condition? Give an example.",
    answer:
      "A bug where the result depends on the timing of threads accessing shared mutable state. `count++` is read, add, write: two threads can both read 41 and both write 42, losing an increment. Check-then-act is the other shape: `if (!map.containsKey(k)) map.put(k, v)` can put twice. Fix with a lock, an atomic class, or an atomic method such as `merge` or `computeIfAbsent`.",
    chapter: 'threads-and-memory-model',
  },
  {
    id: 'synchronized-vs-volatile',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "What is the difference between `synchronized` and `volatile`?",
    answer:
      "`synchronized` gives mutual exclusion — only one thread at a time runs the block for a given lock — and visibility of changes made under the lock. `volatile` only guarantees visibility: every read sees the latest write. It does not make compound actions atomic, so `volatileCount++` is still a race. Use `volatile` for flags and single-writer values; use locks or atomics for compound updates.",
    chapter: 'threads-and-memory-model',
  },
  {
    id: 'deadlock',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "What is a deadlock, and how do you prevent it?",
    answer:
      "Two or more threads each hold a lock another needs, and all wait forever. Prevent it by acquiring locks in a consistent global order (for example by id), by holding locks briefly and never calling unknown code while holding one, or by using `tryLock` with a timeout. Detect it with a thread dump, which lists deadlocked threads.",
    points: ["What are livelock and starvation?"],
    chapter: 'threads-and-memory-model',
  },
  {
    id: 'wait-vs-sleep',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "What is the difference between `wait()` and `sleep()`?",
    answer:
      "`wait()` is an `Object` method, must be called while holding that object's monitor, releases the lock, and returns after `notify`/`notifyAll`, a timeout, or a spurious wake-up — so always call it in a loop that re-checks the condition. `Thread.sleep()` pauses the current thread for a time and does not release any locks it holds. Both throw `InterruptedException`.",
    chapter: 'threads-and-memory-model',
  },
  {
    id: 'interrupt-handling',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "How should you handle `InterruptedException`?",
    answer:
      "Interruption is a request to stop. Either propagate the exception, or — if you cannot, for example inside a `Runnable` — restore the flag with `Thread.currentThread().interrupt()` and return. Never swallow it silently: the thrown exception has already cleared the flag, so the code above you would never learn it was asked to stop.",
    chapter: 'threads-and-memory-model',
  },
  {
    id: 'thread-pool-types',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "What kinds of thread pool does `Executors` provide, and what are their risks?",
    answer:
      "`newFixedThreadPool(n)` — n threads, unbounded queue (overload fills memory). `newCachedThreadPool()` — unlimited threads (overload creates thousands). `newSingleThreadExecutor()` — ordered execution. `newScheduledThreadPool(n)` — delayed and periodic tasks. `newWorkStealingPool()` — a ForkJoinPool. `newVirtualThreadPerTaskExecutor()` — one virtual thread per task (Java 21). In production, build a `ThreadPoolExecutor` with a bounded queue, named threads and a rejection policy.",
    points: ["When does a ThreadPoolExecutor create threads beyond the core size? (Only when the queue is full.)"],
    chapter: 'executors-and-completablefuture',
  },
  {
    id: 'pool-sizing',
    topic: 'concurrency',
    difficulty: 'advanced',
    question: "How do you size a thread pool?",
    answer:
      "For CPU-bound work, about the number of cores. For I/O-bound work, roughly cores × (1 + wait time / compute time), which is often large — and for such work virtual threads now usually remove the need to size a pool at all. Always bound queues, measure under realistic load, and remember that downstream resources such as connection pools cap useful concurrency.",
    chapter: 'executors-and-completablefuture',
  },
  {
    id: 'future-vs-completablefuture',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "What does `CompletableFuture` add over `Future`?",
    answer:
      "`Future` can only be polled or blocked on with `get()`. `CompletableFuture` can be completed manually and composed without blocking: `thenApply` (map), `thenCompose` (flatMap), `thenCombine`, `allOf`/`anyOf`, error handling with `exceptionally`/`handle`/`whenComplete`, and timeouts with `orTimeout`/`completeOnTimeout`.",
    chapter: 'executors-and-completablefuture',
  },
  {
    id: 'thenapply-vs-thencompose',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "What is the difference between `thenApply` and `thenCompose`?",
    answer:
      "`thenApply` takes a function returning a plain value (like `map`). `thenCompose` takes a function that itself returns a `CompletableFuture` and flattens it (like `flatMap`) — use it to chain asynchronous calls, otherwise you get `CompletableFuture<CompletableFuture<T>>`.",
    chapter: 'executors-and-completablefuture',
  },
  {
    id: 'completablefuture-pool',
    topic: 'concurrency',
    difficulty: 'advanced',
    question: "Which thread runs a `CompletableFuture` stage?",
    answer:
      "`supplyAsync(task)` without an executor uses the common ForkJoinPool, which is sized for CPU work and shared with parallel streams — pass your own executor for blocking calls. Non-async stages (`thenApply`) run on the thread that completed the previous stage, or on the caller if it was already complete. `...Async` variants hand off to the given executor (or the common pool).",
    chapter: 'executors-and-completablefuture',
  },
  {
    id: 'reentrantlock-vs-synchronized',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "`ReentrantLock` or `synchronized`?",
    answer:
      "Both are reentrant mutual-exclusion locks. `synchronized` is simpler, releases automatically, and is well optimised. `ReentrantLock` adds `tryLock` (with timeout), interruptible waiting, optional fairness and multiple `Condition`s — at the cost of having to `unlock()` in a `finally` block. On Java 21–23, `ReentrantLock` also avoids pinning virtual threads during blocking calls.",
    chapter: 'locks-atomics-concurrent-collections',
  },
  {
    id: 'atomic-cas',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "How do atomic classes work? When is `LongAdder` better than `AtomicLong`?",
    answer:
      "They use compare-and-set: read the value, compute the new one, and write it only if the value is unchanged, retrying otherwise — no locks. `LongAdder` spreads updates across several internal cells, so under heavy write contention it scales better than a single `AtomicLong`; its `sum()` is not an atomic snapshot, which is fine for counters and metrics.",
    chapter: 'locks-atomics-concurrent-collections',
  },
  {
    id: 'concurrenthashmap-atomic',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "Is this code thread-safe with a `ConcurrentHashMap`: `if (!map.containsKey(k)) map.put(k, v);`?",
    answer:
      "No. Each call is thread-safe, but the check and the put are two operations, so two threads can both pass the check. Use the atomic methods: `putIfAbsent`, `computeIfAbsent`, `compute` or `merge` (for counters, `map.merge(word, 1, Integer::sum)`).",
    chapter: 'locks-atomics-concurrent-collections',
  },
  {
    id: 'copyonwrite',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "When would you use `CopyOnWriteArrayList`?",
    answer:
      "When a list is read and iterated far more often than it is changed — listener lists are the classic case. Every write copies the whole array, so iteration needs no locking and never throws `ConcurrentModificationException`, but writes are expensive.",
    chapter: 'locks-atomics-concurrent-collections',
  },
  {
    id: 'latch-semaphore',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "What are `CountDownLatch` and `Semaphore` used for?",
    answer:
      "`CountDownLatch` lets threads wait until N events have happened (`countDown` N times, then `await` returns); it is one-shot. `Semaphore` limits how many threads use a resource at once: `acquire` a permit, `release` it in `finally`. `CyclicBarrier` makes N threads wait for each other at a common point. `CompletableFuture.allOf` replaces many latch uses today.",
    chapter: 'locks-atomics-concurrent-collections',
  },
  {
    id: 'blocking-queue',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "How would you implement producer–consumer in Java?",
    answer:
      "With a bounded `BlockingQueue` such as `ArrayBlockingQueue`. Producers call `put`, which waits while the queue is full (back-pressure); consumers call `take`, which waits while it is empty. No explicit `wait`/`notify` is needed. Stop consumers by interrupting them or by sending a poison-pill element.",
    chapter: 'locks-atomics-concurrent-collections',
  },
  {
    id: 'virtual-threads',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "What are virtual threads, and when do they help?",
    answer:
      "Lightweight threads managed by the JVM (Java 21) and scheduled onto a small pool of carrier platform threads. When a virtual thread blocks on I/O it unmounts and frees its carrier, so you can run millions of them with ordinary blocking code. They help I/O-bound, high-concurrency work such as web requests calling databases and services; they do not speed up CPU-bound work. Create one per task and never pool them. Spring Boot 3.2+ enables them with `spring.threads.virtual.enabled=true`.",
    points: ["What is pinning?", "How do you limit concurrency against a database when threads are unlimited?"],
    chapter: 'virtual-threads',
  },
  {
    id: 'pinning',
    topic: 'concurrency',
    difficulty: 'advanced',
    question: "What is virtual-thread pinning?",
    answer:
      "A pinned virtual thread cannot unmount while blocked, so it also blocks its carrier thread. It happens during native calls, and on Java 21–23 when blocking inside `synchronized` (fixed for `synchronized` in Java 24 by JEP 491). With few carriers, a few pinned threads can stall the application. On 21, use `ReentrantLock` around blocking calls on hot paths and detect pinning with `-Djdk.tracePinnedThreads` or JFR.",
    chapter: 'virtual-threads',
  },
  {
    id: 'threadlocal',
    topic: 'concurrency',
    difficulty: 'intermediate',
    question: "What is `ThreadLocal`, and what is its main pitfall?",
    answer:
      "It gives each thread its own copy of a value — Spring uses it for the current transaction, security context and request attributes. On pooled threads, a value that is not removed leaks into the next task that runs on the same thread (and can leak memory), so always `remove()` in a `finally` block. With virtual threads there can be millions of copies; scoped values are the newer alternative.",
    chapter: 'threads-and-memory-model',
  },

  // ── JVM and design patterns ────────────────────────────────────────────
  {
    id: 'jdk-jre-jvm',
    topic: 'jvm',
    difficulty: 'basic',
    question: "What is the difference between the JDK, JRE and JVM?",
    answer:
      "The JVM is the virtual machine that loads and runs bytecode. The JRE was the JVM plus the standard libraries needed to run programs. The JDK is the JRE plus development tools such as `javac`, `jar` and `jcmd`. Since Java 11 there is no separate JRE download; you use a JDK or build a trimmed runtime with `jlink`.",
    chapter: 'jvm-internals',
  },
  {
    id: 'memory-areas',
    topic: 'jvm',
    difficulty: 'intermediate',
    question: "Describe the JVM's memory areas.",
    answer:
      "Shared: the heap (all objects, split into young and old generations), metaspace (class metadata in native memory, which replaced PermGen in Java 8) and the code cache (JIT-compiled code). Per thread: the Java stack of frames (local variables and operands), the program counter and the native stack. `OutOfMemoryError` can come from the heap, metaspace or direct memory; `StackOverflowError` from a thread stack.",
    chapter: 'jvm-internals',
  },
  {
    id: 'stack-vs-heap',
    topic: 'jvm',
    difficulty: 'basic',
    question: "What lives on the stack and what lives on the heap?",
    answer:
      "Each thread's stack holds method frames: local variables (primitives and references) and intermediate values; it is freed automatically when the method returns. Every object and array lives on the heap, shared by all threads and reclaimed by the garbage collector. A local variable referring to an object is on the stack; the object is on the heap.",
    chapter: 'jvm-internals',
  },
  {
    id: 'class-loaders',
    topic: 'jvm',
    difficulty: 'intermediate',
    question: "How does class loading work?",
    answer:
      "Classes are loaded lazily in three phases: loading (find the bytes and create the `Class`), linking (verify, prepare static fields, resolve references) and initialisation (run static initialisers). Loaders form a hierarchy — bootstrap, platform, application — and delegate to their parent first, so core classes cannot be replaced. A class's identity includes its loader, which explains `ClassCastException: Foo cannot be cast to Foo`.",
    points: ["`ClassNotFoundException` versus `NoClassDefFoundError`?"],
    chapter: 'jvm-internals',
  },
  {
    id: 'garbage-collection',
    topic: 'jvm',
    difficulty: 'intermediate',
    question: "How does garbage collection work, and what is the generational hypothesis?",
    answer:
      "The GC reclaims objects not reachable from GC roots (thread stacks, static fields, JNI references); cycles are collected too. Most objects die young, so the heap has a young generation (Eden and survivor spaces) collected often and cheaply by copying live objects, and an old generation for long-lived objects collected less often. G1 is the default collector; ZGC offers sub-millisecond pauses; Parallel maximises throughput.",
    chapter: 'jvm-internals',
  },
  {
    id: 'memory-leak-java',
    topic: 'jvm',
    difficulty: 'intermediate',
    question: "Can Java have memory leaks? How do you find one?",
    answer:
      "Yes: objects that are no longer needed but are still referenced — unbounded static caches, listeners never removed, `ThreadLocal` values on pooled threads, inner classes holding their outer object, class-loader leaks on redeploy. Watch heap usage after GC over time; if it keeps rising, take heap dumps (`jcmd <pid> GC.heap_dump`) and compare them in Eclipse MAT, looking at the dominator tree and retained sizes.",
    chapter: 'jvm-internals',
  },
  {
    id: 'jit',
    topic: 'jvm',
    difficulty: 'advanced',
    question: "What does the JIT compiler do?",
    answer:
      "The JVM first interprets bytecode and profiles it. Hot methods are compiled to native code — quickly by C1, then with aggressive optimisation by C2 (inlining, escape analysis, speculative optimisations based on observed types). If an assumption breaks, the code is deoptimised and recompiled. This is why JVMs need warm-up and why benchmarks need JMH.",
    chapter: 'jvm-internals',
  },
  {
    id: 'jvm-container-flags',
    topic: 'jvm',
    difficulty: 'advanced',
    question: "How should you configure the JVM in a container?",
    answer:
      "Modern JVMs read cgroup limits, so size the heap as a percentage (`-XX:MaxRAMPercentage=75`) rather than a fixed `-Xmx`, leaving headroom for metaspace, thread stacks, the code cache and direct buffers. Add `-XX:+HeapDumpOnOutOfMemoryError` with a dump path, consider `-XX:+ExitOnOutOfMemoryError` so the orchestrator restarts the instance, and enable GC logging.",
    chapter: 'jvm-internals',
  },
  {
    id: 'singleton-pattern',
    topic: 'jvm',
    difficulty: 'intermediate',
    question: "How do you write a thread-safe singleton, and should you?",
    answer:
      "The simplest correct forms are an `enum` with one constant, or the initialization-on-demand holder idiom (a private static nested class holding the instance, which the JVM initialises lazily and safely). Double-checked locking needs a `volatile` field. In Spring applications, prefer letting the container manage a singleton-scoped bean and injecting it — hand-written singletons are global state that is hard to test.",
    chapter: 'design-patterns',
  },
  {
    id: 'patterns-in-spring',
    topic: 'jvm',
    difficulty: 'intermediate',
    question: "Which design patterns does Spring use?",
    answer:
      "Singleton (default bean scope), factory (`BeanFactory`, `@Bean` methods, `FactoryBean`), proxy (`@Transactional`, `@Async`, `@Cacheable`, security), template method (`JdbcTemplate`, `RestTemplate`), observer (`ApplicationEvent` and `@EventListener`), strategy (injected interfaces such as `PasswordEncoder`), decorator and chain of responsibility (filters and interceptors), adapter (`HandlerAdapter`) and builder (`RestClient.builder()`).",
    chapter: 'design-patterns',
  },
  {
    id: 'proxy-self-invocation',
    topic: 'jvm',
    difficulty: 'advanced',
    question: "Why does `@Transactional` not work when a method calls another method in the same class?",
    answer:
      "Spring implements `@Transactional` with a proxy that wraps the bean. External calls go through the proxy, which starts and commits the transaction. A call from one method to another inside the bean uses `this`, which is the real object, so it bypasses the proxy and its advice. Fix it by moving the method to another bean, injecting the bean's own proxy, or using `TransactionTemplate`.",
    chapter: 'design-patterns',
  },
  {
    id: 'strategy-vs-template',
    topic: 'jvm',
    difficulty: 'intermediate',
    question: "What is the difference between the strategy and template method patterns?",
    answer:
      "Template method uses inheritance: a base class fixes the algorithm's steps in a final method and subclasses fill in some steps. Strategy uses composition: the varying algorithm is a separate object behind an interface, chosen and injected at run time. Strategy is more flexible and is what dependency injection gives you; `JdbcTemplate` blends the two by taking callbacks instead of requiring subclasses.",
    chapter: 'design-patterns',
  },
  {
    id: 'builder-pattern',
    topic: 'jvm',
    difficulty: 'basic',
    question: "When would you use the builder pattern?",
    answer:
      "When an object has many parameters, especially optional ones. A builder avoids telescoping constructors, makes each argument named at the call site, validates once in `build()`, and lets the final object be immutable. Examples: `HttpRequest.newBuilder()`, `RestClient.builder()`, Lombok's `@Builder`.",
    chapter: 'design-patterns',
  },
];
