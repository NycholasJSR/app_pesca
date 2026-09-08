import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import * as SQLite from "expo-sqlite";
import { StyleSheet, Text, View } from "react-native";

const db = SQLite.openDatabaseSync("pesca_tratada.db");

export default function Index() {
  useDrizzleStudio(db);

  return (
    <View style={styles.container}>
      <Text style={styles.titulos}>Informações sobre a sua região!</Text>
      <Text>Aqui fica o mapa com portos próximos!</Text>
      <Text>Data de hoje: {new Date().toLocaleDateString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  titulos: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
