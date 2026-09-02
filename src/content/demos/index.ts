import type { DemoProject } from '@/lib/types';
import { taskly } from './taskly';

/**
 * Demo projects rendered in-page. `shopflow` (the six-service distributed
 * system) joins this list with the microservices modules.
 */
export const demos: DemoProject[] = [taskly];

export function getDemo(id: string | undefined): DemoProject | undefined {
  return demos.find((d) => d.id === id);
}
