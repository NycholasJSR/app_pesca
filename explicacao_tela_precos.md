# Fluxo dos dados

A tela abre `data.db`, carrega as espécies de `base_principal` e seleciona a primeira como padrão. Não consulta a localização do dispositivo. Quando a espécie muda, busca novamente a estimativa em `precosService.ts`; a referência temporal é sempre o mês atual.

## Registros considerados

Para a espécie selecionada, os valores de preço por kg (`p`), kg no período (`k`), valor estimado (`v`) e dias de pesca (`d`) são convertidos para números. Só entram registros com `p > 0`, `k > 0` e `v > 0`. Preço ou valor zero significa que o preço não estava disponível na coleta, então essas linhas não devem afetar nenhuma estimativa.

## Estimativa principal

A estimativa usa exclusivamente os registros válidos da espécie cujo mês corresponde ao mês atual. Como a base contém apenas o Espírito Santo, esses registros representam o conjunto estadual, sem preferência por município. Não há fallback para meses diferentes: assim, um valor de outro período não é apresentado como se fosse o preço do mês atual.

Se não houver registros válidos no mês, o cartão mostra que não há dados para a espécie naquele mês. Com 1 a 9 registros, ainda calcula a mediana, mas identifica o resultado como “Amostra pequena”. A partir de 10 registros, aplica as categorias normais de confiabilidade.

## Estimativas exibidas

- **Preço típico:** mediana dos preços por kg no conjunto mensal. Os valores são ordenados; com quantidade par, a mediana é a média dos dois valores centrais.
- **Faixa habitual:** percentis 25 e 75 dos preços do conjunto. O cálculo interpola entre valores vizinhos quando a posição do percentil não é inteira; não é uma faixa de mínimo e máximo.
- **Anos históricos:** anos distintos presentes na amostra do mês atual, apresentados como intervalo quando há mais de um.
- **CPUE em kg/dia:** calcula `kg_no_periodo / dias_de_pesca_periodo` por registro com kg e dias positivos. Exibe a mediana se houver pelo menos 10 cálculos válidos; caso contrário, mostra “-”. Aqui o esforço é dias de pesca, diferentemente da CPUE do planejador, que usa descargas.
- **Preço ponderado pelo volume:** divide a soma dos valores estimados pela soma dos kg: `SUM(valor_estimado_periodo) / SUM(kg_no_periodo)`. É uma média ponderada pelo volume, não a média simples dos preços. O valor estimado permanece necessário para esse cálculo, embora a receita bruta estimada não seja mais exibida.

## Gráfico e meses em destaque

O gráfico é histórico e permanece separado da estimativa principal. Para cada mês do calendário, agrega registros válidos da espécie ao longo dos anos e calcula a mediana, o percentil 25 e o percentil 75. Com menos de 10 registros para um mês, esse mês aparece como “Sem dados”; não se completa a amostra usando outros meses.

Os três meses com maior mediana positiva aparecem em “Meses com maior preço típico”. O gráfico inicia com o mês atual selecionado; tocar em outro mês atualiza o valor detalhado. Rótulos de barra a partir de mil são abreviados em milhares. A apresentação está em `cardPrecos.tsx`.

## Confiabilidade e interpretação

A classificação usa a quantidade de registros válidos da estimativa principal: de 1 a 9, “Amostra pequena”; 10–29, baixa confiabilidade; 30–99, moderada; 100 ou mais, alta. Com zero registros, não há estimativa mensal a exibir. A contagem representa linhas da base, não necessariamente observações independentes.

A CPUE é a mediana das razões por linha (`kg/dias`), enquanto o preço ponderado é a razão entre somas (`valor/kg`). São métricas diferentes e não devem ser interpretadas como o mesmo tipo de média.
