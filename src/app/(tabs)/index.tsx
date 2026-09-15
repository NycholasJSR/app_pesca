import {
  obterValorConfiguracao,
  resetarConfiguracao,
} from "@/storage/configuracao";
import { Button, Text, View } from "react-native";

export default function Index() {
  async function resetarConfig() {
    await resetarConfiguracao();
  }

  async function verificarValorAsyncStorage() {
    const valor = await obterValorConfiguracao();
    console.log("Valor da configuração:", valor);
  }

  return (
    <View>
      <Text>Bem-vindo ao aplicativo de pesca!</Text>
      <Button title="Resetar Configuração" onPress={resetarConfig} />
      <Button title="Verificar Valor" onPress={verificarValorAsyncStorage} />
    </View>
  );
}
