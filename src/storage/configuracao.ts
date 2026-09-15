import AsyncStorage from "@react-native-async-storage/async-storage";

const CONFIGURACAO_KEY = "@app_pesca:configuracao_concluida";

export async function configuracaoFoiConcluida() {
  const valor = await AsyncStorage.getItem(CONFIGURACAO_KEY);

  return valor === "true";
}

export async function marcarConfiguracaoComoConcluida() {
  await AsyncStorage.setItem(CONFIGURACAO_KEY, "true");
}

export async function resetarConfiguracao() {
  await AsyncStorage.removeItem(CONFIGURACAO_KEY);
}

export async function obterValorConfiguracao() {
  const valor = await AsyncStorage.getItem(CONFIGURACAO_KEY);
  return valor;
}
