import type { EstimativaPreco } from "@/services/precosService";
import {
  formatarMoeda,
  MESES_ABREVIADOS,
  MESES_EXTENSOS,
} from "@/utils/formatadores";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface CardPrecosProps {
  especie: string;
  estimativa: EstimativaPreco;
  mesAtual: number; // 1-12
}

export function CardPrecos({ especie, estimativa, mesAtual }: CardPrecosProps) {
  const [mesSelecionado, setMesSelecionado] = useState<number>(mesAtual);

  const {
    precoTipico,
    faixaHabitual,
    qtdRegistros,
    confiabilidade,
    corConfiabilidade,
    fonte,
    anosHistoricos,
    historicoMensal,
    topMeses,
    cpue,
    precoPonderado,
  } = estimativa;

  if (qtdRegistros === 0 || !precoTipico) {
    return (
      <View style={styles.card}>
        <View style={styles.cabecalhoVazio}>
          <Text style={styles.nomePeixe}>{especie}</Text>
          <Text style={styles.rotulo}>SEM DADOS SUFICIENTES</Text>
        </View>
        <View style={styles.detalhes}>
          <Text style={{ color: "#52665B", fontSize: 13 }}>
            Não há informações históricas suficientes para estimar o preço desta
            espécie no momento.
          </Text>
        </View>
      </View>
    );
  }

  // Prepara dados do gráfico
  const maxPreco = Math.max(...historicoMensal.map((h) => h.mediana));

  const pontoSelecionado = historicoMensal.find(
    (h) => h.mes === mesSelecionado,
  ) || { mediana: 0, p25: 0, p75: 0, mes: mesSelecionado };
  const hasDataForSelectedMonth = pontoSelecionado.mediana > 0;

  const anosLabel =
    anosHistoricos.length > 1
      ? `${Math.min(...anosHistoricos)}–${Math.max(...anosHistoricos)}`
      : anosHistoricos[0]?.toString() || "";

  return (
    <View style={styles.card}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <View style={styles.informacoes}>
          <Text style={styles.rotulo}>PREÇO TÍPICO</Text>
          <Text style={styles.nomePeixe}>{especie}</Text>
          <View
            style={[
              styles.linhaConfiabilidade,
              { backgroundColor: corConfiabilidade + "20" },
            ]}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={corConfiabilidade}
            />
            <Text
              style={[styles.textoConfiabilidade, { color: corConfiabilidade }]}
            >
              {confiabilidade}
            </Text>
          </View>
        </View>

        <View style={styles.precoEIndicador}>
          <Text style={styles.preco}>{formatarMoeda(precoTipico)}</Text>
          <Text style={styles.unidade}>por kg</Text>
        </View>
      </View>

      <View style={styles.detalhes}>
        {/* Faixa Habitual */}
        <View style={styles.linhaDetalhe}>
          <Text style={styles.rotuloDetalhe}>Faixa habitual</Text>
          <Text style={styles.valorDetalhe}>
            {faixaHabitual
              ? `${formatarMoeda(faixaHabitual[0])} — ${formatarMoeda(faixaHabitual[1])}/kg`
              : "-"}
          </Text>
        </View>

        {/* Quantidade de Dados */}
        <View style={styles.linhaDetalhe}>
          <Text style={styles.rotuloDetalhe}>Base da estimativa</Text>
          <Text style={styles.valorDetalhe}>{qtdRegistros} registros</Text>
        </View>

        <View style={styles.linhaDetalhe}>
          <Text style={styles.rotuloDetalhe}>Anos históricos</Text>
          <Text style={styles.valorDetalhe}>{anosLabel}</Text>
        </View>

        <View style={styles.caixaDica}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#29483D"
          />
          <Text style={styles.textoDica}>{fonte}</Text>
        </View>

        <View style={styles.divisor} />

        {/* Gráfico */}
        <View style={styles.cabecalhoGrafico}>
          <Ionicons name="bar-chart-outline" size={16} color="#18382E" />
          <Text style={styles.tituloSecao}>COMPORTAMENTO DURANTE O ANO</Text>
        </View>

        <View style={styles.containerGrafico}>
          <Text style={styles.descricaoGrafico}>
            Preço típico (mediana) por mês
          </Text>

          <View style={styles.areaBarras}>
            {historicoMensal.map((item) => {
              const heightPercent =
                maxPreco > 0 ? (item.mediana / maxPreco) * 100 : 0;
              const isSelected = item.mes === mesSelecionado;
              const isCurrent = item.mes === mesAtual;

              return (
                <Pressable
                  key={item.mes}
                  style={styles.colunaBarra}
                  onPress={() => setMesSelecionado(item.mes)}
                >
                  <Text
                    style={[
                      styles.rotuloPrecoBarra,
                      isSelected && styles.rotuloPrecoBarraSelecionado,
                      isCurrent && !isSelected && styles.rotuloPrecoBarraAtual,
                      item.mediana === 0 && { opacity: 0 },
                    ]}
                    numberOfLines={1}
                  >
                    {item.mediana >= 1000
                      ? `${Math.round(item.mediana / 1000)}k`
                      : item.mediana > 0
                        ? item.mediana.toFixed(0)
                        : ""}
                  </Text>

                  <View style={styles.areaBarra}>
                    <View
                      style={[
                        styles.barra,
                        { height: `${Math.max(heightPercent, 2)}%` },
                        isSelected
                          ? styles.barraSelecionada
                          : isCurrent
                            ? styles.barraAtual
                            : styles.barraNormal,
                        item.mediana === 0 && { opacity: 0 },
                      ]}
                    />
                  </View>

                  <View
                    style={[
                      styles.badgeMes,
                      isSelected && styles.badgeMesSelecionado,
                      isCurrent && !isSelected && styles.badgeMesAtual,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoMes,
                        isSelected && styles.textoMesSelecionado,
                        isCurrent && !isSelected && styles.textoMesAtual,
                      ]}
                    >
                      {MESES_ABREVIADOS[item.mes - 1]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.linhaBase} />

          <View style={styles.painelSelecao}>
            <Text style={styles.rotuloSelecao}>
              {MESES_EXTENSOS[mesSelecionado - 1]}:{" "}
              <Text style={styles.valorSelecao}>
                {hasDataForSelectedMonth
                  ? `${formatarMoeda(pontoSelecionado.mediana)} / kg`
                  : "Sem dados"}
              </Text>
            </Text>
            {hasDataForSelectedMonth && pontoSelecionado.p25 > 0 && (
              <Text style={{ fontSize: 11, color: "#4F6B5D", marginTop: 2 }}>
                P25–P75: {formatarMoeda(pontoSelecionado.p25)} —{" "}
                {formatarMoeda(pontoSelecionado.p75)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divisor} />

        {/* Meses com maior preço */}
        {topMeses.length > 0 && (
          <View>
            <View style={styles.cabecalhoGrafico}>
              <Ionicons name="trophy-outline" size={16} color="#18382E" />
              <Text style={styles.tituloSecao}>
                MESES COM MAIOR PREÇO TÍPICO
              </Text>
            </View>
            {topMeses.map((m, i) => (
              <View key={m.mes} style={styles.linhaDetalhe}>
                <Text style={styles.rotuloDetalhe}>
                  {i + 1}º {MESES_EXTENSOS[m.mes - 1]}
                </Text>
                <Text style={styles.valorDetalhe}>
                  {formatarMoeda(m.preco)}/kg
                </Text>
              </View>
            ))}
            <View style={styles.divisor} />
          </View>
        )}

        {/* Produtividade */}
        <View style={styles.cabecalhoGrafico}>
          <Ionicons name="boat-outline" size={16} color="#18382E" />
          <Text style={styles.tituloSecao}>INFORMAÇÕES DA ATIVIDADE</Text>
        </View>
        <View style={styles.linhaDetalhe}>
          <Text style={styles.rotuloDetalhe}>Captura típica (CPUE)</Text>
          <Text style={styles.valorDetalhe}>
            {cpue ? `${cpue.toFixed(1)} kg/dia` : "-"}
          </Text>
        </View>
        <View style={styles.linhaDetalhe}>
          <Text style={styles.rotuloDetalhe}>Preço ponderado pelo volume</Text>
          <Text style={styles.valorDetalhe}>
            {precoPonderado ? `${formatarMoeda(precoPonderado)}/kg` : "-"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D8E3DD",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "#F7FAF8",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEEA",
  },
  cabecalhoVazio: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#F7FAF8",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEEA",
  },
  informacoes: {
    flex: 1,
    gap: 3,
  },
  rotulo: {
    color: "#4F6B5D",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  nomePeixe: {
    color: "#18382E",
    fontSize: 20,
    fontWeight: "700",
  },
  unidade: {
    color: "#52665B",
    fontSize: 13,
  },
  precoEIndicador: {
    alignItems: "flex-end",
    gap: 2,
  },
  preco: {
    color: "#18382E",
    fontSize: 24,
    fontWeight: "700",
  },
  linhaConfiabilidade: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  textoConfiabilidade: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detalhes: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  linhaDetalhe: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rotuloDetalhe: {
    color: "#52665B",
    fontSize: 14,
  },
  valorDetalhe: {
    color: "#29483D",
    fontSize: 14,
    fontWeight: "600",
  },
  divisor: {
    height: 1,
    backgroundColor: "#E7EEEA",
    marginVertical: 16,
  },
  cabecalhoGrafico: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  tituloSecao: {
    color: "#18382E",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  containerGrafico: {
    backgroundColor: "#F7FAF8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2ECE6",
    padding: 12,
  },
  descricaoGrafico: {
    fontSize: 12,
    color: "#4F6B5D",
    fontWeight: "600",
    marginBottom: 8,
  },
  areaBarras: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    height: 132,
    paddingHorizontal: 0,
  },
  colunaBarra: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
    height: "100%",
  },
  rotuloPrecoBarra: {
    fontSize: 9,
    color: "#52665B",
    fontWeight: "600",
    height: 14,
    marginBottom: 4,
    maxWidth: "100%",
    textAlign: "center",
  },
  rotuloPrecoBarraAtual: {
    color: "#18382E",
    fontWeight: "700",
  },
  rotuloPrecoBarraSelecionado: {
    color: "#0B7A3E",
    fontWeight: "700",
  },
  barra: {
    width: "70%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  areaBarra: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 88,
    width: "100%",
  },
  barraNormal: {
    backgroundColor: "#A7C7B9",
  },
  barraSelecionada: {
    backgroundColor: "#3A7D60",
  },
  barraAtual: {
    backgroundColor: "#18382E",
  },
  linhaBase: {
    height: 2,
    backgroundColor: "#D0DDD5",
    marginTop: 2,
    marginBottom: 6,
  },
  badgeMes: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  badgeMesAtual: {
    backgroundColor: "#18382E",
  },
  badgeMesSelecionado: {
    backgroundColor: "#E2ECE6",
  },
  textoMes: {
    fontSize: 10,
    color: "#4F6B5D",
    fontWeight: "600",
  },
  textoMesAtual: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  textoMesSelecionado: {
    color: "#18382E",
    fontWeight: "700",
  },
  painelSelecao: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2ECE6",
    alignItems: "center",
  },
  rotuloSelecao: {
    fontSize: 12,
    color: "#4F6B5D",
  },
  valorSelecao: {
    fontWeight: "700",
    color: "#18382E",
    fontSize: 13,
  },
  caixaDica: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    backgroundColor: "#F4F7F5",
    padding: 10,
    borderRadius: 8,
  },
  textoDica: {
    flex: 1,
    fontSize: 12,
    color: "#42675B",
    lineHeight: 16,
  },
});
