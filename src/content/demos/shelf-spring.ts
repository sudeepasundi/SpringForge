import type { DemoFile } from '@/lib/types';

/**
 * The same work with Spring JDBC: JdbcTemplate, NamedParameterJdbcTemplate,
 * JdbcClient, SimpleJdbcInsert and SimpleJdbcCall, batching, streaming,
 * declarative transactions, and a @JdbcTest against real MySQL.
 */
export const shelfSpringFiles: DemoFile[] = [
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/ShelfApplication.java',
    lang: 'java',
    note: 'Boot auto-configures the DataSource, JdbcTemplate, NamedParameterJdbcTemplate, JdbcClient and the transaction manager from the starter.',
    code: `package dev.springforge.shelf;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.Clock;

/**
 * No JDBC configuration here at all. With spring-boot-starter-jdbc and a
 * spring.datasource.url, Boot creates:
 *   - a HikariCP DataSource
 *   - JdbcTemplate and NamedParameterJdbcTemplate
 *   - JdbcClient
 *   - a DataSourceTransactionManager, so @Transactional works
 */
@SpringBootApplication
public class ShelfApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShelfApplication.class, args);
    }

    /** Injected so due dates can be tested with a fixed clock. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/book/BookRepository.java',
    lang: 'java',
    note: 'JdbcTemplate: one line per query, a reusable RowMapper, and exceptions translated for you.',
    code: `package dev.springforge.shelf.book;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Repository
public class BookRepository {

    private static final String SELECT =
            "SELECT id, isbn, title, author_id, published_on, price, copies_available FROM book";

    /** Row → object, written once and reused by every query. */
    static final RowMapper<Book> BOOK = (rs, rowNum) -> new Book(
            rs.getLong("id"),
            rs.getString("isbn"),
            rs.getString("title"),
            rs.getLong("author_id"),
            rs.getObject("published_on", LocalDate.class),
            rs.getBigDecimal("price"),
            rs.getInt("copies_available"));

    private final JdbcTemplate jdbc;

    public BookRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** queryForObject with a simple type: exactly one row, one column. */
    public int count() {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM book", Integer.class);
        return count == null ? 0 : count;
    }

    /**
     * Not queryForObject: that throws EmptyResultDataAccessException when no
     * row matches. Querying for a list and taking the first element turns
     * "not found" into an empty Optional instead of an exception.
     */
    public Optional<Book> findById(long id) {
        return jdbc.query(SELECT + " WHERE id = ?", BOOK, id).stream().findFirst();
    }

    /** query + RowMapper: zero or more rows. Arguments bind to ? in order. */
    public List<Book> findByAuthor(long authorId) {
        return jdbc.query(SELECT + " WHERE author_id = ? ORDER BY title", BOOK, authorId);
    }

    /** queryForList with an element type: a single column, many rows. */
    public List<String> titlesPublishedAfter(LocalDate date) {
        return jdbc.queryForList(
                "SELECT title FROM book WHERE published_on > ? ORDER BY published_on",
                String.class, date);
    }

    /** queryForMap: one row as column name → value. Handy for ad-hoc aggregates. */
    public Map<String, Object> priceStats() {
        return jdbc.queryForMap(
                "SELECT MIN(price) AS min_price, MAX(price) AS max_price, AVG(price) AS avg_price FROM book");
    }

    /** update() runs INSERT, UPDATE and DELETE; KeyHolder captures the new id. */
    public long insert(NewBook book) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO book (isbn, title, author_id, published_on, price, copies_available) "
                            + "VALUES (?, ?, ?, ?, ?, ?)",
                    new String[] {"id"});
            ps.setString(1, book.isbn());
            ps.setString(2, book.title());
            ps.setLong(3, book.authorId());
            ps.setObject(4, book.publishedOn());
            ps.setBigDecimal(5, book.price());
            ps.setInt(6, book.copies());
            return ps;
        }, keys);
        // MySQL returns BIGINT keys as BigInteger, so read it as a Number.
        return Objects.requireNonNull(keys.getKey()).longValue();
    }

    /** update() returns the number of affected rows — check it. */
    public boolean updatePrice(long id, BigDecimal price) {
        return jdbc.update("UPDATE book SET price = ? WHERE id = ?", price, id) == 1;
    }

    public boolean delete(long id) {
        return jdbc.update("DELETE FROM book WHERE id = ?", id) == 1;
    }
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/author/AuthorRepository.java',
    lang: 'java',
    note: 'Named parameters, an IN list, records as parameter sources, and SimpleJdbcInsert.',
    code: `package dev.springforge.shelf.author;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SimplePropertySqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Repository
public class AuthorRepository {

    public record Author(long id, String name, Integer bornYear) { }

    public record NewAuthor(String name, Integer bornYear) { }

    /** Search criteria as a record; its components become :namePattern, :bornAfter, :limit. */
    public record AuthorSearch(String namePattern, Integer bornAfter, int limit) { }

    private static final RowMapper<Author> AUTHOR = (rs, n) -> new Author(
            rs.getLong("id"),
            rs.getString("name"),
            rs.getObject("born_year", Integer.class));     // nullable column → Integer

    private final NamedParameterJdbcTemplate jdbc;
    private final SimpleJdbcInsert insert;

    public AuthorRepository(NamedParameterJdbcTemplate jdbc, DataSource dataSource) {
        this.jdbc = jdbc;
        // Builds the INSERT from table metadata; no SQL string to maintain.
        this.insert = new SimpleJdbcInsert(dataSource)
                .withTableName("author")
                .usingColumns("name", "born_year")
                .usingGeneratedKeyColumns("id");
    }

    public long create(NewAuthor author) {
        return insert.executeAndReturnKey(new MapSqlParameterSource()
                        .addValue("name", author.name())
                        .addValue("born_year", author.bornYear()))
                .longValue();
    }

    /** A named parameter bound to a Map. */
    public List<Author> findByName(String name) {
        return jdbc.query("SELECT id, name, born_year FROM author WHERE name = :name",
                Map.of("name", name), AUTHOR);
    }

    /**
     * IN lists: bind a Collection and Spring expands :ids to (?, ?, ?).
     * An empty IN () is a syntax error in MySQL, so handle it first.
     */
    public List<Author> findByIds(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return jdbc.query("SELECT id, name, born_year FROM author WHERE id IN (:ids) ORDER BY name",
                Map.of("ids", ids), AUTHOR);
    }

    /**
     * SimplePropertySqlParameterSource reads record components (and fields)
     * by name. For JavaBeans with getters, BeanPropertySqlParameterSource does
     * the same. Note :bornAfter is used twice; that is fine with named parameters.
     */
    public List<Author> search(AuthorSearch criteria) {
        String sql = """
                SELECT id, name, born_year
                  FROM author
                 WHERE name LIKE :namePattern
                   AND (:bornAfter IS NULL OR born_year > :bornAfter)
                 ORDER BY name
                 LIMIT :limit
                """;
        return jdbc.query(sql, new SimplePropertySqlParameterSource(criteria), AUTHOR);
    }
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/loan/LoanRepository.java',
    lang: 'java',
    note: 'JdbcClient: one fluent API for positional and named parameters, with records mapped automatically.',
    code: `package dev.springforge.shelf.loan;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Repository
