import { useEffect } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@hooks/auth";
import { theme } from "../src/theme";
import { trpc } from "@lib/trpc/client";
import { Role } from "@repo/domain";
import { setUserContext, clearUserContext } from "@lib/crash-reporting";

export default function Index() {
  const { session, loading, user } = useAuth();

  // Get user info (role) if authenticated
  const { data: userInfo, isLoading: isLoadingUserInfo } =
    trpc.auth.me.useQuery(undefined, {
      enabled: !!session,
      retry: false,
    });

  // Set user context for crash reporting when authenticated
  useEffect(() => {
    if (user && userInfo) {
      setUserContext(user.id, user.email || undefined);
    } else if (!session) {
      clearUserContext();
    }
  }, [user, userInfo, session]);

  // Check if user has pro profile (only if they have PRO role)
  const { data: proProfile, isLoading: isLoadingProfile } =
    trpc.pro.getMyProfile.useQuery(undefined, {
      enabled: !!session && userInfo?.role === Role.PRO,
      retry: false,
    });

  if (loading || (session && isLoadingUserInfo)) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (session) {
    // Check if email is confirmed
    if (!session.user.email_confirmed_at) {
      // Email not confirmed - redirect to confirmation screen
      return (
        <Redirect
          href={{
            pathname: "/auth/confirm-email",
            params: { email: session.user.email || "" },
          }}
        />
      );
    }

    // Email confirmed - check role and profile
    // If user doesn't have PRO role, they need onboarding
    // (This handles the case where user signed up but onboarding wasn't completed)
    if (userInfo?.role !== Role.PRO) {
      return <Redirect href={"/onboarding"} />;
    }

    // If user has PRO role, check if they have a pro profile
    // If no profile exists, they need to complete onboarding
    // This handles cases where:
    // - User signed up but left before completing onboarding
    // - User confirmed email and signed in later
    if (userInfo?.role === Role.PRO) {
      if (isLoadingProfile) {
        return (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.bg,
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        );
      }

      // PRO role but no profile → redirect to onboarding
      if (!proProfile) {
        return <Redirect href={"/onboarding"} />;
      }

      // User has PRO role and profile → go to home
      return <Redirect href={"/(tabs)/home" as any} />;
    }
  }

  return <Redirect href={"/auth/login" as any} />;
}
