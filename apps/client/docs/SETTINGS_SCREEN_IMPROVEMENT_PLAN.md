# Settings Screen Improvement Plan

**Goal:** Show all personal information possible on the Settings screen and improve the page in line with `docs/FE_BEST_PRACTICES.md`. This document is a **plan only**; no implementation is done yet.

---

## 1. Current State Summary

### 1.1 Data sources

| Source                                                             | Data available                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **clientProfile.get** (via `useClientProfile` / `useSettingsForm`) | `id`, `userId`, `firstName`, `lastName`, `email`, `phone`, `preferredContactMethod`, `createdAt`, `updatedAt` |
| **auth.me** (via `useUserRole`)                                    | `id`, `role`                                                                                                  |

### 1.2 What is shown today

- **Información Personal (tab):** email (read-only), first + last name as "Nombre" (read-only), phone (editable), "Miembro desde" (`createdAt`).
- **Preferencias de Notificación (tab):** `preferredContactMethod` only.
- **Seguridad y Privacidad:** change password, delete account.
- **Pagos:** placeholder.
- **Ayuda y Soporte:** help, contact support, report problem.

### 1.3 What exists but is not shown

- **Profile:** `updatedAt`, `id` / `userId` (could be shown for support or in an optional "Datos de cuenta" block).
- **Auth:** `role` (e.g. "Cliente") — not displayed anywhere on Settings.
- **SettingsStatsSection:** component exists (`totalJobs`, `completedJobs`, `totalSpent`, `favoriteCategory`) but is **not** wired in `settingsConfig.tsx` (no tab/section uses it). Stats would require a client stats endpoint or deriving from `order.listByClient`.

---

## 2. Improvements Plan (aligned with FE best practices)

### 2.1 Show all profile and account data (Información Personal)

**Objective:** Surface every piece of personal/account information that is already available, without new API contracts.

| Item            | Action                                 | Notes                                                                                                                                           |
| --------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **updatedAt**   | Add to "Información Personal".         | e.g. "Última actualización" with formatted date. Use a shared date formatter util (see 2.5).                                                    |
| **Role**        | Show account type (e.g. "Cliente").    | Consume `auth.me` in the screen (or a small `useAuthMe` hook); pass `role` as prop to the profile section. Presentational component stays pure. |
| **id / userId** | Optional "Datos de cuenta" subsection. | Only show if useful for support (e.g. "ID de cuenta" copyable). Can be behind "Ver datos de cuenta" to avoid clutter.                           |

**Best practices:** Screen (or a dedicated hook) fetches `useClientProfile` and `auth.me`; maps to section props. No tRPC inside presentational components. All new fields are read-only unless backend allows edits later.

### 2.2 Personal info section structure and copy

- **Order of fields (suggested):** Nombre (firstName + lastName) → Email → Teléfono → Preferencia de contacto (see 2.3) → Miembro desde → Última actualización → (optional) Datos de cuenta.
- **Empty states:** When name or phone are missing, show explicit empty state (e.g. "No agregado") instead of only "No especificado" where applicable; keep wording consistent and accessible.
- **Copy:** Short helper text for read-only fields (e.g. email) is already there; add similar hints for "Última actualización" and "Tipo de cuenta" if needed.

### 2.3 Preferred contact method in the Personal tab (optional)

- **Option A (recommended for “all personal info in one place”):** In the "Información Personal" tab, add **preferred contact method** (read-only display or editable inline) so the user sees one coherent block: name, email, phone, how they prefer to be contacted, and dates.
- **Option B:** Keep "Preferencias de Notificación" as a separate tab but ensure the Personal tab at least shows the current value (read-only) with a link like "Editar en Preferencias de notificación".
- **Implementation note:** Form state and mutation already support `preferredContactMethod`; the Personal section would receive it via `formState` / `formHandlers` from `settingsConfig` and the same submit would persist it (no new API).

### 2.4 Activity / stats (optional)

- **SettingsStatsSection** already exists and expects `totalJobs`, `completedJobs`, `totalSpent`, `favoriteCategory`.
- **Options:**
  - Add a new tab "Tu actividad" (or subsection under Información Personal) and wire `SettingsStatsSection` in `settingsConfig`.
  - Data: either a new tRPC procedure (e.g. `client.stats` or `order.clientSummary`) or the screen/hook calls `order.listByClient` and derives counts and totals. Prefer a small dedicated endpoint for clarity and performance.
