import { Lucide } from "@react-native-vector-icons/lucide";
import { Tabs } from "expo-router";

import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <SQLiteProvider
        databaseName="data.db"
        assetSource={{ assetId: require("@/assets/data.db") }}
      >
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
              tabBarIcon: () => (
                <Lucide name="fishing-rod" size={24} color="#fff" />
              ),
            }}
          />

          <Tabs.Screen
            name="index"
            options={{
              title: "Pag Inicial",
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
      </SQLiteProvider>
    </SafeAreaView>
  );
}
