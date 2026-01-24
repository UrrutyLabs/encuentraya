apps/client/src/
app/
layout.tsx
globals.css

    page.tsx                         # Landing (Spanish text)

    (auth)/
      login/page.tsx
      signup/page.tsx

    (marketplace)/
      search/page.tsx
      pros/
        [proId]/page.tsx
      book/
        page.tsx                     # Booking create (query params: proId, etc.)
      my-bookings/
        page.tsx
        [bookingId]/page.tsx
        [bookingId]/review/page.tsx

screens/ # Containers (smart)
landing/
LandingScreen.tsx
auth/
LoginScreen.tsx
SignupScreen.tsx
search/
SearchScreen.tsx
pro/
ProProfileScreen.tsx
booking/
BookingCreateScreen.tsx
MyBookingsScreen.tsx
BookingDetailScreen.tsx
ReviewCreateScreen.tsx

components/
ui/ # primitives (presentational)
Button.tsx
Card.tsx
Text.tsx
Input.tsx
Badge.tsx

    presentational/                  # UI-only components
      ProCard.tsx
      BookingCard.tsx
      RatingStars.tsx
      Section.tsx
      EmptyState.tsx
      PageHeader.tsx

    forms/                           # UI-only form blocks
      AuthForm.tsx
      BookingForm.tsx
      ReviewForm.tsx

hooks/ # reusable smart logic
useAuth.ts
useSearchPros.ts
useMyBookings.ts
useBooking.ts
useCreateBooking.ts
useCreateReview.ts

lib/
supabase/
client.ts # browser supabase client
trpc/
client.ts
Provider.tsx
links.ts # attaches Authorization Bearer token
env.ts # optional env parsing

domain/ # UI view models/mappers (optional)
mappers/
pro.mapper.ts
booking.mapper.ts
viewModels/
ProVM.ts
BookingVM.ts
