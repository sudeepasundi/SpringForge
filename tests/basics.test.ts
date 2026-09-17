import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  annotationAnchor,
  annotationCategories,
  annotations,
  basicsGuides,
} from '@/content/basics';
import { flatLessons } from '@/content/curriculum';
import { SUPPORTED_LANGS } from '@/lib/highlighter';

/**
 * The catalogue is hand-written data that points at lessons and at itself.
 * Nothing else checks those pointers, so a renamed lesson or a typo in a
 * related name would render a dead link or a button that goes nowhere.
 */

const lessonPaths = new Set(flatLessons.map((l) => l.path));
const names = new Set(annotations.map((a) => a.name));
const categories = new Set(annotationCategories.map((c) => c.id));

describe('annotation catalogue', () => {
  it('has a substantial number of entries', () => {
    expect(annotations.length).toBeGreaterThanOrEqual(80);
  });

  it('has unique names, and unique anchors', () => {
    expect(names.size).toBe(annotations.length);
    expect(new Set(annotations.map((a) => annotationAnchor(a.name))).size).toBe(annotations.length);
  });

  it('writes names without the @', () => {
    expect(annotations.filter((a) => a.name.startsWith('@')).map((a) => a.name)).toEqual([]);
  });

  it('puts every entry in a known category, and every category has entries', () => {
    expect(annotations.filter((a) => !categories.has(a.category)).map((a) => a.name)).toEqual([]);
    for (const c of categories) {
      expect(annotations.some((a) => a.category === c), `category ${c} is empty`).toBe(true);
    }
  });

  it('fills in the fields every card shows', () => {
    const incomplete = annotations
      .filter((a) => !a.pkg || !a.summary || !a.mechanism || !a.useWhen || !a.example.code.trim())
      .map((a) => a.name);
    expect(incomplete).toEqual([]);
  });

  it('links related entries that exist', () => {
    const dangling = annotations.flatMap((a) =>
      (a.related ?? []).filter((r) => !names.has(r)).map((r) => `${a.name} -> ${r}`),
    );
    expect(dangling).toEqual([]);
  });

  it('never lists an entry as related to itself', () => {
    expect(annotations.filter((a) => a.related?.includes(a.name)).map((a) => a.name)).toEqual([]);
  });

  it('links "taught in" lessons that exist', () => {
    const dangling = annotations.flatMap((a) =>
      (a.lessons ?? []).filter((p) => !lessonPaths.has(p)).map((p) => `${a.name} -> ${p}`),
    );
    expect(dangling).toEqual([]);
  });

  it('gives every entry at least one lesson to go deeper', () => {
    expect(annotations.filter((a) => !a.lessons?.length).map((a) => a.name)).toEqual([]);
  });

  it('only uses example languages the highlighter supports', () => {
    const supported = new Set<string>(SUPPORTED_LANGS);
    const unsupported = annotations
      .filter((a) => !supported.has(a.example.lang))
      .map((a) => `${a.name}: ${a.example.lang}`);
    expect(unsupported).toEqual([]);
  });
});

describe('basics guides', () => {
  const dir = join(process.cwd(), 'src', 'content', 'basics', 'guides');
  const authored = readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));

  it('has an MDX file for every guide in the manifest', () => {
    expect(basicsGuides.map((g) => g.slug).filter((s) => !authored.includes(s))).toEqual([]);
  });

  it('has a manifest entry for every MDX file', () => {
    const declared = new Set(basicsGuides.map((g) => g.slug));
    expect(authored.filter((s) => !declared.has(s))).toEqual([]);
  });

  it('does not collide with the catalogue route', () => {
    expect(basicsGuides.map((g) => g.slug)).not.toContain('annotations');
  });

  it('links "go deeper" lessons that exist', () => {
    const dangling = basicsGuides.flatMap((g) =>
      g.lessons.filter((p) => !lessonPaths.has(p)).map((p) => `${g.slug} -> ${p}`),
    );
    expect(dangling).toEqual([]);
  });
});
