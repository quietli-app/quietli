import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#642B73",
          },

          // Allows iPhone-style swipe-back gestures.
          gestureEnabled: true,

          // Allows the gesture to begin from more of the screen,
          // not just the far-left edge.
          fullScreenGestureEnabled: true,

          gestureDirection: "horizontal",

          // This tends to play nicer with full-screen swipe gestures.
          animation: "simple_push",
        }}
      />

      <StatusBar style="light" />
    </>
  );
}