public class LoanRepository {

    /** Column names map to components: borrowed_at → borrowedAt. */
    public record Loan(long id, long bookId, long memberId,
                       LocalDateTime borrowedAt, LocalDate dueOn, LocalDateTime returnedAt) { }

    public record OverdueLoan(long id, String title, String email, LocalDate dueOn) { }

    private final JdbcClient jdbc;

    public LoanRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Named parameters, and the generated key. */
    public long open(long bookId, long memberId, LocalDate dueOn) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.sql("INSERT INTO loan (book_id, member_id, due_on) VALUES (:book, :member, :due)")
                .param("book", bookId)
                .param("member", memberId)
                .param("due", dueOn)
                .update(keys, "id");
        // keys.getKeyAs(Long.class) would fail here: MySQL hands back a BigInteger.
        return Objects.requireNonNull(keys.getKey()).longValue();
    }

    /** Positional parameters, a record result, and optional() for zero-or-one. */
    public Optional<Loan> findOpen(long bookId, long memberId) {
        return jdbc.sql("""
                        SELECT id, book_id, member_id, borrowed_at, due_on, returned_at
                          FROM loan
                         WHERE book_id = ? AND member_id = ? AND returned_at IS NULL
                        """)
                .param(bookId)
                .param(memberId)
                .query(Loan.class)
                .optional();
    }

    /** A join straight into a record; list() for many rows. */
    public List<OverdueLoan> overdue(LocalDate today) {
        return jdbc.sql("""
                        SELECT l.id, b.title, m.email, l.due_on
                          FROM loan l
                          JOIN book b   ON b.id = l.book_id
                          JOIN member m ON m.id = l.member_id
                         WHERE l.returned_at IS NULL
                           AND l.due_on < :today
                         ORDER BY l.due_on
                        """)
                .param("today", today)
                .query(OverdueLoan.class)
                .list();
    }

    /** A single value: query(Class).single(). */
    public int openLoansFor(long memberId) {
        return jdbc.sql("SELECT COUNT(*) FROM loan WHERE member_id = ? AND returned_at IS NULL")
                .param(memberId)
                .query(Integer.class)
                .single();
    }

    public boolean markReturned(long loanId, LocalDateTime at) {
        return jdbc.sql("UPDATE loan SET returned_at = :at WHERE id = :id AND returned_at IS NULL")
                .param("at", at)
                .param("id", loanId)
                .update() == 1;
    }
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/loan/LoanService.java',
    lang: 'java',
    note: '@Transactional around several JdbcTemplate/JdbcClient calls, DuplicateKeyException as a business rule, and SimpleJdbcCall.',
    code: `package dev.springforge.shelf.loan;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Map;

@Service
public class LoanService {

    public static class NoCopiesAvailableException extends RuntimeException {
        public NoCopiesAvailableException(long bookId) {
            super("No copies of book " + bookId + " are available");
        }
    }

    public static class AlreadyBorrowedException extends RuntimeException {
        public AlreadyBorrowedException(long bookId, long memberId, Throwable cause) {
            super("Member " + memberId + " already has book " + bookId, cause);
        }
    }

    private final LoanRepository loans;
    private final JdbcTemplate jdbc;
    private final SimpleJdbcCall checkoutProcedure;
    private final Clock clock;

    public LoanService(LoanRepository loans, JdbcTemplate jdbc, Clock clock) {
        this.loans = loans;
        this.jdbc = jdbc;
        this.clock = clock;
        // Reads the procedure's parameters from database metadata.
        this.checkoutProcedure = new SimpleJdbcCall(jdbc).withProcedureName("checkout_book");
    }

    /**
     * Both statements use the same connection and commit together, because the
     * DataSourceTransactionManager binds one connection to this thread for the
     * whole method. JdbcTemplate and JdbcClient both pick it up automatically.
     */
    @Transactional
    public long borrow(long bookId, long memberId) {
        int taken = jdbc.update(
                "UPDATE book SET copies_available = copies_available - 1 "
                        + "WHERE id = ? AND copies_available > 0", bookId);
        if (taken == 0) {
            throw new NoCopiesAvailableException(bookId);
        }
        try {
            return loans.open(bookId, memberId, LocalDate.now(clock).plusDays(21));
        } catch (DuplicateKeyException e) {
            // MySQL error 1062 on uk_loan_open, translated by Spring. Throwing a
            // runtime exception rolls back the copy we just took, too.
            throw new AlreadyBorrowedException(bookId, memberId, e);
        }
    }

    /** The same checkout, done by the stored procedure. */
    @Transactional
    public long borrowViaProcedure(long bookId, long memberId) {
        Map<String, Object> out = checkoutProcedure.execute(new MapSqlParameterSource()
                .addValue("p_book_id", bookId)
                .addValue("p_member_id", memberId)
                .addValue("p_days", 21));
        // The result map holds the OUT parameters, keyed case-insensitively.
        return ((Number) out.get("p_loan_id")).longValue();
    }

    @Transactional
    public void giveBack(long loanId, long bookId) {
        if (loans.markReturned(loanId, java.time.LocalDateTime.now(clock))) {
            jdbc.update("UPDATE book SET copies_available = copies_available + 1 WHERE id = ?", bookId);
        }
    }
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/loan/BorrowFacade.java',
    lang: 'java',
    note: 'Deadlock retry lives outside the transaction: a retried attempt must be a brand-new transaction.',
    code: `package dev.springforge.shelf.loan;

