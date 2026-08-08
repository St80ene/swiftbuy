# Product Database Schema

## Overview

The `products` table stores the products sold or managed by a business.

A product belongs to a business, can be organized under a category, and has a defined unit of measurement.

## Table: `products`

| Column        | Data Type      | Constraints                 | Description                                     |
| ------------- | -------------- | --------------------------- | ----------------------------------------------- |
| `id`          | INTEGER        | Primary Key, Auto Increment | Unique identifier for the product               |
| `business_id` | INTEGER        | Foreign Key, NOT NULL       | Business that owns the product                  |
| `category_id` | INTEGER        | Foreign Key, NOT NULL       | Category the product belongs to                 |
| `name`        | VARCHAR(255)   | NOT NULL                    | Name of the product                             |
| `sku`         | VARCHAR(100)   | UNIQUE, NOT NULL            | Stock Keeping Unit used to identify the product |
| `unit_id`     | INTEGER        | Foreign Key, NOT NULL       | Unit used to measure or sell the product        |
| `status`      | VARCHAR / ENUM | NOT NULL                    | Current state of the product                    |
| `created_at`  | TIMESTAMP      | NOT NULL                    | Date and time the product was created           |
| `updated_at`  | TIMESTAMP      | NOT NULL                    | Date and time the product was last updated      |

## Foreign Keys

| Column        | References      | Purpose                                   |
| ------------- | --------------- | ----------------------------------------- |
| `business_id` | `businesses.id` | Associates the product with a business    |
| `category_id` | `categories.id` | Associates the product with a category    |
| `unit_id`     | `units.id`      | Defines the product's unit of measurement |

## Schema

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,

    business_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,

    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,

    unit_id INTEGER NOT NULL,

    status VARCHAR(50) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_business
        FOREIGN KEY (business_id)
        REFERENCES businesses(id),

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id),

    CONSTRAINT fk_products_unit
        FOREIGN KEY (unit_id)
        REFERENCES units(id)
);
```

## Example Record

|  id | business_id | category_id | name           | sku       | unit_id | status |
| --: | ----------: | ----------: | -------------- | --------- | ------: | ------ |
|   1 |          10 |           2 | Coca-Cola 50cl | COKE-50CL |       1 | ACTIVE |

## Design Notes

### `business_id`

Every product belongs to a business.

This is important because the system is designed around businesses as the primary organizational boundary.

```text
Business
   │
   └── Products
```

A product should therefore never exist without a business association.

### `category_id`

Products can be grouped into categories.

For example:

```text
Beverages
├── Coca-Cola
├── Pepsi
└── Sprite
```

The category is stored as a foreign key rather than duplicated as text on every product.

### `unit_id`

The unit defines how the product is measured or sold.

Examples:

```text
piece
pack
box
kg
gram
litre
bottle
```

This allows inventory and transaction systems to use a consistent unit definition.

### `sku`

The SKU provides a business-level identifier for a product.

Example:

```text
SKU: SHIRT-BLK-L
```

The SKU should be unique within the appropriate business scope.

> If the product system allows different businesses to independently use the same SKU, the better constraint is a composite unique key on `(business_id, sku)` rather than a globally unique `sku`.

### `status`

`status` represents the lifecycle state of the product.

Possible values can include:

```text
ACTIVE
INACTIVE
ARCHIVED
```

The exact values should be defined by the application's business rules.
