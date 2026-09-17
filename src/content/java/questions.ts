import { questionsOopJava8 } from './questions-oop-java8';
import { questionsCoreModern } from './questions-core-modern';
import { questionsConcurrencyJvm } from './questions-concurrency-jvm';
import type { JavaQuestion } from './question-types';

export type { JavaQuestion, QuestionDifficulty } from './question-types';

/** Topics are the Java book's parts, so the filter reads like the hub. */
export const questionTopics = [
  { id: 'oop', label: 'OOP' },
  { id: 'java8', label: 'Java 8' },
  { id: 'core', label: 'Core Java' },
  { id: 'modern', label: 'Modern Java' },
  { id: 'concurrency', label: 'Concurrency' },
  { id: 'jvm', label: 'JVM & patterns' },
] as const;

export const questionDifficulties = [
  { id: 'basic', label: 'Basic' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
] as const;

export const javaQuestions: JavaQuestion[] = [
  ...questionsOopJava8,
  ...questionsCoreModern,
  ...questionsConcurrencyJvm,
];
