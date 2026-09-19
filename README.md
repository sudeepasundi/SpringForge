# SpringForge

A learning platform for Spring Boot and microservices — from a first `@RestController` to
operating a distributed system in production. 19 modules, 89 lessons, built around mechanisms,
diagrams and real failure modes rather than a tour of annotations.

## Running it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR. Honours `PORT`. |
| `npm run build` | Typecheck, then produce a static bundle in `dist/`. |
| `npm run preview` | Serve the built bundle. |
| `npm run typecheck` | `tsc --noEmit` under `strict`. |
| `npm test` | Vitest suite. |
| `npm run lint` / `npm run format` | ESLint / Prettier. |

The build is fully static and uses hash routing, so `dist/` deploys unchanged to GitHub Pages,
Netlify, Vercel, S3 — or opens directly from disk.

## How it is put together

```
src/
├─ content/
│  ├─ curriculum.ts        # the manifest — every module and lesson
│  ├─ modules/{id}-{slug}/ # one MDX file per lesson
│  └─ demos/               # demo project source, as typed data
├─ content/basics/         # annotation reference data + revision guides
├─ content/fundamentals/   # Fundamentals chapters, manifest and interview questions
├─ content/craft/          # Craft chapters: problem solving, patterns, real code, getting better
├─ content/sql/            # SQL chapters, sample datasets and interview questions
├─ content/java/           # Java chapters, manifest and interview questions
├─ content/qa/             # the shared interview Q&A types and registry
├─ content/jdbc/           # Spring JDBC chapters and their manifest
├─ content/chapters/       # the shared "chapter book" types and registry
├─ components/chapters/    # hub and chapter pages shared by every chapter book
├─ components/sql/         # the in-browser SQL runners (playground, exercise, schema browser)
├─ components/qa/          # the interview Q&A page and card shared by every question set
├─ components/mdx/         # the authoring vocabulary (see below)
├─ components/nav/         # sidebar, command palette, table of contents
├─ lib/                    # search, highlighter, theme, lesson loader
├─ pages/                  # home, path, module, lesson, basics, dashboard, demos
└─ store/progress.ts       # completion, bookmarks, quiz scores, theme
```

**`curriculum.ts` is authoritative.** A lesson exists because it is declared there; the MDX file at
`src/content/modules/{module.id}-{module.slug}/{lesson.slug}.mdx` supplies its body. A lesson with
no file yet still routes, still appears in navigation and search, and shows a "still being
written" placeholder. `tests/curriculum.test.ts` fails if an MDX file has no manifest entry.

**Rendering.** MDX compiles at build time; fenced code blocks are highlighted by Shiki through
`rehype-pretty-code` with a light/dark theme pair, so syntax colouring costs no runtime JavaScript.
Demo project files are highlighted at runtime by the same themes (`src/lib/highlighter.ts`), in a
lazily-loaded chunk, because that code is data rather than markdown.

**Search.** `scripts/search-index-plugin.ts` strips every MDX file to prose at build time and
exposes it as `virtual:search-index`. MiniSearch indexes that alongside the manifest metadata.
Open it with <kbd>⌘K</kbd> / <kbd>Ctrl-K</kbd>, or `/`.

**Progress** lives in `localStorage` under `springforge:v1` and never leaves the browser.
`index.html` reads the same key before first paint so the theme never flashes.

## Authoring a lesson

1. Add the lesson to the right module in `src/content/curriculum.ts`.
2. Create `src/content/modules/{id}-{slug}/{lesson-slug}.mdx`.
3. Write the body. Do not repeat the title or summary — the page renders those from the manifest,
   along with the objectives box. Start at an `##` heading.

These components are available in every MDX file without importing anything:

| Component | Use it for |
| --- | --- |
| `<Callout type="note\|tip\|warn\|pitfall\|prod">` | Asides. `prod` means "what breaks at scale". |
| `<Mermaid chart={\`...\`} caption alt />` | Flowcharts, sequence and state diagrams. Theme-aware, click to enlarge. |
| `<Figure caption>` | Wrapper for hand-authored inline SVG. |
| `<Compare><Bad title>…</Bad><Good title>…</Good></Compare>` | Anti-pattern beside the correct pattern. Children are markdown, so code fences work. |
| `<DecisionTable columns rows />` | Trade-off tables with a verdict stripe. |
| `<Steps><Step title>…</Step></Steps>` | Numbered procedures. |
| `<Terminal title>` | Shell transcripts; `$` lines are treated as commands and are what the copy button yields. |
| `<CodeExplorer files annotations />` | Multi-file walkthrough with a tree and click-to-locate annotations. |
| `<KeyTakeaways points={[…]} />` | Closes every lesson. |
| `<Quiz questions={[…]} />` | Self-check. Scores are stored per lesson. |
| `<Walkthrough title problem><Stage title prompt>…</Stage></Walkthrough>` | A worked problem revealed one step at a time. |
| `<Reveal label>` | A hint or answer hidden behind a toggle. |

