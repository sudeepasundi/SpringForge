import type { DemoProject } from '@/lib/types';
import { taskly } from './taskly';
import { shopflow } from './shopflow-project';
import { relay } from './relay-project';

/**
 * Demo projects rendered in-page. Taskly is the single-service reference used by
 * the core modules; ShopFlow is the distributed system behind modules 07-12;
 * Relay is the notification platform built step by step in module 18.
 */
export const demos: DemoProject[] = [taskly, shopflow, relay];

export function getDemo(id: string | undefined): DemoProject | undefined {
  return demos.find((d) => d.id === id);
}
