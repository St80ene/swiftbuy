# Role Database Schema

## Overview

The `roles` table stores the different roles that can be assigned to users in the system.

The Role entity is intentionally kept simple at this stage. Permissions and more advanced RBAC structures can be introduced separately later.

## Table: `roles`

| Column       | Data Type    | Constraints                 | Description                             |
| ------------ | ------------ | --------------------------- | --------------------------------------- |
| `id`         | INTEGER      | Primary Key, Auto Increment | Unique identifier for the role          |
| `name`       | VARCHAR(100) | NOT NULL, UNIQUE            | Name of the role                        |
| `created_at` | TIMESTAMP    | NOT NULL                    | Date and time the role was created      |
| `updated_at` | TIMESTAMP    | NOT NULL                    | Date and time the role was last updated |

## Schema

```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Example Records

|  id | name     | created_at | updated_at |
| --: | -------- | ---------- | ---------- |
|   1 | ADMIN    | 2026-08-08 | 2026-08-08 |
|   2 | MANAGER  | 2026-08-08 | 2026-08-08 |
|   3 | CASHIER  | 2026-08-08 | 2026-08-08 |
|   4 | STOREMAN | 2026-08-08 | 2026-08-08 |

## Design Notes

### Why `name` is unique

Two roles should not have the same name. The unique constraint prevents duplicate role definitions.

### Why roles have their own table

Roles are modeled as database records rather than an enum inside the User table.

This allows the system to evolve without modifying the User schema whenever a new role is introduced.

### Current Scope

The Role table only defines **what a role is**.

It does not yet define:

- What permissions the role has
- Which resources the role can access
- Which actions the role can perform

Those concerns can be introduced later through a permission system.

## Relationship

A role can be assigned to many users.

```text
roles
  │
  │ 1
  │
  │
  │ N
users
```

The `users.role_id` column references `roles.id`.
