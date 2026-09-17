import type { QaQuestion } from '@/content/qa/types';

/** Operating systems and networking. Answers are plain text; `backticks` mark inline code. */
export const questionsOsNetwork: QaQuestion[] = [
  // ── How computers run your code ────────────────────────────────────────
  {
    id: 'process-vs-thread',
    topic: 'os',
    difficulty: 'basic',
    question: "What is the difference between a process and a thread?",
    answer:
      "A process is a running program with its own isolated memory, open files and at least one thread; the OS keeps processes from reading each other's memory, so one crashing does not affect others. A thread is a path of execution inside a process; threads in the same process share its heap and resources but each has its own stack. Threads are cheaper to create and communicate through shared memory — which is also why they can have race conditions.",
    points: ["What is a context switch, and why is it costly?", "How do processes communicate? (Pipes, sockets, queues, shared files.)"],
    chapter: 'processes-and-threads',
  },
  {
    id: 'concurrency-vs-parallelism',
    topic: 'os',
    difficulty: 'basic',
    question: "What is the difference between concurrency and parallelism?",
    answer:
      "Concurrency is dealing with many tasks at once by interleaving them — possible even on one core. Parallelism is executing several tasks at the same instant on multiple cores. A web server needs concurrency to juggle many requests; a CPU-heavy computation benefits from parallelism.",
    chapter: 'processes-and-threads',
  },
  {
    id: 'cpu-vs-io-bound',
    topic: 'os',
    difficulty: 'intermediate',
    question: "What is the difference between CPU-bound and I/O-bound work, and why does it matter for thread pools?",
    answer:
      "CPU-bound work spends its time computing; running more threads than cores only adds context switches. I/O-bound work spends most of its time waiting on disks, networks or databases, using no CPU while it waits, so many more threads than cores are useful. Most web services are I/O-bound, which is why servers run hundreds of request threads — and why virtual threads help them.",
    chapter: 'processes-and-threads',
  },
  {
    id: 'stack-vs-heap-general',
    topic: 'os',
    difficulty: 'basic',
    question: "What is stored on the stack and what on the heap? What errors come from each?",
    answer:
      "Each thread's stack holds call frames with local variables and return addresses; it is small, fast, and freed automatically when methods return. The heap holds dynamically allocated objects shared across threads, freed by the garbage collector in Java. Deep or infinite recursion exhausts the stack (`StackOverflowError`); too much live data or a leak exhausts the heap (`OutOfMemoryError`).",
    chapter: 'memory',
  },
  {
    id: 'virtual-memory',
    topic: 'os',
    difficulty: 'intermediate',
    question: "What is virtual memory, and what is a page fault?",
    answer:
      "Virtual memory gives each process its own large, private address space. The OS and the CPU's memory-management unit map virtual pages (usually 4 KB) to physical frames through page tables, which isolates processes and lets them reserve more than they use. A page fault happens when a process touches a page not currently in RAM; the OS loads it — cheaply if it just needs a frame, very slowly if it must read it back from swap. Heavy swapping is called thrashing.",
    chapter: 'memory',
  },
  {
    id: 'oomkilled',
    topic: 'os',
    difficulty: 'intermediate',
    question: "A Java pod is `OOMKilled` but no `OutOfMemoryError` appears in the logs. Why?",
    answer:
      "The kernel killed the process for exceeding the container's memory limit (exit code 137) before the JVM could throw anything. The JVM's total memory is the heap plus metaspace, thread stacks, code cache and direct buffers, so a heap sized close to the limit leaves no room. Size the heap as a percentage of the limit (`-XX:MaxRAMPercentage`), leave headroom, and look at native memory if it keeps happening.",
    chapter: 'memory',
  },
  {
    id: 'blocking-vs-nonblocking',
    topic: 'os',
    difficulty: 'intermediate',
    question: "Explain blocking versus non-blocking I/O, and synchronous versus asynchronous.",
    answer:
      "Blocking I/O parks the thread until the operation completes; non-blocking I/O returns immediately and the program is told later (via a selector such as epoll) when data is ready. Synchronous means the caller waits for the result; asynchronous means it gets a future or callback and continues. They are different axes. Event loops (Netty, Node.js) use non-blocking I/O with few threads, and nothing on the loop may block; virtual threads let blocking-style code scale similarly.",
    chapter: 'blocking-and-async-io',
  },
  {
    id: 'event-loop',
    topic: 'os',
    difficulty: 'intermediate',
    question: "What is an event loop, and what is its main pitfall?",
    answer:
      "An event loop is a thread that repeatedly asks the OS which connections are ready and runs a small piece of work for each, so a handful of threads can serve thousands of connections. Its pitfall is blocking: one slow or blocking call (a JDBC query, `Thread.sleep`, heavy computation) on the loop stalls every connection it serves. Blocking work must be moved to a separate thread pool.",
    chapter: 'blocking-and-async-io',
  },
  {
    id: 'race-condition-general',
    topic: 'os',
    difficulty: 'basic',
    question: "What is a race condition? Give a real example.",
    answer:
      "A bug where the result depends on the timing of concurrent operations on shared, mutable state. Example: two payment requests both read a balance of 100, both see enough funds for 80, and both write 20 — paying out 160. Fix it by making the read-decide-write atomic: a lock in one process, or in a multi-instance service a single conditional `UPDATE … WHERE balance >= ?`, a row lock, or optimistic versioning.",
    points: ["Why do in-process locks not help when you run three instances?"],
    chapter: 'race-conditions-and-locks',
  },
  {
    id: 'mutex-vs-semaphore',
    topic: 'os',
    difficulty: 'intermediate',
    question: "What is the difference between a mutex and a semaphore?",
    answer:
      "A mutex allows exactly one holder at a time and is used to protect a critical section; it is released by the thread that acquired it. A semaphore holds N permits and allows up to N concurrent holders, typically to limit access to a resource such as a pool of connections. A semaphore with one permit behaves like a mutex but has no ownership.",
    chapter: 'race-conditions-and-locks',
  },
  {
    id: 'deadlock-conditions',
    topic: 'os',
    difficulty: 'basic',
    question: "What is a deadlock, and what are the four conditions for it?",
    answer:
      "A deadlock is a situation where each party in a cycle holds a resource and waits for one held by the next, so none can proceed. It requires all four Coffman conditions: mutual exclusion, hold and wait, no preemption, and circular wait. Breaking any one prevents it — most practically, acquiring locks in a consistent global order, or using timeouts.",
    points: ["What is the difference between deadlock, livelock and starvation?"],
    chapter: 'deadlock',
  },
  {
    id: 'deadlock-database',
    topic: 'os',
    difficulty: 'intermediate',
    question: "How do databases handle deadlocks, and what should the application do?",
    answer:
      "Databases detect cycles in their lock graph, choose a victim transaction and roll it back with an error (MySQL 1213, PostgreSQL `40P01`). The application should retry that transaction a few times, since it was fully rolled back, and reduce the likelihood by keeping transactions short, accessing rows in a consistent order, and having indexes so updates lock fewer rows.",
    chapter: 'deadlock',
  },
  {
    id: 'deadlock-debug',
    topic: 'os',
    difficulty: 'intermediate',
    question: "A service hangs with zero CPU usage. How would you investigate?",
    answer:
      "Low CPU with no progress means threads are waiting. Take a few thread dumps (`jcmd <pid> Thread.print`) and look for a reported Java-level deadlock, many threads blocked on the same lock, or all request threads waiting on a pool (database connections, an HTTP client) or on a slow downstream call without a timeout. Check database locks and connection-pool metrics too.",
    chapter: 'deadlock',
  },
  {
    id: 'latency-numbers',
    topic: 'os',
    difficulty: 'basic',
    question: "Roughly how do memory, disk and network latencies compare?",
    answer:
      "Orders of magnitude apart: a RAM read is around 100 nanoseconds, an SSD read around 100 microseconds, a round trip within a data centre around half a millisecond, a simple database query a few milliseconds, and a round trip between continents around 100 milliseconds. The takeaway is that network hops dominate request time, which is why caching and reducing round trips matter.",
    chapter: 'caching-and-latency',
  },
  {
    id: 'cache-invalidation',
    topic: 'os',
    difficulty: 'intermediate',
    question: "What is cache-aside, and how do you keep a cache from serving stale data?",
    answer:
      "Cache-aside means the application checks the cache, loads from the database on a miss, and stores the result. To limit staleness, evict or update the entry whenever the data is written, and keep a TTL as a safety net for missed invalidations. With several instances and in-process caches, every instance must be told — a shared cache such as Redis avoids that. Also plan for cache stampedes and cold starts.",
    points: ["How does an LRU cache work internally? (Hash map plus doubly linked list.)"],
    chapter: 'caching-and-latency',
  },
  {
    id: 'cache-stampede',
    topic: 'os',
    difficulty: 'advanced',
    question: "What is a cache stampede, and how do you prevent it?",
    answer:
      "When a popular entry expires, many concurrent requests miss at the same moment and all hit the database, which can overload it. Prevent it by letting only one request reload the value while others wait or get the stale value (request coalescing or a lock), refreshing popular entries before they expire, and adding random jitter to TTLs so entries do not expire together.",
    chapter: 'caching-and-latency',
  },

  // ── Networking and the web ─────────────────────────────────────────────
  {
    id: 'osi-model',
    topic: 'network',
    difficulty: 'basic',
    question: "Explain the OSI model (or the TCP/IP model).",
    answer:
      "The OSI model has seven layers: physical (bits), data link (frames, MAC addresses, Ethernet), network (packets, IP, routing), transport (TCP/UDP, ports), session, presentation (encoding, encryption) and application (HTTP, DNS). The TCP/IP model used on the internet collapses these into link, internet, transport and application. Each layer adds a header around the data from the layer above (encapsulation).",
    points: ["At which layer does a load balancer operate?", "Which layer is TLS?"],
    chapter: 'network-layers',
  },
  {
    id: 'connection-refused-vs-timeout',
    topic: 'network',
    difficulty: 'intermediate',
    question: "What is the difference between 'connection refused' and 'connection timed out'?",
    answer:
      "Connection refused means the host was reached but nothing is listening on that port (or it actively rejected the connection) — the reply was a TCP reset. Connection timed out means no reply arrived at all, typically because a firewall silently drops the packets, the host is down, or the address is unreachable. `UnknownHostException` points at DNS instead.",
    chapter: 'network-layers',
  },
  {
    id: 'cidr',
    topic: 'network',
    difficulty: 'basic',
    question: "What does `10.0.0.0/16` mean, and what are private IP ranges?",
    answer:
      "CIDR notation: the first 16 bits are the network, so `10.0.0.0/16` covers `10.0.0.0` to `10.0.255.255` — 65,536 addresses. Private ranges are `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16`; they are used inside networks and not routed on the public internet. `127.0.0.0/8` is loopback.",
    chapter: 'ip-ports-subnets-nat',
  },
  {
    id: 'localhost-vs-0000',
    topic: 'network',
    difficulty: 'intermediate',
    question: "Why does a server bound to `127.0.0.1` inside a Docker container not respond on the published port?",
    answer:
      "`127.0.0.1` is the container's own loopback interface, reachable only from inside it. Docker forwards published ports to the container's network interface, so the server must bind to `0.0.0.0` (all interfaces). Likewise, `localhost` inside a container refers to that container, so other services must be reached by their service name.",
    chapter: 'ip-ports-subnets-nat',
  },
  {
    id: 'nat',
    topic: 'network',
    difficulty: 'intermediate',
    question: "What is NAT and what are its consequences?",
    answer:
      "Network address translation lets many hosts with private addresses share one public IP: the router rewrites the source address and port of outgoing packets and maps replies back. Consequences: outside hosts cannot initiate connections to hosts behind NAT, many users appear to come from one IP (so IP-based rate limiting is crude), and cloud services in private subnets use a NAT gateway for outbound access.",
    chapter: 'ip-ports-subnets-nat',
  },
  {
    id: 'tcp-vs-udp',
    topic: 'network',
    difficulty: 'basic',
    question: "What is the difference between TCP and UDP? When would you use UDP?",
    answer:
      "TCP is connection-oriented and provides a reliable, ordered byte stream with retransmission, flow control and congestion control. UDP sends independent datagrams with no connection, no delivery or ordering guarantees and very low overhead. Use UDP when fresh data matters more than complete data (voice, video, games), for tiny request–response exchanges (DNS), or when the protocol adds its own reliability (QUIC, which HTTP/3 uses).",
    chapter: 'tcp-vs-udp',
  },
  {
    id: 'three-way-handshake',
    topic: 'network',
    difficulty: 'basic',
    question: "Explain the TCP three-way handshake.",
    answer:
      "The client sends SYN with its initial sequence number; the server replies SYN-ACK with its own sequence number and an acknowledgement of the client's; the client replies ACK. Both sides now agree on sequence numbers and the connection is established. It costs one round trip, which is why connections are reused through keep-alive and pools.",
    chapter: 'tcp-vs-udp',
  },
  {
    id: 'time-wait-close-wait',
    topic: 'network',
    difficulty: 'advanced',
    question: "What do many sockets in TIME_WAIT or CLOSE_WAIT indicate?",
    answer:
      "TIME_WAIT is normal on the side that closes first; huge numbers usually mean many short-lived outgoing connections, which can exhaust ephemeral ports — reuse connections with a pool. CLOSE_WAIT means the remote side closed but your application never closed its socket — a resource leak, often an HTTP response or stream that was not closed.",
    chapter: 'tcp-vs-udp',
  },
  {
    id: 'dns-resolution',
    topic: 'network',
    difficulty: 'basic',
    question: "How does DNS resolution work?",
    answer:
      "The application asks the OS resolver, which checks its cache and hosts file, then asks a recursive resolver. On a cache miss the recursive resolver queries a root server, which refers it to the TLD servers (for `.com`), which refer it to the domain's authoritative servers, which return the record. Every answer is cached along the way for its TTL.",
    points: ["What are A, AAAA, CNAME and MX records?", "Why can a DNS change take hours to take effect?"],
    chapter: 'dns',
  },
  {
    id: 'dns-ttl-migration',
    topic: 'network',
    difficulty: 'intermediate',
    question: "You are moving a service to a new IP. How do you use DNS TTLs to make the switch smooth?",
    answer:
      "Well before the move, lower the record's TTL (for example to 60 seconds) and wait at least the old TTL so caches pick up the short one. Then change the record; clients switch within about a minute. Afterwards raise the TTL again. Keep the old server running for a while, since some clients, JVMs and connection pools cache addresses longer.",
    chapter: 'dns',
  },
  {
    id: 'http-idempotent',
    topic: 'network',
    difficulty: 'basic',
    question: "Which HTTP methods are safe and which are idempotent? Why does it matter?",
    answer:
      "GET, HEAD and OPTIONS are safe (no changes) and idempotent. PUT and DELETE are idempotent but not safe. POST is neither, and PATCH is not necessarily idempotent. It matters for retries: an idempotent request can be retried after a timeout without side effects; a POST needs an idempotency key to avoid duplicates such as double charges.",
    chapter: 'http',
  },
  {
    id: '401-vs-403',
    topic: 'network',
    difficulty: 'basic',
    question: "What is the difference between HTTP 401 and 403? And between 502 and 504?",
    answer:
      "401 Unauthorized means the request is not authenticated — log in or send valid credentials. 403 Forbidden means the caller is known but not allowed. 502 Bad Gateway means a proxy got an invalid response (or none) from the upstream service; 504 Gateway Timeout means the upstream was too slow for the proxy's timeout.",
    chapter: 'http',
  },
  {
    id: 'http2-http3',
    topic: 'network',
    difficulty: 'intermediate',
    question: "What did HTTP/2 and HTTP/3 change compared with HTTP/1.1?",
    answer:
      "HTTP/1.1 sends one request at a time per connection (browsers open several). HTTP/2 uses a binary format, multiplexes many concurrent streams over one TCP connection, and compresses headers. But a lost TCP packet stalls all streams (head-of-line blocking). HTTP/3 runs over QUIC on UDP, where streams are independent, connection set-up is faster, and connections survive network changes.",
    chapter: 'http',
  },
  {
    id: 'type-a-url',
    topic: 'network',
    difficulty: 'intermediate',
    question: "What happens when you type a URL into a browser and press Enter?",
    answer:
      "The browser parses the URL, resolves the host name through DNS, opens a TCP connection (or reuses one), performs the TLS handshake and verifies the certificate, then sends the HTTP request. A CDN or load balancer may answer from cache or forward to an application instance, which runs the request — often calling caches and databases — and returns a response. The browser parses the HTML, fetches CSS, JavaScript and images (reusing connections), builds the page and renders it.",
    points: ["Where can caching happen along this path?", "Which steps are round trips?"],
    chapter: 'what-happens-when-you-type-a-url',
  },
  {
    id: 'l4-vs-l7',
    topic: 'network',
    difficulty: 'intermediate',
    question: "What is the difference between a layer 4 and a layer 7 load balancer?",
    answer:
      "A layer 4 balancer works on TCP/UDP: it sees IPs and ports and forwards connections, fast and protocol-agnostic, possibly passing TLS through. A layer 7 balancer understands HTTP: it can route by host, path or header, terminate TLS, retry, rewrite, and balance individual requests — important for long-lived HTTP/2 or gRPC connections, which a layer 4 balancer would pin to one backend.",
    chapter: 'proxies-load-balancers-cdns',
  },
  {
    id: 'reverse-proxy',
    topic: 'network',
    difficulty: 'basic',
    question: "What is a reverse proxy, and what problems can it introduce?",
    answer:
      "A reverse proxy sits in front of servers and receives client requests on their behalf — terminating TLS, routing, caching, compressing and rate-limiting. It can hide the client's real IP (read `X-Forwarded-For` from trusted proxies only), make the app think requests were plain HTTP (causing redirect loops), impose its own timeouts and body-size limits, and retry requests that were not idempotent.",
    chapter: 'proxies-load-balancers-cdns',
  },
  {
    id: 'sticky-sessions',
    topic: 'network',
    difficulty: 'intermediate',
    question: "What are sticky sessions, and why are they usually avoided?",
    answer:
      "Sticky sessions route each user to the same instance so it can keep session state in memory. The downsides: a failed or redeployed instance loses its users' sessions, load spreads unevenly, and scaling is harder. Stateless instances with sessions in a shared store (or in tokens) avoid these problems.",
    chapter: 'proxies-load-balancers-cdns',
  },
  {
    id: 'websocket-vs-sse',
    topic: 'network',
    difficulty: 'intermediate',
    question: "Polling, long polling, Server-Sent Events or WebSockets — how do you choose?",
    answer:
      "Polling is simplest but wasteful and adds latency. Long polling holds a request until data is available. Server-Sent Events stream server-to-client updates over plain HTTP with automatic reconnection — ideal for notifications and progress. WebSockets give full two-way messaging after an HTTP upgrade — for chat, collaboration and games. SSE and WebSockets keep connections open, so plan for proxy timeouts and for broadcasting across instances.",
    chapter: 'communication-styles',
  },
  {
    id: 'grpc-vs-rest',
    topic: 'network',
    difficulty: 'intermediate',
    question: "When would you use gRPC instead of REST?",
    answer:
      "For high-volume internal service-to-service calls that benefit from strict, generated contracts, compact binary messages (Protocol Buffers), HTTP/2 multiplexing and streaming. REST with JSON remains better for public APIs, browsers, easy debugging and caching. gRPC needs layer 7 load balancing because of its long-lived connections.",
    chapter: 'communication-styles',
  },
];
