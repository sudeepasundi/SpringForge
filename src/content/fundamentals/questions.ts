import { fundamentalsBook } from '@/content/fundamentals';
import type { QuestionSet } from '@/content/qa/types';
import { questionsOsNetwork } from './questions-os-network';
import { questionsSecurityDataSystems } from './questions-security-data-systems';

export const fundamentalsQuestionSet: QuestionSet = {
  book: fundamentalsBook,
  topics: [
    { id: 'os', label: 'OS & concurrency' },
    { id: 'network', label: 'Networking' },
    { id: 'security', label: 'Security' },
    { id: 'data', label: 'Data & algorithms' },
    { id: 'systems', label: 'Systems & practice' },
  ],
  intro:
    'Computer-science questions that come up in interviews for developers from any background, with the answer you would give, the follow-ups to expect, and a link to the chapter that explains it.',
  placeholder: 'Filter — try deadlock, TLS, index, CAP…',
  questions: [...questionsOsNetwork, ...questionsSecurityDataSystems],
};
