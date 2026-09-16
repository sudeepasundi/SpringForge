import type { DemoProject } from '@/lib/types';
import { relayDispatchFiles } from './relay-dispatch';
import { relayClientFiles } from './relay-clients';
import { relayChannelFiles } from './relay-channels';
import { relayPlatformFiles } from './relay-platform';

/**
 * Relay — the system built step by step in module 18.
 *
 * It exists to cover three things ShopFlow does not. Eureka as a registry you
 * actually run, rather than a client configuration in a lesson. Declarative HTTP
 * clients written twice, with Feign and with Spring's HTTP interfaces, because
 * the framework has moved and most codebases have not. And orchestration that
 * routes rather than compensates: nothing here can be undone, so the work is
 * choosing the right channel and never sending twice.
 *
 * It runs on docker-compose, not Kubernetes, and that is the point — module 07
 * argues Eureka on Kubernetes means two disagreeing sources of truth. Off
 * platform is where it still earns its place.
 */
export const relay: DemoProject = {
  id: 'relay',
  name: 'Relay',
  tagline: 'One event in, the right notification out',
  description:
    'A notification platform in five services. A Kafka request arrives, the dispatch orchestrator reads the recipient’s preferences and decides which channels to try and in what order, then calls the email or SMS service through Eureka. Quiet hours, opt-outs and severity decide whether a notification is sent at all; a claim-before-send marker guarantees it is never sent twice; and anything that cannot be delivered ends on a dead-letter topic with a reason attached. The orchestrator’s clients appear twice — once with OpenFeign, once as Spring HTTP interfaces — so the migration the framework recommends is visible side by side.',
  stack: [
    'Spring Boot 3.4',
    'Java 21',
    'Spring Cloud Netflix Eureka',
    'Spring Cloud OpenFeign',
    'Spring HTTP Interfaces',
    'Spring Kafka',
    'Resilience4j',
    'PostgreSQL',
    'Docker Compose',
  ],
  files: [
    // The Kafka consumer opens by default on /demos — it is where a request
    // enters the system, so it is the right place to start reading.
    ...relayDispatchFiles,
    ...relayClientFiles,
    ...relayChannelFiles,
    ...relayPlatformFiles,
  ],
};
