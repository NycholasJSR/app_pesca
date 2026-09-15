import { StyleSheet, Text, View } from "react-native";
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3d4ff8",
  },

  textos_fundo_escuro: {
    color: "#fff",
  },
});
export default function TelaLocalizacao() {
  return (
    <View style={styles.container}>
      <Text style={styles.textos_fundo_escuro}>Tela de Localização</Text>
    </View>
  );
}
