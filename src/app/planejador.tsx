import { Pressable, Text, View } from "react-native";
import { BotaoPlanejador } from "../../components/botaoPlanejador";

export default function Planejador() {
  return (
    <View style={{ flex: 1 }}>
      <Pressable>
        <BotaoPlanejador color="#1afe3c" />
      </Pressable>
      <Pressable>
        <Text>Planejamento por pescado</Text>
      </Pressable>
    </View>
  );
}
