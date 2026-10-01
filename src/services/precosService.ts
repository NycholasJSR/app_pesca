import { SQLiteDatabase } from "expo-sqlite";
import {
  calcularMediana,
  calcularPercentil,
  classificarConfiabilidade,
  getCorConfiabilidade,
} from "./estatistica";

export interface RegistroPrecoRaw {
  p: number;
  k: number;
  v: number;
  d: number | null;
  mes: number;
  ano: number;
}

export interface EstimativaPreco {
  precoTipico: number | null;
  faixaHabitual: [number, number] | null;
  qtdRegistros: number;
  anosHistoricos: number[];
  confiabilidade: string;
  corConfiabilidade: string;
  fonte: string;
  cpue: number | null;
  precoPonderado: number | null;
  historicoMensal: { mes: number; mediana: number; p25: number; p75: number }[];
  topMeses: { mes: number; preco: number }[];
}

export async function buscarEspeciesDisponiveis(
  db: SQLiteDatabase,
): Promise<string[]> {
  const rows = await db.getAllAsync<{ nome_referencia: string }>(
    "SELECT DISTINCT nome_referencia FROM base_principal WHERE nome_referencia IS NOT NULL AND nome_referencia != '' ORDER BY nome_referencia",
  );
  return rows.map((r) => r.nome_referencia);
}

export async function buscarDadosEspecie(
  db: SQLiteDatabase,
  especie: string,
  mesAtual: number,
): Promise<EstimativaPreco> {
  const queryBase = `
    SELECT 
      CAST(REPLACE(preco_kilo, ',', '.') AS REAL) as p,
      CAST(REPLACE(kg_no_periodo, ',', '.') AS REAL) as k,
      CAST(REPLACE(valor_estimado_periodo, ',', '.') AS REAL) as v,
      CAST(REPLACE(dias_de_pesca_periodo, ',', '.') AS REAL) as d,
      mes,
      ano
    FROM base_principal 
    WHERE nome_referencia = ?
      AND p > 0
      AND k > 0
      AND v > 0
  `;

  const todosRegistros = await db.getAllAsync<RegistroPrecoRaw>(queryBase, [
    especie,
  ]);

  const MIN_REGISTROS = 10;
  const registrosSelecionados = todosRegistros.filter(
    (registro) => registro.mes === mesAtual,
  );

  const qtdRegistros = registrosSelecionados.length;
  const fonte =
    qtdRegistros < MIN_REGISTROS
      ? "Amostra pequena: registros do Espírito Santo neste mês"
      : "Registros do Espírito Santo neste mês";

  if (qtdRegistros === 0) {
    return {
      precoTipico: null,
      faixaHabitual: null,
      qtdRegistros: 0,
      anosHistoricos: [],
      confiabilidade: classificarConfiabilidade(0),
      corConfiabilidade: getCorConfiabilidade(0),
      fonte: "Sem dados para esta espécie neste mês",
      cpue: null,
      precoPonderado: null,
      historicoMensal: [],
      topMeses: [],
    };
  }

  const precos = registrosSelecionados.map((r) => r.p);
  const precoTipico = calcularMediana(precos);
  const faixaHabitual: [number, number] = [
    calcularPercentil(precos, 25),
    calcularPercentil(precos, 75),
  ];

  const anos = Array.from(
    new Set(registrosSelecionados.map((r) => r.ano).filter((a) => a !== null)),
  ).sort();

  // CPUE
  const cpues = registrosSelecionados
    .filter((r) => r.k > 0 && r.d && r.d > 0)
    .map((r) => r.k / r.d!);
  const cpue = cpues.length >= MIN_REGISTROS ? calcularMediana(cpues) : null;

  // Preço Ponderado
  const somaV = registrosSelecionados.reduce((acc, r) => acc + r.v, 0);
  const somaK = registrosSelecionados.reduce((acc, r) => acc + r.k, 0);
  const precoPonderado = somaK > 0 ? somaV / somaK : null;

  // Mantém o histórico sazonal separado da estimativa do mês atual.
  const historicoMensal = [];
  for (let m = 1; m <= 12; m++) {
    const regsMes = todosRegistros.filter((r) => r.mes === m);
    if (regsMes.length >= MIN_REGISTROS) {
      const pMes = regsMes.map((r) => r.p);
      historicoMensal.push({
        mes: m,
        mediana: calcularMediana(pMes),
        p25: calcularPercentil(pMes, 25),
        p75: calcularPercentil(pMes, 75),
      });
    } else {
      historicoMensal.push({ mes: m, mediana: 0, p25: 0, p75: 0 }); // 0 means no data
    }
  }

  // Top Meses
  const mesesValidos = historicoMensal
    .filter((h) => h.mediana > 0)
    .sort((a, b) => b.mediana - a.mediana);
  const topMeses = mesesValidos
    .slice(0, 3)
    .map((m) => ({ mes: m.mes, preco: m.mediana }));

  return {
    precoTipico,
    faixaHabitual,
    qtdRegistros,
    anosHistoricos: anos,
    confiabilidade:
      qtdRegistros < MIN_REGISTROS
        ? "Amostra pequena"
        : classificarConfiabilidade(qtdRegistros),
    corConfiabilidade: getCorConfiabilidade(qtdRegistros),
    fonte,
    cpue,
    precoPonderado,
    historicoMensal,
    topMeses,
  };
}
