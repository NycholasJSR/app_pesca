import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  button: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowOpacity: 0.3,
    shadowColor: "black",
    elevation: 5,
  },
});

export function BotaoPlanejador({ color }: { color: string }) {
  return (
    <View style={[styles.button, { backgroundColor: color }]}>
      <Text>bla bla</Text>
    </View>
  );
}
