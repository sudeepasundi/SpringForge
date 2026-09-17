import type { DemoFile } from '@/lib/types';

const CORE = 'tally-core/src/main/java/dev/springforge/tally';

/**
 * The domain and reports: plain Java 21 with no framework. Each file is the
 * natural home of one or two language ideas the Java chapters explain.
 */
export const tallyCoreFiles: DemoFile[] = [
  {
    path: 'tally-core/pom.xml',
    lang: 'xml',
    note: 'No Spring: the JDK plus JUnit and AssertJ for tests.',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>dev.springforge</groupId>
  <artifactId>tally-core</artifactId>
  <version>1.0.0</version>
  <name>Tally core</name>
  <description>Accounts, transactions and reports. Plain Java 21.</description>

  <properties>
    <!-- release, not source/target: also checks you only use Java 21 APIs -->
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.junit</groupId>
        <artifactId>junit-bom</artifactId>
        <version>5.11.4</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.assertj</groupId>
      <artifactId>assertj-core</artifactId>
      <version>3.27.3</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.5.2</version>
      </plugin>
    </plugins>
  </build>
</project>`,
  },
  {
    path: `${CORE}/money/Money.java`,
    lang: 'java',
    note: 'An immutable value object with hand-written equals, hashCode and compareTo.',
    code: `package dev.springforge.tally.money;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Objects;

/**
 * An amount in one currency. Immutable: every operation returns a new Money.
 *
 * A class rather than a record, to show the contracts by hand. A record would
 * compare its BigDecimal with BigDecimal.equals, where 10 and 10.00 differ.
 */
public final class Money implements Comparable<Money> {

    private final BigDecimal amount;
    private final Currency currency;

    private Money(BigDecimal amount, Currency currency) {
        // Fix the scale once, so equal amounts always have equal representations.
        this.amount = amount.setScale(currency.getDefaultFractionDigits(), RoundingMode.HALF_EVEN);
        this.currency = currency;
    }

    public static Money of(String amount, String currencyCode) {
        return of(new BigDecimal(amount), Currency.getInstance(currencyCode));
    }

    public static Money of(BigDecimal amount, Currency currency) {
        Objects.requireNonNull(amount, "amount");
        Objects.requireNonNull(currency, "currency");
        return new Money(amount, currency);
    }

    public static Money zero(Currency currency) {
        return new Money(BigDecimal.ZERO, currency);
    }

    public BigDecimal amount() {
        return amount;          // BigDecimal is immutable too, so no copy is needed
    }

    public Currency currency() {
        return currency;
    }

    public Money plus(Money other) {
        requireSameCurrency(other);
        return new Money(amount.add(other.amount), currency);
    }

    public Money minus(Money other) {
        requireSameCurrency(other);
        return new Money(amount.subtract(other.amount), currency);
    }

    public Money times(BigDecimal factor) {
        return new Money(amount.multiply(factor), currency);
    }

    public Money negate() {
        return new Money(amount.negate(), currency);
    }

    public boolean isNegative() {
        return amount.signum() < 0;
    }

    public boolean isGreaterThan(Money other) {
        return compareTo(other) > 0;
    }

    private void requireSameCurrency(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("Cannot combine " + currency + " and " + other.currency);
        }
    }

    // Consistent with equals: 0 exactly when equals is true, because the
    // constructor fixed the scale. TreeSet and HashSet therefore agree.
    @Override
    public int compareTo(Money other) {
        requireSameCurrency(other);
        return amount.compareTo(other.amount);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money other)) return false;   // the class is final: no subclass surprises
        return amount.equals(other.amount) && currency.equals(other.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);          // the same fields as equals
    }

    @Override
    public String toString() {
        return currency.getCurrencyCode() + " " + amount.toPlainString();
    }
}`,
  },
  {
    path: `${CORE}/account/Account.java`,
    lang: 'java',
    note: 'An abstract base class: shared state and rules, one abstract hook.',
    code: `package dev.springforge.tally.account;

import dev.springforge.tally.error.InsufficientFundsException;
import dev.springforge.tally.money.Money;
import dev.springforge.tally.repo.Identifiable;

import java.util.Currency;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicLong;

/**
 * The base of every account. It owns the balance and the rules that are the
 * same everywhere; subclasses decide only what differs.
 */
public abstract class Account implements Identifiable<Long> {

    // static: one counter for the class, shared by every instance.
    private static final AtomicLong NEXT_ID = new AtomicLong(1);

    private final long id;              // final: assigned exactly once, in the constructor
    private final String name;
    private final Currency currency;
    private Money balance;              // private: changed only by deposit and withdraw

