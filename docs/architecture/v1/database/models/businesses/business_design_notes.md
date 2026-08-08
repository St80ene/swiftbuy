# Business Design Notes

## Purpose

The `businesses` table represents the business using SwiftBuy.

It acts as the parent context for the application's business data.

---

# Core Principle

> Every piece of business-owned data should be traceable to a business.

Therefore, business-owned tables should generally contain:

```text
business_id
```

Examples:

```text
users
products
suppliers
stocks
purchase_orders
audit_logs
```

---

# Business Hierarchy

```text
BUSINESS
   │
   ├── USERS
   │     └── ROLES / PERMISSIONS
   │
   ├── PRODUCTS
   │     └── STOCK
   │
   ├── SUPPLIERS
   │     └── PURCHASE ORDERS
   │             └── PURCHASE ORDER ITEMS
   │
   ├── AUDIT LOGS
   │
   └── DASHBOARD / REPORTS
```

---

# Business Context vs Role

These two concepts should remain separate.

### Business Context

Determined by:

```text
business_id
```

Answers:

> Which business does this user belong to?

### Authorization

Determined by:

```text
role_id
```

Answers:

> What is this user allowed to do?

Therefore:

```text
USER
 ├── business_id → Business A
 └── role_id     → MANAGER
```

means:

> The user is a Manager within Business A.

---

# Settings

The `settings` column uses JSONB for flexible business configuration.

Example:

```json
{
  "low_stock_threshold": 10,
  "allow_negative_stock": false,
  "tax_enabled": false,
  "notifications_enabled": true
}
```

Settings should contain configuration that belongs specifically to the business.

They should not become a dumping ground for core relational data.

---

# Currency

The business has a default currency:

```text
currency
```

Store the ISO currency code.

Example:

```text
NGN
```

rather than:

```text
₦
```

This makes the application easier to extend to other currencies later.

---

# Soft Deletion

Businesses should use soft deletion through:

```text
deletedAt
```

A deleted business is not immediately removed from the database.

Instead:

```text
deletedAt = current timestamp
```

This preserves historical information and provides an opportunity for recovery.

---

# V1 Scope

The first version intentionally keeps the business model simple.

### Included

- Business profile
- Business contact information
- Business location
- Currency
- Business settings
- Business logo
- Business users
- Business products
- Business suppliers
- Business stock
- Business purchase orders
- Business audit logs

### Not Included

- Multiple stores
- Multiple warehouses
- Branches
- Inter-store transfers
- Store-specific inventory
- Warehouse-specific inventory

---

# Future V2 Direction

Multi-store support can later be introduced between the business and inventory.

Current V1:

```text
BUSINESS
   │
   └── STOCK
```

Possible V2:

```text
BUSINESS
   │
   ├── STORE A
   │     └── STOCK
   │
   ├── STORE B
   │     └── STOCK
   │
   └── STORE C
         └── STOCK
```

This allows the current V1 business model to remain simple without closing the door to future expansion.

---

# Architectural Summary

The business is the **root business context**, not a transaction.

It establishes ownership and separation of business data.

```text
BUSINESS
    ↓
OWNERSHIP
    ↓
USERS / PRODUCTS / SUPPLIERS / STOCK / PURCHASE ORDERS
    ↓
OPERATIONS
    ↓
DASHBOARD
    ↓
REPORTS
```

The database should therefore use `business_id` consistently wherever business ownership matters.
