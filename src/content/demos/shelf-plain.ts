import type { DemoFile } from '@/lib/types';

/**
 * Plain JDBC, with no Spring helpers: the java.sql interfaces used directly.
 * The Spring chapters show what JdbcTemplate removes from this code; reading
 * this first is what makes that worth anything.
 */
export const shelfPlainFiles: DemoFile[] = [
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/book/Book.java',
    lang: 'java',
    note: 'Records as row types: immutable, with an accessor per column.',
    code: `package dev.springforge.shelf.book;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One row of the book table. */
public record Book(
        long id,
        String isbn,
        String title,
        long authorId,
        LocalDate publishedOn,        // DATE, nullable
        BigDecimal price,             // DECIMAL — never double for money
        int copiesAvailable) {
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/book/NewBook.java',
    lang: 'java',
    note: 'The input shape has no id — the database assigns it.',
    code: `package dev.springforge.shelf.book;

import java.math.BigDecimal;
import java.time.LocalDate;

/** What a caller provides to create a book; the database assigns the id. */
public record NewBook(
        String isbn,
        String title,
        long authorId,
        LocalDate publishedOn,
        BigDecimal price,
        int copies) {
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/plain/PlainJdbcBookDao.java',
    lang: 'java',
    note: 'Statement for fixed SQL, PreparedStatement for anything with input, try-with-resources for everything.',
    code: `package dev.springforge.shelf.plain;

import dev.springforge.shelf.book.Book;
import dev.springforge.shelf.book.NewBook;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * CRUD with nothing but java.sql. Every resource is opened in a
 * try-with-resources block, so it is closed even when an exception is thrown —
 * and the Connection goes back to the pool instead of leaking.
 */
public class PlainJdbcBookDao {

    private static final String COLUMNS =
            "id, isbn, title, author_id, published_on, price, copies_available";

    private final DataSource dataSource;

    public PlainJdbcBookDao(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** Statement: acceptable only because the SQL contains no input at all. */
    public int countBooks() throws SQLException {
        try (Connection con = dataSource.getConnection();
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM book")) {
            rs.next();                      // the cursor starts BEFORE the first row
            return rs.getInt(1);            // columns are 1-based
        }
    }

    /** PreparedStatement: the value travels separately from the SQL text. */
    public Optional<Book> findByIsbn(String isbn) throws SQLException {
        String sql = "SELECT " + COLUMNS + " FROM book WHERE isbn = ?";
        try (Connection con = dataSource.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, isbn);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public List<Book> findCheaperThan(java.math.BigDecimal limit) throws SQLException {
        String sql = "SELECT " + COLUMNS + " FROM book WHERE price < ? ORDER BY price";
        try (Connection con = dataSource.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setBigDecimal(1, limit);
            try (ResultSet rs = ps.executeQuery()) {
                List<Book> books = new ArrayList<>();
                while (rs.next()) {
                    books.add(map(rs));
                }
                return books;
            }
        }
    }

    /** INSERT, and read back the AUTO_INCREMENT id MySQL assigned. */
    public long insert(NewBook book) throws SQLException {
        String sql = """
                INSERT INTO book (isbn, title, author_id, published_on, price, copies_available)
                VALUES (?, ?, ?, ?, ?, ?)
                """;
        try (Connection con = dataSource.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, book.isbn());
            ps.setString(2, book.title());
            ps.setLong(3, book.authorId());
            // setObject with a java.time value; passing the SQL type makes a
            // null value work too, instead of needing a separate setNull call.
            ps.setObject(4, book.publishedOn(), Types.DATE);
            ps.setBigDecimal(5, book.price());
            ps.setInt(6, book.copies());

            ps.executeUpdate();             // returns the number of rows changed

            try (ResultSet keys = ps.getGeneratedKeys()) {
                keys.next();
                return keys.getLong(1);
            }
        }
    }

    /** executeUpdate for UPDATE and DELETE: the return value is the row count. */
    public boolean updatePrice(long id, java.math.BigDecimal price) throws SQLException {
        try (Connection con = dataSource.getConnection();
             PreparedStatement ps = con.prepareStatement("UPDATE book SET price = ? WHERE id = ?")) {
            ps.setBigDecimal(1, price);
            ps.setLong(2, id);
            return ps.executeUpdate() == 1;
        }
    }

    /** Batching: many parameter sets, one round trip (per batch). */
    public int insertAll(List<NewBook> books) throws SQLException {
        String sql = "INSERT INTO book (isbn, title, author_id, price, copies_available) VALUES (?, ?, ?, ?, ?)";
        try (Connection con = dataSource.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            for (NewBook b : books) {
                ps.setString(1, b.isbn());
                ps.setString(2, b.title());
                ps.setLong(3, b.authorId());
                ps.setBigDecimal(4, b.price());
                ps.setInt(5, b.copies());
                ps.addBatch();
            }
            // With rewriteBatchedStatements=true each count is SUCCESS_NO_INFO (-2),
            // because MySQL executed one multi-row INSERT.
            int[] counts = ps.executeBatch();
            return counts.length;
        }
    }

    static Book map(ResultSet rs) throws SQLException {
        return new Book(
                rs.getLong("id"),
                rs.getString("isbn"),
                rs.getString("title"),
                rs.getLong("author_id"),
                // getObject(…, LocalDate.class) returns null for SQL NULL.
                // getDate(…) would too, but as a legacy java.sql.Date.
                rs.getObject("published_on", LocalDate.class),
                rs.getBigDecimal("price"),
                rs.getInt("copies_available"));
    }
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/plain/PlainJdbcCheckout.java',
    lang: 'java',
    note: 'A transaction by hand: auto-commit off, commit on success, rollback on any failure, and a savepoint for the optional step.',
    code: `package dev.springforge.shelf.plain;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.sql.Statement;
import java.time.LocalDate;

/**
 * Borrowing a book is two writes that must succeed together: take a copy off
 * the shelf, and record the loan. JDBC's default is auto-commit — every
 * statement is its own transaction — so both writes need one explicit
 * transaction around them.
 */
public class PlainJdbcCheckout {

    private final DataSource dataSource;

    public PlainJdbcCheckout(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public long checkout(long bookId, long memberId) throws SQLException {
        try (Connection con = dataSource.getConnection()) {
            boolean previousAutoCommit = con.getAutoCommit();
            con.setAutoCommit(false);                                   // BEGIN
            con.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
            try {
                takeCopy(con, bookId);
                long loanId = insertLoan(con, bookId, memberId);

                // The audit row is nice to have. If it fails, undo only it —
                // not the checkout — by rolling back to a savepoint.
                Savepoint beforeAudit = con.setSavepoint("before_audit");
                try {
                    insertAudit(con, loanId, "checked out");
                } catch (SQLException auditFailed) {
                    con.rollback(beforeAudit);
                }

                con.commit();                                           // COMMIT
                return loanId;
            } catch (SQLException | RuntimeException e) {
                con.rollback();                                         // ROLLBACK
                throw e;
            } finally {
                // The pool reuses this connection. Leave it as we found it.
                con.setAutoCommit(previousAutoCommit);
            }
        }
    }

    private void takeCopy(Connection con, long bookId) throws SQLException {
        String sql = "UPDATE book SET copies_available = copies_available - 1 "
                + "WHERE id = ? AND copies_available > 0";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, bookId);
            if (ps.executeUpdate() == 0) {
                // A conditional UPDATE is both the check and the change, so two
                // people cannot take the last copy at the same time.
                throw new IllegalStateException("No copies of book " + bookId + " available");
            }
        }
    }

    private long insertLoan(Connection con, long bookId, long memberId) throws SQLException {
        String sql = "INSERT INTO loan (book_id, member_id, due_on) VALUES (?, ?, ?)";
        try (PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, bookId);
            ps.setLong(2, memberId);
            ps.setObject(3, LocalDate.now().plusDays(21));
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                keys.next();
                return keys.getLong(1);
            }
        }
    }

    private void insertAudit(Connection con, long loanId, String note) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement(
                "INSERT INTO loan_audit (loan_id, note) VALUES (?, ?)")) {
            ps.setLong(1, loanId);
            ps.setString(2, note);
            ps.executeUpdate();
        }
    }
}`,
  },
  {
    path: 'shelf-api/src/main/java/dev/springforge/shelf/plain/ProcedureCalls.java',
    lang: 'java',
    note: 'CallableStatement for IN, OUT and INOUT parameters, and for a procedure that returns rows.',
    code: `package dev.springforge.shelf.plain;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

