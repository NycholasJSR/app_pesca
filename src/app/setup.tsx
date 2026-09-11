import { Text, View } from "react-native";

export default function TelaSetup() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#644bf1",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff" }}>
        Tela de Setup
      </Text>
      <Text style={{ color: "#fff" }}>
        Aqui você pode configurar as opções do aplicativo.
      </Text>
    </View>
  );
}
