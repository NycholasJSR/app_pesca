import {
  obterValorConfiguracao,
  resetarConfiguracao,
} from "@/storage/configuracao";
import * as Location from "expo-location";
import { findNearest } from "geolib";
import { useEffect, useState } from "react";
import { Button, Text, View, StyleSheet } from "react-native";
import localidadesData from "../../../assets/localidades.json";
import Mapbox, { LocationPuck, MapView } from "@rnmapbox/maps";
import { SafeAreaView } from "react-native-safe-area-context";
type Localidade = {
  id: number;
  nome: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  } | null;
};

const localidades = localidadesData.localidades as Localidade[];

const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (!mapboxAccessToken) {
  throw new Error("EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN não está configurado.");
}

Mapbox.setAccessToken(mapboxAccessToken);

export default function Index() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localidadeMaisProxima, setLocalidadeMaisProxima] = useState<
    string | null
  >(null);
  const [coordenadasMapa, setCoordenadasMapa] = useState<
    [number, number] | null
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
          (
            localidade,
          ): localidade is Localidade & {
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
        const {
          latitude: latitudeMaisProxima,
          longitude: longitudeMaisProxima,
        } = maisProxima as { latitude: number; longitude: number };

        const localidadeEncontrada = localidadesComCoordenadas.find(
          (localidade) =>
            localidade.coordenadas.latitude === latitudeMaisProxima &&
            localidade.coordenadas.longitude === longitudeMaisProxima,
        );

        setLocalidadeMaisProxima(localidadeEncontrada?.nome ?? null);
        setCoordenadasMapa([longitudeMaisProxima, latitudeMaisProxima]);
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
    <SafeAreaView style={styles.page}>
      <Text>Bem-vindo ao aplicativo de pesca!</Text>
      <Text>
        Localização mais próxima:{" "}
        {localidadeMaisProxima ?? (errorMsg ? "Não disponível" : "Buscando...")}
      </Text>
      {errorMsg && <Text>{errorMsg}</Text>}
      <Button title="Resetar Configuração" onPress={resetarConfig} />
      <Button title="Verificar Valor" onPress={verificarValorAsyncStorage} />

      <View style={styles.page}>
        <View style={styles.container}>
          <MapView style={styles.map}>
            {coordenadasMapa && (
              <Mapbox.Camera
                zoomLevel={12} // Zoom ideal para ver uma cidade/porto
                centerCoordinate={coordenadasMapa}
                animationMode="flyTo" // Cria um efeito suave de voo até o ponto
                animationDuration={2000}
              />
            )}
            <LocationPuck
              puckBearingEnabled
              puckBearing="heading"
              pulsing={{ isEnabled: true }}
            ></LocationPuck>
          </MapView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    height: 400,
    width: 300,
  },
  map: {
    flex: 1,
  },
});
