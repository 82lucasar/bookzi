import { test, expect } from "@playwright/test"

test.describe("Flujo público de reservas", () => {
  test("landing page carga con título Bookzi", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Bookzi/i)
  })

  test("página /pricing muestra los 3 planes", async ({ page }) => {
    await page.goto("/pricing")
    // Usar first() para evitar strict mode violation con texto duplicado en FAQ
    await expect(page.getByText("Free").first()).toBeVisible()
    await expect(page.getByText("Pro").first()).toBeVisible()
    await expect(page.getByText("Business").first()).toBeVisible()
    await expect(page.getByText("ARS 12.900").first()).toBeVisible()
    await expect(page.getByText("ARS 32.900").first()).toBeVisible()
  })

  test("página /login carga con pantalla de bienvenida y formulario", async ({ page }) => {
    await page.goto("/login")
    // La página muestra primero una pantalla de bienvenida
    await expect(page.getByText("Empezar").or(page.getByText("Iniciá sesión")).first()).toBeVisible()
    // Hacer click en Empezar para mostrar el formulario de login
    const empezarBtn = page.getByText("Empezar")
    if (await empezarBtn.isVisible()) {
      await empezarBtn.click()
    }
    // Verificar que aparece el formulario
    await expect(page.locator("input").first()).toBeVisible({ timeout: 8000 })
  })

  test("página /register existe y tiene formulario", async ({ page }) => {
    await page.goto("/register")
    await expect(page.locator("form")).toBeVisible()
  })

  test("dashboard redirige al login si no hay sesión", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/login/)
  })
})
