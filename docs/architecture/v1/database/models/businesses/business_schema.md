# Business Database Schema

## Overview

The `businesses` table represents the business using SwiftBuy.

For V1, SwiftBuy supports a single business context per user and does **not** include multi-store or multi-warehouse support.

The business acts as the parent context for business-owned data such as:

- Users
- Products
- Suppliers
- Stock
- Purchase Orders
- Audit Logs

---

## Table: `businesses`

| Column         | Type         | Constraints | Description                        |
| -------------- | ------------ | ----------- | ---------------------------------- |
| `id`           | UUID         | PK          | Unique business identifier         |
| `name`         | VARCHAR(150) | NOT NULL    | Business name                      |
| `city`         | VARCHAR(100) | NULL        | Business city                      |
| `street`       | VARCHAR(255) | NULL        | Business street/address            |
| `state`        | VARCHAR(100) | NULL        | Business state                     |
| `country`      | VARCHAR(100) | NULL        | Business country                   |
| `phone_number` | VARCHAR(30)  | NULL        | Business phone number              |
| `settings`     | JSONB        | NULL        | Business-specific configuration    |
| `currency`     | VARCHAR(3)   | NOT NULL    | Business base currency, e.g. `NGN` |
| `logo`         | VARCHAR(500) | NULL        | Logo URL or storage reference      |
| `deletedAt`    | TIMESTAMP    | NULL        | Soft deletion timestamp            |
| `created_at`   | TIMESTAMP    | NOT NULL    | Record creation timestamp          |
| `updated_at`   | TIMESTAMP    | NOT NULL    | Last update timestamp              |

---

## Example

```json
{
  "id": "business-uuid",
  "name": "SwiftBuy Nylon & Packaging",
  "city": "Lagos",
  "street": "12 Example Street",
  "state": "Lagos",
  "country": "Nigeria",
  "phone_number": "+2348000000000",
  "settings": {
    "low_stock_threshold": 10,
    "allow_negative_stock": false,
    "tax_enabled": false,
    "notifications_enabled": true
  },
  "currency": "NGN",
  "logo": "https://example.com/logo.png"
}
```

## Design Decisions

### Currency

Store the ISO 4217 currency code rather than the currency symbol.

```text
NGN
USD
GBP
EUR
```

### Settings

Business-specific configuration is stored in `settings` as JSONB.

This avoids creating a new database column every time a small configuration option is introduced.

Example:

```json
{
  "low_stock_threshold": 10,
  "allow_negative_stock": false
}
```

### Logo

The database stores a URL or storage reference rather than the image binary itself.

### Soft Delete

`deletedAt` allows the business to be removed logically without immediately deleting its database record.

---

## Business Ownership Rule

Every piece of business-owned data should be traceable back to a business.

Business-owned tables should generally contain:

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

This establishes the foundation for future multi-business support while keeping V1 simple.
