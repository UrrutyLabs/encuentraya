# Mobile App Recreation Prompt

## Context

Recreate a complete Expo Router mobile app for "Arreglatodo" - a local services marketplace for pros (professionals) to manage bookings. This is a Pro-focused mobile app (not client-facing).

## Project Structure

```
src/
  app/                          # Expo Router routes
    _layout.tsx                 # Root layout with fonts + TRPCProvider
    index.tsx                   # Auth check + redirect
    auth/
      login.tsx                 # Delegates to LoginScreen
      signup.tsx                # Delegates to SignupScreen
    (tabs)/
      _layout.tsx               # Tabs layout (Home, Jobs, Availability)
      home.tsx                  # Delegates to HomeScreen
      jobs.tsx                  # Delegates to JobsScreen
      availability.tsx          # Delegates to AvailabilityScreen
    booking/
      [bookingId].tsx           # Delegates to BookingDetailScreen

  screens/                      # Container components (smart)
    auth/
      LoginScreen.tsx
      SignupScreen.tsx
    home/
      HomeScreen.tsx
    jobs/
      JobsScreen.tsx
    booking/
      BookingDetailScreen.tsx
    availability/
      AvailabilityScreen.tsx

  components/
    ui/                         # UI primitives
      Button.tsx
      Text.tsx
      Card.tsx
      Input.tsx
      Badge.tsx
    presentational/             # UI-only components
      BookingCard.tsx

  hooks/                        # Custom hooks
    useAuth.ts
    useBookingActions.ts
    useAvailability.ts

  lib/
    supabase/
      client.ts                 # Supabase client setup
    trpc/
      client.ts                 # tRPC React client
      links.ts                  # tRPC links with auth headers
      Provider.tsx              # TRPCProvider wrapper

  theme/
    index.ts                    # Theme exports from design tokens
```

## External Dependencies Required

**IMPORTANT**: This app depends on two external packages that must be created:

1. **UI Design Tokens Package** - Design system tokens (colors, typography, spacing, radius, shadows)
2. **tRPC AppRouter Type** - TypeScript type for tRPC router (for type-safe API calls)

See sections below for how to create these.

---

## Design Tokens (REQUIRED - Create standalone package or inline)

You have two options:

### Option 1: Create Standalone UI Package (Recommended)

Create a local package `packages/ui` or `src/tokens`:

**Structure:**

```
packages/ui/
  src/
    tokens/
      colors.ts
      typography.ts
      spacing.ts
      radius.ts
      shadows.ts
    index.ts
  package.json
```

**package.json:**

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**src/index.ts:**

```typescript
export { colors, type Colors } from "./tokens/colors";
export { typography, type Typography } from "./tokens/typography";
export { spacing, type Spacing } from "./tokens/spacing";
export { radius, type Radius } from "./tokens/radius";
export { shadows, type Shadows } from "./tokens/shadows";
```

### Option 2: Inline Tokens in Mobile App

If you don't want a separate package, create `src/tokens/` directory directly in the mobile app and import from there.

### Colors (Calm Trust Palette)

```typescript
export const colors = {
  primary: "#1F3A5F",
  secondary: "#4A6FA5",
  accent: "#2CB1BC",
  bg: "#F7F9FC",
  surface: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#2563EB",
} as const;
```

### Typography

```typescript
export const typography = {
  sizes: {
    h1: { fontSize: 24, lineHeight: 32 },
    h2: { fontSize: 20, lineHeight: 28 },
    body: { fontSize: 16, lineHeight: 24 },
    small: { fontSize: 14, lineHeight: 20 },
    xs: { fontSize: 12, lineHeight: 16 },
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;
```

### Spacing

```typescript
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;
```

### Radius

```typescript
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
```

### Shadows

```typescript
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
} as const;
```

## UI Components

### Button (`components/ui/Button.tsx`)

- Props: `variant?: "primary" | "secondary" | "accent" | "ghost" | "danger"`, `children: string`, extends `TouchableOpacityProps`
- Variants use theme colors
- Ghost variant: transparent bg, border, primary text color
- Styles: padding, borderRadius (md), center alignment

### Text (`components/ui/Text.tsx`)

- Props: `variant?: "body" | "small" | "xs" | "h1" | "h2"`, extends `TextProps`
- Maps to typography tokens (fontSize, lineHeight, fontWeight)
- Default color: theme.colors.text

