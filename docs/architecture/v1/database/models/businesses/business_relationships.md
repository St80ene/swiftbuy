# Business Relationships

## Business → Users

```mermaid
erDiagram
    BUSINESSES ||--o{ USERS : employs

    BUSINESSES {
        uuid id PK
        varchar name
    }

    USERS {
        uuid id PK
        uuid business_id FK
        uuid role_id FK
        varchar first_name
        varchar last_name
        varchar email
    }
```

One business can have many users.

```text
Business
   │
   ├── Admin
   ├── Manager
   ├── Storeman
   └── Cashier
```

The `business_id` identifies the business.

The `role_id` identifies what the user can do.

---

# Business → Products

```mermaid
erDiagram
    BUSINESSES ||--o{ PRODUCTS : owns

    BUSINESSES {
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
```

A business can have many products.

---

# Business → Suppliers

```mermaid
erDiagram
    BUSINESSES ||--o{ SUPPLIERS : has

    BUSINESSES {
        uuid id PK
        varchar name
    }

    SUPPLIERS {
        uuid id PK
        uuid business_id FK
        varchar name
        varchar phone_number
    }
```

Suppliers belong to the business that manages them.

---

# Business → Purchase Orders

```mermaid
erDiagram
    BUSINESSES ||--o{ PURCHASE_ORDERS : creates
    SUPPLIERS ||--o{ PURCHASE_ORDERS : receives

    BUSINESSES {
        uuid id PK
        varchar name
    }

    SUPPLIERS {
        uuid id PK
        uuid business_id FK
        varchar name
    }

    PURCHASE_ORDERS {
        uuid id PK
        uuid business_id FK
        uuid supplier_id FK
        varchar status
        decimal total_amount
    }
```

The flow is:

```text
Business
   ↓
Supplier
   ↓
Purchase Order
   ↓
Receive Goods
   ↓
Stock
```

---

# Business → Stock

```mermaid
erDiagram
    BUSINESSES ||--o{ STOCKS : manages
    PRODUCTS ||--o{ STOCKS : has

    BUSINESSES {
        uuid id PK
        varchar name
    }

    PRODUCTS {
        uuid id PK
        uuid business_id FK
        varchar name
    }

    STOCKS {
        uuid id PK
        uuid business_id FK
        uuid product_id FK
        decimal quantity
    }
```

Conceptually:

```text
Business
   │
   └── Product
          │
          └── Stock
```

---

# Business → Audit Logs

```mermaid
erDiagram
    BUSINESSES ||--o{ AUDIT_LOGS : generates
    USERS ||--o{ AUDIT_LOGS : performs

    BUSINESSES {
        uuid id PK
        varchar name
    }

    USERS {
        uuid id PK
        uuid business_id FK
    }

    AUDIT_LOGS {
        uuid id PK
        uuid business_id FK
        uuid user_id FK
        varchar action
    }
```

Audit logs allow the system to answer questions such as:

```text
Who changed the stock?

Who created this product?

Who created this purchase order?

Who changed this supplier?

When did the change happen?
```
