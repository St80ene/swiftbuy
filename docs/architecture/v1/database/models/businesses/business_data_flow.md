# Business Data Flow

## Overview

The business provides the context through which SwiftBuy's major modules operate.

The high-level flow is:

```mermaid
flowchart TD

    A[Business Registration] --> B[Create Business]

    B --> C[Business Profile]

    C --> D[Business Settings]
    C --> E[Users]
    C --> F[Products]
    C --> G[Suppliers]

    F --> H[Stock]
    G --> I[Purchase Orders]

    I --> J[Receive Goods]
    J --> H

    E --> K[Dashboard]
    F --> K
    H --> K
    I --> K

    K --> L[Reports]

    E --> M[Audit Logs]
    F --> M
    G --> M
    H --> M
    I --> M
```

---

# System-Level Data Flow

```mermaid
flowchart LR

    U[User] --> A[Authentication]

    A --> B[Business Context]

    B --> P[Products]
    B --> S[Suppliers]
    B --> PO[Purchase Orders]
    B --> ST[Stock]

    P --> ST
    PO --> S
    S --> ST

    P --> D[Dashboard]
    S --> D
    PO --> D
    ST --> D

    D --> R[Reports]

    U --> AL[Audit Logs]
    P --> AL
    S --> AL
    PO --> AL
    ST --> AL
```

---

# Core Business Flow

```text
USER
  ↓
AUTHENTICATION
  ↓
BUSINESS CONTEXT
  ↓
┌─────────────┬──────────────┬──────────────────┬─────────┐
│             │              │                  │
PRODUCTS   SUPPLIERS   PURCHASE ORDERS       STOCK
│             │              │                  │
└─────────────┴──────────────┴──────────────────┘
                       ↓
                  DASHBOARD
                       ↓
                    REPORTS

```

---

# Stock Flow

The stock flow is particularly important to SwiftBuy.

```mermaid
flowchart LR

    A[Purchase Order] --> B[Supplier]
    B --> C[Receive Goods]
    C --> D[Stock Increase]

    D --> E[Current Inventory]

    E --> F[Dashboard]
    E --> G[Reports]
```

Conceptually:

```text
Supplier
   ↓
Purchase Order
   ↓
Goods Received
   ↓
Stock Increased
   ↓
Current Inventory
   ↓
Dashboard / Reports
```

---

# User Access Flow

```mermaid
flowchart TD

    A[User] --> B[Login]
    B --> C[Authentication]
    C --> D[Business Context]
    D --> E[Role]
    E --> F[Permissions]

    F --> G[Products]
    F --> H[Suppliers]
    F --> I[Purchase Orders]
    F --> J[Stock]
    F --> K[Reports]

```

The user's:

```text
business_id
```

determines which business's data they operate on.

The user's:

```text
role_id
```

determines what they are allowed to do.
