import type { DemoProject } from '@/lib/types';
import { shelfSetupFiles } from './shelf-setup';
import { shelfPlainFiles } from './shelf-plain';
import { shelfSpringFiles } from './shelf-spring';

/**
 * Shelf — the MySQL project behind the Spring JDBC section.
 *
 * The same small domain (books, authors, loans) is accessed twice: once with
 * raw java.sql, once with Spring JDBC, so each chapter can show what the
 * framework removes and what it cannot.
 */
export const shelf: DemoProject = {
  id: 'shelf',
  name: 'Shelf',
  tagline: 'Spring JDBC on MySQL, from DriverManager to JdbcClient',
  description:
    'A small library catalogue on MySQL 8.4. The data access is written twice: first with plain JDBC — Statement, PreparedStatement, CallableStatement, generated keys, batching and a hand-written transaction with a savepoint — and then with Spring JDBC: JdbcTemplate, NamedParameterJdbcTemplate, JdbcClient, SimpleJdbcInsert and SimpleJdbcCall, chunked batch upserts, a streaming report, declarative transactions with deadlock retry, and a @JdbcTest against real MySQL. It is the project the Spring JDBC chapters walk through.',
  stack: ['Spring Boot 3.4', 'Java 21', 'Spring JDBC', 'MySQL 8.4', 'HikariCP', 'Flyway', 'Testcontainers'],
  files: [...shelfSetupFiles, ...shelfPlainFiles, ...shelfSpringFiles],
};
