import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useLocalSearchParams, useRouter, Stack } from "expo-router"
import { getPublicBusiness, type BusinessPublic, type ServicePublic } from "../../../lib/api"

export default function BusinessScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const [business, setBusiness] = useState<BusinessPublic | null>(null)
  const [services, setServices] = useState<ServicePublic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPublicBusiness(slug)
      .then(({ business, services }) => {
        setBusiness(business)
        setServices(services.filter(s => s.isActive))
      })
      .catch(() => setError("No pudimos encontrar este negocio."))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    )
  }

  if (error || !business) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? "Negocio no encontrado."}</Text>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: business.name.trim() }} />
      <FlatList
        data={services}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{business.name.trim()[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.businessName}>{business.name.trim()}</Text>
            {business.category ? (
              <Text style={styles.category}>{business.category}</Text>
            ) : null}
            {business.address ? (
              <Text style={styles.address}>{business.address}</Text>
            ) : null}
            <Text style={styles.sectionTitle}>Servicios disponibles</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/book/${slug}/${item.id}`)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.serviceName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.serviceDesc}>{item.description}</Text>
              ) : null}
              <Text style={styles.duration}>{item.durationMinutes} min</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.price}>
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: item.currency,
                  maximumFractionDigits: 0,
                }).format(Number(item.price))}
              </Text>
              <Text style={styles.reservar}>Reservar →</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Este negocio no tiene servicios disponibles.</Text>
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" },
  errorText: { fontSize: 15, color: "#DC2626", textAlign: "center", padding: 24 },
  list: { padding: 16, gap: 12 },
  header: { alignItems: "center", paddingBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#0284C7", alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#fff" },
  businessName: { fontSize: 22, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  category: { fontSize: 14, color: "#64748B", marginTop: 4 },
  address: { fontSize: 13, color: "#64748B", marginTop: 2 },
  sectionTitle: {
    fontSize: 13, fontWeight: "700", color: "#64748B",
    textTransform: "uppercase", letterSpacing: 0.8,
    marginTop: 28, alignSelf: "flex-start",
  },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#E0F0F8",
    shadowColor: "#0284C7", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  cardLeft: { flex: 1, gap: 4 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  serviceName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  serviceDesc: { fontSize: 13, color: "#64748B" },
  duration: { fontSize: 12, color: "#0284C7", fontWeight: "600" },
  price: { fontSize: 16, fontWeight: "800", color: "#0284C7" },
  reservar: { fontSize: 12, color: "#059669", fontWeight: "600" },
  emptyText: { fontSize: 14, color: "#64748B", textAlign: "center", marginTop: 32 },
})
