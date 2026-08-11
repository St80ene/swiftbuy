# SwiftBuy MVP User Journey

```mermaid
flowchart LR
    A[Login] --> B[View Dashboard]
    B --> C[Manage Products]
    C --> D[Track Inventory]
    D --> E[Review Product History]
    E --> F[Identify Stock Need]
    F --> G[Create Purchase Request]
    G --> H[Manager Reviews]
    H --> I{Decision}
    I -->|Approve| J[Purchase Order]
    I -->|Reject| K[Rejected]
    I -->|Pend| L[Pending]
    J --> M[Supplier Delivers]
    M --> N[Storekeeper Receives Stock]
    N --> O[Inventory Updated]
    O --> D
```

## Key User Journeys

### Owner / Admin

Login → Dashboard → Inventory & Reports → Review purchasing activity → Monitor business

### Inventory Manager

Dashboard → Check stock → Review product history → Identify need → Create/review purchase request → Approve/Reject/Pend

### Storekeeper

Dashboard → Check stock → Count/receive inventory → Record discrepancy → Inventory updated

### Supplier

Receive purchase order → Fulfill order → Deliver stock

## Core Journey

> **Track → Understand → Decide → Purchase → Receive → Update → Repeat**
