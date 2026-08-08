# Role Data Flow

## Overview

The Role data flow describes how roles are created, retrieved, assigned to users, and used when determining a user's role within the system.

At the current stage, the Role entity is primarily a reference entity for Users.

## High-Level Data Flow

```mermaid
flowchart TD

    A[Administrator] --> B[Role Management]

    B --> C[Create / Update Role]

    C --> D[(Roles Table)]

    D --> E[Role ID]

    E --> F[(Users Table)]

    F --> G[User]

    G --> H[Authentication / Authorization]

    H --> I[Application Access]
```

## Role Creation Flow

```mermaid
flowchart LR

    A[Administrator] --> B[Create Role]
    B --> C[Validate Role Name]
    C --> D{Role Exists?}

    D -- Yes --> E[Reject Request]
    D -- No --> F[Insert Role]
    F --> G[(roles)]
    G --> H[Return Role]
```

### Process

1. An administrator creates a role.
2. The system receives the role name.
3. The system validates the role name.
4. The database checks whether the role already exists.
5. If it exists, the request is rejected.
6. If it does not exist, the role is stored.
7. The created role is returned.

## Role Assignment Flow

```mermaid
flowchart LR

    A[Administrator] --> B[Create / Update User]
    B --> C[Select Role]
    C --> D[(roles)]
    D --> E[Retrieve role.id]
    E --> F[(users)]
    F --> G[Store role_id]
```

The important point is that the User does **not** store the role name.

It stores:

```text
users.role_id
```

which references:

```text
roles.id
```

## User Authentication Flow

```mermaid
flowchart TD

    A[User Login] --> B[Authenticate User]
    B --> C[(users)]
    C --> D[Retrieve role_id]
    D --> E[(roles)]
    E --> F[Retrieve Role]
    F --> G[Authenticated User Context]
    G --> H[Authorization]
    H --> I[Allow / Deny Access]
```

## Data Movement

```text
                    ┌───────────────┐
                    │ Administrator │
                    └───────┬───────┘
                            │
                            │ creates/manages
                            ▼
                    ┌───────────────┐
                    │     Role      │
                    │   Management  │
                    └───────┬───────┘
                            │
                            │
                            ▼
                    ┌───────────────┐
                    │    roles      │
                    │               │
                    │ id            │
                    │ name          │
                    └───────┬───────┘
                            │
                            │ role_id
                            ▼
                    ┌───────────────┐
                    │     users     │
                    │               │
                    │ id            │
                    │ role_id       │
                    │ ...           │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Authorization │
                    └───────────────┘
```

## Role Lifecycle

```mermaid
stateDiagram-v2

    [*] --> Created
    Created --> Assigned
    Assigned --> Used
    Used --> Updated
    Updated --> Used
    Used --> Deleted
    Deleted --> [*]
```

> Note: Role deletion should be handled carefully because existing users may reference the role.

## Current Responsibility

The Role entity is responsible for:

- Defining available roles
- Providing a stable role identifier
- Giving Users a role reference
- Supporting future authorization logic

It is **not yet responsible for permissions**.

Future RBAC expansion can introduce:

```text
roles
   │
   ▼
role_permissions
   │
   ▼
permissions
```

without fundamentally changing the current Role design.