import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.stereotype.Component;

/**
 * InnoDB resolves a deadlock by rolling one transaction back (MySQL error 1213,
 * SQLSTATE 40001). Spring translates it to PessimisticLockingFailureException.
 * The whole transaction is gone, so the only correct retry is to run it again
 * from the start — from OUTSIDE the @Transactional method.
 */
@Component
public class BorrowFacade {

    private static final int ATTEMPTS = 3;

    private final LoanService loans;

    public BorrowFacade(LoanService loans) {
        this.loans = loans;
    }

    public long borrow(long bookId, long memberId) {
        for (int attempt = 1; ; attempt++) {
            try {
                return loans.borrow(bookId, memberId);      // a new transaction each time
            } catch (PessimisticLockingFailureException e) {
                if (attempt == ATTEMPTS) {
                    throw e;
                }
                sleepQuietly(50L * attempt);                 // brief backoff
            }
        }
    }

    private static void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while retrying", e);
        }
    }
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/catalog/CatalogImporter.java',
    lang: 'java',
    note: 'batchUpdate in chunks, an upsert, and why every count is -2 on MySQL with batch rewriting on.',
    code: `package dev.springforge.shelf.catalog;

import dev.springforge.shelf.book.NewBook;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSourceUtils;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Statement;
import java.util.Arrays;
import java.util.List;

@Component
public class CatalogImporter {

    private static final int CHUNK_SIZE = 500;

    /**
     * An upsert: insert, or update the existing row with the same ISBN.
     * "AS new" (MySQL 8.0.19+) replaces the deprecated VALUES() function.
     */
    private static final String UPSERT = """
            INSERT INTO book (isbn, title, author_id, published_on, price, copies_available)
            VALUES (?, ?, ?, ?, ?, ?) AS new
            ON DUPLICATE KEY UPDATE
                title = new.title,
                price = new.price,
                copies_available = book.copies_available + new.copies_available
            """;

    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;

    public CatalogImporter(JdbcTemplate jdbc, NamedParameterJdbcTemplate named) {
        this.jdbc = jdbc;
        this.named = named;
    }

    /**
     * batchUpdate with a chunk size: Spring sends the list 500 rows at a time,
     * and with rewriteBatchedStatements=true each chunk becomes one multi-row
     * INSERT. One transaction around the whole import: all or nothing.
     */
    @Transactional
    public int importBooks(List<NewBook> books) {
        int[][] counts = jdbc.batchUpdate(UPSERT, books, CHUNK_SIZE, (ps, book) -> {
            ps.setString(1, book.isbn());
            ps.setString(2, book.title());
            ps.setLong(3, book.authorId());
            ps.setObject(4, book.publishedOn());
            ps.setBigDecimal(5, book.price());
            ps.setInt(6, book.copies());
        });
        // A rewritten batch cannot say how many rows each entry changed, so the
        // driver reports SUCCESS_NO_INFO (-2). Count those as "applied".
        return Arrays.stream(counts)
                .flatMapToInt(Arrays::stream)
                .map(c -> c == Statement.SUCCESS_NO_INFO ? 1 : Math.min(c, 1))
                .sum();
    }

    /** The named-parameter variant: records become parameter sources. */
    @Transactional
    public void renameAll(List<Rename> renames) {
        named.batchUpdate(
                "UPDATE book SET title = :title WHERE isbn = :isbn",
                SqlParameterSourceUtils.createBatch(renames));
    }

    public record Rename(String isbn, String title) { }
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/report/InventoryReport.java',
    lang: 'java',
    note: 'ResultSetExtractor for one object from many rows, RowCallbackHandler for side effects, and a stream that must be closed.',
    code: `package dev.springforge.shelf.report;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Component
