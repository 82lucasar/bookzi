import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const supabase = createClient(
  "https://ukaempboazvlivvsnoln.supabase.co",
  "sb_publishable_0gJyxggbwez5jbsMPgQjuA_fiITRCwD",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
