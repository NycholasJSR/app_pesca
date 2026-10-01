import Mapbox, {
  Camera,
  FillLayer,
  LineLayer,
  MapView,
  ShapeSource,
} from "@rnmapbox/maps";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxAccessToken) {
  void Mapbox.setAccessToken(mapboxAccessToken);
} else {
  console.error("EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN não está configurado.");
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Especie = {
  nome_referencia: string;
  total: number;
};

type BlocoRegistro = {
  bloco5: string;
  registros: number;
  sw_lon: number;
  sw_lat: number;
  ne_lon: number;
  ne_lat: number;
};

type BlocoDetalhes = {
  bloco5: string;
  registros: number;
  /** null enquanto a consulta ainda está carregando */
  kg_total: number | null;
  /** Soma do valor estimado no período; null enquanto carrega */
  valor_total: number | null;
  lat: number;
  lon: number;
};

// ─── Constantes ──────────────────────────────────────────────────────────────

/**
 * Coluna de `base_principal` com o valor estimado no período.
 * AJUSTE AQUI se o nome no seu data.db for diferente.
 */
const COL_VALOR_PERIODO = "valor_estimado_periodo";
const COL_KG_PERIODO = "kg_no_periodo";
const BLOCOS_PROIBIDOS = new Set([
  "40A19J",
  "39K19J",
  "39L19J",
  "39K19I",
  "39L19I",
  "39J19I",
  "39J19H",
  "39I19H",
  "39I19G",
  "39H19G",
  "39I19F",
  "39H19F",
  "39G19F",
  "39I19E",
  "39H19E",
  "39G19E",
  "39I19D",
  "39H19D",
  "39G19D",
  "39F19D",
  "39F19E",
  "39A17F",
  "39K17F",
  "39A17G",
  "39K17G",
]);

/**
 * ORDENAÇÃO DAS CAMADAS (blocos abaixo de estradas/rótulos).
 * Só é aplicada se o ID abaixo existir no estilo do mapa; um ID inexistente
 * faz o Mapbox NÃO desenhar a camada (blocos somem). Deixe `null` para desligar.
 * Exemplo p/ Streets: "road-label" (confirme o ID no JSON do estilo).
 */
const CAMADA_ACIMA_DOS_BLOCOS: string | null = null;

/** Só para o estilo Mapbox Standard: "bottom" | "middle" | "top". Null = não usa. */
const SLOT_DOS_BLOCOS: "bottom" | "middle" | "top" | null = null;

const posicaoCamada = {
  ...(CAMADA_ACIMA_DOS_BLOCOS ? { belowLayerID: CAMADA_ACIMA_DOS_BLOCOS } : {}),
  ...(SLOT_DOS_BLOCOS ? { slot: SLOT_DOS_BLOCOS } : {}),
};

const COR_DESTAQUE = "#3f5cff"; // âmbar/dourado

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** 1234.5 → "1.234,50" (sem depender de Intl) */
function formatarNumero(valor: number, casas = 0): string {
  const [inteiro, decimal] = Math.abs(valor).toFixed(casas).split(".");
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sinal = valor < 0 ? "-" : "";
  return decimal ? `${sinal}${comMilhar},${decimal}` : `${sinal}${comMilhar}`;
}

/** Interpola entre azul-claro (baixo) e azul-escuro (alto) */
function intensidadeParaCor(valor: number, max: number): string {
  const t = max > 0 ? valor / max : 0;
  // azul claro → azul royal → azul escuro
  const r = Math.round(173 - t * 150); // 173 → 23
  const g = Math.round(216 - t * 180); // 216 → 36
  const b = Math.round(230 - t * 80); // 230 → 150
  return `rgb(${r},${g},${b})`;
}

/** Bloco SW/NE → GeoJSON Polygon (ordem anti-horária) */
function blocoParaPoligono(b: BlocoRegistro): Feature<Polygon> {
  const { sw_lon, sw_lat, ne_lon, ne_lat, bloco5, registros } = b;
  return {
    type: "Feature",
    id: bloco5,
    properties: { registros, codigo: bloco5 },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [sw_lon, sw_lat],
          [ne_lon, sw_lat],
          [ne_lon, ne_lat],
          [sw_lon, ne_lat],
          [sw_lon, sw_lat],
        ],
      ],
    },
  };
}

