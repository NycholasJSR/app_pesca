import { Stack } from "expo-router";

export default function PlanejadorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="planPescado" />
      <Stack.Screen name="planLocal" />
    </Stack>
  );
}
