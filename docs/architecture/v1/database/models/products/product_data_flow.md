# Product Data Flow

## Overview

The Product data flow describes how product information enters the system, how it is associated with a business, category, and unit, and how it becomes available to other parts of the inventory system.

## High-Level Product Flow

```mermaid
flowchart TD

    A[Business User] --> B[Product Management]

    B --> C[Create / Update Product]

    C --> D[Validate Product Data]

    D --> E{Valid?}

    E -- No --> F[Return Validation Error]

    E -- Yes --> G[Validate Business]
    G --> H[Validate Category]
    H --> I[Validate Unit]

    I --> J[Save Product]

    J --> K[(Products Table)]

    K --> L[Inventory System]
    K --> M[Sales System]
    K --> N[Procurement System]
    K --> O[Reports & Analytics]
```

## Product Creation Flow

```mermaid
flowchart LR

    A[Business User] --> B[Product Form]

    B --> C[Product Data]

    C --> D[Validate Business]

    D --> E[Validate Category]

    E --> F[Validate Unit]

    F --> G[Validate SKU]

    G --> H{Valid?}

    H -- No --> I[Reject Request]

    H -- Yes --> J[(products)]

    J --> K[Product Created]
```

## Data Dependencies

Before a Product can be created, the system needs to resolve its references.

```mermaid
flowchart TD

    A[Create Product]

    A --> B[Business]
    A --> C[Category]
    A --> D[Unit]

    B --> E{Business Exists?}
    C --> F{Category Exists?}
    D --> G{Unit Exists?}

    E --> H[Create Product]
    F --> H
    G --> H

    H --> I[(products)]
```

The Product record therefore depends on:

```text
business_id → businesses.id
category_id → categories.id
unit_id     → units.id
```

## Product Data Movement

```text
                    ┌─────────────────┐
                    │  Business User  │
                    └────────┬────────┘
                             │
                             │ product information
                             ▼
                    ┌─────────────────┐
                    │ Product Service │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │ Business  │  │ Category  │  │   Unit    │
        │ Validation│  │ Validation│  │ Validation│
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Products     │
                    │     Table       │
                    └────────┬────────┘
                             │
              ┌──────────────┼───────────────┐
              │              │               │
              ▼              ▼               ▼
        ┌───────────┐  ┌───────────┐  ┌────────────┐
        │ Inventory │  │   Sales   │  │ Analytics  │
        └───────────┘  └───────────┘  └────────────┘
```

## Product Update Flow

```mermaid
flowchart LR

    A[Business User] --> B[Select Product]
    B --> C[(products)]
    C --> D[Retrieve Product]

    D --> E[Modify Product]
    E --> F[Validate Changes]
    F --> G[Update Product]
    G --> H[(products)]

    H --> I[Updated Product]
```

## Product Status Flow

```mermaid
stateDiagram-v2

    [*] --> ACTIVE

    ACTIVE --> INACTIVE
    INACTIVE --> ACTIVE

    ACTIVE --> ARCHIVED
    INACTIVE --> ARCHIVED

    ARCHIVED --> [*]
```

The exact lifecycle rules should be determined by the business requirements.

## Product Consumption Flow

Once a product exists, other modules can reference it.

```mermaid
flowchart TD

    A[(Products)]

    A --> B[Inventory]
    A --> C[Sales]
    A --> D[Purchasing]
    A --> E[Stock Movements]
    A --> F[Reports]
    A --> G[Analytics]
```

The Product entity therefore acts as a **central reference point** for inventory-related operations.

## Important Boundary

The Product table describes **what the business sells or manages**.

It should not directly contain operational inventory quantities such as:

```text
quantity_in_stock
quantity_sold
quantity_reserved
warehouse_quantity
```

Those are inventory/stock concerns and should be modeled separately.

The Product entity identifies the item.

The Stock entity describes the item's inventory state.

Conceptually:

```text
PRODUCT
   │
   │ identifies
   ▼
"What is this item?"

STOCK
   │
   │ tracks
   ▼
"How many do we have?"
```
