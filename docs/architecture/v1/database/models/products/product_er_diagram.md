# Product Entity Relationship Diagram

## ER Diagram

```mermaid
erDiagram

    BUSINESS ||--o{ PRODUCT : owns
    CATEGORY ||--o{ PRODUCT : contains
    UNIT ||--o{ PRODUCT : measures

    BUSINESS {
        INT id PK
        VARCHAR name
        VARCHAR city
        VARCHAR street
        VARCHAR state
        VARCHAR country
        VARCHAR phone_number
        JSON settings
        VARCHAR currency
        VARCHAR logo
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CATEGORY {
        INT id PK
        VARCHAR name
        INT business_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    UNIT {
        INT id PK
        VARCHAR name
        VARCHAR symbol
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    PRODUCT {
        INT id PK
        INT business_id FK
        INT category_id FK
        VARCHAR name
        VARCHAR sku UK
        INT unit_id FK
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
```

## Relationships

### Business → Product

A business can have many products.

```text
BUSINESS 1 ─────────── N PRODUCT
```

The relationship is implemented through:

```text
products.business_id → businesses.id
```

### Category → Product

A category can contain many products.

```text
CATEGORY 1 ─────────── N PRODUCT
```

The relationship is implemented through:

```text
products.category_id → categories.id
```

### Unit → Product

A unit can be used by many products.

```text
UNIT 1 ─────────── N PRODUCT
```

The relationship is implemented through:

```text
products.unit_id → units.id
```

## Product's Position in the Database

```text
                         ┌──────────────┐
                         │   BUSINESS   │
                         └──────┬───────┘
                                │
                                │ 1:N
                                ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│   CATEGORY   │─────────▶│   PRODUCT    │◀─────────│     UNIT     │
└──────────────┘   1:N    └──────────────┘    N:1   └──────────────┘
```

## Design Principle

The Product entity does not duplicate business, category, or unit information.

Instead, it stores references:

```text
product.business_id → business.id
product.category_id → category.id
product.unit_id → unit.id
```

This keeps the product table normalized and allows each related entity to maintain its own data.
