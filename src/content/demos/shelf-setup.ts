import type { DemoFile } from '@/lib/types';

/**
 * Shelf's environment: MySQL in Docker, the Maven build, Spring's datasource
 * configuration, and the Flyway migrations that create the schema, seed it, and
 * add the stored procedures the CallableStatement chapter uses.
 */
export const shelfSetupFiles: DemoFile[] = [
  {
    path: 'shelf-db/docker-compose.yml',
    lang: 'yaml',
    note: 'MySQL 8.4 LTS on your machine, in UTC, with utf8mb4 — the three settings that prevent the most confusing bugs later.',
    code: `# Start MySQL for Shelf:
#   docker compose -f shelf-db/docker-compose.yml up -d
#   docker exec -it shelf-mysql mysql -ushelf_app -p shelf
services:
  mysql:
    image: mysql:8.4                      # the current long-term-support release
    container_name: shelf-mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root-pass-local-only
      MYSQL_DATABASE: shelf               # created on first start
      TZ: UTC
    command:
      # Store and compare times in UTC. A server in local time plus a JVM in
      # another zone is how an 11:00 loan comes back as 10:00.
      - --default-time-zone=+00:00
      # utf8mb4 is real UTF-8. MySQL's old "utf8" is 3 bytes and rejects emoji.
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_0900_ai_ci
    volumes:
      # Every .sql file here runs once, when the data volume is first created.
      - ./init:/docker-entrypoint-initdb.d:ro
      - shelf-data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -uroot -p$$MYSQL_ROOT_PASSWORD"]
      interval: 5s
      retries: 20

volumes:
  shelf-data: {}`,
  },
  {
    path: 'shelf-db/init/01-users.sql',
    lang: 'sql',
    note: 'Two users: one that may change the schema, one that may only use it. The application never connects as root.',
    code: `-- Runs once, as root, when the container's data volume is created.

-- Flyway connects as this user: it needs to create tables and procedures.
CREATE USER IF NOT EXISTS 'shelf_migrator'@'%' IDENTIFIED BY 'shelf-migrator-pass';
GRANT ALL PRIVILEGES ON shelf.* TO 'shelf_migrator'@'%';

-- The application connects as this one: data only, plus EXECUTE for the
-- stored procedures. A SQL injection bug in the app cannot drop a table.
CREATE USER IF NOT EXISTS 'shelf_app'@'%' IDENTIFIED BY 'shelf-app-pass';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON shelf.* TO 'shelf_app'@'%';

FLUSH PRIVILEGES;`,
  },
  {
    path: 'shelf-api/pom.xml',
    lang: 'xml',
    note: 'spring-boot-starter-jdbc brings JdbcTemplate, JdbcClient, HikariCP and transaction support. The MySQL driver is runtime-only.',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.1</version>
    </parent>

    <groupId>dev.springforge</groupId>
    <artifactId>shelf-api</artifactId>
    <version>0.1.0</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <!-- JdbcTemplate, NamedParameterJdbcTemplate, JdbcClient,
             HikariCP and DataSourceTransactionManager. -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>

        <!-- The MySQL JDBC driver. runtime scope: your code talks to the
             java.sql interfaces, never to driver classes. -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Flyway needs its MySQL module since Flyway 10. -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-mysql</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-testcontainers</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>mysql</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`,
  },
  {
    path: 'shelf-api/src/main/resources/application.yml',
    lang: 'yaml',
    note: 'Every URL parameter here is there for a reason; the setup chapter explains each one.',
    code: `spring:
  application:
    name: shelf

  datasource:
    # jdbc:mysql://HOST:PORT/DATABASE?param=value&param=value — one line, no spaces.
    #   connectionTimeZone=UTC               interpret TIMESTAMPs as UTC
    #   forceConnectionTimeZoneToSession     ...and set the session time zone to match
    #   rewriteBatchedStatements=true        send batches as multi-row INSERTs (much faster)
    #   sslMode=DISABLED                     local development only
    #   allowPublicKeyRetrieval=true         needed for MySQL 8 auth without TLS; local only
    url: jdbc:mysql://localhost:3306/shelf?connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true&rewriteBatchedStatements=true&sslMode=DISABLED&allowPublicKeyRetrieval=true
    username: shelf_app
    password: \${SHELF_DB_PASSWORD:shelf-app-pass}
    # driver-class-name is detected from the URL; you do not need to set it.

    hikari:
      pool-name: shelf-pool
      maximum-pool-size: 10               # more is rarely faster; see the production chapter
      minimum-idle: 10                    # a fixed-size pool behaves predictably
      # Hikari settings are plain milliseconds.
      connection-timeout: 3000            # fail fast when the pool is exhausted
      max-lifetime: 1500000               # 25 min: below MySQL wait_timeout and any proxy idle timeout
      leak-detection-threshold: 20000     # log a stack trace for connections held over 20 s
      data-source-properties:
        cachePrepStmts: true
        prepStmtCacheSize: 250
        prepStmtCacheSqlLimit: 2048
        useServerPrepStmts: true

  flyway:
    # Migrations run as the user that is allowed to change the schema.
    user: shelf_migrator
    password: \${SHELF_MIGRATOR_PASSWORD:shelf-migrator-pass}

  jdbc:
    template:
      query-timeout: 5s                   # applied to every JdbcTemplate statement

logging:
  level:
    # Logs every SQL statement JdbcTemplate executes, with its parameters.
    org.springframework.jdbc.core.JdbcTemplate: DEBUG
    org.springframework.jdbc.core.StatementCreatorUtils: TRACE`,
  },
  {
    path: 'shelf-api/src/main/resources/db/migration/V1__create_schema.sql',
    lang: 'sql',
    note: 'InnoDB tables with real constraints. The generated column on loan is how MySQL expresses "one open loan per member per book".',
    code: `CREATE TABLE author (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(200) NOT NULL,
    born_year   SMALLINT     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_author_name (name)
) ENGINE = InnoDB;

CREATE TABLE book (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    isbn              CHAR(13)      NOT NULL,
    title             VARCHAR(300)  NOT NULL,
    author_id         BIGINT        NOT NULL,
    published_on      DATE          NULL,
    price             DECIMAL(10,2) NOT NULL,        -- never FLOAT for money
    copies_available  INT           NOT NULL DEFAULT 0,
    created_at        TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_book_isbn (isbn),
    KEY ix_book_author (author_id),
    CONSTRAINT fk_book_author FOREIGN KEY (author_id) REFERENCES author (id),
    CONSTRAINT ck_book_copies CHECK (copies_available >= 0)
) ENGINE = InnoDB;

CREATE TABLE member (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    email      VARCHAR(254) NOT NULL,
    full_name  VARCHAR(200) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_member_email (email)
) ENGINE = InnoDB;

CREATE TABLE loan (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    book_id      BIGINT       NOT NULL,
    member_id    BIGINT       NOT NULL,
    borrowed_at  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    due_on       DATE         NOT NULL,
    returned_at  TIMESTAMP(6) NULL,
    -- 1 while the loan is open, NULL once returned. A UNIQUE key allows any
    -- number of NULLs, so this enforces "one OPEN loan per member per book"
    -- while keeping the full history. (MySQL has no partial indexes.)
    open_marker  TINYINT AS (IF(returned_at IS NULL, 1, NULL)) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uk_loan_open (book_id, member_id, open_marker),
    KEY ix_loan_due (due_on),
    CONSTRAINT fk_loan_book   FOREIGN KEY (book_id)   REFERENCES book (id),
    CONSTRAINT fk_loan_member FOREIGN KEY (member_id) REFERENCES member (id)
) ENGINE = InnoDB;

CREATE TABLE loan_audit (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    loan_id    BIGINT       NOT NULL,
    note       VARCHAR(500) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_loan FOREIGN KEY (loan_id) REFERENCES loan (id)
) ENGINE = InnoDB;`,
  },
  {
    path: 'shelf-api/src/main/resources/db/migration/V2__seed_data.sql',
    lang: 'sql',
    note: 'A handful of rows so every example has something to return.',
    code: `INSERT INTO author (name, born_year) VALUES
    ('Ursula K. Le Guin', 1929),
    ('Terry Pratchett', 1948),
    ('Octavia E. Butler', 1947);

INSERT INTO book (isbn, title, author_id, published_on, price, copies_available) VALUES
    ('9780441478125', 'The Left Hand of Darkness', 1, '1969-03-01', 12.99, 3),
    ('9780060512750', 'The Dispossessed',          1, '1974-05-01', 14.50, 2),
    ('9780062225670', 'Small Gods',                2, '1992-01-01', 10.99, 4),
    ('9780062225687', 'Night Watch',               2, '2002-11-01', 11.99, 0),
    ('9780446675505', 'Parable of the Sower',      3, '1993-10-01', 15.00, 5);

INSERT INTO member (email, full_name) VALUES
    ('ada@example.com',   'Ada Lovelace'),
    ('grace@example.com', 'Grace Hopper');`,
  },
  {
    path: 'shelf-api/src/main/resources/db/migration/V3__loan_procedures.sql',
    lang: 'sql',
    note: 'Three procedures: one with IN and OUT parameters, one with an INOUT parameter, and one that returns a result set.',
    code: `-- Flyway understands DELIMITER for MySQL, so procedure bodies can contain ';'.
DELIMITER //

-- IN parameters and an OUT parameter.
CREATE PROCEDURE checkout_book(
    IN  p_book_id   BIGINT,
    IN  p_member_id BIGINT,
    IN  p_days      INT,
    OUT p_loan_id   BIGINT)
BEGIN
    UPDATE book
       SET copies_available = copies_available - 1
     WHERE id = p_book_id AND copies_available > 0;

    IF ROW_COUNT() = 0 THEN
        -- SQLSTATE 45000 is "user-defined error"; JDBC sees an SQLException.
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No copies available';
    END IF;

    INSERT INTO loan (book_id, member_id, due_on)
    VALUES (p_book_id, p_member_id, DATE_ADD(CURRENT_DATE, INTERVAL p_days DAY));

    SET p_loan_id = LAST_INSERT_ID();
END //

-- An INOUT parameter: the caller passes a value in and reads the result back.
CREATE PROCEDURE apply_discount(
    INOUT p_price   DECIMAL(10,2),
    IN    p_percent INT)
BEGIN
    SET p_price = ROUND(p_price * (100 - p_percent) / 100, 2);
END //

-- A procedure whose SELECT becomes a ResultSet for the caller.
CREATE PROCEDURE books_by_author(IN p_author_id BIGINT)
BEGIN
    SELECT id, isbn, title, price, copies_available
      FROM book
     WHERE author_id = p_author_id
     ORDER BY title;
END //

DELIMITER ;`,
  },
];
