import type { DemoProject } from '@/lib/types';
import { shopflowOrderFiles, shopflowConsumerFiles } from './shopflow';
import { shopflowEdgeFiles } from './shopflow-edges';
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
    'An e-commerce system split into six services: gateway, order, inventory, payment, catalog and shipping. Placing an order reserves stock and captures payment across service boundaries — which cannot be one transaction — so it is coordinated by an orchestrated saga, with events published through a transactional outbox and consumed idempotently. Catalog is upstream of everything and depended on by nobody, so order-service keeps an event-fed projection of it; shipping is the terminal, irreversible step. Every pattern in the microservices modules appears here in working code.',
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
  files: [
    ...shopflowOrderFiles,
    ...shopflowConsumerFiles,
    ...shopflowEdgeFiles,
    ...shopflowPlatformFiles,
  ],
};
