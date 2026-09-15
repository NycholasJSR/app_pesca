import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#3d4ff8" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="localizacao" />
    </Stack>
  );
}
