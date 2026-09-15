import { router } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

import { marcarConfiguracaoComoConcluida } from "@/storage/configuracao";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3d4ff8",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 16,
  },
  textos_fundo_escuro: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
  },
});

export default function Onboarding() {
  async function finalizarConfiguracao() {
    await marcarConfiguracaoComoConcluida();

    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.textos_fundo_escuro}>Bem-vindo</Text>
        <Text style={styles.textos_fundo_escuro}>
          Vamos definir sua localização atual:
        </Text>
        <Button
          title=">"
          onPress={() => router.push("/onboarding/localizacao")}
        />
        <Button title="Começar" onPress={finalizarConfiguracao} />
      </View>
    </View>
  );
}
