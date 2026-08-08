# User Entity — Data Flow

## 1. Overview

The User data flow describes how user information moves through SwiftBuy when a user is created, retrieved, updated, and authorized.

The User entity interacts primarily with:

```text
Client
   │
   ▼
API
   │
   ▼
User Service
   │
   ▼
Users Database
   │
   ▼
Role / Permission System
```

---

# 2. User Creation Flow

```mermaid
flowchart TD

    A[Client] --> B[User Creation Request]

    B --> C[Users Controller]

    C --> D[Validate User Data]

    D --> E{Valid?}

    E -- No --> F[Return Validation Error]

    E -- Yes --> G[Check Email]

    G --> H{Email Available?}

    H -- No --> I[Return Duplicate Email Error]

    H -- Yes --> J[Validate Role]

    J --> K{Role Exists?}

    K -- No --> L[Return Invalid Role Error]

    K -- Yes --> M[Create User]

    M --> N[Save User]

    N --> O[(Users Table)]

    O --> P[Return Created User]
```

---

# 3. User Retrieval Flow

```mermaid
flowchart TD

    A[Client] --> B[GET /users]

    B --> C[Users Controller]

    C --> D[Users Service]

    D --> E[Query Users]

    E --> F[(Users Table)]

    F --> G[Load User Records]

    G --> H[Return Users]

    H --> I[Client]
```

---

# 4. User With Role Flow

When the application needs to determine what a user can do:

```mermaid
flowchart TD

    A[Authenticated User] --> B[User ID]

    B --> C[(Users)]

    C --> D[role_id]

    D --> E[(Roles)]

    E --> F[Role]

    F --> G[(Role Permissions)]

    G --> H[(Permissions)]

    H --> I[Resolved Permissions]

    I --> J[Authorization Check]

    J --> K{Allowed?}

    K -- Yes --> L[Perform Operation]

    K -- No --> M[Reject Request]
```

---

# 5. User Update Flow

```mermaid
flowchart TD

    A[Client] --> B[Update User Request]

    B --> C[Users Controller]

    C --> D[Validate Request]

    D --> E[Users Service]

    E --> F[Find User]

    F --> G{User Exists?}

    G -- No --> H[Return Not Found]

    G -- Yes --> I[Update User]

    I --> J[(Users Table)]

    J --> K[Update updated_at]

    K --> L[Return Updated User]
```

---

# 6. Email Verification State

The User entity maintains only the state of verification:

```text
is_email_verified
```

The state transition is:

```text
false
  │
  │ successful verification
  ▼
true
```

Conceptually:

```mermaid
stateDiagram-v2

    [*] --> Unverified

    Unverified --> Verified: Email verification succeeds

    Verified --> Verified: User remains verified
```

The actual email verification mechanism belongs to the authentication/application layer.

---

# 7. Authorization Data Flow

The complete authorization flow is:

```text
Request
   │
   ▼
Authenticated User
   │
   ▼
User
   │
   │ role_id
   ▼
Role
   │
   ▼
Role Permissions
   │
   ▼
Permissions
   │
   ▼
Authorization Decision
   │
   ├── Allowed
   │
   └── Denied
```

---

# 8. Simplified System Data Flow

```mermaid
flowchart LR

    CLIENT[Client]

    API[SwiftBuy API]

    USER_SERVICE[User Service]

    USERS[(Users)]

    ROLES[(Roles)]

    PERMISSIONS[(Permissions)]

    CLIENT --> API
    API --> USER_SERVICE
    USER_SERVICE --> USERS
    USERS --> ROLES
    ROLES --> PERMISSIONS
```

---

# 9. Responsibilities

### Client

Responsible for:

- Sending user information.
- Requesting user data.
- Requesting user updates.

### Users Controller

Responsible for:

- Receiving HTTP requests.
- Validating request DTOs.
- Returning HTTP responses.

### Users Service

Responsible for:

- User business logic.
- User creation.
- User retrieval.
- User updates.
- User-role validation.

### Users Table

Responsible for:

- Persisting user identity.
- Persisting account state.
- Persisting role assignment.
- Maintaining timestamps.

### Roles

Responsible for:

- Defining user roles.

### Permissions

Responsible for:

- Defining individual system capabilities.

### Role Permissions

Responsible for:

- Connecting roles to permissions.

---

# 10. Core Principle

The User data flow should remain simple:

```text
User Data
    ↓
User Service
    ↓
Users Table
```

Authorization should remain separate:

```text
User
    ↓
Role
    ↓
Permissions
```

This prevents the User entity from becoming responsible for authentication, authorization, business operations, and security simultaneously.
