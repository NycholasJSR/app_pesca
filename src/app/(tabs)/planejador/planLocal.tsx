import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ResumoLocal = {
  nome_local: string;
  total_registros: number;
  total_kg: number | null;
};

type ItemRanqueado = {
  nome: string;
  total_registros: number;
  total_kg: number | null;
};

type ResultadoPesquisa = ResumoLocal & {
  peixes: ItemRanqueado[];
  aparelhos: ItemRanqueado[];
};

function formatarQuilos(quantidade: number | null) {
  return (quantidade ?? 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });
}

export default function PlanLocal() {
  const db = useSQLiteContext();
  const [textoPesquisa, setTextoPesquisa] = useState("");
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [resultado, setResultado] = useState<ResultadoPesquisa | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function carregarSugestoes() {
      const termo = textoPesquisa.trim();

      if (!termo) {
        setSugestoes([]);
        return;
      }

      try {
        const resultados = await db.getAllAsync<{ nome_local: string }>(
          `SELECT DISTINCT COALESCE(NULLIF(TRIM(localidade), ''),
                                    NULLIF(TRIM(municipio), ''),
                                    'Localidade não informada') AS nome_local
             FROM base_dados_viagens
            WHERE lower(COALESCE(localidade, municipio, '')) LIKE ?
            ORDER BY nome_local
            LIMIT 8`,
          [`%${termo.toLowerCase()}%`],
        );

        if (!cancelado) {
          setSugestoes(
            resultados
              .map((item) => item.nome_local)
              .filter(
                (item) => typeof item === "string" && item.trim().length > 0,
              ),
          );
        }
      } catch (error) {
        console.log("Erro ao buscar sugestões de localidades:", error);

        if (!cancelado) {
          setSugestoes([]);
        }
      }
    }

    const timeout = setTimeout(carregarSugestoes, 250);

    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [db, textoPesquisa]);

  function atualizarPesquisa(texto: string) {
    setTextoPesquisa(texto);
    setResultado(null);
    setMensagem(null);
  }

  async function pesquisar() {
    const local = textoPesquisa.trim();

    if (!local) {
      setResultado(null);
      setMensagem(
        "Digite ou selecione o nome de uma localidade para pesquisar.",
      );
      return;
    }

    setCarregando(true);
    setResultado(null);
    setMensagem(null);
    setSugestoes([]);

    try {
      const parametros = [local.toLowerCase()];
      const filtroLocal = `lower(COALESCE(NULLIF(TRIM(localidade), ''),
                                           NULLIF(TRIM(municipio), ''),
                                           'Localidade não informada')) = ?`;
      const resumo = await db.getFirstAsync<ResumoLocal>(
        `SELECT COALESCE(NULLIF(TRIM(localidade), ''),
                         NULLIF(TRIM(municipio), ''),
                         'Localidade não informada') AS nome_local,
                COUNT(*) AS total_registros,
                COALESCE(SUM(kg_no_periodo), 0) AS total_kg
           FROM base_dados_viagens
          WHERE ${filtroLocal}
          GROUP BY nome_local
          LIMIT 1`,
        parametros,
      );

      if (!resumo) {
        setMensagem("Não encontramos registros para essa localidade.");
        return;
      }

      const [peixes, aparelhos] = await Promise.all([
        db.getAllAsync<ItemRanqueado>(
          `SELECT COALESCE(NULLIF(TRIM(nome_referencia), ''),
                           'Pescado não informado') AS nome,
                  COUNT(*) AS total_registros,
                  COALESCE(SUM(kg_no_periodo), 0) AS total_kg
             FROM base_dados_viagens
            WHERE ${filtroLocal}
            GROUP BY nome
            ORDER BY total_registros DESC, total_kg DESC, nome ASC
            LIMIT 3`,
          parametros,
        ),
        db.getAllAsync<ItemRanqueado>(
          `SELECT COALESCE(NULLIF(TRIM(aparelho_pesca_referencia), ''),
                           'Aparelho não informado') AS nome,
                  COUNT(*) AS total_registros,
                  COALESCE(SUM(kg_no_periodo), 0) AS total_kg
             FROM base_dados_viagens
            WHERE ${filtroLocal}
            GROUP BY nome
            ORDER BY total_registros DESC, total_kg DESC, nome ASC
            LIMIT 3`,
          parametros,
        ),
      ]);

      setResultado({ ...resumo, peixes, aparelhos });
    } catch (error) {
      console.log("Erro ao pesquisar dados da localidade:", error);
      setMensagem("Não foi possível consultar os dados. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Planejador - Local</Text>

      <TextInput
        placeholder="Digite o nome da localidade"
        placeholderTextColor="#5b6b7a"
        onChangeText={atualizarPesquisa}
        onSubmitEditing={pesquisar}
        returnKeyType="search"
        value={textoPesquisa}
        clearButtonMode="always"
        style={styles.input}
      />

      {sugestoes.length > 0 && (
        <View style={styles.listaContainer}>
          {sugestoes.map((item, index) => (
            <Pressable
              key={`${item}-${index}`}
              onPress={() => {
                atualizarPesquisa(item);
                setSugestoes([]);
              }}
              style={styles.itemSugerido}
            >
              <Text style={styles.itemTexto}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={carregando}
        onPress={pesquisar}
        style={({ pressed }) => [
          styles.botao,
          (pressed || carregando) && styles.botaoPressionado,
        ]}
      >
        {carregando ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.botaoTexto}>Pesquisar</Text>
        )}
      </Pressable>

      {mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}

      {resultado && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>{resultado.nome_local}</Text>
          <Text style={styles.resumo}>
            {resultado.total_registros} registros encontrados ·{" "}
            {formatarQuilos(resultado.total_kg)} kg registrados
          </Text>

          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>
              Principais peixes registrados
            </Text>
            {resultado.peixes.map((peixe, index) => (
              <View key={peixe.nome} style={styles.linha}>
                <Text style={styles.posicao}>{index + 1}</Text>
                <View style={styles.linhaConteudo}>
                  <Text style={styles.linhaTitulo}>{peixe.nome}</Text>
                  <Text style={styles.linhaDetalhe}>
                    {peixe.total_registros} registros ·{" "}
                    {formatarQuilos(peixe.total_kg)} kg
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Aparelhos mais utilizados</Text>
            {resultado.aparelhos.map((aparelho, index) => (
              <View key={aparelho.nome} style={styles.linha}>
                <Text style={styles.posicao}>{index + 1}</Text>
                <View style={styles.linhaConteudo}>
                  <Text style={styles.linhaTitulo}>{aparelho.nome}</Text>
                  <Text style={styles.linhaDetalhe}>
                    Usado em {aparelho.total_registros} registros ·{" "}
                    {formatarQuilos(aparelho.total_kg)} kg
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  titulo: { fontSize: 18, fontWeight: "700", color: "#083c69" },
  input: {
    borderWidth: 1,
    borderColor: "#d5d9de",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    color: "#081a2c",
  },
  listaContainer: {
    maxHeight: 220,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dfe7f0",
    overflow: "hidden",
  },
  itemSugerido: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5edf5",
  },
  itemTexto: { color: "#12304a", fontSize: 15 },
  botao: {
    alignItems: "center",
    backgroundColor: "#083c69",
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  botaoPressionado: { opacity: 0.72 },
  botaoTexto: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  mensagem: { color: "#52616f", textAlign: "center" },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe7f0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  cardTitulo: { color: "#083c69", fontSize: 22, fontWeight: "700" },
  resumo: { color: "#52616f", fontSize: 14 },
  secao: { gap: 8 },
  secaoTitulo: { color: "#12304a", fontSize: 16, fontWeight: "700" },
  linha: { alignItems: "center", flexDirection: "row", gap: 10 },
  posicao: {
    backgroundColor: "#e6f2fb",
    borderRadius: 14,
    color: "#083c69",
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  linhaConteudo: { flex: 1 },
  linhaTitulo: { color: "#081a2c", fontSize: 15, fontWeight: "600" },
  linhaDetalhe: { color: "#64748b", fontSize: 13, marginTop: 2 },
});
