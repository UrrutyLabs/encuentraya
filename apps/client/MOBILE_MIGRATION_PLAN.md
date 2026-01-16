# Mobile App Migration Plan

## Overview

This document outlines the plan to create a mobile version of the client app (`client_mobile`) using React Native (Expo) and Expo Router, mirroring the architecture and patterns used in `pro_mobile`.

## Current Client App Features

### Core Functionalities

1. **Authentication**
   - Login
   - Signup
   - Email confirmation
   - Password reset (forgot/reset)

2. **Search**
   - Search professionals with filters (category, date, time window)
   - View professional profiles
   - Navigate to professional detail

3. **Bookings**
   - Create booking (with rebooking support)
   - My Bookings (upcoming/past)
   - Booking detail view
   - Cancel booking
   - Checkout/Payment flow
   - Create review

4. **Professional Profile**
   - View professional profile
   - Hire professional (navigate to booking creation)

5. **Settings**
   - User profile management
   - Security (change password)
   - Help section
   - Delete account

6. **Landing**
   - Public landing page (unauthenticated)

---

## Proposed Architecture: `client_mobile`

### Directory Structure (Similar to `pro_mobile`)

```
apps/client_mobile/
├── app/
│   ├── _layout.tsx                    # Root layout (Stack navigator)
│   ├── index.tsx                       # Auth guard & redirect logic
│   ├── (tabs)/                         # Tab navigator (main app)
│   │   ├── _layout.tsx                # Tabs config
│   │   ├── search.tsx                 # Search screen
│   │   ├── bookings.tsx               # My Bookings screen
│   │   └── profile.tsx                # Profile/Settings screen
│   ├── auth/                           # Auth stack
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── confirm-email.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── pro/                            # Pro profile (modal/stack)
│   │   └── [proId].tsx
│   ├── booking/                        # Booking flow
│   │   ├── create.tsx                  # Create booking (query: proId, rebookFrom)
│   │   ├── [bookingId].tsx            # Booking detail
│   │   └── [bookingId]/review.tsx     # Create review
│   └── checkout/                       # Payment flow
│       └── [bookingId].tsx            # Checkout screen
└── src/
    ├── screens/                        # Screen components
    │   ├── auth/
    │   ├── search/
    │   ├── booking/
    │   ├── pro/
    │   └── settings/
    ├── components/
    │   ├── ui/                         # Mobile UI components
    │   └── presentational/             # Reusable presentational
    ├── hooks/                          # Business logic hooks
    ├── lib/                            # Utilities (trpc, auth, etc.)
    └── theme.ts                        # Theme config
```

---

## Screen Mapping

### Tab Navigator (3 Main Tabs)

1. **Search** (`search.tsx`)
   - Search with filters
   - Professional list
   - Navigate to professional profile

2. **My Bookings** (`bookings.tsx`)
   - Upcoming bookings
   - Past bookings
   - Navigate to booking detail

3. **Profile** (`profile.tsx`)
   - Settings access
   - User information
   - Quick access to settings

### Stack Navigator (Modal/Detail Screens)

- `pro/[proId].tsx` - Professional profile
- `booking/create.tsx` - Create booking
- `booking/[bookingId].tsx` - Booking detail
- `booking/[bookingId]/review.tsx` - Create review
- `checkout/[bookingId].tsx` - Checkout/Payment

---

## Layout Design

### Tab Navigator
```
┌─────────────────────────┐
│  [Search] [Bookings] [Profile]  │  ← Bottom tabs
└─────────────────────────┘
```

### Stack Navigator (Over Tabs)
- Header with back button
- Screen title
- ScrollView for content

### Reusable Components
- `ProCard` (mobile version)
- `BookingCard` (mobile version)
- `SearchFilters` (mobile version)
- `BookingForm` (mobile version)
- `ReviewForm` (mobile version)

---

## Implementation Phases

### Phase 1: Initial Setup & Authentication (Foundation)
**Goal**: Basic structure and working authentication flow.

**Tasks**:
1. Create `apps/client_mobile` with Expo Router setup
2. Configure dependencies (same as `pro_mobile`)
3. Setup tRPC, React Query, Supabase
4. Configure theme and design tokens
5. Implement `app/_layout.tsx` (Stack navigator)
6. Implement `app/index.tsx` (auth guard)
7. Auth screens:
   - `auth/login.tsx`
   - `auth/signup.tsx`
   - `auth/confirm-email.tsx`
   - `auth/forgot-password.tsx`
   - `auth/reset-password.tsx`
8. Auth hooks (reuse logic from `client`)

**Deliverables**:
- ✅ App starts and redirects based on auth state
- ✅ Login/Signup works
- ✅ Email confirmation works

---

### Phase 2: Tab Navigator & Search Screen (Core)
**Goal**: Main navigation and professional search functionality.

**Tasks**:
1. Create `app/(tabs)/_layout.tsx` (3 tabs)
2. Implement `app/(tabs)/search.tsx`
3. Create `SearchScreen` component:
   - Filters (category, date, time window)
   - Professional list
   - Empty states
4. Create `ProCard` mobile component
5. Implement `app/pro/[proId].tsx`
6. Create `ProProfileScreen` mobile
7. Hooks: `useSearchPros` (adapt from web)

**Deliverables**:
- ✅ Tab navigator functional
- ✅ Search with filters works
- ✅ View professional profile
- ✅ Navigation between search and profile

---

### Phase 3: My Bookings (Core)
**Goal**: View and manage client bookings.

**Tasks**:
1. Implement `app/(tabs)/bookings.tsx`
2. Create `MyBookingsScreen` mobile:
   - "Upcoming" and "Past" sections
   - Booking list
   - Empty states
