# Database Schema & Security

This document describes the core database schema and security model.

---

## 📋 Tables Overview

### households
| column | type |
|------|-----|
| id | uuid |
| name | text |
| created_by | uuid |
| created_at | timestamptz |

---

### household_members
| column | type |
|------|-----|
| household_id | uuid |
| user_id | uuid |
| role | text (`owner`, `admin`, `member`) |
| created_at | timestamptz |

Constraints:
- Composite PK (`household_id`, `user_id`)
- Role check constraint
- FK to `profiles.user_id`

---

### profiles
| column | type |
|------|-----|
| user_id | uuid |
| email | text |

Profiles are backfilled from `auth.users` and upserted after login.

---

### household_invites
| column | type |
|------|-----|
| id | uuid |
| household_id | uuid |
| invited_email | text |
| token | uuid |
| status | text |
| invited_by | uuid |
| expires_at | timestamptz |
| created_at | timestamptz |

---

### lists
| column | type |
|------|-----|
| id | uuid |
| household_id | uuid |
| owner_user_id | uuid |
| name | text |
| year | integer |
| visibility | text (`private`, `household`) |
| created_at | timestamptz |

---

### people
| column | type |
|------|-----|
| id | uuid |
| list_id | uuid |
| name | text |
| budget | numeric |
| is_manually_completed | boolean |
| created_at | timestamptz |

---

### gifts
| column | type |
|------|-----|
| id | uuid |
| person_id | uuid |
| description | text |
| price | numeric |
| status | text (`idea`, `purchased`) |
| is_wrapped | boolean |
| notes | text |
| created_at | timestamptz |

---

## 🔒 Security Functions

### is_household_member
```sql
returns boolean
