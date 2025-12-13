# Copilot Instructions — Christmas Gift Tracker

This repository is a Christmas Gift Tracker web app for a household (spouses/family) to manage yearly gift lists, people, gift ideas/purchases, wrapping status, and budgets.

Use these instructions whenever generating code, refactors, migrations, hooks, or UI.

---

## Product overview

### Primary use case
- A household (e.g., husband + wife) uses the app to create a list per year (e.g., “Christmas 2025”).
- Within a list, they manage people to buy gifts for (each can have an optional budget).
- Within each person, they manage gifts:
  - status: `idea` or `purchased`
  - wrapped boolean (only relevant for purchased gifts)
  - price (numeric)
  - optional notes
- The app shows totals:
  - total spent per person (sum of purchased gifts only)
  - list total spent (sum of purchased gifts across people)
  - budgets per person and list-level totals
- Lists can be `private` (only the owner user) or `household` (shared across household members).

### Collaboration / membership model
- Users authenticate via Supabase Auth (email/password).
- Users can belong to a household via `household_members`.
- Households support invites and membership management.
- Email confirmations are enabled in Supabase.
  - Therefore `signUp()` can return `{ user, session: null }` until the user confirms via email.
  - The app must handle this gracefully by showing a “Check your email to confirm” message and preserving invite tokens through redirect.

---

## Tech stack
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS v4
- Backend: Supabase Postgres + Supabase Auth + RLS policies
- Hosting: Vercel
- Local dev: Docker compose (dev) mimicking production where possible
- PWA: Vite PWA plugin with full offline support
  - Auto-update service worker with workbox
  - Network status monitoring
  - Offline operation queue with localStorage
  - Optimistic UI updates

---

## Core domain entities (conceptual)

### Households
- `households` table includes:
  - `id`
  - `name`
  - `created_by` (auth.uid)
- Household membership is in `household_members`.

### Household members & roles
- `household_members` table includes:
  - `household_id`
  - `user_id`
  - `role` with values:
    - `owner` (full control; creator is owner)
    - `admin` (can manage invites + members)
    - `member` (regular access)
- IMPORTANT: Existing RLS/policies may depend on `owner`. Do not remove `owner` role.

Role rules:
- The household creator is `owner`.
- Invited users join as `member`.
- Admins (and owner) can:
  - create/revoke invites
  - remove members (except owner)
  - promote/demote members (cannot demote owner)
- Members can:
  - view household members
  - leave household (delete their own membership)
- Owner should not be removable; block in UI. Consider RPC for strict enforcement if needed.

### Profiles
- `profiles` table stores:
  - `user_id`
  - `email`
- This is used to display household member emails.
- Profiles may be backfilled from `auth.users` and should be upserted after sign-in/sign-up.
- Do not assume every auth user already has a profile row; code should be resilient.

### Lists
- `lists` table includes:
  - `id`
  - `household_id` (nullable depending on design; household lists use it)
  - `owner_user_id`
  - `name`
  - `year`
  - `visibility`: `private` or `household`

### People
- `people` table includes:
  - `id`
  - `list_id`
  - `name`
  - `budget` (nullable)
  - `is_manually_completed` (boolean)

### Gifts
- `gifts` table includes:
  - `id`
  - `person_id`
  - `description`
  - `price`
  - `status`: `idea` | `purchased`
  - `is_wrapped` (boolean)
  - `notes` (nullable)

Totals rules:
- “Spent” totals count ONLY gifts with `status='purchased'`.
- Wrapping counts apply ONLY to purchased gifts.

---

## Invite system requirements

### Invites table
- `household_invites` has:
  - `household_id`
  - `invited_email`
  - `token` (uuid)
  - `status`: `pending` | `accepted` | `revoked` | `expired`
  - `invited_by` (auth.uid)
  - `expires_at`
- Invites are accepted via RPC (`accept_household_invite`) and are one-time use.

### Accept flow with email confirmations ON
- If a user visits an invite URL (e.g. `/?invite=TOKEN`) and is not logged in:
  - show auth UI
  - preserve the invite token in the URL or in localStorage
- On sign-up:
  - Supabase may return session null; display “Check your email to confirm”.
  - Use `options.emailRedirectTo` to send them back to the same invite URL after confirmation.