    protected Account(String name, Currency currency) {
        this(name, Money.zero(currency));               // delegate to the other constructor
    }

    protected Account(String name, Money opening) {
        this.id = NEXT_ID.getAndIncrement();
        this.name = Objects.requireNonNull(name, "name");
        this.currency = opening.currency();
        this.balance = opening;
    }

    @Override
    public Long id() {
        return id;                      // autoboxed to Long
    }

    public String name() {
        return name;
    }

    public Currency currency() {
        return currency;
    }

    public Money balance() {
        return balance;                 // Money is immutable, so returning it is safe
    }

    public final void deposit(Money amount) {
        requirePositive(amount);
        balance = balance.plus(amount);
    }

    /**
     * A template method: the steps are fixed here, and final so no subclass
     * can skip the checks. The rule that varies is the abstract hook below.
     */
    public final void withdraw(Money amount) {
        requirePositive(amount);
        if (!canWithdraw(amount)) {
            throw new InsufficientFundsException(id, amount, balance);
        }
        balance = balance.minus(amount);
        afterWithdrawal(amount);
    }

    /** Each kind of account answers this differently. */
    protected abstract boolean canWithdraw(Money amount);

    /** An optional hook with an empty default. */
    protected void afterWithdrawal(Money amount) {
    }

    public abstract AccountType type();

    private static void requirePositive(Money amount) {
        if (amount.amount().signum() <= 0) {
            throw new IllegalArgumentException("Amount must be positive: " + amount);
        }
    }

    @Override
    public String toString() {
        return "%s[%d, %s, %s]".formatted(type(), id, name, balance);
    }
}`,
  },
  {
    path: `${CORE}/account/CheckingAccount.java`,
    lang: 'java',
    code: `package dev.springforge.tally.account;

import dev.springforge.tally.money.Money;

/** May go below zero, down to an agreed overdraft limit. */
public class CheckingAccount extends Account {

    private final Money overdraftLimit;

    public CheckingAccount(String name, Money opening, Money overdraftLimit) {
        super(name, opening);                 // the superclass is initialised first
        this.overdraftLimit = overdraftLimit;
    }

    @Override
    protected boolean canWithdraw(Money amount) {
        // balance - amount must not fall below -overdraftLimit
        return !balance().minus(amount).plus(overdraftLimit).isNegative();
    }

    @Override
    public AccountType type() {
        return AccountType.CHECKING;
    }

    public Money overdraftLimit() {
        return overdraftLimit;
    }
}`,
  },
  {
    path: `${CORE}/account/SavingsAccount.java`,
    lang: 'java',
    code: `package dev.springforge.tally.account;

import dev.springforge.tally.money.Money;

import java.math.BigDecimal;
import java.math.MathContext;

/** Never below zero, a few withdrawals a month, and monthly interest. */
public class SavingsAccount extends Account {

    static final int FREE_WITHDRAWALS_PER_MONTH = 3;   // package-private: tests in this package can read it

    private final BigDecimal annualRate;
    private int withdrawalsThisMonth;

    public SavingsAccount(String name, Money opening, BigDecimal annualRate) {
        super(name, opening);
        this.annualRate = annualRate;
    }

    @Override
    protected boolean canWithdraw(Money amount) {
        return withdrawalsThisMonth < FREE_WITHDRAWALS_PER_MONTH
                && !balance().minus(amount).isNegative();
    }

    @Override
    protected void afterWithdrawal(Money amount) {
        withdrawalsThisMonth++;               // the hook the base class calls
    }

    /** Called on the first of each month. */
    public void startNewMonth() {
        withdrawalsThisMonth = 0;
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(12), MathContext.DECIMAL64);
        Money interest = balance().times(monthlyRate);
        if (interest.amount().signum() > 0) {
            deposit(interest);                 // inherited, and final in Account
        }
    }

    @Override
    public AccountType type() {
        return AccountType.SAVINGS;
    }
}`,
  },
  {
    path: `${CORE}/account/AccountType.java`,
    lang: 'java',
    note: 'An enum with fields, a constructor and constant-specific methods — a small factory.',
    code: `package dev.springforge.tally.account;

import dev.springforge.tally.money.Money;

import java.math.BigDecimal;

/**
 * The kinds of account. Each constant has its own label and knows how to
 * open its kind of account: the enum doubles as a factory.
 */
public enum AccountType {

    CHECKING("Checking") {
        @Override
        public Account open(String name, Money opening) {
            Money overdraft = Money.of(new BigDecimal("500"), opening.currency());
            return new CheckingAccount(name, opening, overdraft);
        }
    },

