import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "../../lib/supabase"
import { getMyBusiness, type Business } from "../../lib/api"

export default function ProfileScreen() {
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.replace("/login")
      setEmail(session.user.email ?? null)
      const business = await getMyBusiness(session.access_token)
      setBusiness(business)
    }
    load().finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Seguro que querés salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir", style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace("/login")
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {business?.name?.trim()[0]?.toUpperCase() ?? "?"}
        </Text>
      </View>

      <Text style={styles.businessName}>{business?.name?.trim() ?? "Mi negocio"}</Text>
      {email && <Text style={styles.email}>{email}</Text>}

      <View style={styles.cards}>
        {business?.category && <InfoRow label="Categoría" value={business.category} />}
        {business?.phone && <InfoRow label="Teléfono" value={business.phone} />}
        {business?.slug && (
          <InfoRow label="Link de reservas" value={`bookzi-three.vercel.app/book/${business.slug}`} />
        )}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  container: { flex: 1, backgroundColor: "#F0F9FF", padding: 24, alignItems: "center" },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#0284C7", alignItems: "center", justifyContent: "center",
    marginTop: 24, marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: "800", color: "#fff" },
  businessName: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  email: { fontSize: 14, color: "#64748B", marginTop: 4 },
  cards: {
    width: "100%", backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1, borderColor: "#E0F0F8", marginTop: 28,
    overflow: "hidden",
  },
  infoRow: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  infoLabel: { fontSize: 11, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#0F172A", marginTop: 3 },
  logoutBtn: {
    marginTop: 32, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 12, borderWidth: 1.5, borderColor: "#DC2626",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
})
