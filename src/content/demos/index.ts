import type { DemoProject } from '@/lib/types';
import { taskly } from './taskly';
import { shopflow } from './shopflow-project';

/**
 * Demo projects rendered in-page. Taskly is the single-service reference used by
 * the core modules; ShopFlow is the distributed system behind modules 07-12.
 */
export const demos: DemoProject[] = [taskly, shopflow];

export function getDemo(id: string | undefined): DemoProject | undefined {
  return demos.find((d) => d.id === id);
}
