-- RLS multi-tenant para Nails Schedule
-- Este script asume que se está ejecutando en la base de datos de Supabase
-- y que el esquema de Prisma creó las tablas en el esquema "public" con
-- nombres de tabla que coinciden con los modelos: "User", "StylistProfile",
-- "VerificationToken" y "AuditLog".
--
-- Supuestos clave:
-- - La columna public."User"."supabaseAuthId" almacena auth.uid() de Supabase.
-- - El rol de servicio de Supabase (service_role) se identifica con auth.role() = 'service_role'.
-- - Los roles de aplicación se almacenan en public."User"."role" (enum UserRole).
-- - El estado de cuenta se almacena en public."User"."status" (enum AccountStatus).


/******************************
 * 1. RLS en tabla "User"
 ******************************/

-- Habilitar y forzar RLS en la tabla User
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" FORCE ROW LEVEL SECURITY;

-- Función helper (opcional): determinar si el usuario actual es SUPER_ADMIN.
-- Se usa en varias políticas para evitar repetir el EXISTS.
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE u."supabaseAuthId" = auth.uid()
      AND u."role" = 'SUPER_ADMIN'
  );
$$;

-- Política de lectura:
-- - Super admins pueden ver todos los usuarios.
-- - Estilistas (u otros roles no privilegiados) solo pueden ver su propio registro.
CREATE POLICY "user_select_self_or_super_admin"
ON public."User"
FOR SELECT
USING (
  "supabaseAuthId" = auth.uid()              -- ver su propio registro
  OR public.is_current_user_super_admin()     -- o cualquier registro si es SUPER_ADMIN
);

-- Política de inserción:
-- - Solo el backend usando la clave service_role puede crear usuarios.
CREATE POLICY "user_insert_service_role_only"
ON public."User"
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
);

-- Política de actualización:
-- - Cada usuario puede actualizar su propio registro, PERO
--   no puede cambiar los campos sensibles "role" ni "status".
-- - El backend (service_role) puede actualizar cualquier cosa.
CREATE POLICY "user_update_self_without_privileged_fields"
ON public."User"
FOR UPDATE
USING (
  "supabaseAuthId" = auth.uid()             -- solo su propio registro
  OR auth.role() = 'service_role'            -- o backend service_role
)
WITH CHECK (
  -- Permitir al usuario actualizarse a sí mismo, siempre que role y status
  -- permanezcan iguales a los valores actuales en BD
  (
    "supabaseAuthId" = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public."User" u
      WHERE u.id = id
        AND u."role" = "role"
        AND u."status" = "status"
    )
  )
  OR auth.role() = 'service_role'
);

-- Política de borrado (opcional): solo service_role puede borrar usuarios.
CREATE POLICY "user_delete_service_role_only"
ON public."User"
FOR DELETE
USING (
  auth.role() = 'service_role'
);


/***********************************
 * 2. RLS en tabla "StylistProfile"
 ***********************************/

ALTER TABLE public."StylistProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StylistProfile" FORCE ROW LEVEL SECURITY;

-- Política para estilistas (propietarios):
-- - Pueden ver y modificar ÚNICAMENTE su propio perfil.
--   Se relaciona StylistProfile.userId -> User.id -> User.supabaseAuthId = auth.uid().
CREATE POLICY "stylist_profile_owner_access"
ON public."StylistProfile"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE u.id = "userId"
      AND u."supabaseAuthId" = auth.uid()
  )
);

CREATE POLICY "stylist_profile_owner_modify"
ON public."StylistProfile"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE u.id = "userId"
      AND u."supabaseAuthId" = auth.uid()
  )
  OR auth.role() = 'service_role'
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE u.id = "userId"
      AND u."supabaseAuthId" = auth.uid()
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "stylist_profile_owner_insert"
ON public."StylistProfile"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE u.id = "userId"
      AND u."supabaseAuthId" = auth.uid()
  )
  OR auth.role() = 'service_role'
);

-- Política pública (lectura):
-- - Cualquier usuario (incluyendo anon) puede consultar perfiles
--   siempre que el usuario asociado tenga status = 'ACTIVE'.
CREATE POLICY "stylist_profile_public_active_only"
ON public."StylistProfile"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE u.id = "userId"
      AND u."status" = 'ACTIVE'
  )
);


/****************************************
 * 3. RLS en tabla "VerificationToken"
 ****************************************/

ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VerificationToken" FORCE ROW LEVEL SECURITY;

-- Política de lectura de tokens de verificación:
-- - Solo el propietario (según userId -> User.supabaseAuthId = auth.uid())
--   puede ver sus propios tokens.
CREATE POLICY "verification_token_owner_select"
ON public."VerificationToken"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE u.id = "userId"
      AND u."supabaseAuthId" = auth.uid()
  )
  OR auth.role() = 'service_role'
);

-- Políticas de inserción/actualización desde backend únicamente:
CREATE POLICY "verification_token_service_role_insert"
ON public."VerificationToken"
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
);

CREATE POLICY "verification_token_service_role_update"
ON public."VerificationToken"
FOR UPDATE
USING (
  auth.role() = 'service_role'
)
WITH CHECK (
  auth.role() = 'service_role'
);

CREATE POLICY "verification_token_service_role_delete"
ON public."VerificationToken"
FOR DELETE
USING (
  auth.role() = 'service_role'
);


/********************************
 * 4. RLS en tabla "AuditLog"
 ********************************/

ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" FORCE ROW LEVEL SECURITY;

-- Política de lectura:
-- - Solo super admins pueden leer logs de auditoría.
CREATE POLICY "audit_log_super_admin_select"
ON public."AuditLog"
FOR SELECT
USING (
  public.is_current_user_super_admin() OR auth.role() = 'service_role'
);

-- Opcionalmente, solo el backend puede insertar logs.
CREATE POLICY "audit_log_service_role_insert"
ON public."AuditLog"
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
);

CREATE POLICY "audit_log_service_role_delete"
ON public."AuditLog"
FOR DELETE
USING (
  auth.role() = 'service_role'
);
