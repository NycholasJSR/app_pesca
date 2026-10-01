export function calcularPercentil(
  valores: number[],
  percentil: number,
): number {
  if (valores.length === 0) return 0;
  // Make a copy to avoid mutating the original array, though usually fine
  const sorted = [...valores].sort((a, b) => a - b);
  const index = (percentil / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const fraction = index - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}

export function calcularMediana(valores: number[]): number {
  return calcularPercentil(valores, 50);
}

export function classificarConfiabilidade(qtdRegistros: number): string {
  if (qtdRegistros < 10) return "Dados insuficientes";
  if (qtdRegistros < 30) return "Baixa confiabilidade";
  if (qtdRegistros < 100) return "Confiabilidade moderada";
  return "Alta confiabilidade";
}

export function getCorConfiabilidade(qtdRegistros: number): string {
  if (qtdRegistros < 10) return "#95a5a6"; // Cinza
  if (qtdRegistros < 30) return "#e74c3c"; // Vermelho
  if (qtdRegistros < 100) return "#f39c12"; // Laranja
  return "#27ae60"; // Verde
}
