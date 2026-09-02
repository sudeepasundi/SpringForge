import { useMemo, useState } from 'react';
import { FileCode2, FolderClosed, FolderOpen, Info } from 'lucide-react';
import { CodeSurface, CopyButton } from './CodeSurface';
import { cn } from '@/lib/cn';
import type { DemoFile } from '@/lib/types';

export interface Annotation {
  /** File path this annotation belongs to; must match a file in `files`. */
  file: string;
  /** Line range spec, e.g. "12-18" or "4, 9-11". */
  lines: string;
  title: string;
  body: string;
}

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  file?: DemoFile;
}

function buildTree(files: DemoFile[]): TreeNode {
  const root: TreeNode = { name: '', path: '', children: new Map() };
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join('/');
      let next = node.children.get(part);
      if (!next) {
        next = { name: part, path, children: new Map() };
        node.children.set(part, next);
      }
      if (i === parts.length - 1) next.file = file;
      node = next;
    });
  }
  return root;
}

/**
 * Collapses single-child directory chains (`src/main/java/com/example` becomes
 * one row) the way IDEs do — otherwise a Maven tree is mostly indentation.
 */
function compact(node: TreeNode): TreeNode {
  const children = [...node.children.values()].map(compact);
  if (!node.file && children.length === 1) {
    const only = children[0]!;
    if (!only.file) {
      return { ...only, name: `${node.name}/${only.name}` };
    }
  }
  return { ...node, children: new Map(children.map((c) => [c.name, c])) };
}

function TreeRows({
  node,
  depth,
  selected,
  onSelect,
  annotatedFiles,
}: {
  node: TreeNode;
  depth: number;
  selected: string;
  onSelect: (path: string) => void;
  annotatedFiles: Set<string>;
}) {
  const [open, setOpen] = useState(true);
  const children = [...node.children.values()].sort((a, b) => {
    const aDir = a.children.size > 0 ? 0 : 1;
    const bDir = b.children.size > 0 ? 0 : 1;
    return aDir - bDir || a.name.localeCompare(b.name);
  });

  if (node.file && node.children.size === 0) {
    const isSelected = selected === node.file.path;
    return (
      <button
        type="button"
        onClick={() => onSelect(node.file!.path)}
        aria-current={isSelected ? 'true' : undefined}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[0.78rem] transition',
          isSelected
            ? 'bg-[color:var(--sf-accent-soft)] font-medium text-[color:var(--sf-accent-text)]'
            : 'text-[color:var(--sf-text-muted)] hover:bg-[color:var(--sf-surface-2)] hover:text-[color:var(--sf-text)]',
        )}
        style={{ paddingLeft: `${depth * 0.7 + 0.4}rem` }}
      >
        <FileCode2 size={13} className="shrink-0 opacity-70" />
        <span className="truncate">{node.name}</span>
        {annotatedFiles.has(node.file.path) && (
          <span
            className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--sf-prod)]"
            title="Has annotations"
          />
        )}
      </button>
    );
  }

  return (
    <div>
      {node.name && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[0.78rem] font-medium text-[color:var(--sf-text-faint)] hover:text-[color:var(--sf-text)]"
          style={{ paddingLeft: `${depth * 0.7 + 0.4}rem` }}
        >
          {open ? (
            <FolderOpen size={13} className="shrink-0 opacity-70" />
          ) : (
            <FolderClosed size={13} className="shrink-0 opacity-70" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
      )}
      {open &&
        children.map((child) => (
          <TreeRows
            key={child.path}
            node={child}
            depth={node.name ? depth + 1 : depth}
            selected={selected}
            onSelect={onSelect}
            annotatedFiles={annotatedFiles}
          />
        ))}
    </div>
  );
}

export function CodeExplorer({
  files,
  annotations = [],
  title,
  defaultFile,
  height = 460,
}: {
  files: DemoFile[];
  annotations?: Annotation[];
  title?: string;
  defaultFile?: string;
  height?: number;
}) {
  const [active, setActive] = useState(defaultFile ?? files[0]?.path ?? '');
  const [focused, setFocused] = useState<number | null>(null);

  const tree = useMemo(() => compact(buildTree(files)), [files]);
  const annotatedFiles = useMemo(() => new Set(annotations.map((a) => a.file)), [annotations]);
  const file = files.find((f) => f.path === active) ?? files[0];
  const fileAnnotations = annotations.filter((a) => a.file === file?.path);
  const activeLines = focused !== null ? fileAnnotations[focused]?.lines : undefined;

  if (!file) return null;

  return (
    <div className="sf-block overflow-hidden rounded-[var(--radius-token)] border bg-[color:var(--sf-surface)] shadow-[var(--sf-shadow)]">
      {title && (
        <div className="flex items-center justify-between gap-3 border-b bg-[color:var(--sf-surface-2)] px-3.5 py-2.5">
          <p className="m-0 text-[0.8rem] font-semibold">{title}</p>
          <span className="text-[0.7rem] text-[color:var(--sf-text-faint)]">
            {files.length} files
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div
          className="max-h-56 overflow-y-auto border-b bg-[color:var(--sf-bg-subtle)] p-2 md:max-h-none md:border-r md:border-b-0"
          style={{ maxHeight: `${height}px` }}
        >
          <TreeRows
            node={tree}
            depth={0}
            selected={file.path}
            onSelect={(p) => {
              setActive(p);
              setFocused(null);
            }}
            annotatedFiles={annotatedFiles}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 border-b bg-[color:var(--sf-code-bg)] px-3.5 py-2">
            <code className="truncate font-[family-name:var(--font-mono)] text-[0.72rem] text-[color:var(--sf-text-muted)]">
              {file.path}
            </code>
            <CopyButton text={file.code} />
          </div>

          <div className="overflow-auto bg-[color:var(--sf-code-bg)]" style={{ maxHeight: height }}>
            <CodeSurface
              code={file.code}
              lang={file.lang}
              highlightLines={activeLines}
              scrollToHighlight={focused !== null}
            />
          </div>

          {file.note && (
            <p className="m-0 border-t bg-[color:var(--sf-surface-2)] px-3.5 py-2.5 text-[0.8rem] text-[color:var(--sf-text-muted)]">
              {file.note}
            </p>
          )}

          {fileAnnotations.length > 0 && (
            <div className="border-t bg-[color:var(--sf-surface)]">
              <p className="m-0 flex items-center gap-1.5 border-b px-3.5 py-2 text-[0.68rem] font-semibold tracking-[0.09em] text-[color:var(--sf-text-faint)] uppercase">
                <Info size={12} /> Walkthrough — click to locate in the file
              </p>
              <ol className="m-0 list-none p-0">
                {fileAnnotations.map((a, i) => (
                  <li key={a.title} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setFocused(focused === i ? null : i)}
                      aria-pressed={focused === i}
                      className={cn(
                        'w-full px-3.5 py-2.5 text-left transition',
                        focused === i
                          ? 'bg-[color:var(--sf-accent-soft)]'
                          : 'hover:bg-[color:var(--sf-surface-2)]',
                      )}
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="font-[family-name:var(--font-mono)] text-[0.68rem] text-[color:var(--sf-text-faint)]">
                          L{a.lines}
                        </span>
                        <span className="text-[0.84rem] font-medium">{a.title}</span>
                      </span>
                      <span className="mt-1 block text-[0.82rem] leading-relaxed text-[color:var(--sf-text-muted)]">
                        {a.body}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
