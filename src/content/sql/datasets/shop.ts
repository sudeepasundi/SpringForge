import type { SqlDataset } from './types';

/**
 * A small online shop: a category tree, products, customers (with referrals),
 * orders, order items and reviews. Built for joins, aggregation, pagination
 * and reporting. The orders table is called `orders` because ORDER is a
 * reserved word.
 */
export const shop: SqlDataset = {
  id: 'shop',
  title: 'Shop',
  description:
    'Categories (a tree), products, customers (with referrals), orders, order items and reviews.',
  sql: `
CREATE TABLE category (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  parent_id  INTEGER REFERENCES category(id)
);

CREATE TABLE product (
  id            INTEGER PRIMARY KEY,
  sku           TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  category_id   INTEGER NOT NULL REFERENCES category(id),
  price         NUMERIC NOT NULL CHECK (price >= 0),
  stock         INTEGER NOT NULL DEFAULT 0,
  discontinued  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE customer (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  city          TEXT,
  country       TEXT NOT NULL,
  signed_up_on  TEXT NOT NULL,
  referred_by   INTEGER REFERENCES customer(id)
);

CREATE TABLE orders (
  id             INTEGER PRIMARY KEY,
  customer_id    INTEGER NOT NULL REFERENCES customer(id),
  ordered_at     TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  shipping_city  TEXT
);

CREATE TABLE order_item (
  order_id    INTEGER NOT NULL REFERENCES orders(id),
  product_id  INTEGER NOT NULL REFERENCES product(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE review (
  id           INTEGER PRIMARY KEY,
  product_id   INTEGER NOT NULL REFERENCES product(id),
  customer_id  INTEGER NOT NULL REFERENCES customer(id),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body         TEXT,
  created_at   TEXT NOT NULL
);

INSERT INTO category (id, name, parent_id) VALUES
  (1, 'Books',       NULL),
  (2, 'Electronics', NULL),
  (3, 'Home',        NULL),
  (4, 'Programming', 1),
  (5, 'Fiction',     1),
  (6, 'Audio',       2),
  (7, 'Laptops',     2),
  (8, 'Kitchen',     3);

INSERT INTO product (id, sku, name, category_id, price, stock, discontinued) VALUES
  (1,  'BK-JAVA-21',  'Modern Java in Action',        4,   45.00,  30, 0),
  (2,  'BK-SQL-101',  'Learning SQL',                 4,   39.50,  12, 0),
  (3,  'BK-SPRING',   'Spring in Practice',           4,   52.00,   0, 0),
  (4,  'BK-DUNE',     'Dune',                         5,   12.99,  80, 0),
  (5,  'BK-HOBBIT',   'The Hobbit',                   5,    9.99,  65, 0),
  (6,  'BK-OLDREF',   'Java 6 Reference',             4,   25.00,   3, 1),
  (7,  'AU-HP-200',   'Studio Headphones',            6,  149.00,  25, 0),
  (8,  'AU-SPK-10',   'Bluetooth Speaker',            6,   59.00,  40, 0),
  (9,  'AU-EAR-5',    'Wireless Earbuds',             6,   89.00,   0, 0),
  (10, 'LT-AIR-13',   'Ultrabook 13',                 7, 1199.00,   8, 0),
  (11, 'LT-PRO-16',   'Workstation 16',               7, 2399.00,   4, 0),
  (12, 'KT-KETTLE',   'Electric Kettle',              8,   34.00,  50, 0),
  (13, 'KT-KNIFE',    'Chef Knife',                   8,   79.00,  18, 0),
  (14, 'KT-PAN-28',   'Cast Iron Pan',                8,   49.00,  22, 0),
  (15, 'HM-LAMP',     'Desk Lamp',                    3,   29.00,  35, 0),
  (16, 'LT-BAG',      'Laptop Sleeve',                7,   24.00,  60, 0);

INSERT INTO customer (id, name, email, city, country, signed_up_on, referred_by) VALUES
  (1,  'Aisha Patel',   'aisha@mail.test',   'Mumbai',    'India',   '2025-11-03', NULL),
  (2,  'Ben Carter',    'ben@mail.test',     'London',    'UK',      '2025-11-20', NULL),
  (3,  'Chen Wei',      'chen@mail.test',    'Singapore', 'Singapore','2025-12-01', 1),
  (4,  'Divya Menon',   'divya@mail.test',   'Pune',      'India',   '2026-01-08', 1),
  (5,  'Elena Rossi',   'elena@mail.test',   'Milan',     'Italy',   '2026-01-15', NULL),
  (6,  'Farhan Qureshi','farhan@mail.test',  'Mumbai',    'India',   '2026-02-02', 4),
  (7,  'Grace Kim',     'grace@mail.test',   NULL,        'South Korea','2026-02-14', NULL),
  (8,  'Hugo Martin',   'hugo@mail.test',    'Paris',     'France',  '2026-03-01', 2),
  (9,  'Isha Gupta',    'isha@mail.test',    'Delhi',     'India',   '2026-03-19', 4),
  (10, 'Jack Wilson',   'jack@mail.test',    'London',    'UK',      '2026-04-05', 2),
  (11, 'Kiran Rao',     'kiran@mail.test',   'Bengaluru', 'India',   '2026-05-10', NULL),
  (12, 'Lucia Gomez',   'lucia@mail.test',   'Madrid',    'Spain',   '2026-06-22', NULL),
  (13, 'Mohan Lal',     'mohan@mail.test',   'Pune',      'India',   '2026-07-30', 9),
  (14, 'Nora Svensson', 'nora@mail.test',    NULL,        'Sweden',  '2026-08-12', NULL);

INSERT INTO orders (id, customer_id, ordered_at, status, shipping_city) VALUES
  (1,  1,  '2026-01-05 10:12:00', 'DELIVERED', 'Mumbai'),
  (2,  2,  '2026-01-09 18:40:00', 'DELIVERED', 'London'),
  (3,  3,  '2026-01-21 08:05:00', 'DELIVERED', 'Singapore'),
  (4,  1,  '2026-02-03 14:30:00', 'DELIVERED', 'Mumbai'),
  (5,  4,  '2026-02-11 09:15:00', 'CANCELLED', 'Pune'),
  (6,  5,  '2026-02-18 20:22:00', 'DELIVERED', 'Milan'),
  (7,  2,  '2026-03-02 11:00:00', 'DELIVERED', 'London'),
  (8,  6,  '2026-03-09 16:45:00', 'DELIVERED', 'Mumbai'),
  (9,  4,  '2026-03-15 12:10:00', 'DELIVERED', 'Pune'),
  (10, 8,  '2026-03-28 19:30:00', 'DELIVERED', 'Paris'),
  (11, 1,  '2026-04-04 07:55:00', 'DELIVERED', 'Pune'),
  (12, 9,  '2026-04-12 13:20:00', 'DELIVERED', 'Delhi'),
  (13, 3,  '2026-04-25 22:05:00', 'CANCELLED', 'Singapore'),
  (14, 10, '2026-05-06 10:40:00', 'DELIVERED', 'London'),
  (15, 5,  '2026-05-19 17:15:00', 'DELIVERED', 'Milan'),
  (16, 11, '2026-05-30 09:00:00', 'DELIVERED', 'Bengaluru'),
  (17, 2,  '2026-06-08 15:35:00', 'DELIVERED', 'London'),
  (18, 6,  '2026-06-17 21:10:00', 'SHIPPED',   'Mumbai'),
  (19, 12, '2026-07-01 08:25:00', 'DELIVERED', 'Madrid'),
  (20, 4,  '2026-07-13 11:50:00', 'DELIVERED', 'Pune'),
  (21, 1,  '2026-07-27 18:05:00', 'SHIPPED',   'Mumbai'),
  (22, 9,  '2026-08-03 10:30:00', 'SHIPPED',   'Delhi'),
  (23, 13, '2026-08-15 14:45:00', 'PAID',      'Pune'),
  (24, 8,  '2026-08-22 09:40:00', 'PAID',      'Paris'),
  (25, 2,  '2026-09-01 12:00:00', 'PAID',      'London'),
  (26, 11, '2026-09-04 16:30:00', 'PENDING',   'Bengaluru'),
  (27, 3,  '2026-09-06 07:20:00', 'PENDING',   'Singapore'),
  (28, 5,  '2026-09-09 19:55:00', 'PENDING',   NULL);

INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES
  (1,  1,  1,   45.00), (1,  4,  2,   12.99),
  (2,  10, 1, 1149.00), (2,  16, 1,   24.00),
  (3,  7,  1,  149.00),
  (4,  2,  1,   39.50), (4,  5,  1,    9.99), (4,  12, 1,   34.00),
  (5,  11, 1, 2399.00),
  (6,  13, 1,   79.00), (6,  14, 1,   49.00),
  (7,  8,  2,   59.00),
  (8,  1,  1,   45.00), (8,  2,  1,   39.50), (8,  3,  1,   52.00),
  (9,  15, 2,   29.00),
  (10, 7,  1,  149.00), (10, 9,  1,   89.00),
  (11, 4,  1,   12.99),
  (12, 10, 1, 1199.00), (12, 16, 1,   24.00),
  (13, 8,  1,   59.00),
  (14, 5,  3,    9.99), (14, 4,  1,   12.99),
  (15, 12, 1,   34.00), (15, 14, 2,   49.00),
  (16, 11, 1, 2399.00),
  (17, 1,  1,   45.00), (17, 7,  1,  149.00),
  (18, 13, 1,   79.00),
  (19, 8,  1,   59.00), (19, 15, 1,   29.00),
  (20, 2,  2,   39.50),
  (21, 9,  1,   89.00), (21, 12, 1,   34.00),
  (22, 4,  1,   12.99), (22, 5,  1,    9.99),
  (23, 10, 1, 1199.00),
  (24, 14, 1,   49.00),
  (25, 3,  1,   52.00), (25, 1,  1,   45.00),
  (26, 16, 2,   24.00),
  (27, 7,  1,  149.00),
  (28, 12, 2,   34.00);

INSERT INTO review (id, product_id, customer_id, rating, body, created_at) VALUES
  (1,  1,  1,  5, 'Clear and practical.',               '2026-01-20'),
  (2,  10, 2,  4, 'Fast, but the fan is loud.',         '2026-01-25'),
  (3,  7,  3,  5, NULL,                                 '2026-02-02'),
  (4,  2,  1,  4, 'Good introduction.',                 '2026-02-15'),
  (5,  13, 5,  5, 'Very sharp.',                        '2026-03-01'),
  (6,  8,  2,  3, 'Battery could be better.',           '2026-03-15'),
  (7,  3,  6,  5, 'Exactly what I needed.',             '2026-03-20'),
  (8,  9,  8,  2, 'Left earbud stopped working.',       '2026-04-10'),
  (9,  4,  1,  5, 'A classic.',                         '2026-04-20'),
  (10, 10, 9,  5, NULL,                                 '2026-04-30'),
  (11, 5,  10, 4, 'Lovely edition.',                    '2026-05-20'),
  (12, 11, 11, 4, 'Powerful, heavy.',                   '2026-06-10'),
  (13, 7,  2,  4, 'Comfortable for long sessions.',     '2026-06-20'),
  (14, 15, 12, 3, 'Bright, but wobbly.',                '2026-07-10'),
  (15, 2,  4,  5, 'The best SQL book I have read.',     '2026-07-25');
`,
};
