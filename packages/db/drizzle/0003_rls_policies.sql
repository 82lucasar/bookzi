-- Migration: 0002_rls_policies
-- Habilita Row Level Security en todas las tablas de datos de negocio.
--
-- IMPORTANTE: El rol de conexión actual (neondb_owner) tiene BYPASSRLS por defecto,
-- por lo que las queries existentes del backend NO se verán afectadas.
--
-- El enforcement real (aislamiento por tenant) se activa cuando:
--   1. Se cree un rol 'app_user' sin BYPASSRLS
--   2. Se implemente SET LOCAL app.current_business_id = '<uuid>' en el connection pool
--      antes de cada query de usuario autenticado
--
-- Por ahora este archivo documenta la intención de seguridad y prepara la infraestructura
-- sin romper el funcionamiento actual.

---------------------------------------------------------------------------
-- 1. Habilitar RLS en todas las tablas multi-tenant
---------------------------------------------------------------------------

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

---------------------------------------------------------------------------
-- 2. Políticas BYPASS para el rol owner de Neon
--    El rol neondb_owner conecta el backend y tiene BYPASSRLS implícito,
--    pero se crean políticas explícitas como documentación de intención
--    y para cuando se agreguen roles adicionales.
---------------------------------------------------------------------------

-- businesses
CREATE POLICY "owner_bypass" ON businesses
  TO neondb_owner
  USING (true);

-- services
CREATE POLICY "owner_bypass" ON services
  TO neondb_owner
  USING (true);

-- staff
CREATE POLICY "owner_bypass" ON staff
  TO neondb_owner
  USING (true);

-- clients
CREATE POLICY "owner_bypass" ON clients
  TO neondb_owner
  USING (true);

-- appointments
CREATE POLICY "owner_bypass" ON appointments
  TO neondb_owner
  USING (true);

-- availability
CREATE POLICY "owner_bypass" ON availability
  TO neondb_owner
  USING (true);

-- availability_blocks
CREATE POLICY "owner_bypass" ON availability_blocks
  TO neondb_owner
  USING (true);

-- waitlist
CREATE POLICY "owner_bypass" ON waitlist
  TO neondb_owner
  USING (true);

-- notifications: no tiene business_id directo, se accede via appointments
CREATE POLICY "owner_bypass" ON notifications
  TO neondb_owner
  USING (true);

---------------------------------------------------------------------------
-- 3. Plantilla comentada para el enforcement real (implementar en Fase 2)
--
-- Cuando se cree el rol 'app_user' y se implemente SET LOCAL en el pool:
--
-- CREATE POLICY "tenant_isolation" ON businesses
--   FOR ALL
--   TO app_user
--   USING (id::text = current_setting('app.current_business_id', true));
--
-- CREATE POLICY "tenant_isolation" ON services
--   FOR ALL
--   TO app_user
--   USING (business_id::text = current_setting('app.current_business_id', true));
--
-- (repetir para staff, clients, appointments, availability, availability_blocks, waitlist)
--
-- Para notifications (sin business_id directo):
-- CREATE POLICY "tenant_isolation" ON notifications
--   FOR ALL
--   TO app_user
--   USING (
--     appointment_id IN (
--       SELECT id FROM appointments
--       WHERE business_id::text = current_setting('app.current_business_id', true)
--     )
--   );
---------------------------------------------------------------------------
