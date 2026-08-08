# Role Entity Relationship Diagram

## ER Diagram

```mermaid
erDiagram

    ROLE ||--o{ USER : "assigned to"

    ROLE {
        INT id PK
        VARCHAR name UK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    USER {
        INT id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email UK
        INT role_id FK
        BOOLEAN is_email_verified
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
```

## Relationship Explanation

### ROLE → USER

A single role can be assigned to multiple users.

For example:

```text
ADMIN
 ├── User A
 ├── User B
 └── User C
```

Therefore:

```text
ROLE 1 ─────────── N USER
```

The relationship is implemented through:

```text
users.role_id → roles.id
```

## Cardinality

| Entity | Relationship | Entity |
| ------ | ------------ | ------ |
| Role   | One-to-Many  | User   |
| User   | Many-to-One  | Role   |

## Important Design Decision

The User table stores the foreign key:

```text
role_id
```

rather than storing the role name directly:

```text
role = "ADMIN"
```

This prevents duplicated role information across users.

Instead:

```text
users.role_id = 1
```

references:

```text
roles.id = 1
roles.name = "ADMIN"
```

This keeps the database normalized.
