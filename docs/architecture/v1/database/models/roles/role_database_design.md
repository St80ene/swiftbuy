# Role Database Design

## Purpose

The Role entity defines the roles available within the system and provides a reference that can be assigned to users.

## Files

```text
role/
├── README.md
├── role-schema.md
├── role-er-diagram.md
└── role-data-flow.md
```

## Entity

```text
Role
├── id
├── name
├── created_at
└── updated_at
```

## Relationship

```text
ROLE
  │
  │ 1
  │
  │ N
  ▼
USER
```

A Role can be assigned to many Users.

## Database Relationship

```text
roles.id
    ▲
    │
    │ FK
    │
users.role_id
```

## Architectural Principle

The Role entity is kept separate from User because **a role is its own domain concept**.

The User references a Role instead of storing role information directly.

This gives the system a clean foundation for expanding into RBAC later:

```mermaid
erDiagram

    ROLE ||--o{ USER : "assigned to"
    ROLE ||--o{ ROLE_PERMISSION : "has"
    PERMISSION ||--o{ ROLE_PERMISSION : "granted through"

    ROLE {
        INT id PK
        VARCHAR name UK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    USER {
        INT id PK
        INT role_id FK
    }

    ROLE_PERMISSION {
        INT role_id FK
        INT permission_id FK
    }

    PERMISSION {
        INT id PK
        VARCHAR name UK
    }
```

The `ROLE_PERMISSION` and `PERMISSION` entities are **future extensions** and are not part of the current Role implementation.

## Current Scope

For the current version:

```text
Role
├── id
└── name
```

with system-managed timestamps:

```text
created_at
updated_at
```

The design intentionally avoids introducing unnecessary RBAC complexity until permissions are actually required.
