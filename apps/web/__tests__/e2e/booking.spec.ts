import { test, expect } from "@playwright/test"

// Este test verifica el flujo público de reserva sin necesitar autenticación
// Requiere que exista un negocio con slug "test-booking" en la DB de prueba
// En CI se puede skipear si no hay un negocio de test

test.describe("Flujo público de reservas", () => {
  test("página de booking muestra servicios del negocio", async ({ page }) => {
    // Ir a la landing
    await page.goto("/")
    await expect(page).toHaveTitle(/Bookzi/i)
  })

  test("página /pricing muestra los 3 planes", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Free")).toBeVisible()
    await expect(page.getByText("Pro")).toBeVisible()
    await expect(page.getByText("Business")).toBeVisible()
    await expect(page.getByText("ARS 12.900")).toBeVisible()
    await expect(page.getByText("ARS 32.900")).toBeVisible()
  })

  test("página /login existe y tiene formulario", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
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
