#!/usr/bin/env node
/**
 * Fails the build when the critical path grows.
 *
 * This exists because of a real regression: naming a `mermaid` chunk in
 * `manualChunks` made Rollup merge the shared vendor chunk into it, which turned
 * a dynamic-only 3.1 MB library into a static import of the entry. It was
 * modulepreloaded on every page — including the home page, which has no diagrams
 * — and shipped to production with every gate green, because nothing measured
 * what the browser actually fetches before first paint.
 *
 * So measure exactly that: the entry, the stylesheets, and everything
 * index.html tells the browser to preload.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = join(process.cwd(), 'dist');
const BUDGET_KB = 200; // per critical-path asset, gzipped
const TOTAL_BUDGET_KB = 400; // whole critical path, gzipped

const html = readFileSync(join(DIST, 'index.html'), 'utf8');

/** Everything the browser fetches before it can render: preloads, entry, css. */
const referenced = new Set();
for (const m of html.matchAll(/(?:modulepreload|stylesheet)"[^>]*href="\.?\/?([^"]+)"/g)) {
  referenced.add(m[1].replace(/^\.\//, ''));
}
for (const m of html.matchAll(/<script[^>]*src="\.?\/?([^"]+)"/g)) {
  referenced.add(m[1].replace(/^\.\//, ''));
}

if (referenced.size === 0) {
  console.error('check-bundle-budget: found no critical-path assets in dist/index.html');
  process.exit(1);
}

let total = 0;
const rows = [];
const over = [];

for (const rel of [...referenced].sort()) {
  const file = join(DIST, rel);
  try {
    statSync(file);
  } catch {
    console.error(`check-bundle-budget: dist/index.html references missing file ${rel}`);
    process.exit(1);
  }
  const kb = Math.round(gzipSync(readFileSync(file), { level: 9 }).length / 1024);
  total += kb;
  rows.push([kb, rel]);
  if (kb > BUDGET_KB) over.push(`${rel} is ${kb} KB gzip (budget ${BUDGET_KB} KB)`);
}

rows.sort((a, b) => b[0] - a[0]);
console.log('Critical path (gzip):');
for (const [kb, rel] of rows) console.log(`  ${String(kb).padStart(5)} KB  ${rel}`);
console.log(`  ${String(total).padStart(5)} KB  total (budget ${TOTAL_BUDGET_KB} KB)`);

if (total > TOTAL_BUDGET_KB) {
  over.push(`critical path totals ${total} KB gzip (budget ${TOTAL_BUDGET_KB} KB)`);
}

// The specific regression that motivated this file: a library that must only
// ever be reached through a dynamic import showing up as a static entry edge.
const entry = readdirSync(join(DIST, 'assets')).find(
  (f) => f.startsWith('index-') && f.endsWith('.js'),
);
if (entry) {
  const source = readFileSync(join(DIST, 'assets', entry), 'utf8');
  for (const lib of ['mermaid', 'shiki', 'minisearch']) {
    const re = new RegExp(`from"\\./[^"]*${lib}[^"]*"`, 'i');
    if (re.test(source)) {
      over.push(`entry chunk statically imports ${lib}; it must be dynamic only`);
    }
  }
}

if (over.length) {
  console.error('\nBundle budget exceeded:');
  for (const line of over) console.error(`  - ${line}`);
  process.exit(1);
}

console.log('\nBundle budget OK.');
