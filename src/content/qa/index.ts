import { fundamentalsQuestionSet } from '@/content/fundamentals/questions';
import { sqlQuestionSet } from '@/content/sql/questions';
import { javaQuestionSet } from '@/content/java/questions';
import type { QuestionSet } from './types';

/** Every revision page's questions, in nav order. */
export const questionSets: QuestionSet[] = [fundamentalsQuestionSet, sqlQuestionSet, javaQuestionSet];