    SAVINGS("Savings") {
        @Override
        public Account open(String name, Money opening) {
            return new SavingsAccount(name, opening, new BigDecimal("0.035"));
        }
    };

    private final String label;

    AccountType(String label) {          // enum constructors are implicitly private
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Abstract, so every constant must implement it. */
    public abstract Account open(String name, Money opening);

    public static AccountType fromLabel(String label) {
        for (AccountType type : values()) {
            if (type.label.equalsIgnoreCase(label)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown account type: " + label);
    }
}`,
  },
  {
    path: `${CORE}/txn/Category.java`,
    lang: 'java',
    code: `package dev.springforge.tally.txn;

import java.util.EnumSet;
import java.util.Set;

/** Spending categories, each belonging to a broader kind. */
public enum Category {
    GROCERIES(Kind.ESSENTIAL),
    RENT(Kind.ESSENTIAL),
    UTILITIES(Kind.ESSENTIAL),
    TRANSPORT(Kind.ESSENTIAL),
    DINING(Kind.LIFESTYLE),
    ENTERTAINMENT(Kind.LIFESTYLE),
    TRAVEL(Kind.LIFESTYLE),
    SALARY(Kind.INCOME),
    OTHER(Kind.LIFESTYLE);

    /** A nested enum. Nested enums, records and interfaces are always static. */
    public enum Kind { ESSENTIAL, LIFESTYLE, INCOME }

    private final Kind kind;

    Category(Kind kind) {
        this.kind = kind;
    }

    public Kind kind() {
        return kind;
    }

    /** EnumSet is a bit vector: the fastest Set there is for enum values. */
    public static Set<Category> ofKind(Kind kind) {
        Set<Category> result = EnumSet.noneOf(Category.class);
        for (Category category : values()) {
            if (category.kind == kind) {
                result.add(category);
            }
        }
        return result;
    }

    public String displayName() {
        String lower = name().toLowerCase();
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}`,
  },
  {
    path: `${CORE}/txn/Transaction.java`,
    lang: 'java',
    note: 'A sealed interface whose permitted subtypes are records.',
    code: `package dev.springforge.tally.txn;

import dev.springforge.tally.money.Money;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Every transaction is exactly one of three kinds. sealed tells the compiler
 * so, which lets a switch over Transaction cover every case without a default.
 */
public sealed interface Transaction
        permits Transaction.Expense, Transaction.Income, Transaction.Transfer {

    long accountId();

    LocalDate date();

    Money amount();

    String description();

    record Expense(long accountId, LocalDate date, Money amount, String description, Category category)
            implements Transaction {

        // A compact constructor: validate and normalise; the fields are assigned afterwards.
        public Expense {
            Objects.requireNonNull(date, "date");
            Objects.requireNonNull(category, "category");
            if (amount.isNegative()) {
                throw new IllegalArgumentException("Expense amounts are positive: " + amount);
            }
            description = description == null ? "" : description.strip();
        }
    }

    record Income(long accountId, LocalDate date, Money amount, String description)
            implements Transaction {
    }

    record Transfer(long accountId, long toAccountId, LocalDate date, Money amount, String description)
            implements Transaction {

        public Transfer {
            if (accountId == toAccountId) {
                throw new IllegalArgumentException("Cannot transfer to the same account");
            }
        }
    }

    /** The effect on the source account's balance. */
    default Money signedAmount() {
        return switch (this) {                 // exhaustive: the interface is sealed
            case Expense e -> e.amount().negate();
            case Income i -> i.amount();
            case Transfer t -> t.amount().negate();
        };
    }

    static TransactionBuilder builder() {
        return new TransactionBuilder();
    }
}`,
  },
  {
    path: `${CORE}/txn/TransactionBuilder.java`,
    lang: 'java',
    note: 'The builder pattern: named, optional arguments and one place that decides the type.',
    code: `package dev.springforge.tally.txn;

import dev.springforge.tally.money.Money;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Builds a Transaction step by step. Each setter returns this, so calls chain;
 * build() validates and picks which record to create.
 */
public final class TransactionBuilder {

    private long accountId;
    private Long toAccountId;               // a wrapper, so "not set" can be null
    private LocalDate date = LocalDate.now();
    private Money amount;
    private String description = "";
    private Category category;
    private boolean income;

    TransactionBuilder() {                  // package-private: callers use Transaction.builder()
    }

    public TransactionBuilder account(long accountId) {
        this.accountId = accountId;
        return this;
    }

    public TransactionBuilder on(LocalDate date) {
        this.date = date;
        return this;
    }

    public TransactionBuilder amount(Money amount) {
        this.amount = amount;
        return this;
    }

    public TransactionBuilder description(String description) {
        this.description = description;
        return this;
    }

    public TransactionBuilder expense(Category category) {
        this.category = category;
        this.income = false;
        return this;
    }

    public TransactionBuilder income() {
        this.income = true;
        return this;
    }

    public TransactionBuilder transferTo(long toAccountId) {
        this.toAccountId = toAccountId;
        return this;
    }

    public Transaction build() {
        Objects.requireNonNull(amount, "amount is required");
        if (toAccountId != null) {
            return new Transaction.Transfer(accountId, toAccountId, date, amount, description);
        }
        if (income) {
            return new Transaction.Income(accountId, date, amount, description);
        }
        return new Transaction.Expense(accountId, date, amount, description,
                category == null ? Category.OTHER : category);
    }
}`,
  },
  {
    path: `${CORE}/categorize/Categorizer.java`,
    lang: 'java',
    note: 'A functional interface with default, static and private methods.',
    code: `package dev.springforge.tally.categorize;

import dev.springforge.tally.txn.Category;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Decides the category of a statement line. It has one abstract method, so it
 * is a functional interface and a lambda can implement it.
 */
@FunctionalInterface
public interface Categorizer {

    Optional<Category> categorize(String description);

    /** A default method: every Categorizer, including every lambda, gets it. */
    default Categorizer orElse(Categorizer fallback) {
        return description -> categorize(description).or(() -> fallback.categorize(description));
    }

    /** Static factory methods live on the interface itself. */
    static Categorizer byKeywords(Category category, String... keywords) {
        Set<String> words = Arrays.stream(keywords)
                .map(Categorizer::normalise)
                .collect(Collectors.toUnmodifiableSet());
        return description -> containsAny(normalise(description), words)
                ? Optional.of(category)
                : Optional.empty();
    }

    static Categorizer always(Category category) {
        return description -> Optional.of(category);
    }

    // Private interface methods (Java 9) share code between the methods above
    // without becoming part of the interface's public API.
    private static String normalise(String text) {
        return text == null ? "" : text.toLowerCase(Locale.ROOT);
    }

    private static boolean containsAny(String text, Set<String> words) {
        return words.stream().anyMatch(text::contains);
    }
}`,
  },
  {
    path: `${CORE}/categorize/Rules.java`,
    lang: 'java',
    note: 'The strategy pattern, composed from small Categorizers.',
    code: `package dev.springforge.tally.categorize;

import dev.springforge.tally.txn.Category;

import java.util.List;
import java.util.Optional;

import static dev.springforge.tally.categorize.Categorizer.byKeywords;

/**
 * Tally's default categorisation strategy: an ordered list of rules where the
 * first match wins. A new rule is a new list entry, not another branch in an
 * ever-growing if/else (the open/closed principle).
 */
public final class Rules implements Categorizer {

    private final List<Categorizer> rules;

    public Rules(List<Categorizer> rules) {
        this.rules = List.copyOf(rules);     // a defensive, unmodifiable copy
    }

    public static Rules defaults() {
        return new Rules(List.of(
                byKeywords(Category.RENT, "rent", "landlord"),
                byKeywords(Category.GROCERIES, "tesco", "aldi", "grocer", "market"),
                byKeywords(Category.TRANSPORT, "uber", "metro", "fuel", "train"),
                byKeywords(Category.DINING, "cafe", "restaurant", "pizza"),
                byKeywords(Category.UTILITIES, "electric", "water", "broadband"),
                byKeywords(Category.SALARY, "salary", "payroll")));
    }

    @Override
    public Optional<Category> categorize(String description) {
        return rules.stream()
                .map(rule -> rule.categorize(description))
                .flatMap(Optional::stream)           // keep only the answers
                .findFirst();                        // short-circuits: later rules never run
    }

    /** Never empty: anything unrecognised is OTHER. */
    public Category categorizeOrOther(String description) {
        return categorize(description).orElse(Category.OTHER);   // a constant, so orElse is fine
    }
}`,
  },
  {
    path: `${CORE}/repo/Identifiable.java`,
    lang: 'java',
    code: `package dev.springforge.tally.repo;

/** Anything with an id. ID is a type parameter: Long, UUID, String... */
public interface Identifiable<ID> {

    ID id();
}`,
  },
  {
    path: `${CORE}/repo/Repository.java`,
    lang: 'java',
    note: 'A generic interface with a bounded type parameter and PECS wildcards.',
    code: `package dev.springforge.tally.repo;

import java.util.Collection;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.function.Predicate;

/**
 * A generic store. T is bounded: only things that have an id of type ID can
 * be stored, so the repository can index them without being told how.
 */
public interface Repository<T extends Identifiable<ID>, ID> {

    T save(T entity);

    Optional<T> findById(ID id);

    List<T> findAll();

    /** The predicate consumes T, so it may accept any supertype: ? super T. */
    List<T> findWhere(Predicate<? super T> condition);

    /** The collection produces T, so it may hold any subtype: ? extends T. */
    void saveAll(Collection<? extends T> entities);

    boolean delete(ID id);

    default T getById(ID id) {
        return findById(id).orElseThrow(() -> new NoSuchElementException("No entity with id " + id));
    }
}`,
  },
  {
    path: `${CORE}/repo/InMemoryRepository.java`,
    lang: 'java',
    code: `package dev.springforge.tally.repo;

import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;

/**
 * A Repository kept in a LinkedHashMap, so findAll returns entities in the
 * order they were first saved. Not thread-safe.
 */
public class InMemoryRepository<T extends Identifiable<ID>, ID> implements Repository<T, ID> {

    private final Map<ID, T> store = new LinkedHashMap<>();

    @Override
    public T save(T entity) {
        store.put(entity.id(), entity);      // ID's hashCode picks the bucket, equals finds the entry
        return entity;
    }

    @Override
    public Optional<T> findById(ID id) {
        return Optional.ofNullable(store.get(id));   // get returns null when the key is absent
    }

    @Override
    public List<T> findAll() {
        return List.copyOf(store.values());  // a snapshot the caller cannot modify
    }

    @Override
    public List<T> findWhere(Predicate<? super T> condition) {
        return store.values().stream().filter(condition).toList();
    }

    @Override
    public void saveAll(Collection<? extends T> entities) {
        for (T entity : entities) {          // each element is at least a T
            save(entity);
        }
    }

    @Override
    public boolean delete(ID id) {
        return store.remove(id) != null;
    }

    /** A generic method with its own type parameter K, bounded to Comparable. */
    public <K extends Comparable<? super K>> Optional<T> maxBy(Function<? super T, ? extends K> key) {
        return store.values().stream().max(Comparator.comparing(key));
    }
}`,
  },
  {
    path: `${CORE}/report/Reports.java`,
    lang: 'java',
    note: 'Stream pipelines, collectors, method references and a pattern-matching switch.',
    code: `package dev.springforge.tally.report;

import dev.springforge.tally.money.Money;
import dev.springforge.tally.txn.Category;
import dev.springforge.tally.txn.Transaction;
import dev.springforge.tally.txn.Transaction.Expense;
import dev.springforge.tally.txn.Transaction.Income;
import dev.springforge.tally.txn.Transaction.Transfer;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Currency;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.partitioningBy;
import static java.util.stream.Collectors.reducing;

/**
 * Read-only reports over a list of transactions. Every method is one stream
 * pipeline: a source, some intermediate operations, one terminal operation.
 */
public final class Reports {

    private static final BigDecimal BIG = new BigDecimal("1000");

    private final List<Transaction> transactions;
    private final Money zero;

    public Reports(List<Transaction> transactions, Currency currency) {
        this.transactions = List.copyOf(transactions);
        this.zero = Money.zero(currency);
    }

    /** Only the expenses, already cast. */
    public List<Expense> expenses() {
        return transactions.stream()
                .filter(Expense.class::isInstance)   // a method reference on a Class object
                .map(Expense.class::cast)
                .toList();                           // Java 16: an unmodifiable list
    }

    /** Total spent in one month. */
    public Money spentIn(YearMonth month) {
        return expenses().stream()
                .filter(e -> YearMonth.from(e.date()).equals(month))
                .map(Expense::amount)                // unbound: calls amount() on each element
                .reduce(zero, Money::plus);          // identity, then accumulate
    }

    public Money averageDailySpend(YearMonth month) {
        BigDecimal perDay = BigDecimal.ONE.divide(BigDecimal.valueOf(month.lengthOfMonth()), MathContext.DECIMAL64);
        return spentIn(month).times(perDay);
    }

    /** Spend per category. groupingBy with a map factory and a downstream collector. */
    public Map<Category, Money> spendByCategory() {
        return expenses().stream()
                .collect(groupingBy(
                        Expense::category,
                        () -> new EnumMap<>(Category.class),
                        reducing(zero, Expense::amount, Money::plus)));
    }

    /** The n biggest categories, largest first. */
    public List<Map.Entry<Category, Money>> topCategories(int n) {
        return spendByCategory().entrySet().stream()
                .sorted(Map.Entry.<Category, Money>comparingByValue().reversed())
                .limit(n)                            // short-circuits after n elements
                .map(Map.Entry::copyOf)              // detach from the map's own entries
                .toList();
    }

    /** Essentials against everything else. partitioningBy always has both keys. */
    public Map<Boolean, Money> essentialVersusLifestyle() {
        return expenses().stream()
                .collect(partitioningBy(
                        e -> e.category().kind() == Category.Kind.ESSENTIAL,
                        reducing(zero, Expense::amount, Money::plus)));
    }

    /** Net movement per month, in month order. */
    public Map<YearMonth, Money> netByMonth() {
        return transactions.stream()
                .collect(groupingBy(
                        t -> YearMonth.from(t.date()),
                        TreeMap::new,                // a constructor reference: sorted keys
                        reducing(zero, Transaction::signedAmount, Money::plus)));
    }

    /** Payee to total. toMap needs a merge function, or a repeated payee throws. */
    public Map<String, Money> totalsByPayee() {
        return expenses().stream()
                .collect(Collectors.toMap(
                        Expense::description,
                        Expense::amount,
                        Money::plus,                 // without this: IllegalStateException
                        TreeMap::new));
    }

    public Optional<Expense> largestExpense() {
        return expenses().stream().max(Comparator.comparing(Expense::amount));
    }

    /** Every distinct word used in descriptions. flatMap turns one line into many words. */
    public List<String> keywords() {
        return transactions.stream()
                .map(Transaction::description)
                .flatMap(d -> Arrays.stream(d.toLowerCase(Locale.ROOT).split(" ")))
                .filter(Predicate.not(String::isBlank))
                .distinct()
                .sorted()
                .toList();
    }

    public List<String> describeAll() {
        return transactions.stream().map(Reports::describe).toList();   // a static method reference
    }

    /** Record patterns with a guard. No default: the compiler knows every case is covered. */
    static String describe(Transaction transaction) {
        return switch (transaction) {
            case Expense(long account, LocalDate date, Money amount, String text, Category category)
                    when amount.amount().compareTo(BIG) > 0 ->
                    "%s  LARGE %s: %s (%s)".formatted(date, category.displayName(), text, amount);
            case Expense e ->
                    "%s  %s: %s (%s)".formatted(e.date(), e.category().displayName(), e.description(), e.amount());
            case Income i ->
                    "%s  +%s %s".formatted(i.date(), i.amount(), i.description());
            case Transfer(long from, long to, LocalDate date, Money amount, String text) ->
                    "%s  transfer %d -> %d: %s".formatted(date, from, to, amount);
        };
    }
}`,
  },
  {
    path: `${CORE}/report/ReportExporter.java`,
    lang: 'java',
    note: 'The template method pattern, with StringBuilder and a text block.',
    code: `package dev.springforge.tally.report;

import dev.springforge.tally.money.Money;
import dev.springforge.tally.txn.Category;

import java.util.Map;

/**
 * Template method: export() fixes the order of the steps, subclasses decide
 * what each step writes. A new format is a new subclass.
 */
public abstract class ReportExporter {

    public final String export(String title, Map<Category, Money> totals) {
        StringBuilder out = new StringBuilder();     // one growable buffer instead of many Strings
        header(out, title);
        totals.forEach((category, amount) -> row(out, category.displayName(), amount));
        footer(out, totals.size());
        return out.toString();
    }

    protected abstract void header(StringBuilder out, String title);

    protected abstract void row(StringBuilder out, String label, Money amount);

    /** A hook with an empty default. */
    protected void footer(StringBuilder out, int rows) {
    }

    /** CSV. A static nested class: it needs no enclosing instance. */
    public static final class Csv extends ReportExporter {

        @Override
        protected void header(StringBuilder out, String title) {
            out.append("category,amount,currency%n".formatted());
        }

        @Override
        protected void row(StringBuilder out, String label, Money amount) {
            String safe = label.contains(",") ? '"' + label + '"' : label;
            out.append(safe).append(',')
                    .append(amount.amount().toPlainString()).append(',')
                    .append(amount.currency().getCurrencyCode())
                    .append(System.lineSeparator());
        }
    }

    /** Markdown, with a text block for the fixed part of the header. */
    public static final class Markdown extends ReportExporter {

        @Override
        protected void header(StringBuilder out, String title) {
            out.append("""
                    ## %s

                    | Category | Amount |
                    | --- | ---: |
                    """.formatted(title));
        }

        @Override
        protected void row(StringBuilder out, String label, Money amount) {
            out.append("| %s | %s |%n".formatted(label, amount));
        }

        @Override
        protected void footer(StringBuilder out, int rows) {
            out.append("%n_%d categories_%n".formatted(rows));
        }
    }
}`,
  },
  {
    path: `${CORE}/budget/BudgetMonitor.java`,
    lang: 'java',
    note: 'The observer pattern, with a CopyOnWriteArrayList of listeners and a bounded Deque.',
    code: `package dev.springforge.tally.budget;

import dev.springforge.tally.money.Money;
import dev.springforge.tally.txn.Category;
import dev.springforge.tally.txn.Transaction;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Observer: the monitor does not know who cares about overspending. Listeners
 * subscribe, and are told when a category goes over its limit.
 */
public class BudgetMonitor {

    /** The observer. One abstract method, so a lambda will do. */
    @FunctionalInterface
    public interface BudgetListener {
        void overBudget(Category category, Money limit, Money spent);
    }

    private static final int MAX_RECENT = 5;

    private final Map<Category, Money> limits;
    private final Map<Category, Money> spent = new EnumMap<>(Category.class);
    // Iteration never sees a concurrent modification; writes copy the array, and are rare.
    private final List<BudgetListener> listeners = new CopyOnWriteArrayList<>();
    // The newest alerts first: a Deque used as a bounded stack.
    private final Deque<String> recentAlerts = new ArrayDeque<>();

    public BudgetMonitor(Map<Category, Money> limits) {
        this.limits = Map.copyOf(limits);     // our own unmodifiable copy
    }

    /** Returns the way to unsubscribe. */
    public Runnable subscribe(BudgetListener listener) {
        listeners.add(listener);
        return () -> listeners.remove(listener);
    }

    public void record(Transaction transaction) {
        if (!(transaction instanceof Transaction.Expense expense)) {
            return;                           // expense is in scope below this line
        }
        Category category = expense.category();
        Money total = spent.merge(category, expense.amount(), Money::plus);
        Money limit = limits.get(category);
        if (limit != null && total.isGreaterThan(limit)) {
            notifyListeners(category, limit, total);
        }
    }

    private void notifyListeners(Category category, Money limit, Money total) {
        recentAlerts.addFirst(category.displayName() + " over by " + total.minus(limit));
        if (recentAlerts.size() > MAX_RECENT) {
            recentAlerts.removeLast();
        }
        for (BudgetListener listener : listeners) {
            listener.overBudget(category, limit, total);
        }
    }

    public List<String> recentAlerts() {
        return List.copyOf(recentAlerts);
    }

    public void resetMonth() {
        spent.clear();
    }
}`,
  },
  {
    path: `${CORE}/error/TallyException.java`,
    lang: 'java',
    note: 'A checked exception: callers must handle or declare it.',
    code: `package dev.springforge.tally.error;

/**
 * Checked, because a bad statement file is something the program should
 * expect and recover from — the compiler makes every caller decide what to do.
 */
public class TallyException extends Exception {

    private final String source;
    private final int line;

    public TallyException(String message, String source, int line, Throwable cause) {
        super("%s (%s, line %d)".formatted(message, source, line), cause);   // keep the cause
        this.source = source;
        this.line = line;
    }

    public String source() {
        return source;
    }

    public int line() {
        return line;
    }
}`,
  },
  {
    path: `${CORE}/error/InsufficientFundsException.java`,
    lang: 'java',
    note: 'An unchecked exception: a broken rule the caller should have checked.',
    code: `package dev.springforge.tally.error;

import dev.springforge.tally.money.Money;

/**
 * Unchecked. Withdrawing more than is allowed is a business-rule violation the
 * caller could have checked first; declaring it on every method would add noise.
 */
public class InsufficientFundsException extends RuntimeException {

    private final long accountId;
    private final transient Money requested;   // Money is not Serializable; exceptions are
    private final transient Money available;

    public InsufficientFundsException(long accountId, Money requested, Money available) {
        super("Account %d cannot pay %s (balance %s)".formatted(accountId, requested, available));
        this.accountId = accountId;
        this.requested = requested;
        this.available = available;
    }

    public long accountId() {
        return accountId;
    }

    public Money requested() {
        return requested;
    }

    public Money available() {
        return available;
    }
}`,
  },
  {
    path: 'tally-core/src/test/java/dev/springforge/tally/money/MoneyTest.java',
    lang: 'java',
    note: 'Tests of the equals, hashCode and compareTo contracts.',
    code: `package dev.springforge.tally.money;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MoneyTest {

    @Test
    void equalAmountsAreEqualWhateverTheScale() {
        Money a = Money.of("10", "EUR");
        Money b = Money.of("10.00", "EUR");

        assertThat(a).isEqualTo(b);
        assertThat(a.hashCode()).isEqualTo(b.hashCode());   // equal objects must have equal hashes
    }

    @Test
    void bigDecimalOnItsOwnWouldGetThisWrong() {
        assertThat(new BigDecimal("10")).isNotEqualTo(new BigDecimal("10.00"));   // scale differs
        assertThat(new BigDecimal("10").compareTo(new BigDecimal("10.00"))).isZero();
    }

    @Test
    void worksAsAHashSetElement() {
        Set<Money> set = new HashSet<>(List.of(Money.of("5", "EUR"), Money.of("5.00", "EUR")));

        assertThat(set).hasSize(1);
    }

    @Test
    void ordersConsistentlyWithEquals() {
        Set<Money> sorted = new TreeSet<>(List.of(
                Money.of("3", "EUR"), Money.of("1", "EUR"), Money.of("1.0", "EUR")));

        assertThat(sorted).containsExactly(Money.of("1", "EUR"), Money.of("3", "EUR"));
    }

    @Test
    void refusesToMixCurrencies() {
        assertThatThrownBy(() -> Money.of("1", "EUR").plus(Money.of("1", "USD")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("EUR");
    }

    @Test
    void operationsReturnNewInstances() {
        Money ten = Money.of("10", "EUR");
        Money twenty = ten.plus(ten);

        assertThat(ten).isEqualTo(Money.of("10", "EUR"));   // unchanged
        assertThat(twenty).isEqualTo(Money.of("20", "EUR"));
    }
}`,
  },
  {
    path: 'tally-core/src/test/java/dev/springforge/tally/report/ReportsTest.java',
    lang: 'java',
    code: `package dev.springforge.tally.report;

import dev.springforge.tally.money.Money;
import dev.springforge.tally.txn.Category;
import dev.springforge.tally.txn.Transaction;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Currency;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ReportsTest {

    private static Money eur(String amount) {
        return Money.of(amount, "EUR");
    }

    private static Transaction expense(String date, String amount, Category category, String payee) {
        return Transaction.builder()
                .account(1)
                .on(LocalDate.parse(date))
                .amount(eur(amount))
                .description(payee)
                .expense(category)
                .build();
    }

    private final Reports reports = new Reports(List.of(
            expense("2026-08-01", "900", Category.RENT, "Landlord"),
            expense("2026-08-03", "40", Category.GROCERIES, "Aldi"),
            expense("2026-08-10", "25", Category.GROCERIES, "Aldi"),
            expense("2026-08-12", "30", Category.DINING, "Pizza place"),
            expense("2026-09-02", "45", Category.GROCERIES, "Tesco"),
            Transaction.builder()
                    .account(1)
                    .on(LocalDate.parse("2026-08-28"))
                    .amount(eur("2500"))
                    .description("Salary")
                    .income()
                    .build()),
            Currency.getInstance("EUR"));

    @Test
    void sumsOneMonth() {
        assertThat(reports.spentIn(YearMonth.of(2026, 8))).isEqualTo(eur("995"));
    }

    @Test
    void groupsByCategory() {
        assertThat(reports.spendByCategory())
                .containsEntry(Category.GROCERIES, eur("110"))
                .containsEntry(Category.RENT, eur("900"))
                .doesNotContainKey(Category.SALARY);
    }

    @Test
    void mergesRepeatedPayeesInsteadOfThrowing() {
        assertThat(reports.totalsByPayee()).containsEntry("Aldi", eur("65"));
    }

    @Test
    void partitionAlwaysHasBothKeys() {
        Map<Boolean, Money> split = reports.essentialVersusLifestyle();

        assertThat(split).containsOnlyKeys(true, false);
        assertThat(split.get(false)).isEqualTo(eur("30"));
    }

    @Test
    void netByMonthIsInMonthOrder() {
        Map<YearMonth, Money> net = reports.netByMonth();

        assertThat(net.keySet()).containsExactly(YearMonth.of(2026, 8), YearMonth.of(2026, 9));
        assertThat(net.get(YearMonth.of(2026, 8))).isEqualTo(eur("1505"));   // 2500 - 995
    }

    @Test
    void ranksTopCategories() {
        assertThat(reports.topCategories(2))
                .extracting(Map.Entry::getKey)
                .containsExactly(Category.RENT, Category.GROCERIES);
    }
}`,
  },
];
