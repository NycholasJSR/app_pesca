import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { configuracaoFoiConcluida } from "@/storage/configuracao";

export default function Index() {
  const [carregando, setCarregando] = useState(true);
  const [configurado, setConfigurado] = useState(false);

  useEffect(() => {
    async function verificarConfiguracao() {
      const resultado = await configuracaoFoiConcluida();

      setConfigurado(resultado);
      setCarregando(false);
    }

    verificarConfiguracao();
  }, []);

  if (carregando) {
    return null;
  }

  if (configurado) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
