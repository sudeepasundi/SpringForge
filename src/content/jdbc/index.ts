export type JdbcLevel = 'beginner' | 'intermediate' | 'advanced';

export interface JdbcChapter {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  level: JdbcLevel;
  /** Course lessons that go further; lesson paths, checked by tests. */
  lessons: string[];
  /** Shelf files the chapter walks through; checked by tests. */
  demoFiles: string[];
}

export const jdbcLevels: { id: JdbcLevel; label: string; blurb: string }[] = [
  { id: 'beginner', label: 'Beginner', blurb: 'What JDBC is, getting MySQL running, and the core interfaces' },
  { id: 'intermediate', label: 'Intermediate', blurb: 'Procedures, transactions, and Spring’s JDBC helpers' },
  { id: 'advanced', label: 'Advanced', blurb: 'Batching, streaming, error handling, testing and production' },
];

const API = 'shelf-api/src/main/java/dev/springforge/shelf';

/** In reading order. Levels must not go backwards; a test checks it. */
export const jdbcChapters: JdbcChapter[] = [
  {
    slug: 'what-is-jdbc',
    title: 'What JDBC Is',
    summary:
      'The API and the driver, DriverManager and DataSource, and where plain JDBC sits under Spring JDBC, Spring Data JDBC and JPA.',
    minutes: 10,
    level: 'beginner',
    lessons: ['data/jpa-fundamentals'],
    demoFiles: [],
  },
  {
    slug: 'setting-up-mysql',
    title: 'Setting Up MySQL',
    summary:
      'MySQL 8.4 in Docker, users and grants, the driver dependency, the JDBC URL and its parameters, Spring Boot datasource settings, HikariCP and Flyway.',
    minutes: 16,
    level: 'beginner',
    lessons: ['data/migrations', 'foundations/environment-setup'],
    demoFiles: [
      'shelf-db/docker-compose.yml',
      'shelf-db/init/01-users.sql',
      'shelf-api/pom.xml',
      'shelf-api/src/main/resources/application.yml',
    ],
  },
  {
    slug: 'connection-statement-resultset',
    title: 'Connection, Statement and ResultSet',
    summary:
      'Opening and closing resources safely, the three execute methods, reading a ResultSet, type mapping and NULL handling.',
    minutes: 14,
    level: 'beginner',
    lessons: [],
    demoFiles: [`${API}/plain/PlainJdbcBookDao.java`, `${API}/book/Book.java`],
  },
  {
    slug: 'prepared-statement',
    title: 'PreparedStatement',
    summary:
      'Parameters, why string concatenation is an SQL injection, nulls and dates, and reading back generated keys.',
    minutes: 13,
    level: 'beginner',
    lessons: ['security/security-hardening'],
    demoFiles: [`${API}/plain/PlainJdbcBookDao.java`],
  },
  {
    slug: 'callable-statement',
    title: 'CallableStatement and Stored Procedures',
    summary:
      'Writing MySQL procedures and calling them with IN, OUT and INOUT parameters, including procedures that return rows.',
    minutes: 12,
    level: 'intermediate',
    lessons: [],
    demoFiles: [
      'shelf-api/src/main/resources/db/migration/V3__loan_procedures.sql',
      `${API}/plain/ProcedureCalls.java`,
    ],
  },
  {
    slug: 'jdbc-transactions',
    title: 'Transactions in Plain JDBC',
    summary: 'Auto-commit, commit and rollback, savepoints, and isolation levels on InnoDB.',
    minutes: 12,
    level: 'intermediate',
    lessons: ['data/transactions'],
    demoFiles: [`${API}/plain/PlainJdbcCheckout.java`],
  },
  {
    slug: 'jdbc-template',
    title: 'JdbcTemplate',
    summary:
      'The core Spring JDBC class: queries, updates, RowMapper, ResultSetExtractor, RowCallbackHandler, and the empty-result trap.',
    minutes: 16,
    level: 'intermediate',
    lessons: [],
    demoFiles: [`${API}/book/BookRepository.java`, `${API}/report/InventoryReport.java`],
  },
  {
    slug: 'named-parameters-and-jdbc-client',
    title: 'NamedParameterJdbcTemplate and JdbcClient',
    summary:
      'Named parameters, parameter sources, IN lists, the fluent JdbcClient API, and which of the three to use.',
    minutes: 14,
    level: 'intermediate',
    lessons: [],
    demoFiles: [`${API}/author/AuthorRepository.java`, `${API}/loan/LoanRepository.java`],
  },
  {
    slug: 'keys-and-simple-jdbc',
    title: 'Inserts, Keys, SimpleJdbcInsert and SimpleJdbcCall',
    summary:
      'Getting generated keys back with KeyHolder, metadata-driven inserts, and calling procedures without CallableStatement code.',
    minutes: 11,
    level: 'intermediate',
    lessons: [],
    demoFiles: [`${API}/author/AuthorRepository.java`, `${API}/loan/LoanService.java`],
  },
  {
    slug: 'batching-and-large-results',
    title: 'Batching and Large Results',
    summary:
      'executeBatch and batchUpdate, why MySQL needs rewriteBatchedStatements, chunking and upserts, and streaming big reads.',
    minutes: 15,
    level: 'advanced',
    lessons: ['production/performance-tuning'],
    demoFiles: [`${API}/catalog/CatalogImporter.java`, `${API}/report/InventoryReport.java`],
  },
  {
    slug: 'spring-transactions-and-errors',
    title: 'Spring Transactions and Exceptions',
    summary:
      '@Transactional over JDBC, the DataAccessException hierarchy, how MySQL error codes are translated, and retrying deadlocks.',
    minutes: 14,
    level: 'advanced',
    lessons: ['data/transactions', 'spring-core/aop-proxies'],
    demoFiles: [`${API}/loan/LoanService.java`, `${API}/loan/BorrowFacade.java`],
  },
  {
    slug: 'testing-and-production',
    title: 'Testing and Production',
    summary:
      '@JdbcTest with Testcontainers MySQL, pool sizing, timeouts, SQL logging, leak detection, and when to move up to Spring Data JDBC or JPA.',
    minutes: 15,
    level: 'advanced',
    lessons: ['testing/testcontainers', 'production/performance-tuning'],
    demoFiles: [
      'shelf-api/src/test/java/dev/springforge/shelf/book/BookRepositoryTest.java',
      'shelf-api/src/main/resources/application.yml',
    ],
  },
  {
    slug: 'method-reference',
    title: 'Method Reference',
    summary:
      'Every core JDBC interface and method, and every JdbcTemplate, NamedParameterJdbcTemplate and JdbcClient method, in lookup tables.',
    minutes: 12,
    level: 'advanced',
    lessons: [],
    demoFiles: [],
  },
];

export function getJdbcChapter(slug: string | undefined): JdbcChapter | undefined {
  return jdbcChapters.find((c) => c.slug === slug);
}

export function jdbcChapterNumber(slug: string): number {
  return jdbcChapters.findIndex((c) => c.slug === slug) + 1;
}
