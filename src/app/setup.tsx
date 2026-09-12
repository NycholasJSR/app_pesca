import localidadesData from "@/assets/localidades.json";
import * as Location from "expo-location";
import { findNearest } from "geolib";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

type LocalidadeItem = {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
};

export default function TelaSetup() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localidadeSelecionada, setLocalidadeSelecionada] = useState<
    number | null
  >(null);

  useEffect(() => {
    async function verificarLocalProximo() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permissão para acessar a localização foi negada");
        return;
      }

      let localizao_usuario = await Location.getCurrentPositionAsync({});
      setLocation(localizao_usuario);
    }

    verificarLocalProximo();
  }, []);

  let text = "Aguardando permissão para acessar a localização...";
  let coordenadasUsuario = {
    nome: "Localização do usuário",
    latitude: 0,
    longitude: 0,
  };
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    coordenadasUsuario = {
      nome: "Localização do usuário",
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }

  const localidades: LocalidadeItem[] = localidadesData.localidades.map(
    (localidade) => ({
      id: localidade.id,
      latitude: localidade.coordenadas.latitude,
      longitude: localidade.coordenadas.longitude,
      nome: localidade.nome,
    }),
  );

  const localMaisProximo = findNearest(
    {
      latitude: coordenadasUsuario.latitude,
      longitude: coordenadasUsuario.longitude,
    },
    localidades,
  ) as LocalidadeItem | null;

  useEffect(() => {
    if (localMaisProximo?.id) {
      setLocalidadeSelecionada(localMaisProximo.id);
    }
  }, [localMaisProximo?.id]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#644bf1",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff" }}>
          Tela de Setup
        </Text>

        <Text style={{ fontSize: 16, color: "#fff", opacity: 0.9 }}>
          {text}
        </Text>

        <Text style={{ fontSize: 18, color: "#fff", fontWeight: "600" }}>
          Localidade mais próxima: {localMaisProximo?.nome ?? "Não disponível"}
        </Text>

        <Dropdown
          data={localidades}
          labelField="nome"
          valueField="id"
          value={localidadeSelecionada}
          onChange={(item) => setLocalidadeSelecionada(item.id)}
          placeholder="Selecione a localidade"
          selectedTextStyle={{ color: "#111827", fontWeight: "600" }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
          containerStyle={{ width: "100%" }}
        />
      </View>
    </View>
  );
}
