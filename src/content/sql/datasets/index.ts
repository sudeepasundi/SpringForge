import { hr } from './hr';
import { shop } from './shop';
import type { SqlDataset } from './types';

export type { SqlDataset } from './types';

export const datasets: SqlDataset[] = [shop, hr];

export function getDataset(id: string): SqlDataset | undefined {
  return datasets.find((d) => d.id === id);
}