/** Calling the procedures created in V3__loan_procedures.sql. */
public class ProcedureCalls {

    public record BookSummary(long id, String isbn, String title, BigDecimal price, int copies) { }

    private final DataSource dataSource;

    public ProcedureCalls(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** IN parameters plus one OUT parameter. */
    public long checkout(long bookId, long memberId, int days) throws SQLException {
        try (Connection con = dataSource.getConnection()) {
            // With auto-commit on, MySQL commits each statement INSIDE the
            // procedure separately — the UPDATE could stick while the INSERT
            // fails. Wrap the call in a transaction.
            con.setAutoCommit(false);
            try (CallableStatement cs = con.prepareCall("{call checkout_book(?, ?, ?, ?)}")) {
                cs.setLong(1, bookId);
                cs.setLong(2, memberId);
                cs.setInt(3, days);
                cs.registerOutParameter(4, Types.BIGINT);   // declare OUT before executing

                cs.execute();
                long loanId = cs.getLong(4);
                con.commit();
                return loanId;
            } catch (SQLException | RuntimeException e) {
                // SIGNAL SQLSTATE '45000' in the procedure arrives here:
                // e.getSQLState() is "45000", e.getMessage() the MESSAGE_TEXT.
                // Catch runtime exceptions too: setAutoCommit(true) below would
                // otherwise COMMIT whatever the procedure had already done.
                con.rollback();
                throw e;
            } finally {
                con.setAutoCommit(true);
            }
        }
    }

    /** INOUT: the same parameter carries a value in and the result out. */
    public BigDecimal discounted(BigDecimal price, int percent) throws SQLException {
        try (Connection con = dataSource.getConnection();
             CallableStatement cs = con.prepareCall("{call apply_discount(?, ?)}")) {
            cs.setBigDecimal(1, price);
            cs.registerOutParameter(1, Types.DECIMAL);
            cs.setInt(2, percent);
            cs.execute();
            return cs.getBigDecimal(1);
        }
    }

    /** A procedure that SELECTs: its rows come back as a ResultSet. */
    public List<BookSummary> booksByAuthor(long authorId) throws SQLException {
        try (Connection con = dataSource.getConnection();
             CallableStatement cs = con.prepareCall("{call books_by_author(?)}")) {
            cs.setLong(1, authorId);

            // execute() returns true when the first result is a ResultSet.
            boolean hasResultSet = cs.execute();
            List<BookSummary> books = new ArrayList<>();
            if (hasResultSet) {
                try (ResultSet rs = cs.getResultSet()) {
                    while (rs.next()) {
                        books.add(new BookSummary(
                                rs.getLong("id"),
                                rs.getString("isbn"),
                                rs.getString("title"),
                                rs.getBigDecimal("price"),
                                rs.getInt("copies_available")));
                    }
                }
            }
            return books;
        }
    }
}`,
  },
];