### Card (`components/ui/Card.tsx`)

- Props: extends `ViewProps`
- Styles: surface bg, border, radius (lg), padding (spacing[4])

### Input (`components/ui/Input.tsx`)

- Props: `label?: string`, extends `TextInputProps`
- Optional label above input
- Styles: border, radius (md), padding, surface bg, text color

### Badge (`components/ui/Badge.tsx`)

- Props: `variant?: "success" | "warning" | "danger" | "info"`, `children: string`
- Background: variant color at 10% opacity (1A)
- Border: variant color at 20% opacity (33)
- Text: variant color
- Styles: padding, radius (md), border

## Presentational Components

### BookingCard (`components/presentational/BookingCard.tsx`)

- Props: `booking: Booking`, `onPress: () => void`
- Displays: category (translated), status badge, description (2 lines max), date/time (formatted), total amount
- Status labels (Spanish): Pendiente, Aceptada, Rechazada, Completada, Cancelada
- Category labels (Spanish): plumbing→Plomería, electrical→Electricidad, cleaning→Limpieza, handyman→Arreglos generales, painting→Pintura
- Date format: `Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })`
- TouchableOpacity wrapper, uses Card component

## Hooks

### useAuth (`hooks/useAuth.ts`)

- Returns: `{ user, session, loading, error, signIn, signUp, signOut }`
- Uses Supabase: `supabase.auth.getSession()`, `onAuthStateChange()`, `signInWithPassword()`, `signUp()`, `signOut()`
- Manages session state, loading, errors
- Error handling: sets error state and throws

### useBookingActions (`hooks/useBookingActions.ts`)

- Props: `onSuccess?: () => void`
- Returns: `{ acceptBooking, rejectBooking, completeBooking, isAccepting, isRejecting, isCompleting, error }`
- Uses tRPC mutations: `trpc.booking.accept.useMutation()`, `reject.useMutation()`, `complete.useMutation()`
- Calls `onSuccess()` after successful mutation
- Error messages (Spanish): "Error al aceptar/rechazar/completar la reserva"

### useAvailability (`hooks/useAvailability.ts`)

- Returns: `{ isAvailable, isLoading, error, toggleAvailability, isSaving }`
- Fetches: `trpc.pro.getMyProfile.useQuery()`
- Availability logic: `pro.isApproved && !pro.isSuspended`
- Mutation: `trpc.pro.setAvailability.useMutation({ isAvailable: boolean })`
- Refetches profile after mutation

## Screens (Containers)

### LoginScreen (`screens/auth/LoginScreen.tsx`)

- Form: email, password inputs
- Button: "Ingresar" (primary), loading state "Iniciando sesión..."
- Link: "¿No tenés cuenta? Registrate" (ghost variant) → `/auth/signup`
- Uses `useAuth().signIn()`
- On success: `router.replace("/(tabs)/home")`
- Error display below form
- Centered Card layout, maxWidth 400

### SignupScreen (`screens/auth/SignupScreen.tsx`)

- Same structure as LoginScreen
- Button: "Crear cuenta" (primary), loading "Registrando..."
- Link: "¿Ya tenés cuenta? Iniciar sesión" (ghost) → `router.back()`
- Uses `useAuth().signUp()`

### HomeScreen (`screens/home/HomeScreen.tsx`)

- Fetches: `trpc.booking.proInbox.useQuery()`
- Sections:
  - "Solicitudes nuevas" (PENDING bookings)
  - "Próximos trabajos" (ACCEPTED bookings)
- Empty states: "No hay solicitudes nuevas" / "No hay trabajos próximos"
- Loading: ActivityIndicator + "Cargando..."
- Error: "Error al cargar trabajos"
- Navigation: tap BookingCard → `/booking/${bookingId}`
- Uses `useMemo` to filter bookings by status

### JobsScreen (`screens/jobs/JobsScreen.tsx`)

- Fetches: `trpc.booking.proJobs.useQuery()`
- Sections:
  - "Próximos" (ACCEPTED bookings)
  - "Completados" (COMPLETED bookings)
- Same empty/loading/error states as HomeScreen
- Navigation: tap BookingCard → `/booking/${bookingId}`

### BookingDetailScreen (`screens/booking/BookingDetailScreen.tsx`)

