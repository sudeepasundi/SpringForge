import type { DemoFile } from '@/lib/types';

const APP = 'tally-app/src/main/java/dev/springforge/tally/app';

/**
 * The command-line app: wiring, file import and the concurrent parts.
 */
export const tallyAppFiles: DemoFile[] = [
  {
    path: 'tally-app/pom.xml',
    lang: 'xml',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>dev.springforge</groupId>
  <artifactId>tally-app</artifactId>
  <version>1.0.0</version>
  <name>Tally app</name>

  <properties>
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencies>
    <!-- Installed into the local repository by "mvn install" in tally-core -->
    <dependency>
      <groupId>dev.springforge</groupId>
      <artifactId>tally-core</artifactId>
      <version>1.0.0</version>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>3.5.0</version>
        <configuration>
          <mainClass>dev.springforge.tally.app.TallyApp</mainClass>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>`,
  },
  {
    path: 'tally-app/run.sh',
    lang: 'bash',
    note: 'Build the core, then run the app against the sample statements.',
    code: `#!/usr/bin/env bash
set -euo pipefail

# Needs JDK 21+ and Maven 3.9+.
java -version

# 1. Build and test the core, and install it into ~/.m2 for the app to use.
mvn -q -f ../tally-core/pom.xml install

# 2. Run the app on the sample statements.
mvn -q compile exec:java -Dexec.args="statements"`,
  },
  {
    path: 'tally-app/statements/2026-08-everyday.csv',
    lang: 'text',
    note: 'Sample input: negative amounts are spending, positive are income.',
    code: `date,description,amount
01/08/2026,Rent to landlord,-900.00
02/08/2026,Aldi,-42.10
04/08/2026,Metro card,-35.00
06/08/2026,Cafe Nero,-6.40
09/08/2026,Tesco,-58.25
12/08/2026,Pizza Express,-48.00
15/08/2026,Electric bill,-72.30
19/08/2026,Aldi,-37.90
22/08/2026,Restaurant Zola,-96.50
28/08/2026,Salary ACME Ltd,2650.00
30/08/2026,Cinema,-24.00`,
  },
  {
    path: 'tally-app/statements/2026-08-travel.csv',
    lang: 'text',
    code: `date,description,amount
10/08/2026,Train to Lisbon,-128.00
11/08/2026,Hotel Lisboa,-1240.00
12/08/2026,Uber airport,-31.20
13/08/2026,Market lunch,-18.60`,
  },
  {
    path: `${APP}/TallyApp.java`,
    lang: 'java',
    note: 'Wiring by hand — the job the Spring container does in the rest of the course.',
    code: `package dev.springforge.tally.app;

import dev.springforge.tally.account.Account;
import dev.springforge.tally.account.AccountType;
import dev.springforge.tally.app.io.CsvImporter;
import dev.springforge.tally.app.io.StatementImporter;
import dev.springforge.tally.app.stats.RunningTotals;
import dev.springforge.tally.budget.BudgetMonitor;
import dev.springforge.tally.categorize.Rules;
import dev.springforge.tally.error.TallyException;
import dev.springforge.tally.money.Money;
import dev.springforge.tally.report.ReportExporter;
import dev.springforge.tally.report.Reports;
import dev.springforge.tally.repo.InMemoryRepository;
import dev.springforge.tally.repo.Repository;
import dev.springforge.tally.txn.Category;
import dev.springforge.tally.txn.Transaction;

import java.nio.file.Path;
import java.time.Duration;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.Currency;
import java.util.List;
import java.util.Map;

/**
 * Creates every object and connects them by hand. In the rest of the course
 * Spring's container does this; here you can see all of it.
 */
public final class TallyApp {

    private static final String USAGE = """
            Usage: tally <statement-directory>

            Imports every .csv file in the directory at once, then
            prints a spending report for the most recent month.
            """;

    private TallyApp() {                 // a utility class: no instances
    }

    public static void main(String[] args) throws TallyException, InterruptedException {
        if (args.length != 1) {
            System.out.print(USAGE);
            System.exit(2);
        }

        var eur = Currency.getInstance("EUR");          // var: the type is obvious from the right-hand side
        Repository<Account, Long> accounts = new InMemoryRepository<>();
        Account everyday = accounts.save(AccountType.CHECKING.open("Everyday", Money.of("1200", "EUR")));

        var monitor = new BudgetMonitor(Map.of(
                Category.DINING, Money.of("150", "EUR"),
                Category.GROCERIES, Money.of("400", "EUR"),
                Category.TRAVEL, Money.of("1000", "EUR")));
        monitor.subscribe((category, limit, spent) ->
                System.out.printf("! %s is over budget: %s of %s%n", category.displayName(), spent, limit));

        var importer = new StatementImporter(
                new CsvImporter(Rules.defaults(), everyday.id()),
                Duration.ofSeconds(30));
        List<Transaction> transactions = importer.importAll(Path.of(args[0]));
        if (transactions.isEmpty()) {
            System.out.println("No transactions found.");
            return;
        }

        var totals = new RunningTotals();
        transactions.forEach(monitor::record);          // a bound method reference
        transactions.parallelStream().forEach(totals::add);   // safe: RunningTotals is thread-safe

        YearMonth latest = transactions.stream()
                .map(t -> YearMonth.from(t.date()))
                .max(Comparator.naturalOrder())
                .orElseGet(YearMonth::now);

        var reports = new Reports(transactions, eur);
        System.out.println(new ReportExporter.Markdown().export("Spending, " + latest, reports.spendByCategory()));
        System.out.println("Spent in " + latest + ": " + reports.spentIn(latest));
        reports.largestExpense()
                .ifPresent(e -> System.out.println("Largest: " + e.description() + ", " + e.amount()));
        System.out.println("Last imported: " + transactions.getLast().description());   // Java 21
        System.out.println(totals.snapshot());
    }
}`,
  },
  {
    path: `${APP}/io/CsvImporter.java`,
    lang: 'java',
    note: 'try-with-resources, java.time parsing, and translating low-level exceptions.',
    code: `package dev.springforge.tally.app.io;

import dev.springforge.tally.categorize.Rules;
import dev.springforge.tally.error.TallyException;
import dev.springforge.tally.money.Money;
import dev.springforge.tally.txn.Transaction;
import dev.springforge.tally.txn.TransactionBuilder;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Currency;
import java.util.List;

/**
 * Reads one statement: date,description,amount with negative amounts for
 * spending. It holds no mutable state, so many threads can share one instance.
 */
public final class CsvImporter {

    // Immutable and thread-safe, unlike the old SimpleDateFormat.
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Currency EUR = Currency.getInstance("EUR");

    private final Rules rules;
    private final long accountId;

    public CsvImporter(Rules rules, long accountId) {
        this.rules = rules;
        this.accountId = accountId;
    }

    public List<Transaction> read(Path file) throws TallyException {
        List<Transaction> result = new ArrayList<>();
        int lineNo = 0;
        // try-with-resources: the reader is closed however the block is left.
        try (BufferedReader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            reader.readLine();                           // skip the header
            String line;
            while ((line = reader.readLine()) != null) {
                lineNo++;
                if (!line.isBlank()) {
                    result.add(parse(line));
                }
            }
            return result;
        } catch (IOException e) {
            throw new TallyException("Cannot read statement", file.toString(), lineNo, e);
        } catch (DateTimeParseException | IllegalArgumentException e) {
            // Turn low-level failures into one exception the caller understands,
            // keeping the original as the cause.
            throw new TallyException("Malformed line", file.getFileName().toString(), lineNo + 1, e);
        }
    }

    private Transaction parse(String line) {
        int first = line.indexOf(',');
        int last = line.lastIndexOf(',');                 // descriptions may contain commas
        if (first < 0 || first == last) {
            throw new IllegalArgumentException("Expected date,description,amount but got: " + line);
        }
        LocalDate date = LocalDate.parse(line.substring(0, first).strip(), DATE);
        String description = line.substring(first + 1, last).strip();
        BigDecimal amount = new BigDecimal(line.substring(last + 1).strip());   // NumberFormatException is an IllegalArgumentException

        TransactionBuilder builder = Transaction.builder()
                .account(accountId)
                .on(date)
                .description(description)
                .amount(Money.of(amount.abs(), EUR));
        if (amount.signum() >= 0) {
            builder.income();
        } else {
            builder.expense(rules.categorizeOrOther(description));
        }
        return builder.build();
    }
}`,
  },
  {
    path: `${APP}/io/StatementImporter.java`,
    lang: 'java',
    note: 'CompletableFuture on virtual threads, with a timeout and exception unwrapping.',
    code: `package dev.springforge.tally.app.io;

import dev.springforge.tally.error.TallyException;
import dev.springforge.tally.txn.Transaction;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.Stream;

/**
 * Imports every statement in a directory at the same time. Reading files is
 * blocking I/O, which is what virtual threads are for: one cheap thread per
 * file and no pool to size.
 */
public final class StatementImporter {

    private final CsvImporter csv;
    private final Duration timeout;

    public StatementImporter(CsvImporter csv, Duration timeout) {
        this.csv = csv;
        this.timeout = timeout;
    }

    public List<Transaction> importAll(Path directory) throws TallyException, InterruptedException {
        List<Path> files = listStatements(directory);

        // ExecutorService is AutoCloseable since Java 19: close() waits for running tasks.
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<CompletableFuture<List<Transaction>>> futures = files.stream()
                    .map(file -> CompletableFuture.supplyAsync(() -> readUnchecked(file), executor))
                    .toList();

            // allOf completes when every future has, and fails if any one fails.
            CompletableFuture<Void> all = CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new));
            try {
                all.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
            } catch (TimeoutException e) {
                executor.shutdownNow();          // interrupt the stragglers before close() waits on them
                throw new TallyException("Import timed out after " + timeout, directory.toString(), 0, e);
            } catch (ExecutionException e) {
                throw unwrap(e.getCause());
            }

            return futures.stream()
                    .flatMap(future -> future.join().stream())   // all complete: join cannot block
                    .sorted(Comparator.comparing(Transaction::date))
                    .toList();
        }
    }

    private List<Transaction> readUnchecked(Path file) {
        try {
            return csv.read(file);
        } catch (TallyException e) {
            // A Supplier cannot throw a checked exception: wrap it here, unwrap it above.
            throw new CompletionException(e);
        }
    }

    private static TallyException unwrap(Throwable cause) {
        if (cause instanceof TallyException tally) {
            return tally;
        }
        if (cause instanceof RuntimeException runtime) {
            throw runtime;
        }
        throw new IllegalStateException("Import failed", cause);
    }

    private static List<Path> listStatements(Path directory) throws TallyException {
        // Files.list holds the directory open, so the stream must be closed.
        try (Stream<Path> entries = Files.list(directory)) {
            return entries
                    .filter(path -> path.getFileName().toString().endsWith(".csv"))
                    .sorted()
                    .toList();
        } catch (IOException e) {
            throw new TallyException("Cannot list statements", directory.toString(), 0, e);
        }
    }
}`,
  },
  {
    path: `${APP}/stats/RunningTotals.java`,
    lang: 'java',
    note: 'Four ways to share state between threads safely.',
    code: `package dev.springforge.tally.app.stats;

