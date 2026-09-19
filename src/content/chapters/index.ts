import { fundamentalsBook } from '@/content/fundamentals';
import { craftBook } from '@/content/craft';
import { sqlBook } from '@/content/sql';
import { javaBook } from '@/content/java';
import { jdbcBook } from '@/content/jdbc';
import type { ChapterBook } from './types';

/** Every chapter book, in nav order. */
export const books: ChapterBook[] = [fundamentalsBook, craftBook, sqlBook, javaBook, jdbcBook];
