# SpringForge
https://sudeepasundi.github.io/SpringForge/
A learning platform for Spring Boot and microservices — from a first `@RestController` to
operating a distributed system in production. 18 modules, 84 lessons, built around mechanisms,
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
├─ components/mdx/         # the authoring vocabulary (see below)
├─ components/nav/         # sidebar, command palette, table of contents
├─ lib/                    # search, highlighter, theme, lesson loader
├─ pages/                  # home, path, module, lesson, dashboard, demos
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

Fenced code blocks accept a `title` and line highlighting:

````text
```java title="TaskService.java" {4-7}
````

### A note on the demos

`src/content/demos/` holds real, compilable Spring Boot source rendered in-page. A browser cannot
run a JVM, so nothing executes here — copy a file into an IDE and it will build.

Two projects: **Taskly**, a single service used by the core modules, and **ShopFlow**, a six-service
system whose checkout spans four services and therefore exercises the outbox, saga, idempotency and
resilience patterns from modules 07–09. ShopFlow also carries the configuration that runs it —
Kafka broker and topic settings, `redis.conf`, the Nginx edge, Istio policy, and the Prometheus,
Alertmanager and OpenTelemetry Collector pipelines — which is what modules 14–17 walk through.

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

All 84 lessons across 18 modules are written, each with objectives, diagrams,
annotated code, production pitfalls, key takeaways and a quiz.

| Track | Modules |
| --- | --- |
| Foundation | 00 Foundations |
| Core Spring | 01 Spring Core · 02 Boot Essentials · 03 Web and REST · 04 Data · 05 Security · 06 Testing |
| Microservices | 07 Microservices Fundamentals · 08 Resilience · 09 Event-Driven |
| Production | 10 Observability · 11 Cloud Native · 12 Production Hardening · 13 Capstone |
| Infrastructure | 14 Running Kafka · 15 Running Redis · 16 The Edge · 17 The Observability Stack |

Adding a *new module directory* under `src/content/modules/` requires restarting the dev server —
`import.meta.glob` is resolved at server start, and HMR alone will not pick up a directory that did
not exist. New files in an existing module directory hot-reload normally.
