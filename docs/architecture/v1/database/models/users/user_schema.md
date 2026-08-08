# User Entity — Database Design

## 1. Overview

The `User` entity represents a person who has an account within a SwiftBuy business.

A user belongs to a business and is assigned a role that determines what actions they are authorized to perform within that business.

The `User` entity is responsible for storing:

- User identity
- Contact information
- Business role assignment
- Email verification state
- Account timestamps

Authentication mechanisms such as passwords, refresh tokens, password reset tokens, and login security state are intentionally excluded from this first version of the User entity.

---

## 2. Design Goals

The User design should:

- Use UUIDs for primary identification.
- Maintain a clear relationship between users and roles.
- Support business-level ownership/tenancy.
- Prevent duplicate email addresses within the appropriate business scope.
- Store only information that belongs directly to the user account.
- Keep authentication and authorization concerns conceptually separated.
- Remain simple enough for the first version of SwiftBuy.
- Work cleanly with NestJS, TypeORM, and PostgreSQL.

---

## 3. Table

### `users`

| Column              | PostgreSQL Type | Nullable | Default   | Constraints              |
| ------------------- | --------------- | -------: | --------- | ------------------------ |
| `id`                | `uuid`          |       No | Generated | Primary Key              |
| `first_name`        | `varchar(100)`  |       No | —         | —                        |
| `last_name`         | `varchar(100)`  |       No | —         | —                        |
| `email`             | `varchar(150)`  |       No | —         | Unique within business   |
| `role_id`           | `uuid`          |       No | —         | Foreign Key → `roles.id` |
| `is_email_verified` | `boolean`       |       No | `false`   | —                        |
| `created_at`        | `timestamptz`   |       No | `now()`   | —                        |
| `updated_at`        | `timestamptz`   |       No | `now()`   | —                        |

---

## 4. Column Details

### `id`

```text
Type: UUID
Primary Key: Yes
Nullable: No
Generated: Yes
```

Uniquely identifies the user.

UUIDs are preferred because they provide globally unique identifiers without exposing sequential database IDs.

---

### `first_name`

```text
Type: VARCHAR(100)
Nullable: No
```

Stores the user's first name.

---

### `last_name`

```text
Type: VARCHAR(100)
Nullable: No
```

Stores the user's last name.

---

### `email`

```text
Type: VARCHAR(150)
Nullable: No
```

Stores the user's email address.

The email should be normalized before storage, for example:

```text
John.Doe@Example.com
```

becomes:

```text
john.doe@example.com
```

This prevents logically duplicate accounts caused by differences in capitalization.

### Recommended constraint

For a multi-business system, email uniqueness should normally be scoped to the business rather than globally enforced.

Conceptually:

```text
UNIQUE (business_id, email)
```

This allows the same email address to potentially exist in different businesses while preventing duplicate users within the same business.

> **Important:** If the `business_id` relationship is being introduced in the User table, it should be added as part of the tenant relationship design. It is not included in the current field list above.

---

### `role_id`

```text
Type: UUID
Nullable: No
Foreign Key: roles.id
```

Identifies the role assigned to the user.

The User should not store a role name directly.

Instead:

```text
users.role_id
       │
       ▼
roles.id
```

This allows the authorization system to remain database-driven.

Example:

```text
User
  │
  └── role_id = 2
              │
              ▼
          Role
          └── MANAGER
```

---

### `is_email_verified`

```text
Type: BOOLEAN
Nullable: No
Default: false
```

Indicates whether the user has successfully verified their email address.

Possible states:

```text
false → Email not verified
true  → Email verified
```

The actual verification mechanism belongs to the authentication/application layer and is not represented directly in this entity.

---

### `created_at`

```text
Type: TIMESTAMPTZ
Nullable: No
Default: now()
```

Stores when the user account was created.

This field should not be manually changed after creation.

---

### `updated_at`

```text
Type: TIMESTAMPTZ
Nullable: No
Default: now()
```

Stores the most recent time the user record was modified.

The application/database should automatically update this value when the record changes.

---

# 5. Relationships

## User → Role

Each user must have one role.

```text
User
  │
  │ role_id
  ▼
Role
```

Cardinality:

```text
Role 1 ─────────── N Users
```

One role can be assigned to many users.

Example:

```text
MANAGER
   │
   ├── John
   ├── Mary
   └── David
```

---

# 6. Authorization Architecture

The User entity should not contain the permissions themselves.

Instead, authorization follows:

```text
User
  │
  ▼
Role
  │
  ▼
Role Permission
  │
  ▼
Permission
```

This keeps responsibilities separated.

### Example

```text
John
  │
  └── role_id → MANAGER
                    │
                    ▼
              Permissions
              ├── products.read
              ├── products.update
              ├── stock.read
              └── reports.read
```

The user therefore receives permissions through their role.

---

# 7. Indexes

Recommended indexes:

### Primary key

```sql
PRIMARY KEY (id)
```

Automatically indexes `id`.

### Role lookup

```sql
CREATE INDEX idx_users_role_id
ON users(role_id);
```

Useful for queries such as:

```text
Find all users with a specific role.
```

### Email lookup

An index should exist on the email field because email is commonly used during authentication.

If email uniqueness is scoped to a business:

```sql
CREATE UNIQUE INDEX idx_users_business_email
ON users(business_id, email);
```

---

# 8. Integrity Rules

The database should enforce:

1. `id` must always exist.
2. `first_name` must always exist.
3. `last_name` must always exist.
4. `email` must always exist.
5. `role_id` must always reference an existing role.
6. `is_email_verified` defaults to `false`.
7. `created_at` must always exist.
8. `updated_at` must always exist.

---

# 9. What Does NOT Belong in This Version

The following are intentionally excluded:

```text
password
refresh_token
password_reset_token
password_reset_expires_at
email_verification_token
email_verification_expires_at
failed_login_attempts
locked_until
last_login_at
last_login_ip
```

These belong to authentication/security concerns rather than the core User identity model.

They can be introduced later through dedicated authentication/session structures when the system requires them.

---

# 10. Simplified Model

The final conceptual model is:

```text
User
├── Identity
│   ├── id
│   ├── first_name
│   └── last_name
│
├── Contact
│   └── email
│
├── Authorization
│   └── role_id
│
├── Account State
│   └── is_email_verified
│
└── Audit
    ├── created_at
    └── updated_at
```

This keeps the first version of the User model small while leaving room for authentication and security concerns to evolve independently.
