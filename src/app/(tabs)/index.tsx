import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Redirect } from "expo-router";
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const db = SQLite.openDatabaseSync("base_pesca_tratada.db");

export default function Index() {
  useDrizzleStudio(db);
  const [isCarregando, setIsCarregando] = useState(true);
  const [isPrimeiraVez, setIsPrimeiraVez] = useState(true);

  useEffect(() => {
    //Verifica se o usuario ja realizou o primeiro cadastro;
    async function verificarPrimeiraVez() {
      try {
        const fezCadastro = await AsyncStorage.getItem("@cadastroFeito");
        if (fezCadastro === "true") {
          setIsPrimeiraVez(false);
        }
      } catch (error) {
        console.error("Erro ao verificar primeira vez:", error);
      } finally {
        setIsCarregando(false);
      }
    }
    verificarPrimeiraVez();
  }, []);

  if (isCarregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (isPrimeiraVez) {
    return <Redirect href={"/setup" as any} />;
  }

  return <Redirect href={"/planejador" as any} />;
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