- Fetches: `trpc.booking.getById.useQuery({ id: bookingId })`
- Displays:
  - Status badge (with variant mapping)
  - Card with summary: category, date/time, estimated hours, description, total amount
- Actions (conditional based on status):
  - PENDING: "Aceptar" (primary) + "Rechazar" (danger)
  - ACCEPTED: "Marcar como completado" (primary)
  - COMPLETED/CANCELLED/REJECTED: read-only (no actions)
- Uses `useBookingActions` hook
- Loading states on buttons: "Aceptando...", "Rechazando...", "Completando..."
- Error display for action errors
- Date format: `Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })`

### AvailabilityScreen (`screens/availability/AvailabilityScreen.tsx`)

- Title: "Disponibilidad"
- Toggle: Switch component (React Native)
- Label: "Disponible" / "No disponible" (based on state)
- Helper text: "Cuando estás disponible, podés recibir solicitudes."
- Error display below toggle
- Uses `useAvailability` hook
- Switch colors: track (border when false, primary when true), thumb (surface)

## Routes (Expo Router Pages)

### `app/_layout.tsx`

- Loads Inter fonts (400, 500, 600, 700) using `useFonts`
- Shows ActivityIndicator while fonts load
- Wraps app in `TRPCProvider`
- Stack navigator with screenOptions:
  - `headerStyle: { backgroundColor: theme.colors.surface }`
  - `headerTintColor: theme.colors.text`
- Screens:
  - `index`: `headerShown: false`
  - `auth/login`: title "Iniciar sesión"
  - `auth/signup`: title "Registrarse"
  - `(tabs)`: `headerShown: false`
  - `booking/[bookingId]`: title "Detalle de reserva"

### `app/index.tsx`

- Uses `useAuth()` hook
- If loading: ActivityIndicator
- If session exists: `<Redirect href="/(tabs)/home" />`
- Else: `<Redirect href="/auth/login" />`

### `app/(tabs)/_layout.tsx`

- Tabs navigator
- screenOptions:
  - `headerStyle: { backgroundColor: theme.colors.surface }`
  - `headerTintColor: theme.colors.text`
  - `tabBarActiveTintColor: theme.colors.primary`
  - `tabBarInactiveTintColor: theme.colors.muted`
  - `tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }`
- Tabs:
  - `home`: title "Inicio", tabBarLabel "Inicio"
  - `jobs`: title "Trabajos", tabBarLabel "Trabajos"
  - `availability`: title "Disponibilidad", tabBarLabel "Disponibilidad"

### Route Pages (thin wrappers)

- `app/(tabs)/home.tsx`: `export default function HomePage() { return <HomeScreen />; }`
- `app/(tabs)/jobs.tsx`: `export default function JobsPage() { return <JobsScreen />; }`
- `app/(tabs)/availability.tsx`: `export default function AvailabilityPage() { return <AvailabilityScreen />; }`
- `app/auth/login.tsx`: `export default function LoginPage() { return <LoginScreen />; }`
- `app/auth/signup.tsx`: `export default function SignupPage() { return <SignupScreen />; }`
- `app/booking/[bookingId].tsx`: `export default function BookingDetailPage() { return <BookingDetailScreen />; }`

## tRPC Setup (REQUIRED - Create AppRouter Type)

**CRITICAL**: The tRPC client requires an `AppRouter` type. Since you're recreating outside the monorepo, you MUST create a mock/standalone version.

### Option 1: Simple Type (Quick Start - Recommended)

Create `src/lib/trpc/types.ts`:

```typescript
import { AnyRouter } from "@trpc/server";

/**
 * AppRouter type for type-safe tRPC calls.
 *
 * For a standalone app, you can use AnyRouter as a base type.
 * The actual API endpoints must exist on your backend server.
 *
 * If you want full type safety, you can define the exact router structure
 * matching your backend API (see Option 2 below).
 */
export type AppRouter = AnyRouter;
```

This is the simplest approach and will work immediately. You'll get basic type checking, but not full endpoint-specific types.

### Option 2: Detailed AppRouter Type (Full Type Safety - Advanced)

If you want full type safety with exact endpoint types, you can define a more detailed structure. However, this is complex and Option 1 is recommended for most cases.

