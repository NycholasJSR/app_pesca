import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type RegistroTeste = {
  ano: number | null;
  mes: number | null;
  localidade: string | null;
  local_descarga: string | null;
  nome_referencia: string | null;
  kg_no_periodo: number | null;
  valor_estimado_no_periodo: number | null;
};

export default function Testes() {
  const db = useSQLiteContext();
  const [registros, setRegistros] = useState<RegistroTeste[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarRegistros() {
      try {
        const dados = await db.getAllAsync<RegistroTeste>(
          `SELECT ano, mes, localidade, local_descarga,
            nome_referencia, kg_no_periodo, valor_estimado_no_periodo
           FROM base_pesca_tratada
           LIMIT 5`,
        );
        setRegistros(dados);
      } catch {
        setErro("Não foi possível ler os dados da base.");
      } finally {
        setCarregando(false);
      }
    }

    carregarRegistros();
  }, [db]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {carregando && <Text>Carregando registros...</Text>}
      {erro && <Text style={styles.erro}>{erro}</Text>}
      {!carregando && !erro && registros.length === 0 && (
        <Text>Nenhum registro encontrado.</Text>
      )}

      {registros.map((registro, index) => (
        <View
          key={`${registro.ano}-${registro.mes}-${index}`}
          style={styles.card}
        >
          <Text style={styles.cardTitulo}>
            {registro.nome_referencia || "Espécie não informada"}
          </Text>
          <Text>Localidade: {registro.localidade || "Não informada"}</Text>
          <Text>Descarga: {registro.local_descarga || "Não informada"}</Text>
          <Text>
            Período: {registro.mes ?? "-"}/{registro.ano ?? "-"}
          </Text>
          <Text>
            Kilos pescados: {registro.kg_no_periodo?.toFixed(2) ?? "-"} kg
          </Text>
          <Text>
            Valor estimado: R${" "}
            {registro.valor_estimado_no_periodo?.toFixed(2) ?? "-"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  titulo: {
    color: "#083c69",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitulo: {
    color: "#566573",
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#f5d520",
    borderRadius: 10,
    gap: 4,
    padding: 14,
  },
  cardTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  erro: {
    color: "#b42318",
  },
});
