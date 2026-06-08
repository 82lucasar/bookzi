import { useEffect, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { Redirect } from "expo-router"
import { supabase } from "../lib/supabase"

export default function HomeScreen() {
  const [loading, setLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F9FF" }}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    )
  }

  return <Redirect href={hasSession ? "/(tabs)" : "/login"} />
}
