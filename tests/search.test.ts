import { describe, expect, it } from 'vitest';
import { search } from '@/lib/search';
import { mdxToText } from '../scripts/search-index-plugin';
import { parseLineRanges } from '@/components/mdx/CodeSurface';

describe('search', () => {
  it('ignores queries that are too short to be useful', () => {
    expect(search('')).toEqual([]);
    expect(search('a')).toEqual([]);
  });

  it('finds a lesson by its title', () => {
    const hits = search('circuit breakers');
    expect(hits[0]?.path).toBe('resilience/circuit-breakers');
  });

  it('finds a lesson by a tag rather than its title', () => {
    const hits = search('n+1');
    expect(hits.map((h) => h.path)).toContain('data/n-plus-one');
  });

  it('finds an unwritten lesson through its manifest metadata', () => {
    const hits = search('graalvm native');
    expect(hits.map((h) => h.path)).toContain('cloud-native/native-images');
  });

  it('finds an annotation by name, with or without the @', () => {
    for (const q of ['@Transactional', 'Transactional']) {
      const hit = search(q)[0];
      expect(hit?.kind).toBe('annotation');
      expect(hit?.href).toBe('/basics/annotations?a=transactional');
    }
  });

  it('finds Basics content alongside lessons', () => {
    const hrefs = search('qualifier').map((h) => h.href);
    expect(hrefs).toContain('/basics/annotations?a=qualifier');
    expect(hrefs).toContain('/learn/spring-core/dependency-injection');
  });

  it('finds a Basics guide', () => {
    const hit = search('autowiring').find((h) => h.kind === 'guide');
    expect(hit?.href).toBe('/basics/injection-and-autowiring');
  });

  it('finds Spring JDBC chapters', () => {
    const prepared = search('PreparedStatement').find((h) => h.kind === 'chapter');
    expect(prepared?.href).toBe('/jdbc/prepared-statement');

    expect(search('callable statement')[0]?.href).toBe('/jdbc/callable-statement');

    const hrefs = search('JdbcClient').map((h) => h.href);
    expect(hrefs).toContain('/jdbc/named-parameters-and-jdbc-client');
  });

  it('finds Java chapters', () => {
    const hashmap = search('HashMap').filter((h) => h.kind === 'chapter');
    expect(hashmap.map((h) => h.href)).toContain('/java/hashmap-internals');

    const sealed = search('sealed').find((h) => h.kind === 'chapter');
    expect(sealed?.href).toBe('/java/sealed-types-and-pattern-matching');
  });

  it('finds interview questions and links them to the Q&A page', () => {
    const hit = search('diamond problem').find((h) => h.kind === 'question');
    expect(hit?.href).toBe('/java/revision?q=diamond-problem');
    expect(hit?.title).not.toContain('`');
  });

  it('finds Fundamentals chapters and questions', () => {
    const deadlock = search('deadlock').filter((h) => h.kind === 'chapter');
    expect(deadlock.map((h) => h.href)).toContain('/fundamentals/deadlock');

    expect(search('TLS handshake')[0]?.href).toBe('/fundamentals/tls-and-https');

    const question = search('hashing encryption').find((h) => h.kind === 'question');
    expect(question?.href).toMatch(/^\/fundamentals\/revision\?q=/);
  });

  it('finds SQL chapters and puzzle questions', () => {
    expect(search('window functions')[0]?.href).toBe('/sql/window-functions');

    const puzzle = search('second highest salary').find((h) => h.kind === 'question');
    expect(puzzle?.href).toBe('/sql/revision?q=second-highest-salary');
  });

  it('finds Craft chapters', () => {
    expect(search('sliding window')[0]?.href).toBe('/craft/sliding-window');
    expect(search('deliberate practice')[0]?.href).toBe('/craft/deliberate-practice');
  });

  it('gives lessons a /learn href', () => {
    const hit = search('circuit breakers')[0];
    expect(hit?.kind).toBe('lesson');
    expect(hit?.href).toBe('/learn/resilience/circuit-breakers');
  });

  it('returns nothing for a term that appears nowhere', () => {
    expect(search('zzzqqqxyz')).toEqual([]);
  });
});

describe('mdxToText', () => {
  it('strips fenced code, JSX and imports, and collects headings', () => {
    const { headings, body } = mdxToText(`import { Foo } from 'bar';

## First heading

Some **prose** with \`code\`.

\`\`\`java
class Secret {}
\`\`\`

<Callout type="note">Inside a component</Callout>

### Second heading
`);

    expect(headings).toEqual(['First heading', 'Second heading']);
    expect(body).toContain('Some prose with code');
    expect(body).not.toContain('Secret');
    expect(body).not.toContain('import');
    expect(body).toContain('Inside a component');
  });

  it('drops diagram and terminal source', () => {
    const { body } = mdxToText(`Before.

<Mermaid
  caption="A caption"
  chart={\`
flowchart LR
    A --> B
\`}
/>

<Terminal>
{\`$ curl -v https://example.com\`}
</Terminal>

After.`);

    expect(body).toBe('Before. After.');
  });

  it('drops frontmatter', () => {
    const { body } = mdxToText('---\ntitle: hidden\n---\n\nvisible text');
    expect(body).toBe('visible text');
  });
});

describe('parseLineRanges', () => {
  it('parses single lines, ranges and lists', () => {
    expect([...parseLineRanges('3')]).toEqual([3]);
    expect([...parseLineRanges('3-5')]).toEqual([3, 4, 5]);
    expect([...parseLineRanges('1, 4-6')]).toEqual([1, 4, 5, 6]);
  });

  it('is empty for undefined or nonsense input', () => {
    expect(parseLineRanges(undefined).size).toBe(0);
    expect(parseLineRanges('abc').size).toBe(0);
  });
});
