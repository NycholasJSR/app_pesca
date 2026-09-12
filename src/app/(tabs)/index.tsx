import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import * as SQLite from "expo-sqlite";
import { Text, View } from "react-native";

const db = SQLite.openDatabaseSync("base_pesca_tratada.db");

export default function Index() {
  useDrizzleStudio(db);
  return (
    <View>
      <Text>Bem-vindo ao aplicativo de pesca!</Text>
    </View>
  );
}
