import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulos}>Informações sobre a sua região!</Text>
      <Text>Aqui fica o mapa com portos próximos!</Text>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  titulos:{
    fontSize: 24,
    fontWeight: "bold",
  }
});
