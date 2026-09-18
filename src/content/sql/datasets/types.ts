/** A sample database the SQL runners can load: schema and data in one script. */
export interface SqlDataset {
  id: 'shop' | 'hr';
  title: string;
  description: string;
  /** CREATE TABLE and INSERT statements, run once to build the dataset. */
  sql: string;
}
