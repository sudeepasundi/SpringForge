import type { DemoProject } from '@/lib/types';
import { shopflowOrderFiles, shopflowConsumerFiles } from './shopflow';
import { shopflowPlatformFiles } from './shopflow-platform';

/**
 * ShopFlow — the distributed system that carries modules 07–12.
 *
 * Checkout spans four services with no shared transaction, so it exercises the
 * whole toolkit: an outbox for atomic event publication, an orchestrated saga
 * with compensations, idempotent consumers, and resilience policies on every
 * outbound call.
 */
export const shopflow: DemoProject = {
  id: 'shopflow',
  name: 'ShopFlow',
  tagline: 'Six services, one checkout, no distributed transaction',
  description:
    'An e-commerce system split into gateway, order, inventory, payment, catalog and shipping services. Placing an order reserves stock and captures payment across service boundaries — which cannot be one transaction — so it is coordinated by a saga, with events published through a transactional outbox and consumed idempotently. Every pattern in the microservices modules appears here in working code.',
  stack: [
    'Spring Boot 3.4',
    'Java 21',
    'Spring Cloud Gateway',
    'Kafka',
    'PostgreSQL',
    'Redis',
    'Resilience4j',
    'OpenTelemetry',
    'Kubernetes',
  ],
  files: [...shopflowOrderFiles, ...shopflowConsumerFiles, ...shopflowPlatformFiles],
};
