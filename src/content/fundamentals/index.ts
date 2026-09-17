import type { Chapter, ChapterBook } from '@/content/chapters/types';

type Entry = Omit<Chapter, 'demoFiles'>;

/** In reading order, part by part. Levels never go backwards within a part. */
const chapters: Entry[] = [
  // ── Part 1 — How computers run your code ─────────────────────────────
  {
    slug: 'processes-and-threads',
    title: 'Programs, Processes and Threads',
    summary:
      'What the operating system does when you run a program, how processes and threads differ, context switches, and CPU-bound versus I/O-bound work.',
    minutes: 13,
    level: 'beginner',
    group: 'os',
    lessons: ['production/virtual-threads'],
  },
  {
    slug: 'memory',
    title: 'Memory: Stack, Heap and Virtual Memory',
    summary:
      'Where your variables live, how virtual memory and paging work, what swap does to performance, and why programs run out of memory.',
    minutes: 13,
    level: 'beginner',
    group: 'os',
    lessons: ['production/jvm-memory'],
  },
  {
    slug: 'blocking-and-async-io',
    title: 'Blocking, Non-blocking and Async I/O',
    summary:
      'Why threads spend most of their time waiting, synchronous versus asynchronous calls, event loops, and how servers handle thousands of connections.',
    minutes: 12,
    level: 'intermediate',
    group: 'os',
    lessons: ['web-rest/reactive-intro', 'production/virtual-threads'],
  },
  {
    slug: 'race-conditions-and-locks',
    title: 'Race Conditions and Locks',
    summary:
      'What goes wrong when two threads share data, critical sections, mutexes and semaphores, atomic operations — told through a bank balance.',
    minutes: 13,
    level: 'intermediate',
    group: 'os',
    lessons: [],
  },
  {
    slug: 'deadlock',
    title: 'Deadlock',
    summary:
      'The four conditions that cause it, how to prevent and detect it, and the deadlocks you will actually meet: in threads, in databases and between services.',
    minutes: 14,
    level: 'intermediate',
    group: 'os',
    lessons: ['data/transactions', 'redis-ops/distributed-locks'],
  },
  {
    slug: 'caching-and-latency',
    title: 'Caching and the Latency Ladder',
    summary:
      'The memory hierarchy, the latency numbers every developer should know, cache hits and misses, eviction policies like LRU, and cache invalidation.',
    minutes: 13,
    level: 'intermediate',
    group: 'os',
    lessons: ['data/caching-redis', 'edge/edge-caching-and-limits'],
  },

  // ── Part 2 — Networking and the web ───────────────────────────────────
  {
    slug: 'network-layers',
    title: 'Network Layers',
    summary:
      'The OSI and TCP/IP models without the memorisation: what each layer does, packets and encapsulation, and which layer your bug is in.',
    minutes: 12,
    level: 'beginner',
    group: 'network',
    lessons: [],
  },
  {
    slug: 'ip-ports-subnets-nat',
    title: 'IP Addresses, Ports, Subnets and NAT',
    summary:
      'IPv4 and IPv6, CIDR notation, private ranges, ports and sockets, NAT, and why localhost and 0.0.0.0 behave so differently in containers.',
    minutes: 14,
    level: 'beginner',
    group: 'network',
    lessons: ['cloud-native/containerising'],
  },
  {
    slug: 'tcp-vs-udp',
    title: 'TCP versus UDP',
    summary:
      'The three-way handshake, how TCP makes delivery reliable, flow and congestion control, connection states like TIME_WAIT, and when UDP is the better choice.',
    minutes: 14,
    level: 'intermediate',
    group: 'network',
    lessons: [],
  },
  {
    slug: 'dns',
    title: 'DNS',
    summary:
      'How a name becomes an address, record types, TTLs and caching, service discovery by DNS, and why so many outages turn out to be DNS.',
    minutes: 12,
    level: 'intermediate',
    group: 'network',
    lessons: ['microservices-fundamentals/service-discovery'],
  },
  {
    slug: 'http',
    title: 'HTTP in Depth',
    summary:
      'Requests and responses, methods and idempotency, status codes, headers, cookies, keep-alive and connection pools, and HTTP/1.1 versus 2 versus 3.',
    minutes: 16,
    level: 'intermediate',
    group: 'network',
    lessons: ['web-rest/request-lifecycle', 'web-rest/api-design', 'edge/tls-and-http2'],
  },
  {
    slug: 'what-happens-when-you-type-a-url',
    title: 'What Happens When You Type a URL',
    summary:
      'The classic interview question answered end to end: DNS, TCP, TLS, HTTP, load balancers, the application, the database, and back to rendering.',
    minutes: 12,
    level: 'intermediate',
    group: 'network',
    lessons: ['web-rest/request-lifecycle'],
  },
  {
    slug: 'proxies-load-balancers-cdns',
    title: 'Proxies, Load Balancers and CDNs',
    summary:
      'Forward and reverse proxies, layer 4 versus layer 7 load balancing, algorithms, health checks, sticky sessions, and what a CDN caches.',
    minutes: 13,
    level: 'intermediate',
    group: 'network',
    lessons: ['edge/nginx-reverse-proxy', 'microservices-fundamentals/api-gateway'],
  },
  {
    slug: 'communication-styles',
    title: 'REST, WebSockets, SSE, gRPC and Polling',
    summary:
      'Ways for programs to talk, how each works on the wire, and how to choose between request–response, streaming and push.',
    minutes: 12,
    level: 'intermediate',
    group: 'network',
    lessons: ['microservices-fundamentals/communication-styles'],
  },

  // ── Part 3 — Security and cryptography ─────────────────────────────────
  {
    slug: 'hashing',
    title: 'Hashing',
    summary:
      'What a hash function is, the properties that matter, and where hashing is used: hash tables, checksums, deduplication, caching keys and integrity.',
    minutes: 12,
    level: 'beginner',
    group: 'security',
    lessons: [],
  },
  {
    slug: 'encoding-hashing-encryption',
    title: 'Encoding, Hashing and Encryption',
    summary:
      'Three things beginners mix up: what each one is for, whether it can be reversed, and why Base64 is never security.',
    minutes: 10,
    level: 'beginner',
    group: 'security',
    lessons: [],
  },
  {
    slug: 'symmetric-and-asymmetric-encryption',
    title: 'Symmetric and Asymmetric Encryption',
    summary:
      'AES, RSA and elliptic curves, the key-distribution problem, Diffie–Hellman key exchange, and why real systems combine both kinds.',
    minutes: 14,
    level: 'intermediate',
    group: 'security',
    lessons: [],
  },
  {
    slug: 'signatures-and-certificates',
    title: 'MACs, Digital Signatures and Certificates',
    summary:
      'Proving who sent a message and that it was not changed: HMAC, digital signatures, certificates, certificate authorities and chains of trust.',
    minutes: 13,
    level: 'intermediate',
    group: 'security',
    lessons: ['security/jwt-oauth2'],
  },
  {
    slug: 'tls-and-https',
    title: 'TLS and HTTPS',
    summary:
      'The TLS handshake step by step, what the padlock actually guarantees, certificate errors you will see, termination at a proxy, and mutual TLS.',
    minutes: 14,
    level: 'intermediate',
    group: 'security',
    lessons: ['edge/tls-and-http2', 'edge/service-mesh'],
  },
  {
    slug: 'storing-passwords',
    title: 'Storing Passwords',
    summary:
      'Why passwords are hashed, not encrypted; salts; why fast hashes like SHA-256 are wrong; bcrypt, scrypt and Argon2; and what to do after a breach.',
    minutes: 11,
    level: 'intermediate',
    group: 'security',
    lessons: ['security/authentication'],
  },
  {
    slug: 'authentication-and-authorization',
    title: 'Authentication and Authorization',
    summary:
      'Who you are versus what you may do: sessions and cookies, tokens and JWTs, OAuth 2 and OpenID Connect in plain words, and least privilege.',
    minutes: 15,
    level: 'intermediate',
    group: 'security',
    lessons: ['security/authentication', 'security/authorization', 'security/jwt-oauth2'],
  },
  {
    slug: 'common-vulnerabilities',
    title: 'Common Vulnerabilities',
    summary:
      'The mistakes attackers look for first — injection, XSS, CSRF, SSRF, broken access control, leaked secrets — with the fix for each.',
    minutes: 15,
    level: 'intermediate',
    group: 'security',
    lessons: ['security/security-hardening', 'security/filter-chain'],
  },

  // ── Part 4 — Data and algorithms ──────────────────────────────────────
  {
    slug: 'big-o',
    title: 'Big-O in Practice',
    summary:
      'Reading time and space complexity without the maths anxiety, the common classes, and how an innocent nested loop takes down production.',
    minutes: 12,
    level: 'beginner',
    group: 'data',
    lessons: ['data/n-plus-one'],
  },
  {
    slug: 'data-structures',
    title: 'Core Data Structures',
    summary:
      'Arrays, linked lists, stacks, queues, hash tables, trees, heaps, graphs and tries — how each works and the problem it is good at.',
    minutes: 16,
    level: 'beginner',
    group: 'data',
    lessons: [],
  },
  {
    slug: 'searching-sorting-recursion',
    title: 'Searching, Sorting and Recursion',
    summary:
      'Linear and binary search, the sorting algorithms worth knowing and stability, and recursion — including why it overflows the stack.',
    minutes: 13,
    level: 'intermediate',
    group: 'data',
    lessons: [],
  },
  {
    slug: 'databases-and-indexes',
    title: 'Databases and Indexes',
    summary:
      'Relational versus NoSQL, keys and normalisation, how a B-tree index speeds up a query, composite indexes, and reading a query plan.',
    minutes: 15,
    level: 'intermediate',
    group: 'data',
    lessons: ['data/jpa-fundamentals', 'data/n-plus-one'],
  },
  {
    slug: 'transactions-and-isolation',
    title: 'Transactions, ACID and Isolation',
    summary:
      'What ACID promises, the anomalies isolation levels prevent, locking versus MVCC, and optimistic versus pessimistic locking.',
    minutes: 15,
    level: 'intermediate',
    group: 'data',
    lessons: ['data/transactions'],
  },

  // ── Part 5 — Systems and engineering practice ─────────────────────────
  {
    slug: 'scaling',
    title: 'Scaling a System',
    summary:
      'Vertical versus horizontal scaling, stateless services, read replicas, sharding and partitioning, and consistent hashing.',
    minutes: 15,
    level: 'intermediate',
    group: 'systems',
    lessons: ['microservices-fundamentals/why-microservices', 'kafka-ops/topics-and-retention'],
  },
  {
    slug: 'consistency-cap-idempotency',
    title: 'Consistency, CAP and Idempotency',
    summary:
      'What the CAP theorem really says, PACELC, strong versus eventual consistency, and why idempotency matters more than exactly-once.',
    minutes: 14,
    level: 'advanced',
    group: 'systems',
    lessons: ['event-driven/idempotency', 'kafka-ops/brokers-and-replication'],
  },
  {
    slug: 'queues-and-async-processing',
    title: 'Queues and Asynchronous Processing',
    summary:
      'Why systems put work on a queue, point-to-point versus publish–subscribe, delivery guarantees, ordering, dead letters and back-pressure.',
    minutes: 13,
    level: 'advanced',
    group: 'systems',
    lessons: ['event-driven/messaging-foundations', 'event-driven/outbox-pattern'],
  },
  {
    slug: 'failure-and-resilience',
    title: 'Failure and Resilience',
    summary:
      'Everything fails: timeouts, retries with backoff and jitter, circuit breakers, bulkheads, rate limiting and graceful degradation.',
    minutes: 13,
    level: 'advanced',
    group: 'systems',
    lessons: ['resilience/failure-modes', 'resilience/retries-timeouts', 'resilience/circuit-breakers'],
  },
  {
    slug: 'how-teams-ship-software',
    title: 'How Teams Ship Software',
    summary:
      'Git and branching, pull requests and code review, the testing pyramid, CI/CD, environments, and logs, metrics and traces once it is live.',
    minutes: 14,
    level: 'advanced',
    group: 'systems',
    lessons: ['testing/testing-strategy', 'cloud-native/cicd', 'observability/observability-model'],
  },
];

export const fundamentalsBook: ChapterBook = {
  id: 'fundamentals',
  basePath: '/fundamentals',
  title: 'Fundamentals',
  intro:
    'The computer-science background that interviews and production incidents assume — written for developers who came from electronics, electrical or another non-CS branch. Every chapter answers why it matters, how it works, and when you will meet it.',
  tags: 'fundamentals computer-science cs basics',
  groups: [
    { id: 'os', label: 'Part 1 · How Computers Run Your Code', blurb: 'Processes, memory, I/O, concurrency and caching' },
    { id: 'network', label: 'Part 2 · Networking and the Web', blurb: 'From IP packets to HTTP, DNS and load balancers' },
    { id: 'security', label: 'Part 3 · Security and Cryptography', blurb: 'Hashing, encryption, TLS, passwords and common attacks' },
    { id: 'data', label: 'Part 4 · Data and Algorithms', blurb: 'Complexity, data structures, databases and transactions' },
    { id: 'systems', label: 'Part 5 · Systems and Engineering Practice', blurb: 'Scaling, consistency, queues, resilience and shipping' },
  ],
  chapters: chapters.map((c) => ({ ...c, demoFiles: [] })),
};
