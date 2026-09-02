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
