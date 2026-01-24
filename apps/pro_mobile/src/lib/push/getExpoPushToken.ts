import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { logger } from "../logger";

/**
 * Result of getting Expo push token
 */
export interface ExpoPushTokenResult {
  token: string;
  platform: "IOS" | "ANDROID";
}

/**
 * Request notification permissions and retrieve Expo push token
 * @returns { token, platform } or null if permission denied
 */
export async function getExpoPushToken(): Promise<ExpoPushTokenResult | null> {
  try {
    // Request permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission denied, return null
    if (finalStatus !== "granted") {
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Expo will auto-detect from app.json/app.config.js
    });

    // Detect platform
    const platform: "IOS" | "ANDROID" =
      Platform.OS === "ios" ? "IOS" : "ANDROID";

    return {
      token: tokenData.data,
      platform,
    };
  } catch (error) {
    // If any error occurs (e.g., not running on device), return null
    logger.warn("Failed to get Expo push token", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
