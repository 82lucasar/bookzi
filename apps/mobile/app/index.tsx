import { StyleSheet, Text, View } from "react-native"

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookzi</Text>
      <Text style={styles.subtitle}>Tu agenda inteligente</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginTop: 8,
  },
})
