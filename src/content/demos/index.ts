import type { DemoProject } from '@/lib/types';
import { taskly } from './taskly';
import { shopflow } from './shopflow-project';
import { relay } from './relay-project';
import { shelf } from './shelf-project';

/**
 * Demo projects rendered in-page. Taskly is the single-service reference used by
 * the core modules; ShopFlow is the distributed system behind modules 07-12;
 * Relay is the notification platform built step by step in module 18; Shelf is
 * the MySQL project behind the Spring JDBC section.
 */
export const demos: DemoProject[] = [taskly, shopflow, relay, shelf];

export function getDemo(id: string | undefined): DemoProject | undefined {
  return demos.find((d) => d.id === id);
}
