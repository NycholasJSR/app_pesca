import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

const styles = StyleSheet.create({
  button: {
    width: "70%",
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowOpacity: 0.3,
    shadowColor: "black",
    elevation: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

type BotaoPlanejadorProps = PressableProps & {
  text: string;
  color: string;
  icon: ComponentProps<typeof Ionicons>["name"];
};

export function BotaoPlanejador({
  text,
  color,
  icon,
  style,
  ...pressableProps
}: BotaoPlanejadorProps) {
  return (
    <Pressable
      {...pressableProps}
      style={(state) => [
        styles.button,
        { backgroundColor: color },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      <Ionicons name={icon} size={32} color="white" />
      <Text style={{ color: "white", fontWeight: "bold", marginTop: 8 }}>
        {text}
      </Text>
    </Pressable>
  );
}
