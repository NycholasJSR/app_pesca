import { Lucide } from "@react-native-vector-icons/lucide";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: { backgroundColor: "#083c69" },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "bold",
            color: "#fff",
          },
        }}
      >
        <Tabs.Screen
          name="planejador"
          options={{
            title: "Planejador",
            headerShown: false,
            tabBarIcon: () => <Lucide name="search" size={24} color="#fff" />,
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: () => <Lucide name="home" size={24} color="#fff" />,
          }}
        />

        <Tabs.Screen
          name="precos"
          options={{
            title: "Preços",
            headerShown: false,
            tabBarIcon: () => <Lucide name="fish" size={24} color="#fff" />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
