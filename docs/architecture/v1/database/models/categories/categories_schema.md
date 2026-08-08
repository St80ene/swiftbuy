# Category Database Schema

## Overview

The `categories` table stores the product categories defined by a business.

Categories provide a way for a business to organize its products into logical groups.

## Table: `categories`

| Column        | Data Type    | Constraints                 | Description                                 |
| ------------- | ------------ | --------------------------- | ------------------------------------------- |
| `id`          | INTEGER      | Primary Key, Auto Increment | Unique identifier for the category          |
| `business_id` | INTEGER      | Foreign Key, NOT NULL       | Business that owns the category             |
| `name`        | VARCHAR(100) | NOT NULL                    | Name of the category                        |
| `created_at`  | TIMESTAMP    | NOT NULL                    | Date and time the category was created      |
| `updated_at`  | TIMESTAMP    | NOT NULL                    | Date and time the category was last updated |

## Foreign Keys

| Column        | References      | Purpose                                   |
| ------------- | --------------- | ----------------------------------------- |
| `business_id` | `businesses.id` | Associates the category with its business |

## Schema

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,

    business_id INTEGER NOT NULL,

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_business
        FOREIGN KEY (business_id)
        REFERENCES businesses(id)
);
```

## Example Records

|  id | business_id | name        |
| --: | ----------: | ----------- |
|   1 |          10 | Beverages   |
|   2 |          10 | Clothing    |
|   3 |          10 | Electronics |
|   4 |          11 | Beverages   |

## Design Notes

### Business Ownership

Every category belongs to a business.

This means two businesses can have categories with the same name.

For example:

```text
Business A
├── Beverages
├── Snacks
└── Household

Business B
├── Beverages
├── Clothing
└── Electronics
```

The category is therefore scoped to the business through `business_id`.

### Category Name

The category name identifies the category within the business.

Because categories are business-scoped, the recommended uniqueness rule is:

```sql
UNIQUE (business_id, name)
```

This prevents the same business from creating duplicate categories while allowing different businesses to use the same category name.

## Recommended Constraint

```sql
CONSTRAINT uq_categories_business_name
    UNIQUE (business_id, name)
```

This is preferable to making `name` globally unique.

## Current Scope

The Category entity is intentionally simple:

```text
Category
├── id
├── business_id
└── name
```

With system-managed timestamps:

```text
created_at
updated_at
```

The Category entity does not store product information directly.

Products reference categories through `category_id`.
