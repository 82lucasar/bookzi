import { Tabs } from "expo-router"
import { Text } from "react-native"

function Icon({ label }: { label: string }) {
  return <Text style={{ fontSize: 18 }}>{label}</Text>
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0284C7" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "800" },
        tabBarActiveTintColor: "#0284C7",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: { borderTopColor: "#E0F0F8" },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarLabel: "Inicio",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "🏠" : "🏡"} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarLabel: "Agenda",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "📅" : "📆"} />,
        }}
      />
      <Tabs.Screen
        name="turnos"
        options={{
          title: "Turnos",
          tabBarLabel: "Turnos",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "📋" : "📄"} />,
        }}
      />
      <Tabs.Screen
        name="metricas"
        options={{
          title: "Métricas",
          tabBarLabel: "Métricas",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "📊" : "📈"} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          tabBarLabel: "Clientes",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "👥" : "🧑"} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mi perfil",
          tabBarLabel: "Perfil",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "👤" : "🧑"} />,
        }}
      />
    </Tabs>
  )
}
