# Category Data Flow

## Overview

The Category data flow describes how categories are created, associated with businesses, retrieved, updated, and used when organizing products.

## High-Level Data Flow

```mermaid
flowchart TD

    A[Business User] --> B[Category Management]

    B --> C[Create / Update Category]

    C --> D[Validate Category]

    D --> E{Valid?}

    E -- No --> F[Return Validation Error]

    E -- Yes --> G[(Categories Table)]

    G --> H[Product Management]
    H --> I[(Products Table)]
```

## Category Creation Flow

```mermaid
flowchart LR

    A[Business User] --> B[Create Category]

    B --> C[Provide Category Name]

    C --> D[Identify Business]

    D --> E[Check Existing Category]

    E --> F{Already Exists?}

    F -- Yes --> G[Reject Request]

    F -- No --> H[Create Category]

    H --> I[(categories)]

    I --> J[Category Created]
```

## Category Validation Flow

A category should be validated within the context of its business.

```mermaid
flowchart TD

    A[Create Category] --> B[Get business_id]

    B --> C[Check Business Exists]

    C --> D{Business Exists?}

    D -- No --> E[Reject Request]

    D -- Yes --> F[Check Category Name]

    F --> G{Duplicate for Business?}

    G -- Yes --> H[Reject Request]

    G -- No --> I[Create Category]

    I --> J[(categories)]
```

## Product Assignment Flow

Once a category exists, products can reference it.

```mermaid
flowchart LR

    A[Create / Update Product] --> B[Select Category]

    B --> C[(categories)]

    C --> D[Retrieve category.id]

    D --> E[(products)]

    E --> F[Store category_id]
```

The relationship is:

```text
products.category_id
        │
        ▼
categories.id
```

## Complete Category Data Flow

```text
                    ┌─────────────────┐
                    │  Business User  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Category     │
                    │    Management   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Validate     │
                    │    Business     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Check Duplicate │
                    │    Category     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    categories   │
                    │                 │
                    │ id              │
                    │ business_id     │
                    │ name            │
                    └────────┬────────┘
                             │
                             │ category_id
                             ▼
                    ┌─────────────────┐
                    │    products     │
                    └─────────────────┘
```

## Category Update Flow

```mermaid
flowchart LR

    A[Business User] --> B[Select Category]

    B --> C[(categories)]

    C --> D[Retrieve Category]

    D --> E[Update Name]

    E --> F[Validate]

    F --> G[Save Changes]

    G --> H[(categories)]
```

## Category Consumption

Categories are primarily consumed by Product Management.

```mermaid
flowchart TD

    A[(Categories)]

    A --> B[Product Creation]
    A --> C[Product Filtering]
    A --> D[Product Organization]
    A --> E[Reports]
    A --> F[Analytics]
```

## Design Boundary

The Category entity answers:

> **How should products be grouped?**

It does not answer:

> What products exist?

That responsibility belongs to Product.

Therefore:

```text
CATEGORY
    │
    │ organizes
    ▼
PRODUCT
```

The Category entity should not contain product-specific information such as SKU, price, stock quantity, or unit.
