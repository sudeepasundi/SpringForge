import { javaBook } from '@/content/java';
import { jdbcBook } from '@/content/jdbc';
import type { ChapterBook } from './types';

/** Every chapter book, in nav order. */
export const books: ChapterBook[] = [javaBook, jdbcBook];