3. Create `BookingCard` mobile component
4. Implement `app/booking/[bookingId].tsx`
5. Create `BookingDetailScreen` mobile:
   - Booking information
   - Professional information
   - Actions (cancel, pay, rebook)
   - Status-based states
6. Hooks: `useMyBookings`, `useBookingDetail`, `useCancelBooking`

**Deliverables**:
- ✅ View booking list
- ✅ View booking detail
- ✅ Cancel booking
- ✅ Navigation from bookings to detail

---

### Phase 4: Create Booking (Core)
**Goal**: Complete booking creation flow.

**Tasks**:
1. Implement `app/booking/create.tsx`
2. Create `BookingCreateScreen` mobile:
   - Booking form
   - Date/time validation
   - Rebooking handling
   - Suspended professional handling
3. Create `BookingForm` mobile component
4. Integrate with `ProProfileScreen` ("Hire" button)
5. Hooks: `useCreateBooking`, `useRebookTemplate`, `useProDetail`

**Deliverables**:
- ✅ Create booking from professional profile
- ✅ Rebooking from past booking
- ✅ Validations and error handling
- ✅ Redirect to checkout or detail based on status

---

### Phase 5: Checkout & Payment (Core)
**Goal**: Payment flow for bookings.

**Tasks**:
1. Implement `app/checkout/[bookingId].tsx`
2. Create `CheckoutScreen` mobile:
   - Booking summary
   - Payment information
   - "Authorize payment" button
   - Provider redirect handling
3. Integrate with `BookingDetailScreen` ("Pay" button)
4. Hooks: `useCheckout` (adapt from web)

**Deliverables**:
- ✅ Checkout screen
- ✅ Initiate payment process
- ✅ Redirect to payment provider
- ✅ Payment status handling

---

### Phase 6: Reviews (Core)
**Goal**: Create reviews for completed bookings.

**Tasks**:
1. Implement `app/booking/[bookingId]/review.tsx`
2. Create `ReviewCreateScreen` mobile:
   - Review form
   - Rating (stars)
   - Comment
3. Integrate with `BookingDetailScreen` ("Leave review" button)
4. Hooks: `useCreateReview`

**Deliverables**:
- ✅ Create review from booking detail
- ✅ Validation and submission
- ✅ UI updates after creating review

---

### Phase 7: Profile & Settings (Core)
**Goal**: User profile and settings management.

**Tasks**:
1. Implement `app/(tabs)/profile.tsx`
2. Create `ProfileScreen` mobile:
   - User information
   - Settings access
   - Logout button
3. Create `app/settings/` (stack or modal)
4. Create `SettingsScreen` mobile:
   - Personal data
   - Security (change password)
   - Help
   - Delete account
5. Hooks: `useClientProfile`, `useSettingsForm`

**Deliverables**:
- ✅ View user profile
- ✅ Access settings
- ✅ Change password
- ✅ Delete account

---

### Phase 8: Refinements & UX Polish (Polish)
**Goal**: Improve UX and consistency.

**Tasks**:
1. Loading states and skeletons
2. Error handling and messages
3. Empty states
4. Pull-to-refresh on lists
5. Optimistic updates where applicable
6. Navigation and deep linking
7. Basic offline handling
8. Push notifications (optional)
9. Basic testing of critical flows

**Deliverables**:
- ✅ Consistent UX
- ✅ Clear error handling
- ✅ Optimized performance
- ✅ Production-ready app

---

## Technical Considerations

### Code Reuse

- **Hooks**: Adapt from `apps/client/src/hooks` (change `useRouter` from Next.js to Expo Router)
- **Domain**: Reuse `@repo/domain` types and schemas
- **tRPC**: Same setup as `pro_mobile`
- **UI Components**: Create mobile variants in `@repo/ui` or local components

### Differences from Web

- **Navigation**: Expo Router instead of Next.js
- **Styling**: StyleSheet instead of Tailwind CSS
- **Forms**: Native mobile form components
- **Payment**: Handle redirects in mobile (Expo WebBrowser)

### Shared Components

- `BookingCard` (adapt from `pro_mobile`)
- `Badge`, `Button`, `Card`, `Text`, `Input` (adapt from `pro_mobile` or create new)

---

## Recommended Implementation Order

1. **Phase 1** (Setup + Auth) - Foundation
2. **Phase 2** (Search) - First visible functionality
3. **Phase 3** (Bookings) - Core client functionality
4. **Phase 4** (Create Booking) - Main flow
5. **Phase 5** (Checkout) - Complete payment flow
6. **Phase 6** (Reviews) - Secondary functionality
7. **Phase 7** (Settings) - Complete profile
8. **Phase 8** (Polish) - Final refinements

---

## Dependencies

### Core Dependencies (from `pro_mobile`)
- `expo` (~54.0.31)
- `expo-router` (~6.0.21)
- `react-native` (0.81.5)
- `@tanstack/react-query` (^5.90.16)
- `@trpc/client` (^11.8.1)
- `@trpc/react-query` (^11.8.1)
- `@supabase/supabase-js` (^2.90.1)
- `@repo/domain` (workspace:*)
- `@repo/trpc` (workspace:*)
- `@repo/react-query` (workspace:*)
- `@repo/monitoring` (workspace:*)

### UI Dependencies
- `@expo/vector-icons` (^15.0.3)
- `react-native-safe-area-context` (~5.6.0)
- `react-native-gesture-handler` (~2.28.0)
- `react-native-screens` (~4.16.0)

---

## Notes

- Follow the same patterns and structure as `pro_mobile` for consistency
- Reuse hooks and business logic from `apps/client/src/hooks` where possible
- Adapt web components to mobile using React Native components
- Ensure proper error handling and loading states throughout
- Test navigation flows thoroughly
- Consider offline capabilities for better UX