Fenced code blocks accept a `title` and line highlighting:

````text
```java title="TaskService.java" {4-7}
````

### Basics

`/basics` is a revision section beside the path, not part of it. It has two parts:

- **An annotation reference** — about a hundred annotations across ten categories, each with what
  it does at runtime, when to use and avoid it, the usual mistake, an example, related annotations
  and the lessons that teach it. Filter state lives in the URL (`?q=&cat=`), and `?a=<name>` opens
  one card; hash routing owns the fragment, so a query parameter is the anchor.
- **Five revision guides** — injection and autowiring, bean scopes and lifecycle, transactions,
  proxies and AOP, configuration and profiles.

The catalogue is typed data in `src/content/basics/annotations-*.ts`; guides are MDX in
`src/content/basics/guides/`, registered in `src/content/basics/index.ts`. Both appear in ⌘K
search. `tests/basics.test.ts` checks that every related annotation and every "taught in" lesson
actually exists, so a renamed lesson fails the build instead of leaving a dead link.

### Fundamentals

`/fundamentals` is computer science for developers who came from electronics, electrical or other
non-CS branches: 32 chapters in five parts — how computers run code (processes and threads, memory,
blocking and async I/O, race conditions, deadlock, caching); networking and the web (layers, IP and
NAT, TCP and UDP, DNS, HTTP, what happens when you type a URL, proxies and load balancers,
communication styles); security and cryptography (hashing, encoding versus encryption, symmetric and
asymmetric encryption, signatures and certificates, TLS, password storage, authentication and
authorization, common vulnerabilities); data and algorithms (Big-O, data structures, searching and
sorting, databases and indexes, transactions); and systems and practice (scaling, CAP and idempotency,
queues, resilience, how teams ship software). Every chapter is written as **why it matters, how it
works, when you'll meet it**, and links into the Spring, Java and JDBC material. `/fundamentals/revision`
has its own interview Q&A.

### Craft

`/craft` teaches *how* to approach code rather than what to know, in 25 chapters across four parts:
a problem-solving method (understand, brute force first, decompose, check, get unstuck); problem
patterns (hash maps, two pointers, sliding window, greedy, binary search on the answer, backtracking,
graphs, dynamic programming), each worked in Java with hinted practice problems; writing and debugging
real code (reading unfamiliar code, naming, debugging, testing, refactoring, code review); and getting
better (learning a technology, deliberate practice, asking questions, using AI assistants, habits).

Worked problems use `<Walkthrough title problem>` with `<Stage title prompt>` children. Each stage shows
its prompt first and unlocks one at a time on "Show my thinking", with "Reveal all" and "Start over";
`<Reveal label="Hint">` hides a single hint. `tests/craft.test.ts` checks that every pattern chapter has
walkthroughs of at least three stages and hinted practice problems, and that every stage has a title and
a prompt.

### SQL

`/sql` teaches SQL from the first `SELECT` to window functions, schema design and query plans, in 24
chapters across five parts. Every example is **runnable**: `<SqlPlayground dataset="shop" query={…} />`
and `<SqlExercise … solution={…} />` run on SQLite compiled to WebAssembly (`sql.js`) inside the
browser, each against a private copy of a sample dataset (`shop` or `hr`, in
`src/content/sql/datasets/`). Exercises compare the reader's result with the solution's. The engine is a
lazy chunk loaded only by SQL pages (`src/lib/sqlite.ts`), and `/sql/playground` is a full-page editor.
Queries are standard SQL with MySQL and PostgreSQL differences noted.

`tests/sql.test.ts` runs every playground query, every exercise solution and every Q&A answer marked
with a `dataset` against the real datasets in Node, so a typo in a column name fails the build.
Playgrounds that demonstrate an error on purpose carry `expectError`.

### Java

`/java` covers the Java every lesson assumes, in 29 chapters across six parts: object-oriented
programming (classes, encapsulation, inheritance, polymorphism, abstraction, the equals/hashCode
contracts, SOLID, nested classes and enums); Java 8 in depth (lambdas, method references, streams
and collectors, Optional, java.time); core Java (strings, generics, collections, HashMap internals,
exceptions); modern Java up to 21 (records, sealed types, pattern matching); concurrency (threads,
executors, CompletableFuture, locks and atomics, virtual threads); and the JVM and design patterns.

`/java/revision` is its interview Q&A page.

**Interview Q&A pages** (`<book>/revision`) share one component. Each has about ninety questions
with model answers and likely follow-ups, filterable by topic and difficulty (`?topic=&level=&s=`),
with `?q=<id>` opening one question. Questions are typed data (`src/content/{fundamentals,sql,java}/questions-*.ts`)
collected into a `QuestionSet` per book and registered in `src/content/qa/index.ts`;
`tests/questions.test.ts` checks every set — unique ids, topics matching the book's parts, and a
link from each question to a chapter in its own part. Chapters and questions are both in ⌘K search.

Fundamentals, Craft, SQL, Java and Spring JDBC are all **chapter books**: a manifest (`src/content/{fundamentals,craft,sql,java,jdbc}/index.ts`)
of numbered chapters in groups, rendered by `src/components/chapters/`. `tests/chapters.test.ts`
checks every book — MDX files against the manifest, group order, and that every "go deeper" lesson
and demo file exists.

### Spring JDBC

`/jdbc` is a thirteen-chapter section from first connection to production, on MySQL: plain JDBC
(Connection, Statement, PreparedStatement, CallableStatement, ResultSet, transactions), then Spring's
JdbcTemplate, NamedParameterJdbcTemplate, JdbcClient, SimpleJdbcInsert and SimpleJdbcCall, batching,
streaming, exception translation, testing and pool configuration, and a method reference. Chapters
are MDX in `src/content/jdbc/chapters/`, ordered by `src/content/jdbc/index.ts`, and share their
article layout with the Basics guides (`src/components/guides/GuideArticle.tsx`).

### A note on the demos

`src/content/demos/` holds real Java source — Spring Boot projects, plus plain-Java Tally — rendered in-page. A browser cannot
run a JVM, so nothing executes here — copy a file into an IDE and it will build.

Five projects. **Taskly**, a single service used by the core modules, and **ShopFlow**, a six-service
system whose checkout spans four services and therefore exercises the outbox, saga, idempotency and
resilience patterns from modules 07–09. ShopFlow also carries the configuration that runs it —
Kafka broker and topic settings, `redis.conf`, the Nginx edge, Istio policy, and the Prometheus,
Alertmanager and OpenTelemetry Collector pipelines — which is what modules 14–17 walk through.

**Relay** is the third: a five-service notification platform — a Kafka consumer, a routing orchestrator,
email and SMS services and a Eureka registry — built step by step in module 18. It runs on
docker-compose rather than Kubernetes, which is the condition under which module 07 says a registry
still earns its place.

**Shelf** is the fourth: a MySQL library catalogue whose data access is written twice — plain JDBC
and Spring JDBC — for the Spring JDBC section. `/demos?project=shelf&file=<path>` opens it at a
specific file.

**Tally** is the fifth, and the only one without Spring: a plain Java 21 expense tracker behind the
Java section — an account hierarchy, an immutable `Money` value, a sealed transaction hierarchy of
records, stream reports, a generic repository, and a statement importer running on virtual threads.

Lesson walkthroughs import a demo and filter its files, so the annotated code in a lesson is the same
source the demos page renders — there is no second copy to drift.

## Deploying

The build is fully static and uses hash routing, so `dist/` deploys unchanged
anywhere — no server-side rewrite rules are needed.

| Target | How |
| --- | --- |
| GitHub Pages | Push to `main`; `.github/workflows/deploy.yml` builds and publishes. Enable Pages with source "GitHub Actions". |
| Netlify | `netlify.toml` is included — connect the repository and it builds. |
| Vercel / S3 / anywhere | `npm run build`, then serve `dist/`. |
| Locally, from disk | `npm run build`, then open `dist/index.html`. |

Both workflows run lint, typecheck, tests and build before publishing.

## Accessibility

Verified in-browser rather than assumed:

- Every colour token pair meets WCAG AA (4.5:1) for normal text, in both themes.
  Two tokens were adjusted to reach it — the measurements are in the commit history.
- Every interactive element has an accessible name; no positive `tabindex`;
  the skip link is first in tab order.
- One `h1` per page, no heading-level skips.
- Every Mermaid diagram has alt text and a caption, enforced by
  `tests/mdx-syntax.test.ts`.
- Wide content (tables, diagrams, code) scrolls inside its own container, so the
  page never scrolls horizontally — checked at 375px.
- `prefers-reduced-motion` disables animation and smooth scrolling.

## Content status

All 89 lessons across 19 modules are written, each with objectives, diagrams,
annotated code, production pitfalls, key takeaways and a quiz.

| Track | Modules |
| --- | --- |
| Foundation | 00 Foundations |
| Core Spring | 01 Spring Core · 02 Boot Essentials · 03 Web and REST · 04 Data · 05 Security · 06 Testing |
| Microservices | 07 Microservices Fundamentals · 08 Resilience · 09 Event-Driven |
| Production | 10 Observability · 11 Cloud Native · 12 Production Hardening · 13 Capstone |
| Infrastructure | 14 Running Kafka · 15 Running Redis · 16 The Edge · 17 The Observability Stack |
| Workshop | 18 Build: A Notification Platform |

Adding a *new module directory* under `src/content/modules/` requires restarting the dev server —
`import.meta.glob` is resolved at server start, and HMR alone will not pick up a directory that did
not exist. New files in an existing module directory hot-reload normally.
