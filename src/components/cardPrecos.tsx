import { StyleSheet, Text, View } from "react-native";

export function CardPrecos({ nome, preco }: { nome: string; preco: number }) {
  return (
    <View style={styles.card}>
      <Text>{nome}</Text>
      <Text>R$ {preco.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f5d520",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
