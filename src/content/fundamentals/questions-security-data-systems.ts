import type { QaQuestion } from '@/content/qa/types';

/** Security, data and systems. Answers are plain text; `backticks` mark inline code. */
export const questionsSecurityDataSystems: QaQuestion[] = [
  // ── Security and cryptography ─────────────────────────────────────────
  {
    id: 'what-is-hashing',
    topic: 'security',
    difficulty: 'basic',
    question: "What is hashing, and what is a collision?",
    answer:
      "A hash function maps input of any size to a fixed-size output, deterministically. Hash tables use fast hashes to find buckets in O(1); cryptographic hashes such as SHA-256 are one-way and collision-resistant, used for integrity and fingerprints. A collision is two different inputs with the same hash — unavoidable in principle because the output is fixed-size, but infeasible to find for a good cryptographic hash.",
    chapter: 'hashing',
  },
  {
    id: 'md5-sha1',
    topic: 'security',
    difficulty: 'intermediate',
    question: "Is MD5 still acceptable to use?",
    answer:
      "Not for anything security-related: practical collisions exist for MD5 and SHA-1, so they cannot guarantee integrity against an attacker, and they are far too fast for passwords. They are acceptable only as non-security checksums or cache keys. Use SHA-256 or better for integrity, and bcrypt or Argon2 for passwords.",
    chapter: 'hashing',
  },
  {
    id: 'hashing-vs-encryption',
    topic: 'security',
    difficulty: 'basic',
    question: "What is the difference between encoding, hashing and encryption?",
    answer:
      "Encoding (Base64, URL encoding) changes the representation of data so a system can carry it; anyone can reverse it and it provides no security. Hashing produces a one-way, fixed-size fingerprint with no key; it is used for integrity and, with slow salted algorithms, for passwords. Encryption transforms data so only someone with the key can reverse it; it is used when you need the original back, such as data in transit or secrets at rest.",
    points: ["Is a JWT encrypted? (Usually it is only signed and Base64URL-encoded.)"],
    chapter: 'encoding-hashing-encryption',
  },
  {
    id: 'base64-not-security',
    topic: 'security',
    difficulty: 'basic',
    question: "A config file stores passwords in Base64 and calls them encrypted. What is wrong?",
    answer:
      "Base64 is an encoding, not encryption: anyone can decode it instantly, and there is no key. Secrets should come from a secrets manager or an encrypted store at run time, be excluded from the repository, and be rotated if they were ever committed.",
    chapter: 'encoding-hashing-encryption',
  },
  {
    id: 'symmetric-vs-asymmetric',
    topic: 'security',
    difficulty: 'basic',
    question: "What is the difference between symmetric and asymmetric encryption?",
    answer:
      "Symmetric encryption (AES, ChaCha20) uses one shared key to encrypt and decrypt; it is fast but both sides must already share the key. Asymmetric encryption (RSA, elliptic curves) uses a key pair: data encrypted with the public key can only be decrypted with the private key, which solves key distribution but is much slower. Real systems combine them: asymmetric cryptography to agree on a key, symmetric encryption for the data.",
    chapter: 'symmetric-and-asymmetric-encryption',
  },
  {
    id: 'forward-secrecy',
    topic: 'security',
    difficulty: 'advanced',
    question: "What is forward secrecy?",
    answer:
      "A property where each session's keys are derived from ephemeral key-exchange values (ECDHE) that are discarded afterwards. Even if a server's long-term private key is stolen later, previously recorded traffic cannot be decrypted. TLS 1.3 always provides it.",
    chapter: 'symmetric-and-asymmetric-encryption',
  },
  {
    id: 'aes-gcm',
    topic: 'security',
    difficulty: 'intermediate',
    question: "What should you watch for when encrypting data with AES?",
    answer:
      "Use an authenticated mode such as AES-GCM, which also detects tampering; never ECB, which leaks patterns. Use a unique random nonce or IV for every encryption and never reuse one with the same key. Generate keys with a secure random source, keep them in a KMS or secrets manager rather than in code, and rotate them. Prefer well-reviewed libraries over custom schemes.",
    chapter: 'symmetric-and-asymmetric-encryption',
  },
  {
    id: 'hmac-vs-signature',
    topic: 'security',
    difficulty: 'intermediate',
    question: "What is the difference between an HMAC and a digital signature?",
    answer:
      "An HMAC is computed with a shared secret key; anyone who can verify it can also create one, so it proves the sender knew the secret. A digital signature is created with a private key and verified with the public key; anyone can verify, but only the key holder can sign, which gives non-repudiation. HMAC suits webhooks between two parties; signatures suit tokens verified by many services and software releases.",
    chapter: 'signatures-and-certificates',
  },
  {
    id: 'certificate-chain',
    topic: 'security',
    difficulty: 'intermediate',
    question: "How does a client decide to trust a server certificate?",
    answer:
      "It builds a chain from the server certificate through intermediate CA certificates to a root CA in its trust store, checking every signature. It also checks the validity dates, that the requested hostname matches a subject alternative name, the key usage, and optionally revocation. In Java, 'PKIX path building failed' means that chain could not be built to a trusted root.",
    chapter: 'signatures-and-certificates',
  },
  {
    id: 'tls-handshake',
    topic: 'security',
    difficulty: 'intermediate',
    question: "Explain the TLS handshake.",
    answer:
      "The client sends a hello with supported versions, cipher suites, the server name (SNI) and a key share. The server replies with its choice and its key share; both derive shared keys with ECDHE. The server sends its certificate and a signature over the handshake, proving it holds the certificate's private key. The client verifies the chain, hostname and signature, both sides send Finished messages, and application data flows encrypted with symmetric keys. TLS 1.3 does this in one round trip.",
    points: ["What does mTLS add?", "Where does TLS terminate in your architecture?"],
    chapter: 'tls-and-https',
  },
  {
    id: 'what-https-protects',
    topic: 'security',
    difficulty: 'basic',
    question: "What does HTTPS protect, and what does it not?",
    answer:
      "HTTPS protects the confidentiality and integrity of data in transit and authenticates the server. It does not hide the IP address you connect to, usually not the hostname, and it does nothing about the security of the server or client themselves — injection, weak authorization or stolen tokens are still possible.",
    chapter: 'tls-and-https',
  },
  {
    id: 'password-storage',
    topic: 'security',
    difficulty: 'basic',
    question: "How should passwords be stored?",
    answer:
      "As salted hashes from a deliberately slow password-hashing function — Argon2id, bcrypt or scrypt — with a tuned cost factor. Never in plain text, encoded or reversibly encrypted, and never with a fast hash such as SHA-256. The salt is random per user and stored with the hash; the algorithm and parameters are stored too so they can be upgraded. Add rate limiting and MFA on top.",
    points: ["What is a salt for? What is a pepper?"],
    chapter: 'storing-passwords',
  },
  {
    id: 'why-not-sha256-passwords',
    topic: 'security',
    difficulty: 'intermediate',
    question: "Why is SHA-256 a poor choice for hashing passwords?",
    answer:
      "Because it is designed to be fast: attackers with GPUs can test billions of guesses per second against leaked hashes, and unsalted hashes can be looked up in precomputed tables. Password-hashing functions are deliberately slow and often memory-hard, so each guess costs far more, while a single legitimate login still takes only a fraction of a second.",
    chapter: 'storing-passwords',
  },
  {
    id: 'authn-vs-authz',
    topic: 'security',
    difficulty: 'basic',
    question: "What is the difference between authentication and authorization?",
    answer:
      "Authentication establishes who the caller is — with a password, a passkey, a certificate or a token — and failure is a 401. Authorization decides what that identity may do — through roles, permissions or ownership checks — and failure is a 403. Authentication usually happens once; authorization must be checked on every request, on the server.",
    chapter: 'authentication-and-authorization',
  },
  {
    id: 'session-vs-jwt',
    topic: 'security',
    difficulty: 'intermediate',
    question: "Session cookies or JWTs — what are the trade-offs?",
    answer:
      "A server-side session keeps state on the server and gives the client an opaque id in a cookie: easy to revoke, but it needs a shared store to scale. A JWT is a signed, self-contained token: any instance can verify it without a lookup, but it cannot easily be revoked before it expires and its contents are readable. Use short-lived access tokens with refresh tokens, validate signature, expiry, issuer and audience, and never put secrets in a JWT.",
    chapter: 'authentication-and-authorization',
  },
  {
    id: 'oauth-oidc',
    topic: 'security',
    difficulty: 'intermediate',
    question: "What is the difference between OAuth 2 and OpenID Connect?",
    answer:
      "OAuth 2 is a framework for delegated authorization: an application obtains an access token to call an API on a user's behalf without learning their password. OpenID Connect is a layer on top for authentication: it adds an ID token describing who the user is, which is what 'Sign in with Google' uses. For user-facing apps use the authorization code flow with PKCE; for service-to-service calls use client credentials.",
    chapter: 'authentication-and-authorization',
  },
  {
    id: 'sql-injection',
    topic: 'security',
    difficulty: 'basic',
    question: "What is SQL injection and how do you prevent it?",
    answer:
      "It happens when untrusted input is concatenated into a SQL string, letting an attacker change the query — for example `' OR '1'='1` returning every row. Prevent it with parameterised queries (`?` placeholders, named parameters, JPA queries with parameters), which keep input as data. Allow-list anything that cannot be a parameter, such as sort columns, and give the database user minimal privileges.",
    chapter: 'common-vulnerabilities',
  },
  {
    id: 'xss-vs-csrf',
    topic: 'security',
    difficulty: 'intermediate',
    question: "What is the difference between XSS and CSRF?",
    answer:
      "XSS (cross-site scripting) injects attacker-controlled script into your pages, which runs in other users' browsers with your site's privileges — prevented by context-aware output escaping, a Content-Security-Policy and HttpOnly cookies. CSRF (cross-site request forgery) makes a victim's browser send a request to your site from another site, with the victim's cookies attached — prevented by CSRF tokens, SameSite cookies and not changing state on GET.",
    chapter: 'common-vulnerabilities',
  },
  {
    id: 'ssrf',
    topic: 'security',
    difficulty: 'advanced',
    question: "What is SSRF and why is it dangerous in the cloud?",
    answer:
      "Server-side request forgery tricks your server into requesting a URL of the attacker's choosing — typically internal addresses such as the cloud metadata endpoint (`169.254.169.254`), which can expose credentials, or internal admin services. Defend with destination allow-lists, blocking private, loopback and link-local addresses after resolving and after redirects, isolating fetchers from the internal network, and requiring IMDSv2 on AWS.",
    chapter: 'common-vulnerabilities',
  },
  {
    id: 'idor',
    topic: 'security',
    difficulty: 'intermediate',
    question: "What is an IDOR, and how do you prevent it?",
    answer:
      "An insecure direct object reference lets a user access another user's data by changing an identifier, such as `/invoices/1042` to `/invoices/1043`, because the server checks only that the user is logged in. Prevent it by checking ownership or permission for every object on the server — for example querying by id and owner — denying by default, and testing access rules.",
    chapter: 'common-vulnerabilities',
  },

  // ── Data and algorithms ────────────────────────────────────────────────
  {
    id: 'big-o-meaning',
    topic: 'data',
    difficulty: 'basic',
    question: "What does Big-O notation describe? Give common examples.",
    answer:
      "How the work or memory an algorithm needs grows with the input size, ignoring constants. O(1): a hash-map lookup. O(log n): binary search or an index lookup. O(n): one pass over the data. O(n log n): efficient sorting. O(n²): nested loops over the same data, which becomes unusable at large sizes.",
    chapter: 'big-o',
  },
  {
    id: 'nested-loop-fix',
    topic: 'data',
    difficulty: 'intermediate',
    question: "A report joins 100,000 orders to 50,000 customers with nested loops and takes minutes. How do you fix it?",
    answer:
      "The nested loops are O(n × m) — billions of comparisons. Build a hash map of customers by id once (O(m)) and look each order's customer up in O(1), making the whole job O(n + m). Better still, let the database do the join with proper indexes and fetch only what the report needs.",
    chapter: 'big-o',
  },
  {
    id: 'n-plus-one-general',
    topic: 'data',
    difficulty: 'intermediate',
    question: "What is the N+1 query problem?",
    answer:
      "Loading a list with one query and then running one more query per item — often through lazy loading — so N items cost N+1 round trips to the database. It is fast in development with few rows and slow in production. Fix it with a join or fetch join, batch loading (`IN` queries), or a projection that returns everything in one query.",
    chapter: 'big-o',
  },
  {
    id: 'array-vs-linked-list',
    topic: 'data',
    difficulty: 'basic',
    question: "Array or linked list — what are the trade-offs?",
    answer:
      "Arrays give O(1) access by index and contiguous memory that CPUs cache well, but inserting or removing in the middle is O(n). Linked lists allow O(1) insertion and removal at a known node, but access by index is O(n) and every node has pointer overhead and poor locality. In practice array-based lists win most workloads.",
    chapter: 'data-structures',
  },
  {
    id: 'stack-vs-queue',
    topic: 'data',
    difficulty: 'basic',
    question: "What is the difference between a stack and a queue? Give uses of each.",
    answer:
      "A stack is last-in, first-out: push and pop at the top — used for undo, parsing and matching brackets, depth-first search, and the call stack. A queue is first-in, first-out: add at the back, remove from the front — used for task processing, breadth-first search, buffering and message brokers.",
    chapter: 'data-structures',
  },
  {
    id: 'heap-use',
    topic: 'data',
    difficulty: 'intermediate',
    question: "What is a heap (priority queue) good for?",
    answer:
      "A heap always gives the smallest (or largest) element in O(1) and inserts or removes in O(log n), without keeping everything fully sorted. It is used for schedulers and job priorities, merging sorted streams, Dijkstra's shortest path, and finding the top K items efficiently with a heap of size K.",
    chapter: 'data-structures',
  },
  {
    id: 'bfs-vs-dfs',
    topic: 'data',
    difficulty: 'intermediate',
    question: "What is the difference between BFS and DFS?",
    answer:
      "Breadth-first search explores neighbours level by level using a queue; it finds the shortest path in an unweighted graph. Depth-first search follows one path as deep as possible before backtracking, using a stack or recursion; it is used for cycle detection, topological sorting (build or dependency order) and exploring all paths.",
    chapter: 'data-structures',
  },
  {
    id: 'binary-search',
    topic: 'data',
    difficulty: 'basic',
    question: "How does binary search work, and what does it require?",
    answer:
      "It requires sorted data. Compare the target with the middle element and discard the half that cannot contain it, repeating until found or the range is empty — O(log n). Compute the middle as `(low + high) >>> 1` to avoid integer overflow. The same idea powers index lookups and `git bisect`.",
    chapter: 'searching-sorting-recursion',
  },
  {
    id: 'merge-vs-quick-sort',
    topic: 'data',
    difficulty: 'intermediate',
    question: "Compare merge sort and quicksort.",
    answer:
      "Both average O(n log n). Merge sort is always O(n log n), stable, and needs O(n) extra memory — suited to linked data and external sorting. Quicksort sorts in place and is very fast in practice, but has an O(n²) worst case with bad pivots and is not stable. Java uses Timsort (a stable merge-sort variant) for objects and dual-pivot quicksort for primitives.",
    chapter: 'searching-sorting-recursion',
  },
  {
    id: 'recursion-stack-overflow',
    topic: 'data',
    difficulty: 'intermediate',
    question: "Why can recursion cause a `StackOverflowError`, and how do you avoid it?",
    answer:
      "Each recursive call adds a frame to the thread's limited stack, so recursion as deep as the data — a long chain or a degenerate tree — or a missing base case exhausts it. Java does not optimise tail calls. Convert to a loop, use an explicit stack (such as `ArrayDeque`), or restructure to reduce depth; raising `-Xss` is only a stop-gap.",
    chapter: 'searching-sorting-recursion',
  },
  {
    id: 'how-index-works',
    topic: 'data',
    difficulty: 'basic',
    question: "How does a database index work, and why not index every column?",
    answer:
      "Most indexes are B-trees: sorted, shallow trees mapping column values to row locations, turning a full table scan into an O(log n) lookup and also supporting ranges and ordering. Every index must be updated on insert, update and delete and takes space, so too many indexes slow writes. Index the columns your queries filter, join and sort on.",
    points: ["What is the left-most prefix rule for composite indexes?", "Why does `WHERE LOWER(email) = ?` not use an index on email?"],
    chapter: 'databases-and-indexes',
  },
  {
    id: 'sql-vs-nosql',
    topic: 'data',
    difficulty: 'intermediate',
    question: "When would you choose a NoSQL database over a relational one?",
    answer:
      "Start relational for most applications: joins, constraints, transactions and flexible queries. Choose NoSQL for a clear reason — a key–value store for very fast simple lookups (Redis), a document store for self-contained aggregates with varying shape, a wide-column store for massive write volume across many nodes (Cassandra), a search engine for full-text search, or a graph database for relationship traversal — accepting weaker joins or transactions.",
    chapter: 'databases-and-indexes',
  },
  {
    id: 'normalisation',
    topic: 'data',
    difficulty: 'basic',
    question: "What is normalisation, and when would you denormalise?",
    answer:
      "Normalisation organises tables so each fact is stored once — a customer's address in the customer table rather than in every order — avoiding inconsistencies when data changes. Denormalisation deliberately duplicates data to make frequent reads faster or simpler, for example in reporting tables or read models, at the cost of keeping copies in sync.",
    chapter: 'databases-and-indexes',
  },
  {
    id: 'acid',
    topic: 'data',
    difficulty: 'basic',
    question: "What does ACID stand for?",
    answer:
      "Atomicity: all of a transaction's changes happen or none do. Consistency: constraints and rules hold before and after. Isolation: concurrent transactions do not see each other's intermediate state, to the degree the isolation level promises. Durability: once committed, changes survive crashes, thanks to the write-ahead log.",
    chapter: 'transactions-and-isolation',
  },
  {
    id: 'isolation-levels-general',
    topic: 'data',
    difficulty: 'intermediate',
    question: "Explain the transaction isolation levels and the anomalies they prevent.",
    answer:
      "Read Uncommitted allows dirty reads. Read Committed prevents dirty reads but allows non-repeatable reads and phantoms; it is the default in PostgreSQL, Oracle and SQL Server. Repeatable Read prevents non-repeatable reads (and in MySQL InnoDB, its default, largely phantoms too). Serializable prevents all of them, at the cost of concurrency and occasional aborted transactions that must be retried. Lost updates need extra care at the lower levels.",
    chapter: 'transactions-and-isolation',
  },
  {
    id: 'optimistic-vs-pessimistic',
    topic: 'data',
    difficulty: 'intermediate',
    question: "Optimistic or pessimistic locking — how do they work and when do you use each?",
    answer:
      "Optimistic locking reads without locking and checks a version column when writing (`WHERE version = ?`); if another transaction changed the row, the update affects zero rows and the caller retries or reports a conflict — good when conflicts are rare, such as user edits. Pessimistic locking takes a lock when reading (`SELECT … FOR UPDATE`) so others wait — good when conflicts are frequent and the critical section is short.",
    chapter: 'transactions-and-isolation',
  },

  // ── Systems and engineering practice ───────────────────────────────────
  {
    id: 'vertical-vs-horizontal',
    topic: 'systems',
    difficulty: 'basic',
    question: "What is the difference between vertical and horizontal scaling?",
    answer:
      "Vertical scaling adds resources to one machine; it is simple but has a ceiling and remains a single point of failure. Horizontal scaling adds more machines behind a load balancer; it grows further and adds redundancy but requires stateless services and shared state stores. Start simple, and design so horizontal scaling is possible.",
    chapter: 'scaling',
  },
  {
    id: 'stateless-service',
    topic: 'systems',
    difficulty: 'basic',
    question: "Why should web services be stateless?",
    answer:
      "So any instance can serve any request: instances can be added, removed, restarted or deployed without losing user data, and load balancing needs no stickiness. State such as sessions, carts and files belongs in shared stores — a database, Redis or object storage — or in signed tokens.",
    chapter: 'scaling',
  },
  {
    id: 'sharding',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "What is database sharding, and what are its costs?",
    answer:
      "Sharding splits data across several databases by a shard key (such as tenant or customer id), by range, hash or a lookup directory, so each shard handles part of the load. Costs: queries and transactions that span shards become hard, unique constraints and joins across shards are lost, hot keys can overload one shard, and re-sharding is a major effort. Try indexes, caching, bigger machines and read replicas first.",
    chapter: 'scaling',
  },
  {
    id: 'consistent-hashing',
    topic: 'systems',
    difficulty: 'advanced',
    question: "What is consistent hashing and why is it used?",
    answer:
      "Nodes and keys are placed on a hash ring, and each key belongs to the next node clockwise. When a node is added or removed, only the keys next to it move — about 1/N of them — whereas `hash mod N` would remap almost everything. Virtual nodes spread load evenly. It is used by distributed caches, Cassandra, DynamoDB and load balancers.",
    chapter: 'scaling',
  },
  {
    id: 'read-replica-lag',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "A user updates their profile but still sees the old version. Reads go to replicas. What is happening?",
    answer:
      "Replication lag: the write went to the primary, and the replica the read hit has not applied it yet. Fixes include reading from the primary for a short time after a user writes (read-your-writes), routing that user's reads to the primary, or returning the updated data directly from the write request.",
    chapter: 'scaling',
  },
  {
    id: 'cap-theorem',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "Explain the CAP theorem.",
    answer:
      "In a distributed data store, when a network partition separates nodes, the system must choose between consistency — rejecting or delaying requests so no one reads stale data — and availability — answering every request, possibly with stale data, and reconciling later. Partitions are unavoidable, so the real choice is C or A during one. PACELC adds that even without partitions there is a trade-off between latency and consistency.",
    points: ["Is the C in CAP the same as the C in ACID? (No.)"],
    chapter: 'consistency-cap-idempotency',
  },
  {
    id: 'eventual-consistency',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "What is eventual consistency? Give an example.",
    answer:
      "A guarantee that if no new updates occur, all copies of the data will converge to the same value, though reads in the meantime may be stale. Examples: DNS changes propagating through caches, read replicas lagging the primary, and an order service learning about a payment through an event a moment after the payment service recorded it.",
    chapter: 'consistency-cap-idempotency',
  },
  {
    id: 'idempotency-general',
    topic: 'systems',
    difficulty: 'basic',
    question: "What is idempotency, and how do you make a message consumer idempotent?",
    answer:
      "An operation is idempotent if performing it several times has the same effect as once. Because messaging and retries deliver at least once, consumers must tolerate duplicates: record processed message ids in a table with a unique constraint in the same transaction as the work, prefer absolute updates (`status = PAID`) over relative ones, use idempotency keys for API requests, and use conditional writes.",
    chapter: 'consistency-cap-idempotency',
  },
  {
    id: 'exactly-once',
    topic: 'systems',
    difficulty: 'advanced',
    question: "Is exactly-once delivery possible?",
    answer:
      "Not as a network guarantee across arbitrary systems: a sender cannot distinguish a lost message from a lost acknowledgement, so it must either risk loss (at most once) or risk duplicates (at least once). Systems achieve exactly-once processing within their boundary by combining at-least-once delivery with deduplication or transactions (for example Kafka transactions). External side effects such as emails still need idempotency.",
    chapter: 'consistency-cap-idempotency',
  },
  {
    id: 'outbox-saga',
    topic: 'systems',
    difficulty: 'advanced',
    question: "How do you keep data consistent across microservices without distributed transactions?",
    answer:
      "Use the transactional outbox to write a business change and its event in one local transaction, then publish the event reliably. Coordinate multi-step business processes as sagas: a series of local transactions with compensating actions (refund, release stock) when a later step fails. Make every consumer idempotent and add reconciliation jobs as a safety net. Two-phase commit is usually avoided because it couples services and blocks on failures.",
    chapter: 'consistency-cap-idempotency',
  },
  {
    id: 'why-queue',
    topic: 'systems',
    difficulty: 'basic',
    question: "Why would you put work on a message queue instead of doing it in the request?",
    answer:
      "To respond quickly while slow work happens in the background, to decouple the producer from consumers that may be down, to absorb traffic bursts (load levelling), to scale workers independently, and to retry failures transparently. The costs are eventual consistency, duplicate handling and more infrastructure to operate.",
    chapter: 'queues-and-async-processing',
  },
  {
    id: 'queue-vs-topic',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "What is the difference between a queue and a publish–subscribe topic?",
    answer:
      "In a queue (point-to-point), each message is delivered to one of possibly many competing consumers — used to distribute work. In publish–subscribe, each message is delivered to every subscriber — used for events that several services react to. Kafka offers both: every consumer group gets every message, and partitions are shared among instances within a group.",
    chapter: 'queues-and-async-processing',
  },
  {
    id: 'dead-letter-queue',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "What is a dead-letter queue, and why is it needed?",
    answer:
      "A place where messages go after failing processing a set number of times. Without it, a permanently failing ('poison') message is retried forever and can block the queue or partition. The DLQ keeps the message and error for inspection, alerting and replay after a fix, while healthy messages keep flowing. Retry transient errors with backoff first.",
    chapter: 'queues-and-async-processing',
  },
  {
    id: 'message-ordering',
    topic: 'systems',
    difficulty: 'advanced',
    question: "How do you keep messages in order while processing them in parallel?",
    answer:
      "Order only what needs ordering: give related messages the same key (for example the order id) so they go to the same partition or message group, which is processed sequentially, while different keys are processed in parallel. Global ordering would force a single consumer. Consumers should also tolerate occasional out-of-order or duplicate events, for example with version numbers.",
    chapter: 'queues-and-async-processing',
  },
  {
    id: 'timeouts-retries',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "How should timeouts and retries be configured for service-to-service calls?",
    answer:
      "Every remote call needs connect and read timeouts based on the dependency's normal latency, and a caller's timeout should exceed the time its downstream calls may take. Retry only transient failures of idempotent operations, a small number of times, with exponential backoff and jitter, and only at one layer to avoid multiplying load. Combine with circuit breakers so a failing dependency is not hammered.",
    chapter: 'failure-and-resilience',
  },
  {
    id: 'circuit-breaker',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "What is a circuit breaker?",
    answer:
      "A wrapper around calls to a dependency that tracks failures. While the failure rate is acceptable it is closed and calls pass through; when it exceeds a threshold it opens and fails calls immediately (often with a fallback), protecting your threads and giving the dependency time to recover; after a wait it goes half-open and lets a few trial calls decide whether to close again.",
    chapter: 'failure-and-resilience',
  },
  {
    id: 'cascading-failure',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "What is a cascading failure, and how do you prevent it?",
    answer:
      "A failure that spreads: a slow dependency makes callers wait, their threads and connections run out, they stop responding, and their callers fail in turn. Prevent it with timeouts, bulkheads that limit how many resources each dependency can consume, circuit breakers, load shedding and rate limiting, backoff with jitter on retries, and graceful degradation for non-essential features.",
    chapter: 'failure-and-resilience',
  },
  {
    id: 'rate-limiting',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "How does rate limiting work?",
    answer:
      "It caps the number of requests a client may make in a period. A token bucket adds tokens at a fixed rate up to a burst size, and each request spends one; a sliding window counts requests in a moving time window. Excess requests get `429 Too Many Requests`, ideally with `Retry-After`. Across several instances, counters live in a shared store such as Redis or at the gateway.",
    chapter: 'failure-and-resilience',
  },
  {
    id: 'testing-pyramid',
    topic: 'systems',
    difficulty: 'basic',
    question: "What is the testing pyramid?",
    answer:
      "A guideline to have many fast unit tests at the base, fewer integration tests in the middle (real databases or brokers, for example with Testcontainers), and a small number of end-to-end tests at the top, because tests become slower, more brittle and harder to diagnose as they grow. Contract tests help services agree on APIs without full end-to-end runs.",
    chapter: 'how-teams-ship-software',
  },
  {
    id: 'ci-vs-cd',
    topic: 'systems',
    difficulty: 'basic',
    question: "What is the difference between continuous integration, continuous delivery and continuous deployment?",
    answer:
      "Continuous integration builds and tests every change merged into the main branch, so problems surface quickly. Continuous delivery keeps every passing build ready to release and promotes the same artefact through environments, with a manual release decision. Continuous deployment releases every passing change to production automatically, usually with canaries, feature flags and automatic rollback.",
    chapter: 'how-teams-ship-software',
  },
  {
    id: 'deployment-strategies',
    topic: 'systems',
    difficulty: 'intermediate',
    question: "Compare rolling, blue–green and canary deployments.",
    answer:
      "Rolling replaces instances a few at a time — simple, but old and new versions run together. Blue–green runs a complete new environment alongside the old and switches all traffic at once, allowing instant rollback at the cost of double capacity. Canary sends a small share of traffic to the new version and widens it while metrics stay healthy. In all of them, database changes must be backward-compatible.",
    chapter: 'how-teams-ship-software',
  },
  {
    id: 'logs-metrics-traces',
    topic: 'systems',
    difficulty: 'basic',
    question: "What are logs, metrics and traces, and when do you use each?",
    answer:
      "Logs are detailed records of individual events — use them to understand what happened in a specific request. Metrics are numeric time series such as request rate, error rate and latency percentiles — use them for dashboards and alerts. Traces follow one request across services with timing for each hop — use them to find where time was spent. Linking them with a trace id makes investigation much faster.",
    chapter: 'how-teams-ship-software',
  },
];
