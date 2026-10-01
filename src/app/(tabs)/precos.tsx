import { CardPrecos } from "@/components/cardPrecos";
import {
  buscarDadosEspecie,
  buscarEspeciesDisponiveis,
  type EstimativaPreco,
} from "@/services/precosService";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { Suspense, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function PrecosContent() {
  const db = useSQLiteContext();

  const [especies, setEspecies] = useState<string[]>([]);
  const [especieSelecionada, setEspecieSelecionada] = useState<string | null>(
    null,
  );
  const [dropdownAberto, setDropdownAberto] = useState(false);

  const [estimativa, setEstimativa] = useState<EstimativaPreco | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(false);

  const mesAtual = new Date().getMonth() + 1; // 1-12

  useEffect(() => {
    async function loadEspecies() {
      const lista = await buscarEspeciesDisponiveis(db);
      setEspecies(lista);
      if (lista.length > 0) {
        // Seleciona a primeira como padrão
        setEspecieSelecionada(lista[0]);
      }
    }
    loadEspecies();
  }, [db]);

  useEffect(() => {
    async function carregarDados() {
      if (!especieSelecionada) return;
      setCarregandoDados(true);
      try {
        const dados = await buscarDadosEspecie(
          db,
          especieSelecionada,
          mesAtual,
        );
        setEstimativa(dados);
      } catch (e) {
        console.error(e);
      } finally {
        setCarregandoDados(false);
      }
    }
    carregarDados();
  }, [db, especieSelecionada, mesAtual]);

  return (
    <View style={styles.container}>
      {/* Cabeçalho / Dropdown */}
      <View style={styles.header}>
        <Text style={styles.label}>SELECIONAR ESPÉCIE</Text>
        <TouchableOpacity
          style={styles.dropdownBotao}
          onPress={() => setDropdownAberto(!dropdownAberto)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownBotaoTexto}>
            {especieSelecionada ?? "Selecione..."}
          </Text>
          <Ionicons
            name={dropdownAberto ? "chevron-up" : "chevron-down"}
            size={20}
            color="#083c69"
          />
        </TouchableOpacity>

        {dropdownAberto && (
          <View style={styles.dropdownLista}>
            <FlatList
              data={especies}
              keyExtractor={(item) => item}
              style={{ maxHeight: 220 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    especieSelecionada === item && styles.dropdownItemAtivo,
                  ]}
                  onPress={() => {
                    setEspecieSelecionada(item);
                    setDropdownAberto(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemTexto,
                      especieSelecionada === item &&
                        styles.dropdownItemTextoAtivo,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.aviso}>
          <Text style={styles.dropdownItemTexto}>
            As informações contidas nesse aplicativo não refletem ao preço atual
            dos peixes, apenas estimativas baseadas em dados históricos.
          </Text>

          <Text style={styles.dropdownItemTexto}>
            Algumas espécies não possuem registros suficientes para estimar
            algum valor.
          </Text>
        </View>
        {carregandoDados ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#083c69" />
            <Text style={styles.loadingTexto}>Calculando estimativa...</Text>
          </View>
        ) : estimativa && especieSelecionada ? (
          <CardPrecos
            especie={especieSelecionada}
            estimativa={estimativa}
            mesAtual={mesAtual}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

export default function Precos() {
  return (
    <SQLiteProvider
      databaseName="data.db"
      assetSource={{ assetId: require("@/assets/data.db") }}
      useSuspense
    >
      <Suspense
        fallback={
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#083c69" />
            <Text style={styles.loadingTexto}>
              Carregando banco de dados...
            </Text>
          </View>
        }
      >
        <PrecosContent />
      </Suspense>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  aviso: {
    backgroundColor: "#fdff76",
    padding: 12,
    borderRadius: 10,
    borderColor: "#f5d93b",
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
    opacity: 0.8,
  },
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  label: {
    color: "#2c3e50",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dropdownBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8E3DD",
    paddingHorizontal: 14,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownBotaoTexto: {
    color: "#18382E",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  dropdownLista: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8E3DD",
    marginTop: 4,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F7F5",
  },
  dropdownItemAtivo: {
    backgroundColor: "#E2F7EB",
  },
  dropdownItemTexto: {
    color: "#42675B",
    fontSize: 15,
  },
  dropdownItemTextoAtivo: {
    color: "#18382E",
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 12,
  },
  loadingTexto: {
    color: "#083c69",
    fontSize: 15,
  },
});
