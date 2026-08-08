# Business Entity Relationship Diagram

## V1 Business ER Diagram

```mermaid
erDiagram

    BUSINESSES ||--o{ USERS : has
    BUSINESSES ||--o{ PRODUCTS : owns
    BUSINESSES ||--o{ SUPPLIERS : has
    BUSINESSES ||--o{ PURCHASE_ORDERS : creates
    BUSINESSES ||--o{ STOCKS : manages
    BUSINESSES ||--o{ AUDIT_LOGS : generates

    USERS }o--|| ROLES : assigned
    ROLES }o--o{ PERMISSIONS : grants

    PRODUCTS ||--o{ STOCKS : tracks
    SUPPLIERS ||--o{ PURCHASE_ORDERS : receives

    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : contains
    PRODUCTS ||--o{ PURCHASE_ORDER_ITEMS : ordered

    BUSINESSES {
        uuid id PK
        varchar name
        varchar city
        varchar street
        varchar state
        varchar country
        varchar phone_number
        jsonb settings
        varchar currency
        varchar logo
        timestamp deletedAt
        timestamp created_at
        timestamp updated_at
    }

    USERS {
        uuid id PK
        uuid business_id FK
        uuid role_id FK
        varchar first_name
        varchar last_name
        varchar email
        varchar password
    }

    ROLES {
        uuid id PK
        varchar name
    }

    PERMISSIONS {
        uuid id PK
        varchar name
    }

    PRODUCTS {
        uuid id PK
        uuid business_id FK
        varchar name
        decimal cost_price
        decimal selling_price
    }

    STOCKS {
        uuid id PK
        uuid business_id FK
        uuid product_id FK
        decimal quantity
    }

    SUPPLIERS {
        uuid id PK
        uuid business_id FK
        varchar name
        varchar phone_number
    }

    PURCHASE_ORDERS {
        uuid id PK
        uuid business_id FK
        uuid supplier_id FK
        varchar status
        decimal total_amount
    }

    PURCHASE_ORDER_ITEMS {
        uuid id PK
        uuid purchase_order_id FK
        uuid product_id FK
        decimal quantity
        decimal unit_cost
    }

    AUDIT_LOGS {
        uuid id PK
        uuid business_id FK
        uuid user_id FK
        varchar action
    }
```

## Core Relationship

The business is the parent context for business-owned resources.

```text
BUSINESS
   │
   ├── USERS
   ├── PRODUCTS
   ├── SUPPLIERS
   ├── STOCK
   ├── PURCHASE ORDERS
   └── AUDIT LOGS
```

## Important Relationships

### Business → Users

```text
BUSINESS 1 ──── N USERS
```

One business can have multiple users.

### Business → Products

```text
BUSINESS 1 ──── N PRODUCTS
```

A business owns its product catalogue.

### Business → Suppliers

```text
BUSINESS 1 ──── N SUPPLIERS
```

Suppliers belong to a business.

### Business → Stock

```text
BUSINESS 1 ──── N STOCKS
```

Stock records are business-specific.

### Business → Purchase Orders

```text
BUSINESS 1 ──── N PURCHASE_ORDERS
```

Purchase orders are created within the business context.

---

## V1 Scope

The diagram intentionally does **not** include:

- Stores
- Warehouses
- Branches
- Store-level inventory
- Inter-store transfers

Those can be introduced in a future version.
