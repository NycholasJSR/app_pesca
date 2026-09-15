import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function PlanejadorLayout() {
  const db = useSQLiteContext();
  const [textoPesquisa, setTextoPesquisa] = useState("");
  const [sugestoes, setSugestoes] = useState<string[]>([]);

  useEffect(() => {
    let cancelado = false;

    async function carregarSugestoes() {
      const termo = textoPesquisa.trim();

      if (!termo) {
        setSugestoes([]);
        return;
      }

      try {
        const resultados = await db.getAllAsync<{ nome_referencia: string }>(
          `SELECT nome_referencia
           FROM especies
           WHERE lower(nome_referencia) LIKE ?
           ORDER BY nome_referencia
           LIMIT 8`,
          [`%${termo.toLowerCase()}%`],
        );

        if (!cancelado) {
          setSugestoes(
            resultados
              .map((item) => item.nome_referencia)
              .filter(
                (item) => typeof item === "string" && item.trim().length > 0,
              ),
          );
        }
      } catch (error) {
        console.log("Erro ao buscar sugestões de espécies:", error);

        try {
          const resultadosFallback = await db.getAllAsync<{
            nome_referencia: string;
          }>(
            `SELECT nome_referencia
             FROM pesca_tratada
             WHERE lower(nome_referencia) LIKE ?
             ORDER BY nome_referencia
             LIMIT 8`,
            [`%${termo.toLowerCase()}%`],
          );

          if (!cancelado) {
            setSugestoes(
              resultadosFallback
                .map((item) => item.nome_referencia)
                .filter(
                  (item) => typeof item === "string" && item.trim().length > 0,
                ),
            );
          }
        } catch (fallbackError) {
          console.log(
            "Erro ao buscar sugestões na tabela principal:",
            fallbackError,
          );

          if (!cancelado) {
            setSugestoes([]);
          }
        }
      }
    }

    const timeout = setTimeout(carregarSugestoes, 250);

    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [db, textoPesquisa]);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Planejador - Pescado</Text>

      <TextInput
        placeholder="Digite o nome do pescado"
        placeholderTextColor="#5b6b7a"
        onChangeText={setTextoPesquisa}
        value={textoPesquisa}
        clearButtonMode="always"
        style={styles.input}
      />

      {sugestoes.length > 0 && (
        <View style={styles.listaContainer}>
          <FlatList
            data={sugestoes}
            keyExtractor={(item, index) => `${item}-${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setTextoPesquisa(item)}
                style={styles.itemSugerido}
              >
                <Text style={styles.itemTexto}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      <Button title="Pesquisar" onPress={() => console.log(textoPesquisa)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#083c69",
  },
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
  itemTexto: {
    color: "#12304a",
    fontSize: 15,
  },
});
