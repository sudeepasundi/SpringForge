import type { JavaQuestion } from './question-types';

/** OOP and Java 8. Answers are plain text; `backticks` mark inline code. */
export const questionsOopJava8: JavaQuestion[] = [
  // ── OOP ────────────────────────────────────────────────────────────────
  {
    id: 'four-pillars',
    topic: 'oop',
    difficulty: 'basic',
    question: "What are the four pillars of object-oriented programming?",
    answer:
      "Encapsulation: an object keeps its state private and exposes behaviour, so it can protect its invariants. Abstraction: callers depend on what something does, not how — interfaces and abstract classes. Inheritance: a subclass reuses and specialises a parent (is-a). Polymorphism: code written against a supertype runs each subtype's own behaviour, chosen at run time.\n\nA good answer ties them together: encapsulation and abstraction reduce what callers depend on; polymorphism is what lets you swap implementations; inheritance is one (often overused) way to get it.",
    points: [
      "Why is composition usually preferred to inheritance?",
      "Give an example of polymorphism in Spring (proxies behind an interface).",
    ],
    chapter: 'classes-and-objects',
  },
  {
    id: 'pass-by-value',
    topic: 'oop',
    difficulty: 'basic',
    question: "Is Java pass-by-value or pass-by-reference?",
    answer:
      "Always pass-by-value. For objects, the value passed is a copy of the reference. A method can change the object the reference points to (`list.add(x)` is visible to the caller), but reassigning the parameter (`list = new ArrayList<>()`) only changes the method's local copy.",
    code: {
      lang: 'java',
      code: `void reset(List<String> list) {
    list.clear();               // caller sees this
    list = new ArrayList<>();   // caller does not
}`,
    },
    chapter: 'classes-and-objects',
  },
  {
    id: 'overloading-vs-overriding',
    topic: 'oop',
    difficulty: 'basic',
    question: "What is the difference between overloading and overriding?",
    answer:
      "Overloading: same method name, different parameter lists, resolved at compile time from the static types of the arguments. Overriding: a subclass redefines an inherited method with the same signature, resolved at run time from the object's actual class (dynamic dispatch).\n\nOverrides may return a subtype (covariant return), may widen access, and may not throw new or broader checked exceptions. Static and private methods cannot be overridden.",
    points: [
      "Which overload does `print(null)` pick when there are `print(Object)` and `print(String)`? (The most specific: `String`.)",
      "Why should you always write `@Override`?",
    ],
    chapter: 'polymorphism',
  },
  {
    id: 'static-method-override',
    topic: 'oop',
    difficulty: 'intermediate',
    question: "Can you override a static method? A private one?",
    answer:
      "No to both. A static method with the same signature in a subclass hides the parent's; which one runs depends on the declared type, not the object. Private methods are not inherited, so a same-named method in a subclass is simply a new method. Fields are not polymorphic either — they are also hidden.",
    chapter: 'polymorphism',
  },
  {
    id: 'abstract-vs-interface',
    topic: 'oop',
    difficulty: 'basic',
    question: "Abstract class or interface — what is the difference and when do you use each?",
    answer:
      "An abstract class can have state, constructors and methods with any access modifier; a class can extend only one. An interface has no instance state, a class can implement many, and since Java 8/9 it can have default, static and private methods.\n\nUse an interface for a capability or contract that unrelated types can share, and depend on interfaces. Add an abstract class when several implementations share real code — often as a base class behind the interface, like `AbstractList` behind `List`.",
    points: ["What changed for interfaces in Java 8 and 9?", "How is the diamond problem resolved for default methods?"],
    chapter: 'abstract-classes-and-interfaces',
  },
  {
    id: 'diamond-problem',
    topic: 'oop',
    difficulty: 'intermediate',
    question: "How does Java handle the diamond problem with default methods?",
    answer:
      "If a class inherits the same default method from two unrelated interfaces, it must override it or the code does not compile. Inside the override it can pick one with `InterfaceName.super.method()`. Two rules apply first: a method from the class hierarchy beats any interface default, and a more specific interface (a sub-interface) beats a more general one.",
    code: {
      lang: 'java',
      code: `class Duck implements Walker, Swimmer {
    @Override public String move() {
        return Walker.super.move() + " and " + Swimmer.super.move();
    }
}`,
    },
    chapter: 'abstract-classes-and-interfaces',
  },
  {
    id: 'equals-hashcode-contract',
    topic: 'oop',
    difficulty: 'basic',
    question: "What is the contract between `equals` and `hashCode`?",
    answer:
      "If two objects are equal according to `equals`, they must return the same `hashCode`. The reverse is not required — unequal objects may collide. `equals` must also be reflexive, symmetric, transitive, consistent, and return false for null.\n\nBreaking it silently breaks hash-based collections: override `equals` without `hashCode` and `set.contains(equalObject)` usually returns false, because the lookup goes to the wrong bucket.",
    points: [
      "What happens if you mutate a field used in `hashCode` while the object is in a `HashSet`?",
      "Why is `equals(Money other)` a bug? (It overloads instead of overriding `equals(Object)`.)",
    ],
    chapter: 'equals-hashcode-comparable',
  },
  {
    id: 'comparable-vs-comparator',
    topic: 'oop',
    difficulty: 'basic',
    question: "What is the difference between `Comparable` and `Comparator`?",
    answer:
      "`Comparable` is implemented by the class itself and defines its single natural order (`compareTo`). `Comparator` is a separate object defining any order you like, and can be composed: `comparing(Person::lastName).thenComparing(Person::firstName).reversed()`.\n\nKeep `compareTo` consistent with `equals`, and never compare by subtraction — it overflows. Use `Integer.compare`.",
    chapter: 'equals-hashcode-comparable',
  },
  {
    id: 'immutable-class',
    topic: 'oop',
    difficulty: 'intermediate',
    question: "How do you make a class immutable?",
    answer:
      "Make the class `final` (or its constructors private); make every field `private final`; provide no setters; have operations return new instances; and defensively copy any mutable input in the constructor and never expose mutable internals (return `List.copyOf` or an unmodifiable view).\n\nImmutable objects are thread-safe, safe to share and cache, and safe as map keys. Records give you most of this, but a record holding a `List` still needs a defensive copy in its compact constructor.",
    points: ["Is a `final` field holding an `ArrayList` immutable? (No — the list can still change.)"],
    chapter: 'encapsulation-and-immutability',
  },
  {
    id: 'composition-over-inheritance',
    topic: 'oop',
    difficulty: 'intermediate',
    question: "Why prefer composition over inheritance?",
    answer:
      "Inheritance couples a subclass to its parent's implementation, exposes the parent's whole API, and allows only one parent. Changes inside the parent can break subclasses (the fragile base class problem — for example counting additions in a `HashSet` subclass double-counts because `addAll` calls `add`).\n\nComposition holds a collaborator and delegates to its public contract: parts can be swapped (including in tests), you expose only what you choose, and a class can compose many collaborators. Use inheritance only for true is-a relationships with classes designed for it.",
    chapter: 'composition-and-solid',
  },
  {
    id: 'solid',
    topic: 'oop',
    difficulty: 'intermediate',
    question: "Explain the SOLID principles with an example each.",
    answer:
      "Single responsibility: one reason to change — separate pricing, PDF rendering and persistence. Open/closed: add behaviour by adding code — a list of rule objects instead of a growing if/else. Liskov substitution: subtypes must honour the parent's contract — a mutable Square extending Rectangle breaks it. Interface segregation: small focused interfaces — `Printer` and `Scanner` rather than one `Machine` with methods that throw. Dependency inversion: depend on abstractions and have them handed in — `CheckoutService` takes a `PaymentGateway` interface, which is exactly what Spring's constructor injection provides.",
    chapter: 'composition-and-solid',
  },
  {
    id: 'static-vs-inner-class',
    topic: 'oop',
    difficulty: 'intermediate',
    question: "What is the difference between a static nested class and an inner class?",
    answer:
      "A static nested class is an ordinary class grouped inside another; it has no reference to an outer instance. An inner (non-static) class is always tied to an instance of the outer class and can read its fields — it holds a hidden reference to it.\n\nThat hidden reference can cause memory leaks if the inner object outlives the outer one, so make nested classes static unless they need the outer instance. Nested records, enums and interfaces are always static.",
    chapter: 'nested-classes-and-enums',
  },
  {
    id: 'enum-features',
    topic: 'oop',
    difficulty: 'basic',
    question: "What can a Java enum do beyond listing constants?",
    answer:
      "Enums are full classes with a fixed set of instances. They can have fields, constructors (always private), methods, implement interfaces, and give each constant its own method body (constant-specific methods). They work in `switch`, compare safely with `==`, and are the simplest correct singleton.\n\nUse `EnumSet` and `EnumMap` for enum keys, and persist `name()` rather than `ordinal()`.",
    chapter: 'nested-classes-and-enums',
  },
  {
    id: 'constructor-overridable-call',
    topic: 'oop',
    difficulty: 'advanced',
    question: "Why should a constructor not call an overridable method?",
    answer:
      "Construction runs parent first. If the parent constructor calls a method the child overrides, the child's version runs before the child's own fields are initialised, so it sees `null`s and zeros. Keep constructors to field assignment, or call only `private` or `final` methods.",
    chapter: 'classes-and-objects',
  },
  {
    id: 'initialisation-order',
    topic: 'oop',
    difficulty: 'intermediate',
    question: "In what order is an object initialised?",
    answer:
      "Once per class, on first use: static fields and static blocks, in source order, parent class first. Then per object: memory is allocated with default values; the constructor chain runs up to `Object`; then, from the top class down, each class's instance field initialisers and instance blocks run in source order, followed by the rest of its constructor body.",
    chapter: 'classes-and-objects',
  },

  // ── Java 8 ─────────────────────────────────────────────────────────────
  {
    id: 'functional-interface',
    topic: 'java8',
    difficulty: 'basic',
    question: "What is a functional interface?",
    answer:
      "An interface with exactly one abstract method, which lets a lambda or method reference implement it. Default and static methods do not count. `@FunctionalInterface` makes the compiler enforce the rule. Examples: `Runnable`, `Comparator`, `Callable`, and the `java.util.function` family — `Function`, `Predicate`, `Supplier`, `Consumer`, `BiFunction`, `UnaryOperator`, `BinaryOperator`.",
    chapter: 'lambdas-and-functional-interfaces',
  },
  {
    id: 'effectively-final',
    topic: 'java8',
    difficulty: 'intermediate',
    question: "Why must local variables used in a lambda be effectively final?",
    answer:
      "A lambda captures a copy of the local variable's value, and it may run later or on another thread. If the variable could still change, the copy and the original would diverge and any update would be a data race. So Java only allows capturing variables that are never reassigned. Fields and array elements can be modified — which is exactly why doing so from lambdas often causes concurrency bugs.",
    chapter: 'lambdas-and-functional-interfaces',
  },
  {
    id: 'lambda-vs-anonymous',
    topic: 'java8',
    difficulty: 'intermediate',
    question: "How does a lambda differ from an anonymous class?",
    answer:
      "Inside a lambda, `this` is the enclosing object; inside an anonymous class it is the anonymous object. A lambda can implement only a functional interface and cannot have fields; an anonymous class can implement any interface or extend an abstract class. Lambdas compile to `invokedynamic` without a separate class file, and cannot shadow local variables.",
    chapter: 'lambdas-and-functional-interfaces',
  },
  {
    id: 'method-reference-kinds',
    topic: 'java8',
    difficulty: 'basic',
    question: "What are the four kinds of method reference?",
    answer:
      "Static (`Integer::parseInt`), bound instance (`System.out::println` — a specific object), unbound instance (`String::toUpperCase` — the first argument becomes the receiver) and constructor (`ArrayList::new`, also `String[]::new`).",
    chapter: 'method-references',
  },
  {
    id: 'intermediate-vs-terminal',
    topic: 'java8',
    difficulty: 'basic',
    question: "What is the difference between intermediate and terminal stream operations?",
    answer:
      "Intermediate operations (`filter`, `map`, `flatMap`, `sorted`, `distinct`, `limit`) return a new stream and are lazy — they only describe work. A terminal operation (`collect`, `toList`, `forEach`, `reduce`, `count`, `findFirst`, `anyMatch`) triggers the pipeline and produces a result. Without a terminal operation nothing runs, and a stream can be consumed only once.",
    points: ["What does laziness allow? (Short-circuiting and infinite streams.)"],
    chapter: 'streams-pipeline',
  },
  {
    id: 'map-vs-flatmap',
    topic: 'java8',
    difficulty: 'basic',
    question: "What is the difference between `map` and `flatMap`?",
    answer:
      "`map` transforms each element into exactly one element. `flatMap` transforms each element into a stream and flattens those streams into one — one-to-many. Use `flatMap` for nested collections (`orders.flatMap(o -> o.lines().stream())`) or to drop empty Optionals (`flatMap(Optional::stream)`). On `Optional` itself, `flatMap` is for functions that already return an `Optional`.",
    chapter: 'streams-pipeline',
  },
  {
    id: 'stream-laziness',
    topic: 'java8',
    difficulty: 'intermediate',
    question: "How do elements flow through a stream pipeline?",
    answer:
      "One at a time, vertically: each element passes through every stage before the next element starts, rather than each stage processing the whole collection. That is what lets `findFirst` or `limit` stop early — later elements are never touched. Stateful operations like `sorted` are the exception: they must see all elements before passing any on.",
    chapter: 'streams-pipeline',
  },
  {
    id: 'tomap-duplicate',
    topic: 'java8',
    difficulty: 'intermediate',
    question: "What goes wrong with `Collectors.toMap`, and how do you fix it?",
    answer:
      "The two-argument form throws `IllegalStateException` on a duplicate key, and any form throws `NullPointerException` on a null value. Pass a merge function as the third argument to say how to combine values, and a map supplier as the fourth when you need a particular map type or ordering.",
    code: {
      lang: 'java',
      code: `Map<String, Money> byPayee = expenses.stream()
        .collect(toMap(Expense::payee, Expense::amount, Money::plus, TreeMap::new));`,
    },
    chapter: 'streams-collectors',
  },
  {
    id: 'groupingby-vs-partitioningby',
    topic: 'java8',
    difficulty: 'intermediate',
    question: "What is the difference between `groupingBy` and `partitioningBy`?",
    answer:
      "`groupingBy` groups by any key and only contains keys that occurred. `partitioningBy` takes a predicate, always produces a `Map<Boolean, …>`, and always contains both `true` and `false`, even if one side is empty. Both accept a downstream collector such as `counting()`, `mapping(...)` or `summingInt(...)`.",
    chapter: 'streams-collectors',
  },
  {
    id: 'parallel-streams',
    topic: 'java8',
    difficulty: 'advanced',
    question: "When should you use parallel streams?",
    answer:
      "Rarely, and only after measuring. They help for large, CPU-heavy, stateless work over sources that split well (`ArrayList`, arrays, ranges). They hurt for small inputs, blocking I/O, `LinkedList` or `iterate` sources, and ordered operations like `limit` and `findFirst`.\n\nAll parallel streams share the common ForkJoinPool, so in a web server one slow parallel stream can starve others — and requests are already running in parallel.",
    points: ["What must be true of a `reduce` operation to be safe in parallel? (Identity really neutral; operation associative.)"],
    chapter: 'streams-pitfalls-and-parallel',
  },
  {
    id: 'stream-side-effects',
    topic: 'java8',
    difficulty: 'intermediate',
    question: "Why is `forEach(list::add)` inside a stream a bad idea?",
    answer:
      "It builds the result through a side effect on shared state. It works sequentially but corrupts the list in parallel, and it hides intent. Let the terminal operation build the result (`toList()`, `collect(...)`). Use `forEach` only for genuine end-of-pipeline side effects like printing or sending.",
    chapter: 'streams-pitfalls-and-parallel',
  },
  {
    id: 'orelse-vs-orelseget',
    topic: 'java8',
    difficulty: 'intermediate',
    question: "What is the difference between `Optional.orElse` and `orElseGet`?",
    answer:
      "`orElse(value)` always evaluates its argument, even when the Optional has a value. `orElseGet(supplier)` calls the supplier only when the Optional is empty. So `cache.find(id).orElse(db.load(id))` hits the database every time; use `orElseGet(() -> db.load(id))`. `orElse` is fine for constants.",
    chapter: 'optional',
  },
  {
    id: 'optional-misuse',
    topic: 'java8',
    difficulty: 'intermediate',
    question: "Where should `Optional` not be used?",
    answer:
      "As a field (not serializable, adds allocation), as a method parameter (callers must wrap and it can still be null), for collections (return an empty collection), or wrapping a collection. Never return `null` from a method declared to return `Optional`. Avoid `get()` — use `orElseThrow()`. Use `OptionalInt` and friends for primitives.",
    chapter: 'optional',
  },
  {
    id: 'default-methods-why',
    topic: 'java8',
    difficulty: 'basic',
    question: "Why were default methods added in Java 8?",
    answer:
      "To let interfaces evolve without breaking existing implementations. Java 8 needed to add `stream()`, `forEach` and `removeIf` to `Collection`; without default methods, every collection class ever written would have stopped compiling. They also enable small composable APIs like `Comparator.reversed()` and `Predicate.and()`.",
    chapter: 'default-methods-and-date-time',
  },
  {
    id: 'java-time-types',
    topic: 'java8',
    difficulty: 'basic',
    question: "Which `java.time` type should you use for timestamps, birthdays and meeting times?",
    answer:
      "Timestamps: `Instant` (a point on the UTC timeline) — store and transmit these. Birthdays and due dates: `LocalDate` (no time, no zone). A meeting in a user's city: `ZonedDateTime` with a region `ZoneId`, so daylight-saving changes are handled. `LocalDateTime` is rarely right because it is not a moment in time. All `java.time` types are immutable and thread-safe.",
    points: ["What is the difference between `Duration` and `Period`?", "Why inject a `Clock`?"],
    chapter: 'default-methods-and-date-time',
  },
  {
    id: 'java8-features',
    topic: 'java8',
    difficulty: 'basic',
    question: "What were the main features of Java 8?",
    answer:
      "Lambdas and method references; the Streams API; `Optional`; default and static interface methods; the `java.time` API; `CompletableFuture`; new `Map` methods (`merge`, `compute`, `computeIfAbsent`, `getOrDefault`); `String.join`; `Base64`; and metaspace replacing PermGen.",
    chapter: 'default-methods-and-date-time',
  },
];
