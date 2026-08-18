import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: { backgroundColor: "#083c69" },
          tabBarActiveTintColor: "#fff",
          animation: "fade",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Home", headerShown: false }}
        />

        <Tabs.Screen
          name="precos"
          options={{ title: "Preços", headerShown: false }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
