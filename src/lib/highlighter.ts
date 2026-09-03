import type { HighlighterCore } from 'shiki/core';

/**
 * Runtime highlighter for code that does not come from MDX fenced blocks —
 * demo project files, which are plain data.
 *
 * MDX prose is highlighted at build time by rehype-pretty-code; this loads
 * only when a CodeExplorer actually mounts, in its own async chunk, with the
 * same theme pair so the two paths look identical.
 */
let instance: Promise<HighlighterCore> | null = null;

export const SUPPORTED_LANGS = [
  'java',
  'kotlin',
  'xml',
  'yaml',
  'json',
  'sql',
  'bash',
  'properties',
  'docker',
  'groovy',
  'http',
  'typescript',
  'javascript',
  'diff',
  'ini',
  'nginx',
] as const;

export type Lang = (typeof SUPPORTED_LANGS)[number] | 'text';

function normalise(lang: string): Lang {
  const l = lang.toLowerCase();
  const aliases: Record<string, Lang> = {
    dockerfile: 'docker',
    yml: 'yaml',
    sh: 'bash',
    shell: 'bash',
    console: 'bash',
    ts: 'typescript',
    js: 'javascript',
    gradle: 'groovy',
    conf: 'ini',
    props: 'properties',
  };
  if (aliases[l]) return aliases[l]!;
  return (SUPPORTED_LANGS as readonly string[]).includes(l) ? (l as Lang) : 'text';
}

async function load(): Promise<HighlighterCore> {
  const [{ createHighlighterCore }, { default: wasm }] = await Promise.all([
    import('shiki/core'),
    import('shiki/wasm'),
  ]);

  return createHighlighterCore({
    themes: [
      import('shiki/themes/github-light.mjs'),
      import('shiki/themes/github-dark-dimmed.mjs'),
    ],
    langs: [
      import('shiki/langs/java.mjs'),
      import('shiki/langs/kotlin.mjs'),
      import('shiki/langs/xml.mjs'),
      import('shiki/langs/yaml.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/sql.mjs'),
      import('shiki/langs/bash.mjs'),
      import('shiki/langs/properties.mjs'),
      import('shiki/langs/docker.mjs'),
      import('shiki/langs/groovy.mjs'),
      import('shiki/langs/http.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/diff.mjs'),
      import('shiki/langs/ini.mjs'),
      import('shiki/langs/nginx.mjs'),
    ],
    loadWasm: wasm,
  });
}

export function getHighlighter(): Promise<HighlighterCore> {
  instance ??= load();
  return instance;
}

/**
 * Returns HTML whose tokens carry both theme colours as CSS variables, matching
 * the build-time output so `code.css` styles both identically.
 */
export async function highlight(code: string, lang: string): Promise<string> {
  const hl = await getHighlighter();
  const html = hl.codeToHtml(code.replace(/\s+$/, ''), {
    lang: normalise(lang),
    themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    defaultColor: false,
  });
  // rehype-pretty-code marks lines with `data-line`; shiki core uses `class="line"`.
  // Aligning them means one stylesheet covers both.
  return html.replace(/class="line"/g, 'class="line" data-line');
}