public class InventoryReport {

    private final JdbcTemplate jdbc;
    private final JdbcTemplate streaming;

    public InventoryReport(JdbcTemplate jdbc, DataSource dataSource) {
        this.jdbc = jdbc;
        // MySQL's driver normally reads the WHOLE result into memory. A fetch
        // size of Integer.MIN_VALUE switches it to row-by-row streaming.
        // (The alternative is useCursorFetch=true with a positive fetch size.)
        this.streaming = new JdbcTemplate(dataSource);
        this.streaming.setFetchSize(Integer.MIN_VALUE);
    }

    /** ResultSetExtractor: you drive the cursor and build one result. */
    public Map<String, List<String>> titlesByAuthor() {
        return jdbc.query("""
                SELECT a.name, b.title
                  FROM author a JOIN book b ON b.author_id = a.id
                 ORDER BY a.name, b.title
                """, rs -> {
            Map<String, List<String>> byAuthor = new LinkedHashMap<>();
            while (rs.next()) {
                byAuthor.computeIfAbsent(rs.getString(1), k -> new ArrayList<>()).add(rs.getString(2));
            }
            return byAuthor;
        });
    }

    /** RowCallbackHandler: act on each row, keep nothing in memory. */
    public void exportCsv(Writer out) {
        streaming.query("SELECT isbn, title, price FROM book ORDER BY id", (RowCallbackHandler) rs -> {
            try {
                out.write(rs.getString("isbn") + "," + quote(rs.getString("title")) + ","
                        + rs.getBigDecimal("price") + "\\n");
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        });
    }

    /**
     * queryForStream holds the connection open until the stream is closed —
     * always use try-with-resources. While a MySQL result is streaming, no other
     * statement can run on that connection.
     */
    @Transactional(readOnly = true)
    public BigDecimal totalStockValue() {
        try (Stream<BigDecimal> values = streaming.queryForStream(
                "SELECT price * copies_available FROM book",
                (rs, rowNum) -> rs.getBigDecimal(1))) {
            return values.reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }

    private static String quote(String value) {
        return "\\"" + value.replace("\\"", "\\"\\"") + "\\"";
    }
}`,
  },
  {
    path: 'shelf-api/src/test/java/dev/springforge/shelf/book/BookRepositoryTest.java',
    lang: 'java',
    note: '@JdbcTest against a real MySQL in Testcontainers; each test rolls back.',
    code: `package dev.springforge.shelf.book;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.jdbc.Sql;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * @JdbcTest starts only the JDBC slice: DataSource, JdbcTemplate, JdbcClient,
 * Flyway and a transaction manager. Every test runs in a transaction that is
 * rolled back afterwards, so tests cannot see each other's data.
 */
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)   // keep MySQL
@Testcontainers
@Import(BookRepository.class)
@Sql("/books-fixture.sql")                       // runs before each test, inside its transaction
class BookRepositoryTest {

