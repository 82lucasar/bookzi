import { useState } from "react"
import {
  ActivityIndicator, Alert,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native"
import { Stack, useRouter } from "expo-router"
import { supabase } from "../lib/supabase"

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) return Alert.alert("Completá email y contraseña")
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      Alert.alert("Error", error.message)
    } else {
      router.replace("/(tabs)")
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
          <Text style={styles.logo}>Bookzi</Text>
          <Text style={styles.subtitle}>Panel profesional</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
            <Pressable
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Iniciar sesión</Text>
              }
            </Pressable>
          </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F9FF" },
  inner: { flexGrow: 1, justifyContent: "center", padding: 32 },
  logo: { fontSize: 48, fontWeight: "800", color: "#0284C7", letterSpacing: -1.5, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#64748B", textAlign: "center", marginTop: 4, marginBottom: 40 },
  form: { gap: 12 },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0F0F8",
    borderRadius: 12, padding: 16, fontSize: 15, color: "#0F172A",
  },
  btn: { backgroundColor: "#0284C7", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
})