- **Best practices:** New hook (e.g. `useClientStats`) in `hooks/` that calls tRPC; screen passes stats as props to the presentational `SettingsStatsSection`; no formatting logic in the screen (use utils).

### 2.5 Formatting and structure (FE best practices)

- **Date formatting:** Move `formatDate` (and any variant) out of `SettingsProfileSection` into a shared util (e.g. `@/utils/formatDate` or `components/settings/utils/formatDate.ts`) and use it in the section. Keeps presentational components free of formatting logic.
- **Screen vs components:**
  - **Screen:** Only orchestration: hooks (`useSettingsForm`, optionally `useAuthMe`, optionally `useClientStats`), loading/error, tab state, passing props to section components.
  - **Sections:** Presentational; all data and callbacks via props; no tRPC, no hooks that fetch.
- **Config:** All section-to-data mapping stays in `settingsConfig.tsx` (e.g. extend `getProps` for profile to pass `updatedAt`, `role`, optional `preferredContactMethod` for the Personal tab).

### 2.6 Editable fields and API

- Today the API allows updating only **phone** and **preferredContactMethod** (`clientProfileUpdateInputSchema`). First name, last name, and email are not editable via settings.
- **If product later wants name (or email) editable:** extend `clientProfileUpdateInputSchema` and backend update logic; then extend form state in `useSettingsForm`, add handlers, and pass them through config to the profile section. No change to the plan for "show all personal info"; this is a follow-up.

### 2.7 Accessibility and UX

- Ensure every new field has a clear label and, if needed, a short description (already done for email).
- Keep a logical tab order and focus order; avoid unnecessary modal or extra steps for read-only data.
- If "Datos de cuenta" is added, keep it minimal (e.g. one line with copy-to-clipboard for ID).

### 2.8 Loading and errors

- If `auth.me` is used, handle loading/error in the screen (e.g. don’t block the whole page if role is missing; show "—" or hide the role line).
- Profile loading is already handled with `SettingsSkeleton`; keep one place for loading/error for the whole settings data (profile + optional me/stats).

---

## 3. Suggested implementation order

1. **Phase 1 – Show existing data (no new APIs)**
   - Add `updatedAt` to profile section.
   - Add `role` from `auth.me` to the screen and profile section.
   - Extract date formatting to a shared util and use it in `SettingsProfileSection`.
   - Optionally add preferred contact method to the Personal tab (display or edit).
   - Optionally add "Datos de cuenta" (id/userId) subsection.

2. **Phase 2 – Structure and UX**
   - Reorder and group fields as in 2.2; improve empty states and copy.
   - Add any optional "Tu actividad" section and wire `SettingsStatsSection` once a data source (hook + optional endpoint) is defined.

3. **Phase 3 – Future**
   - If product requests it: make name (and optionally email) editable (API + form + section).

---

## 4. Files to touch (reference)

- **Screen:** `apps/client/src/screens/settings/SettingsScreen.tsx` — optional `useAuthMe` (or existing auth hook), pass new props; no direct tRPC.
- **Config:** `apps/client/src/components/settings/settingsConfig.tsx` — extend profile `getProps` with `updatedAt`, `role`, optional `preferredContactMethod`; optionally add stats section and tab.
- **Profile section:** `apps/client/src/components/settings/SettingsProfileSection.tsx` — new props, new rows (updatedAt, role, optional account id, optional preferred contact); use shared `formatDate`.
- **Utils:** New or existing `formatDate` (e.g. under `utils/` or `components/settings/utils/`).
- **Hooks:** Optional `useAuthMe` (if not reusing existing auth hook for role); optional `useClientStats` when adding stats.
- **API (only if adding stats):** Optional `client.stats` or `order.clientSummary` in API + router.

---

## 5. Compliance with FE_BEST_PRACTICES.md

- **Presentational components:** Sections receive all data via props; no tRPC, no fetch hooks; formatting via utils.
- **Screens/containers:** Settings screen uses only hooks for data and mutations; handles loading/error; maps data to section props.
- **Hooks:** One hook per concern (e.g. `useClientProfile`, optional `useAuthMe`, `useSettingsForm`, optional `useClientStats`); no UI in hooks.
- **Subcomponents:** Existing section components; any new block (e.g. "Datos de cuenta") as a small presentational component.
- **Utils:** Date (and currency if needed for stats) formatting in pure functions.
- **No direct tRPC in screens:** Screen uses only hooks that wrap tRPC.

---

_Document created as a plan only; implementation to be done in a separate step._