**Note**: The detailed type definition is complex and requires deep knowledge of tRPC's type system. For most use cases, Option 1 (`AnyRouter`) is sufficient and will work correctly with your backend API.

### `lib/trpc/client.ts`

```typescript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "./types"; // Import from local types file

export const trpc = createTRPCReact<AppRouter>();
```

**Note**: The `AppRouter` type is only for TypeScript type checking. The actual API endpoints must exist on your backend server. This type definition ensures your mobile app code is type-safe when calling the API.

### `lib/trpc/links.ts`

- Function: `createTRPCLinks()`
- Returns: `[httpBatchLink({ ... })]`
- URL: `${getBaseUrl()}/api/trpc`
- Base URL logic:
  - Uses `process.env.EXPO_PUBLIC_API_URL` if set
  - Fallback: `"http://localhost:3002"`
  - Comments about LAN IP for device testing
- Transformer: `superjson`
- Headers: async function that:
  - Calls `supabase.auth.getSession()`
  - If `session?.access_token` exists, sets `Authorization: Bearer ${token}`
  - Returns headers object

### `lib/trpc/Provider.tsx`

- Wraps children with tRPC and React Query providers
- Creates `QueryClient` with `useState(() => new QueryClient())`
- Creates `trpcClient` with `trpc.createClient({ links: createTRPCLinks() })`
- Returns:
  ```tsx
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </trpc.Provider>
  ```

## Supabase Setup

### `lib/supabase/client.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Theme Setup

### `theme/index.ts`

- Imports tokens from design system (colors, typography, spacing, radius, shadows)
- Exports: `export const theme = { colors, typography, spacing, radius, shadows }`

## Environment Variables

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL` (optional, defaults to localhost:3002)

## tRPC Endpoints Used

- `trpc.booking.proInbox.useQuery()` - Get pending + accepted bookings for pro
- `trpc.booking.proJobs.useQuery()` - Get accepted + completed bookings for pro
- `trpc.booking.getById.useQuery({ id })` - Get booking by ID
- `trpc.booking.accept.useMutation({ bookingId })` - Accept booking
- `trpc.booking.reject.useMutation({ bookingId })` - Reject booking
- `trpc.booking.complete.useMutation({ bookingId })` - Complete booking
- `trpc.pro.getMyProfile.useQuery()` - Get authenticated pro profile
- `trpc.pro.setAvailability.useMutation({ isAvailable: boolean })` - Set availability

## Domain Types (REQUIRED - Create locally or import)

**IMPORTANT**: The app uses domain types that must be defined. Create `src/types/domain.ts`:

```typescript
// src/types/domain.ts

export enum BookingStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum Category {
  PLUMBING = "plumbing",
  ELECTRICAL = "electrical",
  CLEANING = "cleaning",
  HANDYMAN = "handyman",
  PAINTING = "painting",
}

