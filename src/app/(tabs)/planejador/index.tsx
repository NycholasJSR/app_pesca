import { BotaoPlanejador } from "@/components/botaoPlanejador";
import { StyleSheet, View } from "react-native";

export default function Planejador() {
  return (
    <View style={styles.container}>
      <BotaoPlanejador
        color="#feaa1a"
        icon="fish"
        text="Planejar por Pescado"
        onPress={() => console.log("Apertou pescado")}
      />
      <BotaoPlanejador
        color="#c51a48"
        icon="navigate-circle"
        text="Planejar por Local"
        onPress={() => console.log("Apertou local")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
