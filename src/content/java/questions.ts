import { javaBook } from '@/content/java';
import type { QuestionSet } from '@/content/qa/types';
import { questionsOopJava8 } from './questions-oop-java8';
import { questionsCoreModern } from './questions-core-modern';
import { questionsConcurrencyJvm } from './questions-concurrency-jvm';

export const javaQuestionSet: QuestionSet = {
  book: javaBook,
  topics: [
    { id: 'oop', label: 'OOP' },
    { id: 'java8', label: 'Java 8' },
    { id: 'core', label: 'Core Java' },
    { id: 'modern', label: 'Modern Java' },
    { id: 'concurrency', label: 'Concurrency' },
    { id: 'jvm', label: 'JVM & patterns' },
  ],
  intro:
    'Questions that come up in Java interviews, with the answer you would give, the follow-ups to expect, and a link to the chapter that explains it properly.',
  placeholder: 'Filter — try HashMap, volatile, stream, sealed…',
  questions: [...questionsOopJava8, ...questionsCoreModern, ...questionsConcurrencyJvm],
};