export type Booking = {
  id: string;
  clientId: string;
  proId: string;
  category: string; // Category enum value
  description: string;
  status: BookingStatus;
  scheduledAt: Date;
  estimatedHours: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Pro = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  hourlyRate: number;
  categories: string[]; // Array of Category enum values
  serviceArea: string | null;
  rating: number | null;
  reviewCount: number;
  isApproved: boolean;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

Then update imports throughout the app:

- Replace `import { BookingStatus } from "@repo/domain"` with `import { BookingStatus } from "../types/domain"`
- Replace `import type { Booking } from "@repo/domain"` with `import type { Booking } from "../types/domain"`

## UI Text (All Spanish - Rioplatense)

- Auth: "Iniciar sesión", "Registrarse", "Email", "Contraseña", "Ingresar", "Crear cuenta"
- Home: "Inicio", "Bandeja de trabajos", "Solicitudes nuevas", "Próximos trabajos"
- Jobs: "Trabajos", "Lista de mis trabajos", "Próximos", "Completados"
- Booking Detail: "Detalle de reserva", "Resumen", "Categoría", "Fecha y hora", "Horas estimadas", "Descripción", "Total estimado", "Acciones", "Aceptar", "Rechazar", "Marcar como completado"
- Availability: "Disponibilidad", "Disponible", "No disponible", "Cuando estás disponible, podés recibir solicitudes."
- Status labels: "Pendiente", "Aceptada", "Rechazada", "Completada", "Cancelada"
- Category labels: "Plomería", "Electricidad", "Limpieza", "Arreglos generales", "Pintura"
- Loading: "Cargando...", "Cargando reserva...", "Iniciando sesión...", "Registrando...", "Aceptando...", "Rechazando...", "Completando..."
- Errors: "Error al cargar trabajos", "Error al cargar la reserva", "Reserva no encontrada", etc.

## Styling Rules

- All components use `StyleSheet.create()` with theme tokens
- Spacing: use `theme.spacing[number]` (numeric keys: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)
- Colors: use `theme.colors.*`
- Radius: use `theme.radius.*` (named: none, sm, md, lg, xl, full)
- Typography: use `theme.typography.sizes.*` and `theme.typography.weights.*`

## Architecture Rules

- **Screens are containers**: Handle data fetching, state, navigation logic
- **Components are presentational**: UI-only, receive props, no tRPC calls
- **Hooks encapsulate logic**: Business logic in custom hooks
- **Routes are thin**: Just delegate to screens
- **English for code**: File names, component names, variables
- **Spanish for UI**: All visible text in Spanish

## Key Implementation Details

1. **Date Formatting**: Use `Intl.DateTimeFormat("es-UY", ...)` for all dates
2. **Status Mapping**: PENDING→info, ACCEPTED→success, REJECTED→danger, COMPLETED→success, CANCELLED→warning
3. **Category Translation**: Map enum values to Spanish labels
4. **Error Handling**: Display error messages in Spanish, handle loading states
5. **Navigation**: Use `expo-router`'s `useRouter()` and `useLocalSearchParams()`
6. **Empty States**: Show helpful messages when lists are empty
7. **Loading States**: ActivityIndicator with text, disable buttons during mutations
8. **Refetching**: Use `refetch()` from `useQuery` after mutations

## Code Examples

### Complete Component Examples

#### Button Component

```typescript
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from "react-native";
import { theme } from "../../theme";

interface ButtonProps extends TouchableOpacityProps {
  children: string;
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
}

export function Button({ children, variant = "primary", style, ...props }: ButtonProps) {
  const variantStyles = {
    primary: { backgroundColor: theme.colors.primary },
    secondary: { backgroundColor: theme.colors.secondary },
    accent: { backgroundColor: theme.colors.accent },
    ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.colors.border },
    danger: { backgroundColor: theme.colors.danger },
  };

  return (
    <TouchableOpacity style={[styles.button, variantStyles[variant], style]} {...props}>
      <Text style={[styles.buttonText, variant === "ghost" && styles.ghostButtonText]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.body.fontSize,
    fontWeight: theme.typography.weights.medium,
  },
  ghostButtonText: {
    color: theme.colors.primary,
  },
});
```

#### Text Component

```typescript
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from "react-native";
import { theme } from "../../theme";

interface TextProps extends RNTextProps {
  children: React.ReactNode;
  variant?: "body" | "small" | "xs" | "h1" | "h2";
}

export function Text({ children, variant = "body", style, ...props }: TextProps) {
  const variantStyles = {
    h1: {
      fontSize: theme.typography.sizes.h1.fontSize,
      lineHeight: theme.typography.sizes.h1.lineHeight,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    h2: {
      fontSize: theme.typography.sizes.h2.fontSize,
      lineHeight: theme.typography.sizes.h2.lineHeight,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    body: {
      fontSize: theme.typography.sizes.body.fontSize,
      lineHeight: theme.typography.sizes.body.lineHeight,
      fontWeight: theme.typography.weights.regular,
      color: theme.colors.text,
    },
    small: {
      fontSize: theme.typography.sizes.small.fontSize,
      lineHeight: theme.typography.sizes.small.lineHeight,
      fontWeight: theme.typography.weights.regular,
      color: theme.colors.text,
    },
    xs: {
      fontSize: theme.typography.sizes.xs.fontSize,
      lineHeight: theme.typography.sizes.xs.lineHeight,
      fontWeight: theme.typography.weights.regular,
      color: theme.colors.text,
    },
  };

  return <RNText style={[variantStyles[variant], style]} {...props}>{children}</RNText>;
}
```

#### Card Component

```typescript
import { View, ViewProps, StyleSheet } from "react-native";
import { theme } from "../../theme";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  return <View style={[styles.card, style]} {...props}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
  },
});
```

#### Input Component

```typescript
import { TextInput, TextInputProps, Text, View, StyleSheet } from "react-native";
import { theme } from "../../theme";

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  const input = (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={theme.colors.muted}
      {...props}
    />
  );

  if (label) {
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        {input}
      </View>
    );
  }

  return input;
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.body.fontSize,
  },
  label: {
    fontSize: theme.typography.sizes.small.fontSize,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing[1],
  },
});
```

#### Badge Component

```typescript
import { View, Text, StyleSheet, ViewProps } from "react-native";
import { theme } from "../../theme";

interface BadgeProps extends ViewProps {
  children: string;
  variant?: "success" | "warning" | "danger" | "info";
}

export function Badge({ children, variant = "info", style, ...props }: BadgeProps) {
  const variantStyles = {
    success: {
      backgroundColor: `${theme.colors.success}1A`,
      borderColor: `${theme.colors.success}33`,
      color: theme.colors.success,
    },
    warning: {
      backgroundColor: `${theme.colors.warning}1A`,
      borderColor: `${theme.colors.warning}33`,
      color: theme.colors.warning,
    },
    danger: {
      backgroundColor: `${theme.colors.danger}1A`,
      borderColor: `${theme.colors.danger}33`,
      color: theme.colors.danger,
    },
    info: {
      backgroundColor: `${theme.colors.info}1A`,
      borderColor: `${theme.colors.info}33`,
      color: theme.colors.info,
    },
  };

  const variantStyle = variantStyles[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
        },
        style,
      ]}
      {...props}
    >
      <Text style={[styles.badgeText, { color: variantStyle.color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: theme.typography.sizes.xs.fontSize,
    fontWeight: theme.typography.weights.medium,
  },
});
```

## Testing Checklist

- [ ] App loads without errors
- [ ] Fonts load correctly (Inter)
- [ ] Auth flow: login → redirect to home
- [ ] Auth flow: signup → redirect to home
- [ ] Home screen shows pending and accepted bookings
- [ ] Jobs screen shows accepted and completed bookings
- [ ] Booking detail shows correct info and actions
- [ ] Accept/Reject/Complete actions work
- [ ] Availability toggle works
- [ ] Navigation between screens works
- [ ] tRPC calls include Authorization header
- [ ] Error states display correctly
- [ ] Loading states display correctly
- [ ] Empty states display correctly

## Setup Checklist for Standalone Recreation

Before starting development, ensure you have:

### ✅ Required Setup Steps

1. **Create UI Design Tokens**
   - [ ] Create `packages/ui` or `src/tokens` directory
   - [ ] Add all token files (colors, typography, spacing, radius, shadows)
   - [ ] Create index.ts to export all tokens
   - [ ] Update `src/theme/index.ts` to import from tokens

2. **Create tRPC AppRouter Type**
   - [ ] Create `src/lib/trpc/types.ts`
   - [ ] Define `AppRouter` type (can be simplified with `AnyRouter` initially)
   - [ ] Update `src/lib/trpc/client.ts` to import from local types

3. **Create Domain Types**
   - [ ] Create `src/types/domain.ts`
   - [ ] Define `BookingStatus` enum
   - [ ] Define `Category` enum
   - [ ] Define `Booking` type
   - [ ] Define `Pro` type
   - [ ] Update all imports throughout the app

4. **Environment Variables**
   - [ ] Create `.env` or `.env.local` file
   - [ ] Add `EXPO_PUBLIC_SUPABASE_URL`
   - [ ] Add `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - [ ] Add `EXPO_PUBLIC_API_URL` (optional, defaults to localhost:3002)

5. **Backend API**
   - [ ] Ensure backend API server is running
   - [ ] Verify all tRPC endpoints are implemented:
     - `booking.proInbox`
     - `booking.proJobs`
     - `booking.getById`
     - `booking.accept`
     - `booking.reject`
     - `booking.complete`
     - `pro.getMyProfile`
     - `pro.setAvailability`

### Quick Start Alternative

If you want to get started quickly without full type safety:

1. **UI Tokens**: Inline them directly in `src/theme/index.ts` (copy all token definitions)
2. **AppRouter Type**: Use `export type AppRouter = any;` temporarily in `src/lib/trpc/types.ts`
3. **Domain Types**: Define minimal types as you encounter them

Then refine the types as you build out the app.
