import { test, expect } from "@playwright/test"

test("smoke — rutas críticas responden 200", async ({ page }) => {
  const routes = ["/", "/pricing", "/login", "/register"]

  for (const route of routes) {
    const response = await page.goto(route)
    expect(response?.status(), `${route} debería retornar 200`).toBe(200)
  }
})

test("smoke — dashboard redirige sin auth", async ({ page }) => {
  await page.goto("/dashboard")
  await page.waitForURL(/login/)
  expect(page.url()).toContain("/login")
})

test("smoke — booking page pública existe", async ({ page }) => {
  // La URL /book/[slug] devuelve 404 si no hay negocio, pero la ruta existe
  const response = await page.goto("/book/test-negocio-inexistente")
  expect(response?.status()).toBe(404)
})
