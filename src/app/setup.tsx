import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {findNearest} from "geolib"
import {localidades} from "@/assets/localidades.json"

export default function TelaSetup() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    const coodenadasUsuario = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    
    const localMaisProximo = findNearest(coodenadasUsuario, localidades.map((local) =>)) 
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#644bf1",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff" }}>
        Tela de Setup
      </Text>
      <Text style={{ color: "#fff" }}>
        Aqui você pode configurar as opções do aplicativo.
      </Text>

      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
        {text}
      </Text>
    </View>
  );
}