import dev.springforge.tally.money.Money;
import dev.springforge.tally.txn.Category;
import dev.springforge.tally.txn.Transaction;

import java.util.Collections;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Totals that many threads update at once. Each field stays correct in a
 * different way, without one big synchronized block around everything.
 */
public final class RunningTotals {

    // merge() is atomic for each key: no lost updates and no external lock.
    private final ConcurrentHashMap<Category, Money> byCategory = new ConcurrentHashMap<>();

    // Many writers and rare reads: LongAdder scales better than AtomicLong.
    private final LongAdder count = new LongAdder();

    // A lock-free maximum: accumulateAndGet retries compare-and-set until it wins.
    private final AtomicLong largestCents = new AtomicLong();

    // A plain TreeMap guarded by a read-write lock: many readers, or one writer.
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final Map<String, Integer> payeeCounts = new TreeMap<>();

    // A plain int guarded by the object's own monitor.
    private int incomeCount;

    public void add(Transaction transaction) {
        count.increment();
        switch (transaction) {
            case Transaction.Expense e -> {
                byCategory.merge(e.category(), e.amount(), Money::plus);
                largestCents.accumulateAndGet(e.amount().amount().movePointRight(2).longValue(), Math::max);
                countPayee(e.description());
            }
            case Transaction.Income i -> countIncome();
            case Transaction.Transfer t -> {
                // not counted
            }
        }
    }

    private synchronized void countIncome() {
        incomeCount++;                         // read, add, write: not atomic without the lock
    }

    private void countPayee(String payee) {
        lock.writeLock().lock();
        try {
            payeeCounts.merge(payee, 1, Integer::sum);
        } finally {
            lock.writeLock().unlock();         // always in finally, or an exception leaks the lock
        }
    }

    public Map<String, Integer> payeeCounts() {
        lock.readLock().lock();
        try {
            return Collections.unmodifiableMap(new TreeMap<>(payeeCounts));   // copy while locked
        } finally {
            lock.readLock().unlock();
        }
    }

    public synchronized int incomeCount() {
        return incomeCount;
    }

    /** Each value is correct, though not necessarily all from the same instant. */
    public String snapshot() {
        long largest = largestCents.get();     // read once, so both halves agree
        return "%d transactions (%d income), largest expense %d.%02d, by category %s".formatted(
                count.sum(), incomeCount(), largest / 100, largest % 100, new TreeMap<>(byCategory));
    }
}`,
  },
];
