import type { SqlDataset } from './types';

/**
 * A small company: departments, employees with managers, salary history,
 * projects, assignments, attendance and a job-applicant table that contains
 * duplicates on purpose. Built to exercise self-joins, recursive CTEs, window
 * functions and the classic interview puzzles.
 */
export const hr: SqlDataset = {
  id: 'hr',
  title: 'HR',
  description:
    'Departments, employees (with managers), salary history, projects, assignments, attendance and job applicants.',
  sql: `
CREATE TABLE department (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  location  TEXT
);

CREATE TABLE employee (
  id              INTEGER PRIMARY KEY,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  department_id   INTEGER REFERENCES department(id),
  manager_id      INTEGER REFERENCES employee(id),
  job_title       TEXT NOT NULL,
  salary          NUMERIC NOT NULL CHECK (salary > 0),
  commission_pct  NUMERIC,
  hired_on        TEXT NOT NULL
);

CREATE TABLE salary_history (
  employee_id     INTEGER NOT NULL REFERENCES employee(id),
  salary          NUMERIC NOT NULL,
  effective_from  TEXT NOT NULL,
  PRIMARY KEY (employee_id, effective_from)
);

CREATE TABLE project (
  id             INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  department_id  INTEGER REFERENCES department(id),
  starts_on      TEXT,
  ends_on        TEXT,
  budget         NUMERIC
);

CREATE TABLE assignment (
  employee_id  INTEGER NOT NULL REFERENCES employee(id),
  project_id   INTEGER NOT NULL REFERENCES project(id),
  role         TEXT NOT NULL,
  hours        INTEGER NOT NULL,
  PRIMARY KEY (employee_id, project_id)
);

CREATE TABLE attendance (
  employee_id  INTEGER NOT NULL REFERENCES employee(id),
  work_date    TEXT NOT NULL,
  PRIMARY KEY (employee_id, work_date)
);

-- Imported twice by mistake: no unique constraint, so duplicates exist.
CREATE TABLE applicant (
  id          INTEGER PRIMARY KEY,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  position    TEXT NOT NULL,
  applied_on  TEXT NOT NULL
);

INSERT INTO department (id, name, location) VALUES
  (1, 'Engineering', 'Pune'),
  (2, 'Sales',       'Mumbai'),
  (3, 'Finance',     'Bengaluru'),
  (4, 'HR',          'Pune'),
  (5, 'Research',    'Hyderabad');

INSERT INTO employee (id, first_name, last_name, email, department_id, manager_id, job_title, salary, commission_pct, hired_on) VALUES
  (1,  'Asha',   'Rao',     'asha.rao@acme.test',     NULL, NULL, 'CEO',                  250000, NULL, '2015-04-01'),
  (2,  'Vikram', 'Iyer',    'vikram.iyer@acme.test',  1,    1,    'VP Engineering',       210000, NULL, '2016-07-11'),
  (3,  'Meera',  'Nair',    'meera.nair@acme.test',   1,    2,    'Engineering Manager',  150000, NULL, '2018-02-19'),
  (4,  'Arjun',  'Mehta',   'arjun.mehta@acme.test',  1,    3,    'Senior Engineer',      125000, NULL, '2019-09-02'),
  (5,  'Priya',  'Shah',    'priya.shah@acme.test',   1,    3,    'Senior Engineer',      125000, NULL, '2020-01-06'),
  (6,  'Rohan',  'Das',     'rohan.das@acme.test',    1,    3,    'Engineer',              95000, NULL, '2022-03-14'),
  (7,  'Neha',   'Kulkarni','neha.kulkarni@acme.test',1,    3,    'Engineer',              98000, NULL, '2021-11-29'),
  (8,  'Karan',  'Singh',   'karan.singh@acme.test',  1,    4,    'Junior Engineer',       60000, NULL, '2025-07-01'),
  (9,  'Lena',   'Fischer', 'lena.fischer@acme.test', 1,    3,    'Staff Engineer',       160000, NULL, '2017-05-22'),
  (10, 'Rahul',  'Verma',   'rahul.verma@acme.test',  2,    1,    'Head of Sales',        170000, NULL, '2017-01-09'),
  (11, 'Sara',   'Khan',    'sara.khan@acme.test',    2,    10,   'Account Executive',     70000, 0.10, '2021-06-15'),
  (12, 'Tom',    'Baker',   'tom.baker@acme.test',    2,    10,   'Account Executive',     72000, 0.12, '2020-10-05'),
  (13, 'Ananya', 'Joshi',   'ananya.joshi@acme.test', 2,    11,   'Sales Associate',       45000, 0.05, '2024-08-19'),
  (14, 'David',  'Chen',    'david.chen@acme.test',   3,    1,    'Finance Director',     160000, NULL, '2016-03-28'),
  (15, 'Kavya',  'Reddy',   'kavya.reddy@acme.test',  3,    14,   'Accountant',            80000, NULL, '2019-12-02'),
  (16, 'Imran',  'Sheikh',  'imran.sheikh@acme.test', 3,    14,   'Financial Analyst',     80000, NULL, '2022-08-08'),
  (17, 'Fatima', 'Ali',     'fatima.ali@acme.test',   4,    1,    'HR Manager',           110000, NULL, '2018-10-15'),
  (18, 'Nikhil', 'Bose',    'nikhil.bose@acme.test',  4,    17,   'Recruiter',             55000, NULL, '2023-04-03'),
  (19, 'Olivia', 'Brown',   'olivia.brown@acme.test', NULL, 2,    'Contractor',            90000, NULL, '2026-01-12');

INSERT INTO salary_history (employee_id, salary, effective_from) VALUES
  (2,  180000, '2016-07-11'), (2,  195000, '2020-04-01'), (2,  210000, '2024-04-01'),
  (3,  110000, '2018-02-19'), (3,  135000, '2022-04-01'), (3,  150000, '2025-04-01'),
  (4,   90000, '2019-09-02'), (4,  110000, '2022-04-01'), (4,  125000, '2025-04-01'),
  (5,  100000, '2020-01-06'), (5,  125000, '2024-04-01'),
  (6,   80000, '2022-03-14'), (6,   95000, '2025-04-01'),
  (7,   85000, '2021-11-29'), (7,   98000, '2024-04-01'),
  (8,   60000, '2025-07-01'),
  (9,  120000, '2017-05-22'), (9,  140000, '2021-04-01'), (9,  160000, '2025-04-01'),
  (11,  60000, '2021-06-15'), (11,  70000, '2024-04-01'),
  (12,  65000, '2020-10-05'), (12,  72000, '2023-04-01'),
  (15,  70000, '2019-12-02'), (15,  80000, '2023-04-01'),
  (16,  80000, '2022-08-08');

INSERT INTO project (id, name, department_id, starts_on, ends_on, budget) VALUES
  (1, 'Checkout Revamp', 1, '2026-01-15', '2026-06-30', 500000),
  (2, 'Mobile App',      1, '2026-03-01', NULL,         800000),
  (3, 'CRM Migration',   2, '2025-11-01', '2026-02-28', 200000),
  (4, 'Audit 2026',      3, '2026-04-01', '2026-05-15',  50000),
  (5, 'Hiring Drive',    4, '2026-02-01', NULL,          30000),
  (6, 'Data Platform',   1, NULL,         NULL,          NULL);

INSERT INTO assignment (employee_id, project_id, role, hours) VALUES
  (3, 1, 'Lead',      120), (4, 1, 'Developer', 300), (6, 1, 'Developer', 280),
  (8, 1, 'Developer', 150), (9, 2, 'Lead',      200), (5, 2, 'Developer', 320),
  (7, 2, 'Developer', 310), (19, 2, 'Designer', 180), (10, 3, 'Sponsor',   40),
  (11, 3, 'Analyst',  160), (12, 3, 'Analyst',  140), (14, 4, 'Lead',      60),
  (15, 4, 'Auditor',  110), (16, 4, 'Auditor',  90),  (17, 5, 'Lead',      50),
  (18, 5, 'Recruiter', 220), (4, 2, 'Reviewer', 40);

INSERT INTO attendance (employee_id, work_date) VALUES
  (6, '2026-09-01'), (6, '2026-09-02'), (6, '2026-09-03'), (6, '2026-09-04'),
  (6, '2026-09-07'), (6, '2026-09-08'),
  (6, '2026-09-10'), (6, '2026-09-11'),
  (8, '2026-09-01'), (8, '2026-09-02'),
  (8, '2026-09-05'), (8, '2026-09-06'), (8, '2026-09-07'), (8, '2026-09-08');

INSERT INTO applicant (id, full_name, email, position, applied_on) VALUES
  (1, 'Maya Pillai',   'maya.p@mail.test',    'Engineer',          '2026-08-01'),
  (2, 'Jon Ellis',     'jon.ellis@mail.test', 'Account Executive', '2026-08-02'),
  (3, 'Ravi Kumar',    'ravi.k@mail.test',    'Engineer',          '2026-08-03'),
  (4, 'Maya Pillai',   'maya.p@mail.test',    'Engineer',          '2026-08-01'),
  (5, 'Zoe Martin',    'zoe.m@mail.test',     'Recruiter',         '2026-08-05'),
  (6, 'Ravi Kumar',    'ravi.k@mail.test',    'Engineer',          '2026-08-03'),
  (7, 'Maya Pillai',   'maya.p@mail.test',    'Engineer',          '2026-08-01'),
  (8, 'Ines Silva',    'ines.s@mail.test',    'Financial Analyst', '2026-08-07');
`,
};
