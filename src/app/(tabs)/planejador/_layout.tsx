import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
export default function PlanejadorLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="planPescado" />
        <Stack.Screen name="planLocal" />
      </Stack>
    </SafeAreaView>
  );
}
