# SwiftBuy Database Design (MVP)

## Overview

SwiftBuy uses a relational database (MYSLQ) with a modular schema.

The database is organized around six business domains:

- Identity & Access
- Product Catalog
- Inventory
- Procurement
- Reporting
- Auditing

---

# High-Level ERD

```text
                    +-------------+
                    | Companies   |
                    +-------------+
                           |
                     1 ----- *
                           |
                    +-------------+
                    | Users       |
                    +-------------+
                           |
                           |
                           *
                     +-------------+
                     | Roles       |
                     +-------------+
                           |
                           *
                     +-------------+
                     | Permissions |
                     +-------------+

──────────────────────────────────────────────

                    +-------------+
                    | Categories  |
                    +-------------+
                           |
                           |
                     1 ----- *
                           |
                    +-------------+
                    | Products    |
                    +-------------+
                           |
        ┌──────────────────┼────────────────────┐
        │                  │                    │
        ▼                  ▼                    ▼
+-------------+    +---------------+    +---------------+
| Suppliers   |    | Inventory     |    | PurchaseItems |
+-------------+    +---------------+    +---------------+
        ▲                  ▲                    ▲
        │                  │                    │
        │                  │                    │
        │           +---------------+           │
        │           | StockMovement |           │
        │           +---------------+           │
        │                                      │
        │                                      │
        └──────────────┐               ┌────────┘
                       ▼               ▼
                +---------------------------+
                | Purchase Orders           |
                +---------------------------+

──────────────────────────────────────────────

               +---------------------+
               | Audit Logs          |
               +---------------------+

               +---------------------+
               | Notifications       |
               +---------------------+
```

---

# Core Tables

## Identity

```
companies
users
roles
permissions
role_permissions
```

Purpose:

- Authentication
- Authorization
- Multi-company support

---

## Product Catalog

```
categories

products
```

Products contain:

- SKU
- Barcode
- Name
- Description
- Cost Price
- Selling Price
- Reorder Point
- Status

Products do NOT store inventory history.

---

## Suppliers

```
suppliers
```

Contains:

- Name
- Contact
- Email
- Phone
- Address
- Status

---

## Procurement

```
purchase_orders

purchase_order_items
```

Relationship

```
Purchase Order

↓

Many Purchase Order Items

↓

Each Item references Product
```

---

## Inventory

```
inventory
```

Current stock snapshot.

Example

```
Product

Current Quantity

Reserved Quantity

Available Quantity

Average Cost
```

---

## Stock Movements

```
stock_movements
```

Every inventory change creates one record.

Movement Types

```
PURCHASE

SALE

RETURN

ADJUSTMENT

TRANSFER

DAMAGE

EXPIRED
```

This becomes the source of truth for inventory history.

---

## Audit Logs

```
audit_logs
```

Captures

- User
- Action
- Entity
- Old Value
- New Value
- Timestamp

---

## Notifications

```
notifications
```

Supports

- Approval alerts
- Low stock
- Purchase approval
- Supplier updates

---

# Relationships

```
Company

↓

Users

↓

Roles

↓

Permissions
```

---

```
Category

↓

Products

↓

Inventory
```

---

```
Supplier

↓

Purchase Orders

↓

Purchase Order Items

↓

Products
```

---

```
Purchase Order

↓

Stock Movement

↓

Inventory
```

---

```
Users

↓

Audit Logs
```

---

# Suggested Entity Relationships

```text
Company
 └── Users

Role
 └── Users

Role
 └── RolePermissions
        └── Permissions

Category
 └── Products

Supplier
 └── PurchaseOrders

PurchaseOrder
 └── PurchaseOrderItems

Product
 ├── PurchaseOrderItems
 ├── Inventory
 └── StockMovements

Users
 └── AuditLogs
```

---

# Future Tables

The MVP intentionally excludes the following.

```
warehouses

warehouse_stock

customers

sales

sale_items

returns

payments

invoices

transfers

price_history

supplier_ratings

inventory_forecasts

barcode_scans

offline_sync_queue
```

These can be introduced without redesigning the existing schema.

---

# Design Principles

## Separation of Concerns

Products describe what exists.

Inventory describes current quantities.

Stock Movements describe why quantities changed.

Purchase Orders describe procurement.

Audit Logs describe user activity.

---

## Immutable History

Inventory can change.

Stock movements never change.

Audit logs never change.

---

## Extensibility

The schema supports future additions such as:

- Multi-warehouse
- POS
- Mobile apps
- AI forecasting
- Offline synchronization
- Accounting integrations

without breaking existing relationships.