    // application.yml tells Flyway to connect as shelf_migrator, so the
    // container creates that user. @ServiceConnection supplies the same
    // credentials to the DataSource.
    @Container
    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withUsername("shelf_migrator")
            .withPassword("shelf-migrator-pass");

    @Autowired
    BookRepository books;

    @Test
    void finds_an_authors_books_in_title_order() {
        assertThat(books.findByAuthor(100))
                .extracting(Book::title)
                .containsExactly("Alpha", "Beta");
    }

    @Test
    void returns_empty_instead_of_throwing_when_nothing_matches() {
        assertThat(books.findById(987_654)).isEmpty();
    }

    @Test
    void returns_the_generated_id() {
        long id = books.insert(new NewBook(
                "9999999999999", "Gamma", 100, LocalDate.of(2020, 1, 1), new BigDecimal("9.50"), 1));

        assertThat(books.findById(id))
                .get()
                .extracting(Book::title, Book::price)
                .containsExactly("Gamma", new BigDecimal("9.50"));
    }

    @Test
    void reports_whether_an_update_matched_a_row() {
        assertThat(books.updatePrice(987_654, BigDecimal.ONE)).isFalse();
    }
}`,
  },
  {
    path: 'shelf-api/src/test/resources/books-fixture.sql',
    lang: 'sql',
    note: 'Test data with ids no migration uses, so it cannot collide with seed rows.',
    code: `INSERT INTO author (id, name, born_year) VALUES (100, 'Test Author', 1970);

INSERT INTO book (isbn, title, author_id, published_on, price, copies_available) VALUES
    ('1000000000001', 'Beta',  100, '2011-01-01', 5.00, 1),
    ('1000000000002', 'Alpha', 100, '2010-01-01', 6.00, 2);`,
  },
];
