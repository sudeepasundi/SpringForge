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
