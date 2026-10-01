import { StyleSheet, Text, View } from "react-native";

export function CardAviso(texto: string) {
  return (
    <View style={styles.container}>
      <Text>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderColor: "#8cac00",
    backgroundColor: "#fcff38",
    borderRadius: 10,
  },
});
