import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // Cada archivo de test corre en su propio contexto para que los mocks
    // de vi.mock no se filtren entre suites
    isolate: true,
  },
  resolve: {
    alias: {
      // Alias @/* → raíz del proyecto web (igual al paths en tsconfig.json)
      "@": path.resolve(__dirname, "."),
      // Paquetes del workspace — apuntamos directo al source para evitar
      // que Vitest necesite compilar los paquetes antes de testear
      "@bookzi/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@bookzi/db/schema": path.resolve(__dirname, "../../packages/db/src/schema/index.ts"),
    },
  },
})
