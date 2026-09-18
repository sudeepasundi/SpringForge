import { sqlBook } from '@/content/sql';
import type { QuestionSet } from '@/content/qa/types';
import { questionsSqlBasics } from './questions-basics';
import { questionsSqlAdvanced } from './questions-advanced';

export const sqlQuestionSet: QuestionSet = {
  book: sqlBook,
  topics: [
    { id: 'foundations', label: 'Foundations' },
    { id: 'combining', label: 'Joins & grouping' },
    { id: 'advanced', label: 'Windows & puzzles' },
    { id: 'changing', label: 'Writes & schema' },
    { id: 'production', label: 'Performance & production' },
  ],
  intro:
    'SQL questions from interviews — concepts and the classic query puzzles — with model answers. Puzzle answers run against the sample databases, so you can paste them into the playground.',
  placeholder: 'Filter — try HAVING, join, window, duplicates…',
  questions: [...questionsSqlBasics, ...questionsSqlAdvanced],
};
