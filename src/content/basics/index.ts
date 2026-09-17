import type { AnnotationCategory, AnnotationEntry, BasicsGuide } from './types';
import { coreAnnotations } from './annotations-core';
import { webAnnotations } from './annotations-web';
import { dataAnnotations } from './annotations-data';
import { platformAnnotations } from './annotations-platform';

export type { AnnotationCategory, AnnotationEntry, BasicsGuide } from './types';

/** Display order and labels for the catalogue's category chips. */
export const annotationCategories: { id: AnnotationCategory; label: string }[] = [
  { id: 'core', label: 'Core & DI' },
  { id: 'config', label: 'Configuration & Boot' },
  { id: 'web', label: 'Web & REST' },
  { id: 'validation', label: 'Validation' },
  { id: 'data', label: 'Data, JPA & Caching' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'security', label: 'Security' },
  { id: 'testing', label: 'Testing' },
  { id: 'messaging', label: 'Messaging, Scheduling & Async' },
  { id: 'cloud', label: 'Cloud & Resilience' },
];

export const annotations: AnnotationEntry[] = [
  ...coreAnnotations,
  ...webAnnotations,
  ...dataAnnotations,
  ...platformAnnotations,
];

/** `Transactional` → `transactional`, used as the card's anchor. */
export function annotationAnchor(name: string): string {
  return name.toLowerCase();
}

export function getAnnotation(name: string): AnnotationEntry | undefined {
  return annotations.find((a) => a.name === name);
}

export const basicsGuides: BasicsGuide[] = [
  {
    slug: 'injection-and-autowiring',
    title: 'Injection & Autowiring',
    summary:
      'Constructor, setter and field injection; how Spring picks a bean; @Qualifier, @Primary, collections, optional and lazy dependencies — and which to use when.',
    minutes: 12,
    lessons: ['spring-core/dependency-injection', 'spring-core/ioc-container'],
  },
  {
    slug: 'bean-scopes-and-lifecycle',
    title: 'Bean Scopes & Lifecycle',
    summary:
      'Singleton, prototype and the web scopes; the prototype-into-singleton trap; and the order in which a bean is built, used and destroyed.',
    minutes: 9,
    lessons: ['spring-core/bean-lifecycle'],
  },
  {
    slug: 'transactions-cheat-sheet',
    title: 'Transactions Cheat Sheet',
    summary:
      'Every propagation and isolation level in one place, what rolls back and what does not, and the settings worth knowing by heart.',
    minutes: 9,
    lessons: ['data/transactions'],
  },
  {
    slug: 'proxies-and-aop-gotchas',
    title: 'Proxies & AOP Gotchas',
    summary:
      'Why @Transactional, @Async and @Cacheable sometimes do nothing at all — and how to tell in ten seconds.',
    minutes: 8,
    lessons: ['spring-core/aop-proxies'],
  },
  {
    slug: 'configuration-and-profiles',
    title: 'Configuration & Profiles',
    summary:
      '@Value versus @ConfigurationProperties, where a property value actually comes from, profiles, and the @Conditional family.',
    minutes: 9,
    lessons: ['boot-essentials/configuration-properties', 'boot-essentials/typed-config'],
  },
];

export function getBasicsGuide(slug: string | undefined): BasicsGuide | undefined {
  return basicsGuides.find((g) => g.slug === slug);
}
