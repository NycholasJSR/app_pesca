import { BotaoPlanejador } from "@/components/botaoPlanejador";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function Planejador() {
  const route = useRouter();

  return (
    <View style={styles.container}>
      <BotaoPlanejador
        color="#feaa1a"
        icon="fish"
        text="Planejar por Pescado"
        onPress={() => route.push("/planejador/planPescado")}
      />
      <BotaoPlanejador
        color="#c51a48"
        icon="navigate-circle"
        text="Planejar por Local"
        onPress={() => route.push("/planejador/planLocal")}
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