- After confirmation and login:
  - if invite token exists, automatically call the accept RPC, then redirect to normal app UI.

---

## RLS and policy patterns (CRITICAL)

### Avoid infinite recursion in RLS
- DO NOT reference `household_members` inside policies on `household_members` directly.
- Use SECURITY DEFINER helper functions instead:
  - `is_household_member(household_id)`
  - `is_household_admin(household_id)` (admin OR owner)

### Preferred approach
- RLS policies should rely on helper functions and avoid self-referential subqueries on the same table.
- RPCs that need multi-step writes should be `security definer`, carefully scoped, and granted execute to authenticated.

---

## UI/UX expectations

### Main navigation and flow
- Auth screen (sign in / sign up)
- Household creation (if no household membership)
- Main:
  - Lists (create, edit inline, toggle private/household, duplicate, delete)
  - People (create, edit inline name/budget, mark complete)
  - Gifts (create, edit inline all fields, toggle status/wrapped, delete, notes)
  - Summary (list totals and per-person budgets)
  - Household settings:
    - create invite (copy invite link)
    - pending invites (copy/revoke) — admin/owner only
    - members list (show roles) — member can view
    - promote/demote/remove — admin/owner only (never for owner)

### Inline editing
- Lists, people, and gifts all support inline editing (no modals)
- Click "Edit" button to expand form in place
- Save/Cancel buttons appear during edit mode
- Maintain visual styling and state during editing

### PWA & Offline Support
- App should remain installable and run well on iPhone.
- Prefer responsive/mobile-first layouts.
- Network status indicator shows at top when offline
- All gift and people operations queue when offline
- Automatic background sync when reconnected
- Update notifications for new app versions

---

## Code conventions (how Copilot should write code)

### General
- TypeScript strictness matters; avoid `any` unless unavoidable.
- Prefer small hooks for data fetching:
  - `useLists`, `usePeople`, `useGifts`, `useListTotals`, `useHouseholdInvites`, `useHouseholdMembers`
- Always handle loading + error state in hooks and UI.

### Data access
- All data access uses `supabase.from(...).select/insert/update/delete`.
- For mutations (create/update/delete) on gifts and people, use `offlineInsert`, `offlineUpdate`, `offlineDelete` from `lib/offlineSupabase.ts`
  - These wrap Supabase calls with offline queue support
  - Automatically queue operations when offline
  - Return optimistic responses for instant UI updates
- Keep queries minimal (select only needed columns).
- After any create/update/delete that affects totals, trigger totals refresh.
- Avoid heavy realtime features unless requested.

### Offline operation queue
- Gift and people operations are automatically queued when offline
- Queue stored in localStorage via `lib/offlineQueue.ts`
- Optimistic UI updates happen immediately
- Background sync processes queue when reconnected
- Network status component shows sync progress

### Budget calculations
- Purchased gifts only contribute to spent totals.
- Budgets can be null; show “No budget” rather than treating as 0 in UI (except percentage calcs).

### Roles enforcement
- UI should hide or disable actions the user can’t do.
- Still handle “permission denied” errors gracefully (RLS is source of truth).

### Styling
- Use Tailwind utility classes.
- Maintain existing component structure and patterns.
- Prefer simple, readable UI.

---

## What NOT to do
- Do not add server-side code or an API server unless explicitly needed.
- Do not bypass RLS using client-side service keys.
- Do not remove or rename existing tables/columns unless the migration plan covers it.
- Do not break existing invite flow assumptions with email confirmations enabled.

---

## Testing and developer ergonomics
- Local dev uses Docker compose; app should work with local env vars.
- Ensure Vercel build passes TypeScript checks (no unused variables, no ts-expect-error unless truly required).
- Keep migration SQL idempotent (`if exists`, `if not exists`) when possible.

---

## Completed features
- ✅ Inline editing for lists, people, and gifts
- ✅ Duplicate list to next year (copy people + budgets + optionally ideas)
- ✅ Offline operation queue with localStorage
- ✅ Network status indicator
- ✅ Background sync for offline operations
- ✅ PWA update notifications
- ✅ Optimistic UI updates

## Feature roadmap hints (optional)
Potential future features include:
- Gift history per person across years
- Wrapping "night mode" enhancements
- Ownership transfer
- Audit log
- Bulk operations (mark all as wrapped, etc.)