function Metrica({ valor, legenda }: { valor: string; legenda: string }) {
  return (
    <View style={styles.metrica}>
      <Text style={styles.metricaValor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text style={styles.metricaLegenda}>{legenda}</Text>
    </View>
  );
}

// ─── Sub-componente interno (usa o SQLiteContext da própria tela) ─────────────

function ConteudoPaginaInicial() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [municipios, setMunicipios] = useState<string[]>([]);
  const [municipioSelecionado, setMunicipiSelecionado] = useState<
    string | null
  >(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);

  const [especies, setEspecies] = useState<Especie[]>([]);
  const [carregandoEspecies, setCarregandoEspecies] = useState(false);

  const [especieSelecionada, setEspecieSelecionada] = useState<string | null>(
    null,
  );
  const [blocos, setBlocos] = useState<BlocoRegistro[]>([]);
  const [carregandoBlocos, setCarregandoBlocos] = useState(false);
  const [mapModalVisivel, setMapModalVisivel] = useState(false);

  // Bloco tocado no mapa + detalhes do card flutuante
  const [blocoSelecionado, setBlocoSelecionado] =
    useState<BlocoDetalhes | null>(null);
  const [carregandoDetalhesBloco, setCarregandoDetalhesBloco] = useState(false);
  const requisicaoDetalhesRef = useRef(0); // evita resposta antiga sobrescrever a nova
  const ultimoToqueBlocoRef = useRef(0); // evita que o toque no bloco também "desmarque" via MapView

  // Câmera do mapa: centrada na média dos blocos
  const [cameraBounds, setCameraBounds] = useState<{
    sw: [number, number];
    ne: [number, number];
  } | null>(null);

  // ── Carrega municípios ────────────────────────────────────────────────────
  useEffect(() => {
    async function carregar() {
      const rows = await db.getAllAsync<{ municipio: string }>(
        "SELECT municipio FROM municipios ORDER BY municipio;",
      );
      setMunicipios(rows.map((r) => r.municipio));
    }
    carregar();
  }, [db]);

  // ── Carrega espécies ao selecionar município ──────────────────────────────
  const carregarEspecies = useCallback(
    async (municipio: string) => {
      setCarregandoEspecies(true);
      setEspecies([]);
      setEspecieSelecionada(null);
      setBlocos([]);
      setBlocoSelecionado(null);
      try {
        const rows = await db.getAllAsync<Especie>(
          `SELECT nome_referencia, COUNT(*) AS total
             FROM base_principal
            WHERE municipio = ?
              AND nome_referencia IS NOT NULL
            GROUP BY nome_referencia
            ORDER BY total DESC
            LIMIT 12;`,
          [municipio],
        );
        setEspecies(rows);
      } finally {
        setCarregandoEspecies(false);
      }
    },
    [db],
  );

  // ── Carrega blocos ao selecionar espécie ─────────────────────────────────
  const carregarBlocos = useCallback(
    async (municipio: string, especie: string) => {
      setCarregandoBlocos(true);
      setBlocos([]);
      setBlocoSelecionado(null);
      try {
        const rows = await db.getAllAsync<BlocoRegistro>(
          `SELECT
              bp.bloco5,
              COUNT(*) AS registros,
              b.sw_lon,
              b.sw_lat,
              b.ne_lon,
              b.ne_lat
           FROM base_principal bp
           INNER JOIN blocos b ON bp.bloco5 = b.codigo
           WHERE bp.municipio = ?
             AND bp.nome_referencia = ?
           GROUP BY bp.bloco5
           ORDER BY registros DESC;`,
          [municipio, especie],
        );
        const blocosVisiveis = rows.filter(
          (row) => !BLOCOS_PROIBIDOS.has(row.bloco5.split("-")[0]),
        );
        setBlocos(blocosVisiveis);

        // Calcula bounds para centralizar o mapa
        if (blocosVisiveis.length > 0) {
          const minLon = Math.min(...blocosVisiveis.map((r) => r.sw_lon));
          const minLat = Math.min(...blocosVisiveis.map((r) => r.sw_lat));
          const maxLon = Math.max(...blocosVisiveis.map((r) => r.ne_lon));
          const maxLat = Math.max(...blocosVisiveis.map((r) => r.ne_lat));
          setCameraBounds({
            sw: [minLon - 0.5, minLat - 0.5],
            ne: [maxLon + 0.5, maxLat + 0.5],
          });
        }
      } finally {
        setCarregandoBlocos(false);
      }
    },
    [db],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  function selecionarMunicipio(m: string) {
    setMunicipiSelecionado(m);
    setDropdownAberto(false);
    carregarEspecies(m);
  }

  function selecionarEspecie(nome: string) {
    setEspecieSelecionada(nome);
    if (municipioSelecionado) {
      carregarBlocos(municipioSelecionado, nome);
      setMapModalVisivel(true);
    }
  }

  function fecharMapa() {
    setMapModalVisivel(false);
    setBlocoSelecionado(null);
  }

  function desmarcarBloco() {
    requisicaoDetalhesRef.current++;
    setBlocoSelecionado(null);
    setCarregandoDetalhesBloco(false);
  }

  async function selecionarBloco(codigo: string) {
    if (!municipioSelecionado || !especieSelecionada) return;
    const bloco = blocos.find((b) => b.bloco5 === codigo);
    if (!bloco) return;

    const reqId = ++requisicaoDetalhesRef.current;

    // Destaca o bloco e abre o card imediatamente; métricas entram em seguida
    setBlocoSelecionado({
      bloco5: codigo,
      registros: bloco.registros,
      kg_total: null,
      valor_total: null,
      lat: (bloco.sw_lat + bloco.ne_lat) / 2,
      lon: (bloco.sw_lon + bloco.ne_lon) / 2,
    });
    setCarregandoDetalhesBloco(true);

    try {
      const row = await db.getFirstAsync<{
        registros: number;
        kg_total: number | null;
        valor_total: number | null;
      }>(
        `SELECT
            COUNT(*) AS registros,
            SUM(${COL_KG_PERIODO}) AS kg_total,
            SUM(${COL_VALOR_PERIODO}) AS valor_total
           FROM base_principal
          WHERE bloco5 = ?
            AND municipio = ?
            AND nome_referencia = ?;`,
        [codigo, municipioSelecionado, especieSelecionada],
      );
      if (reqId !== requisicaoDetalhesRef.current) return;
      setBlocoSelecionado((prev) =>
        prev && prev.bloco5 === codigo
          ? {
              ...prev,
              registros: row?.registros ?? prev.registros,
              kg_total: row?.kg_total ?? 0,
              valor_total: row?.valor_total ?? 0,
            }
          : prev,
      );
    } catch (e) {
      console.warn("Erro ao carregar detalhes do bloco", e);
    } finally {
      if (reqId === requisicaoDetalhesRef.current) {
        setCarregandoDetalhesBloco(false);
      }
    }
  }

  // ── GeoJSON ──────────────────────────────────────────────────────────────
  const maxRegistros = blocos.length > 0 ? blocos[0].registros : 1;

  const geojson: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: blocos.map((b) => blocoParaPoligono(b)),
  };

  // Expressão step do Mapbox para colorir por quantidade de registros
  // Usamos uma escala de azul claro → azul escuro
  const stops = (() => {
    if (blocos.length === 0) return null;
    const passos = 5;
    const steps: (number | string)[] = [];
    for (let i = 0; i < passos; i++) {
      const limiar = Math.round((maxRegistros / passos) * i);
      const cor = intensidadeParaCor(limiar, maxRegistros);
      steps.push(limiar, cor);
    }
    // Mapbox step: ["step", ["get", "registros"], fallback, threshold1, color1, ...]
    return ["step", ["get", "registros"], "#b3e5fc", ...steps] as unknown[];
  })();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View
      style={[
        styles.container,
        { paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      {/* ── Cabeçalho ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>🎣 Pesca ES</Text>
        <Text style={styles.headerSubtitulo}>
          Espécies capturadas por município
        </Text>
      </View>

      {/* ── Seletor de município ── */}
      <View style={styles.selecionadorContainer}>
        <Text style={styles.label}>Município de referência</Text>
        <TouchableOpacity
          style={styles.dropdownBotao}
          onPress={() => setDropdownAberto(!dropdownAberto)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownBotaoTexto}>
            {municipioSelecionado ?? "Selecione um município"}
          </Text>
          <Text style={styles.dropdownSeta}>{dropdownAberto ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {dropdownAberto && (
          <View style={styles.dropdownLista}>
            <FlatList
              data={municipios}
              keyExtractor={(item) => item}
              style={{ maxHeight: 220 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    municipioSelecionado === item && styles.dropdownItemAtivo,
                  ]}
                  onPress={() => selecionarMunicipio(item)}
                >
                  <Text
                    style={[
                      styles.dropdownItemTexto,
                      municipioSelecionado === item &&
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

      {/* ── Lista de espécies ── */}
      {municipioSelecionado && (
        <View style={styles.especiesContainer}>
          <Text style={styles.especiesTitulo}>
            Principais espécies em{" "}
            <Text style={{ fontWeight: "bold" }}>{municipioSelecionado}</Text>
          </Text>
          <Text style={styles.especiesHint}>
            Toque em uma espécie para ver os blocos no mapa
          </Text>

          {carregandoEspecies ? (
            <ActivityIndicator
              size="large"
              color="#083c69"
              style={{ marginTop: 24 }}
            />
          ) : especies.length === 0 ? (
            <Text style={styles.semDados}>
              Nenhuma espécie encontrada para este município.
            </Text>
          ) : (
            <FlatList
              data={especies}
              keyExtractor={(item) => item.nome_referencia}
              contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.especieCard}
                  onPress={() => selecionarEspecie(item.nome_referencia)}
                  activeOpacity={0.75}
                >
                  <View style={styles.especieRankBadge}>
                    <Text style={styles.especieRankTexto}>#{index + 1}</Text>
                  </View>
                  <View style={styles.especieInfo}>
                    <Text style={styles.especieNome}>
                      {item.nome_referencia}
                    </Text>
                    <Text style={styles.especieRegistros}>
                      {item.total} registro{item.total !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Text style={styles.especieSetaDireita}>›</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* ── Modal do Mapa ── */}
      <Modal
        visible={mapModalVisivel}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={fecharMapa}
      >
        <View style={styles.modalContainer}>
          {/* Cabeçalho do modal (respeita notch / barra de status) */}
          <View
            style={[
              styles.modalHeader,
              {
                paddingTop: insets.top + 10,
                paddingLeft: 14 + insets.left,
                paddingRight: 14 + insets.right,
              },
            ]}
          >
            <Pressable onPress={fecharMapa} style={styles.modalFecharBotao}>
              <Text style={styles.modalFecharTexto}>← Voltar</Text>
            </Pressable>
            <View style={styles.modalTituloContainer}>
              <Text style={styles.modalTitulo} numberOfLines={1}>
                {especieSelecionada}
              </Text>
              <Text style={styles.modalSubtitulo}>
                {municipioSelecionado} · {blocos.length} bloco
                {blocos.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* Mapa */}
          {carregandoBlocos ? (
            <View style={styles.carregandoMapa}>
              <ActivityIndicator size="large" color="#083c69" />
              <Text style={styles.carregandoTexto}>Carregando mapa...</Text>
            </View>
          ) : blocos.length === 0 ? (
            <View style={styles.carregandoMapa}>
              <Text style={styles.semDados}>
                Nenhum bloco permitido disponível para esta seleção.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.mapaWrapper}>
                <MapView
                  style={styles.mapa}
                  logoEnabled={false}
                  onPress={() => {
                    // Ignora o toque que acabou de selecionar um bloco
                    if (Date.now() - ultimoToqueBlocoRef.current < 400) return;
                    desmarcarBloco();
                  }}
                >
                  {cameraBounds && (
                    <Camera
                      bounds={{
                        sw: cameraBounds.sw,
                        ne: cameraBounds.ne,
                        paddingTop: 60,
                        paddingBottom: 60,
                        paddingLeft: 40,
                        paddingRight: 40,
                      }}
                      animationMode="flyTo"
                      animationDuration={800}
                    />
                  )}

                  <ShapeSource
                    id="blocos-source"
                    shape={geojson}
                    onPress={(event) => {
                      const codigo = event.features?.[0]?.properties?.codigo;
                      if (typeof codigo !== "string") return;
                      ultimoToqueBlocoRef.current = Date.now();
                      selecionarBloco(codigo);
                    }}
                  >
                    <FillLayer
                      id="blocos-fill"
                      {...posicaoCamada}
                      style={{
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        fillColor: stops ? (stops as any) : "#b3e5fc",
                        fillOpacity: 0.65,
                      }}
                    />
                    {/* Borda dos blocos */}
                    <LineLayer
                      id="blocos-borda"
                      {...posicaoCamada}
                      style={{
                        lineColor: "#083c69",
                        lineWidth: 1,
                        lineOpacity: 0.5,
                      }}
                    />
                    {/* Contorno do bloco selecionado */}
                    <LineLayer
                      id="bloco-selecionado-destaque"
                      {...posicaoCamada}
                      filter={[
                        "==",
                        ["get", "codigo"],
                        blocoSelecionado?.bloco5 ?? "",
                      ]}
                      style={{
                        lineColor: COR_DESTAQUE,
                        lineWidth: 4,
                        lineOpacity: 1,
                      }}
                    />
                  </ShapeSource>
                </MapView>

                {/* Card flutuante do bloco */}
                {blocoSelecionado && (
                  <View
                    pointerEvents="box-none"
                    style={[
                      styles.cardBlocoPosicao,
                      {
                        left: 12 + insets.left,
                        right: 12 + insets.right,
                      },
                    ]}
                  >
                    <View style={styles.cardBloco}>
                      <View style={styles.cardBlocoTopo}>
                        <View style={styles.cardBlocoTitulos}>
                          <Text style={styles.cardBlocoTitulo}>
                            Bloco {blocoSelecionado.bloco5}
                          </Text>
                          <Text
                            style={styles.cardBlocoEspecie}
                            numberOfLines={1}
                          >
                            {especieSelecionada}
                          </Text>
                        </View>
                        <Pressable
                          onPress={desmarcarBloco}
                          hitSlop={12}
                          style={styles.cardBlocoFechar}
                          accessibilityRole="button"
                          accessibilityLabel="Fechar detalhes do bloco"
                        >
                          <Text style={styles.cardBlocoFecharTexto}>✕</Text>
                        </Pressable>
                      </View>

                      <View style={styles.cardBlocoMetricas}>
                        <Metrica
                          valor={formatarNumero(blocoSelecionado.registros)}
                          legenda={
                            blocoSelecionado.registros === 1
                              ? "captura registrada"
                              : "capturas registradas"
                          }
                        />
                        <View style={styles.metricaDivisor} />
                        <Metrica
                          valor={
                            blocoSelecionado.kg_total === null
                              ? "…"
                              : formatarNumero(blocoSelecionado.kg_total, 1)
                          }
                          legenda="kg estimados"
                        />
                        <View style={styles.metricaDivisor} />
                        <Metrica
                          valor={
                            blocoSelecionado.valor_total === null
                              ? "…"
                              : `R$ ${formatarNumero(blocoSelecionado.valor_total, 2)}`
                          }
                          legenda="valor estimado no período"
                        />
                      </View>

                      <View style={styles.cardBlocoRodape}>
                        <Text style={styles.cardBlocoCoord}>
                          Coord. aprox.: {blocoSelecionado.lat.toFixed(3)}°,{" "}
                          {blocoSelecionado.lon.toFixed(3)}°
                        </Text>
                        {carregandoDetalhesBloco && (
                          <ActivityIndicator size="small" color="#083c69" />
                        )}
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Legenda (respeita barra de gestos) */}
              <View
                style={[
                  styles.legenda,
                  {
                    paddingBottom: Math.max(insets.bottom, 12),
                    paddingLeft: 20 + insets.left,
                    paddingRight: 20 + insets.right,
                  },
                ]}
              >
                <Text style={styles.legendaTitulo}>Registros de captura</Text>
                <View style={styles.legendaGradiente}>
                  {[0.1, 0.3, 0.5, 0.7, 1.0].map((t) => (
                    <View
                      key={t}
                      style={[
                        styles.legendaQuadrado,
                        {
                          backgroundColor: intensidadeParaCor(
                            t * maxRegistros,
                            maxRegistros,
                          ),
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.legendaRotulos}>
                  <Text style={styles.legendaRotulo}>Menos</Text>
                  <Text style={styles.legendaRotulo}>Mais</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Componente raiz (configura o SQLiteProvider para o data.db) ──────────────

export default function PaginaInicial() {
  return (
    <SQLiteProvider
      databaseName="data.db"
      assetSource={{ assetId: require("@/assets/data.db") }}
      useSuspense
    >
      <Suspense
        fallback={
          <View style={styles.fallback}>
            <ActivityIndicator size="large" color="#083c69" />
            <Text style={styles.fallbackTexto}>Carregando base de dados…</Text>
          </View>
        }
      >
        <ConteudoPaginaInicial />
      </Suspense>
    </SQLiteProvider>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Layout geral
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  fallbackTexto: {
    color: "#083c69",
    fontSize: 16,
  },

  // Cabeçalho
  header: {
    backgroundColor: "#083c69",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitulo: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
  headerSubtitulo: {
    color: "#a8c6e8",
    fontSize: 13,
    marginTop: 2,
  },

  // Seletor de município
  selecionadorContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  label: {
    color: "#2c3e50",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#083c69",
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownBotaoTexto: {
    color: "#2c3e50",
    fontSize: 15,
    flex: 1,
  },
  dropdownSeta: {
    color: "#083c69",
    fontSize: 12,
    marginLeft: 8,
  },
  dropdownLista: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d0dce8",
    marginTop: 4,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  dropdownItemAtivo: {
    backgroundColor: "#e8f0fa",
  },
  dropdownItemTexto: {
    color: "#2c3e50",
    fontSize: 15,
  },
  dropdownItemTextoAtivo: {
    color: "#083c69",
    fontWeight: "bold",
  },

  // Lista de espécies
  especiesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  especiesTitulo: {
    fontSize: 15,
    color: "#2c3e50",
    marginBottom: 2,
  },
  especiesHint: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 12,
    fontStyle: "italic",
  },
  especieCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  especieRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#083c69",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  especieRankTexto: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  especieInfo: {
    flex: 1,
  },
  especieNome: {
    color: "#1a252f",
    fontSize: 15,
    fontWeight: "600",
  },
  especieRegistros: {
    color: "#7f8c8d",
    fontSize: 12,
    marginTop: 2,
  },
  especieSetaDireita: {
    color: "#083c69",
    fontSize: 24,
    marginLeft: 8,
  },
  semDados: {
    color: "#7f8c8d",
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
  },

  // Modal do mapa
  modalContainer: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#083c69",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  modalFecharBotao: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  modalFecharTexto: {
    color: "#a8c6e8",
    fontSize: 15,
    fontWeight: "600",
  },
  modalTituloContainer: {
    flex: 1,
  },
  modalTitulo: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  modalSubtitulo: {
    color: "#a8c6e8",
    fontSize: 12,
    marginTop: 1,
  },
  mapaWrapper: {
    flex: 1,
  },
  mapa: {
    flex: 1,
  },
  carregandoMapa: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  carregandoTexto: {
    color: "#083c69",
    fontSize: 15,
  },

  // Card flutuante do bloco
  cardBlocoPosicao: {
    position: "absolute",
    bottom: 12,
  },
  cardBloco: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: COR_DESTAQUE,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardBlocoTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  cardBlocoTitulos: {
    flex: 1,
  },
  cardBlocoTitulo: {
    color: "#083c69",
    fontSize: 17,
    fontWeight: "bold",
  },
  cardBlocoEspecie: {
    color: "#566573",
    fontSize: 13,
    marginTop: 2,
  },
  cardBlocoFechar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eef2f7",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBlocoFecharTexto: {
    color: "#566573",
    fontSize: 13,
    fontWeight: "bold",
  },
  cardBlocoMetricas: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 14,
  },
  metrica: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  metricaValor: {
    color: "#1a252f",
    fontSize: 22,
    fontWeight: "bold",
  },
  metricaLegenda: {
    color: "#7f8c8d",
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  metricaDivisor: {
    width: 1,
    backgroundColor: "#e3eaf2",
  },
  cardBlocoRodape: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    minHeight: 18,
  },
  cardBlocoCoord: {
    color: "#95a5a6",
    fontSize: 11,
  },

  // Legenda
  legenda: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#d0dce8",
    elevation: 4,
  },
  legendaTitulo: {
    fontSize: 12,
    color: "#566573",
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  legendaGradiente: {
    flexDirection: "row",
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    gap: 2,
  },
  legendaQuadrado: {
    flex: 1,
    borderRadius: 4,
  },
  legendaRotulos: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  legendaRotulo: {
    fontSize: 11,
    color: "#7f8c8d",
  },
});
