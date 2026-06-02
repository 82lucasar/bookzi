import "dotenv/config"
import { createNotificationWorker } from "./notifications.js"

console.log("[worker] Iniciando worker de notificaciones Bookzi…")

const worker = createNotificationWorker()

process.on("SIGTERM", async () => {
  console.log("[worker] SIGTERM recibido — cerrando limpiamente…")
  await worker.close()
  process.exit(0)
})

process.on("SIGINT", async () => {
  await worker.close()
  process.exit(0)
})
