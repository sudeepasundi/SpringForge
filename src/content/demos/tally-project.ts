import type { DemoProject } from '@/lib/types';
import { tallyCoreFiles } from './tally-core';
import { tallyAppFiles } from './tally-app';

/**
 * Tally — the plain-Java project behind the Java section.
 *
 * No framework at all, so every language feature is visible: the chapters on
 * OOP, streams, generics, modern Java and concurrency each point at the file
 * where that feature does real work.
 */
export const tally: DemoProject = {
  id: 'tally',
  name: 'Tally',
  tagline: 'Plain Java 21: OOP, streams, generics and concurrency in one small app',
  description:
    'An expense tracker with no framework. An abstract Account hierarchy and an enum factory, an immutable Money value object with hand-written equals, hashCode and compareTo, a sealed Transaction hierarchy of records with a builder, a functional Categorizer interface composed into a strategy, a generic repository with bounded wildcards, stream reports with collectors and pattern-matching switches, a template-method exporter, an observer for budget alerts, checked and unchecked exceptions, a statement importer running CompletableFutures on virtual threads, and thread-safe running totals. It is the project the Java chapters walk through.',
  stack: ['Java 21', 'Maven', 'JUnit 5', 'AssertJ'],
  files: [...tallyCoreFiles, ...tallyAppFiles],
};
