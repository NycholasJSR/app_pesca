import { FlatList, View } from "react-native";

import dados from "@/assets/dados_falsos.json";
import { CardPrecos } from "../../components/cardPrecos";

type DadosPeixe = {
  id: number;
  nome: string;
  preco: number;
};

function ordenarMaiorparaMenor(dados: DadosPeixe[]) {
  return dados.sort((a, b) => b.preco - a.preco);
}

export default function Precos() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={ordenarMaiorparaMenor(dados.dados_peixes)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CardPrecos nome={item.nome} preco={item.preco} />
        )}
      />
    </View>
  );
}
