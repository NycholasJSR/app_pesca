import {
  obterValorConfiguracao,
  resetarConfiguracao,
} from "@/storage/configuracao";
import * as Location from "expo-location";
import { findNearest } from "geolib";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import localidadesData from "../../../assets/localidades.json";

type Localidade = {
  id: number;
  nome: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  } | null;
};

const localidades = localidadesData.localidades as Localidade[];

export default function Index() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localidadeMaisProxima, setLocalidadeMaisProxima] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function getLocalizacaoAtual() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setErrorMsg("Permissão para acessar a localização foi negada.");
          return;
        }

        const localizacaoUsuario = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const localidadesComCoordenadas = localidades.filter(
          (localidade): localidade is Localidade & {
            coordenadas: NonNullable<Localidade["coordenadas"]>;
          } => localidade.coordenadas !== null,
        );

        if (localidadesComCoordenadas.length === 0) {
          setErrorMsg("Não há localidades com coordenadas cadastradas.");
          return;
        }

        const maisProxima = findNearest(
          {
            latitude: localizacaoUsuario.coords.latitude,
            longitude: localizacaoUsuario.coords.longitude,
          },
          localidadesComCoordenadas.map((localidade) => ({
            latitude: localidade.coordenadas.latitude,
            longitude: localidade.coordenadas.longitude,
            nome: localidade.nome,
          })),
        );
        const { latitude: latitudeMaisProxima, longitude: longitudeMaisProxima } =
          maisProxima as { latitude: number; longitude: number };

        const localidadeEncontrada = localidadesComCoordenadas.find(
          (localidade) =>
            localidade.coordenadas.latitude === latitudeMaisProxima &&
            localidade.coordenadas.longitude === longitudeMaisProxima,
        );

        setLocalidadeMaisProxima(localidadeEncontrada?.nome ?? null);
      } catch (error) {
        console.log("Erro ao obter localização atual:", error);
        setErrorMsg("Não foi possível obter sua localização atual.");
      }
    }

    getLocalizacaoAtual();
  }, []);

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
      <Text>
        Localização mais próxima:{" "}
        {localidadeMaisProxima ??
          (errorMsg ? "Não disponível" : "Buscando...")}
      </Text>
      {errorMsg && <Text>{errorMsg}</Text>}
      <Button title="Resetar Configuração" onPress={resetarConfig} />
      <Button title="Verificar Valor" onPress={verificarValorAsyncStorage} />
    </View>
  );
}
