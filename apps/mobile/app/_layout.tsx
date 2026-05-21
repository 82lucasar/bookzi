import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0284C7" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: "#F0F9FF" },
        }}
      />
      <StatusBar style="light" />
    </>
  )
}
