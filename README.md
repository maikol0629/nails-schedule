# Nails Schedule

Agenda online para estilistas (uñas, cabello y belleza) con panel de administración, gestión de citas, servicios, portafolio y landing pública para reservas.

---

## 1. Descripción del Proyecto

**Nails Schedule** es una aplicación full‑stack pensada para estilistas y salones pequeños que necesitan:

- Una **landing pública** donde los clientes puedan ver servicios, portafolio y agendar citas online.
- Un **panel admin** con autenticación (Supabase Auth) para:
	- Gestionar citas (estado: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW).
	- Configurar horarios de atención y días bloqueados.
	- Administrar servicios y clientes.
	- Subir fotos de portafolio.
	- Configurar el **perfil público del estilista** (nombre, bio, redes, etc.).

### Arquitectura general

- **Backend** (carpeta `backend/`)
	- API REST con Express y Prisma sobre PostgreSQL.
	- Autenticación de estilistas mediante Supabase Auth (JWT).
	- Separación clara de rutas:
		- `/api/public/...` para la landing y reservas públicas.
		- `/api/admin/...` para panel de administración (requiere token Supabase).
		- `/api/setup/...` para inicializar y resolver el estilista principal (solo entorno de desarrollo).

- **Frontend** (carpeta `frontend/`)
	- SPA en React + Vite + TailwindCSS.
	- Rutas públicas: `/` y `/book` (landing + flujo de reserva).
	- Rutas admin (`/admin/...`) con login, dashboard, citas, servicios, clientes, portafolio, configuración y perfil.

---

## 2. Tecnologías Usadas

- **Backend**
	- Node.js
	- Express
	- Prisma ORM
	- PostgreSQL
	- Supabase Auth (`@supabase/supabase-js`)
	- CORS, dotenv, etc.

- **Frontend**
	- React (Vite)
	- React Router
	- TailwindCSS
	- Axios
	- Supabase JS (para obtener el token de sesión en el frontend)

---

## 3. Requisitos Previos

Antes de empezar asegúrate de tener instalado:

- **Node.js** >= 18.x
- **npm** (o pnpm/yarn, pero los ejemplos usan `npm`)
- **PostgreSQL** accesible (local o remoto)
- Una cuenta de **Supabase** con un proyecto creado

También necesitarás las claves de Supabase:

- `SUPABASE_URL` (backend)
- `SUPABASE_ANON_KEY` (backend y frontend)

---

## 4. Instalación Paso a Paso

### 4.1 Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd nails-schedule
```

### 4.2 Configurar Supabase

1. Crea un proyecto en [https://supabase.com](https://supabase.com).
2. Ve a **Project Settings → API** y copia:
	 - `Project URL`
	 - `anon public API key`
3. Habilita el proveedor de email/password para Auth (si no está activo).

### 4.3 Backend setup

```bash
cd backend
npm install
```

Crear un archivo `.env` dentro de `backend/` con al menos:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public"
SUPABASE_URL="https://<your-project>.supabase.co"
SUPABASE_ANON_KEY="<your-anon-key>"

# Opcional: ajustes para slots públicos
PUBLIC_BOOKING_BUFFER_MINUTES=0
```

### 4.4 Frontend setup

```bash
cd ../frontend
npm install
```

Crear un archivo `.env` dentro de `frontend/` con al menos:

```env
VITE_API_URL="http://localhost:4000"   # URL donde corre el backend
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-anon-key>"

# Se rellenará después de ejecutar el seed / setup
VITE_STYLIST_ID=""
```

> Nota: Asegúrate de que los valores de Supabase en backend y frontend coinciden.

### 4.5 Ejecutar migraciones de Prisma (backend)

Desde la carpeta `backend/`:

```bash
cd backend
npx prisma migrate deploy
# o, durante desarrollo
# npx prisma migrate dev

# Asegúrate también de generar el cliente Prisma
npx prisma generate
```

### 4.6 Seed de datos

El proyecto incluye un script de seed que:

- Crea un estilista de prueba en Supabase Auth.
- Configura `AppSettings.primaryStylistId`.
- Crea un `StylistProfile` de ejemplo.
- Crea horarios estándar (`BusinessHours`).
- Crea 4 servicios de ejemplo.
- Crea 6 imágenes de portafolio.
- Crea 1 cita de prueba en estado `PENDING`.

Ejecutar desde `backend/`:

```bash
cd backend
node src/scripts/seed.js
```

La salida esperada (similar a):

```text
✓ Usuario creado: stylist.demo+<timestamp>@example.com
✓ Perfil creado
✓ Horarios configurados
✓ 4 servicios creados
✓ 6 imágenes de portafolio creadas
✓ 1 cita de prueba creada
```

### 4.7 Obtener el stylist ID

El `stylistId` (UUID de Supabase) se utiliza en el frontend para cargar el perfil y servicios públicos.

Tienes dos opciones:

#### Opción A: Usar AppSettings (recomendado tras el seed)

Desde una consola de Node (o un script pequeño) puedes consultar `AppSettings` con Prisma, o directamente en la base de datos:

```sql
SELECT "primaryStylistId" FROM "AppSettings" WHERE id = 1;
```

Toma ese UUID y configúralo en el `.env` del frontend:

```env
VITE_STYLIST_ID="<UUID_DEL_STYLIST>"
```

#### Opción B: Endpoint de setup

Con el backend levantado (ver sección siguiente), puedes llamar al endpoint de setup:

```bash
curl http://localhost:4000/api/setup/stylist-id
```

La respuesta incluirá algo como:

```json
{ "userId": "<UUID>", "created": false, "source": "settings" }
```

Usa ese `userId` como `VITE_STYLIST_ID` en el `.env` del frontend.

---

## 5. Ejecutar el Proyecto

### 5.1 Iniciar el backend

Desde `backend/`:

```bash
cd backend
npm run dev   # o npm start, según tu package.json
```

Por defecto escucha en `http://localhost:4000`.

### 5.2 Iniciar el frontend

En otra terminal, desde `frontend/`:

```bash
cd frontend
npm run dev
```

Por defecto Vite se levanta en `http://localhost:5173`.

### 5.3 Flujo básico

- Abre `http://localhost:5173` para ver la **landing pública**.
- Usa el botón de **login admin** (o navega a `/admin/login`) para entrar al panel.
- Desde el panel puedes:
	- Ver el **Dashboard**.
	- Revisar y gestionar **citas**.
	- Configurar **horarios** y **días bloqueados**.
	- Gestionar **servicios**, **clientes** y **portafolio**.
	- Editar el **perfil público** desde `/admin/profile`.

---

## 6. Testing

Actualmente el proyecto no incluye una batería de tests automatizados configurada.

Sugerencias para futuro:

- Añadir tests unitarios para la lógica de slots en `backend/src/utils/slotCalculator.js` (por ejemplo con Jest).
- Añadir tests de integración para los endpoints públicos y admin.
- Añadir pruebas E2E para el flujo de reserva desde la landing.

---

## 7. Estructura de Carpetas

Estructura simplificada del proyecto:

```text
nails-schedule/
├─ backend/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ routes/
│  │  ├─ middleware/
│  │  ├─ prisma/
│  │  │  └─ schema.prisma
│  │  ├─ scripts/
│  │  │  └─ seed.js
│  │  ├─ utils/
│  │  └─ server.js
│  └─ package.json
│
├─ frontend/
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ admin/
│  │  │  │  ├─ SettingsPage.jsx
│  │  │  │  └─ ProfilePage.jsx
│  │  │  └─ public/
│  │  │     └─ LandingPage.jsx
│  │  ├─ components/
│  │  ├─ services/
│  │  └─ context/
│  └─ package.json
│
└─ README.md
```

---

## 8. Variables de Entorno

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>

# Opcionales
PUBLIC_BOOKING_BUFFER_MINUTES=0   # minutos de anticipación mínima para reservar
```

### Claves para Resend (emails)

El backend usa Resend para enviar correos transaccionales (por ejemplo, notificaciones de aprobación o rechazo de cuentas). Debes crear la cuenta y configurar las claves en `backend/.env`:

#### Resend (envío de emails)

1. Crea una cuenta en [https://resend.com](https://resend.com) y entra al dashboard.
2. Ve a **API Keys** y crea una nueva clave de tipo **Production** o **Test**.
3. Copia la clave y añádela en `backend/.env` como:

	```env
	RESEND_API_KEY=your_resend_api_key
	EMAIL_FROM="Nails Schedule <no-reply@tu-dominio.com>"
	```

4. (Opcional pero recomendado) Verifica un dominio o un email sender en Resend y úsalo en `EMAIL_FROM` para evitar que los correos lleguen a spam.

> Nota: sin estas claves, los correos transaccionales simplemente fallarán al intentar enviarse. El resto de la app (citas, servicios, etc.) puede seguir probándose en local.

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_STYLIST_ID=<UUID_DEL_STYLIST>
```

> Recuerda reiniciar el servidor de Vite cuando cambies variables de entorno.

---

## 9. Deployment (futuro)

Pendiente de documentar en detalle. Ideas para despliegue futuro:

- **Backend**
	- Desplegar la API en un servicio como:
		- Render, Railway, Fly.io, Heroku (legacy) o un contenedor en Azure / AWS / GCP.
	- Usar una base de datos PostgreSQL gestionada (Supabase, Railway, RDS, etc.).

- **Frontend**
	- Construir con Vite y desplegar en:
		- Vercel, Netlify, Cloudflare Pages o Azure Static Web Apps.

- **Configuración recomendada**
	- Usar HTTPS en producción.
	- Configurar correctamente CORS en el backend (`FRONTEND_URL`).
	- Gestionar las variables de entorno sensibles mediante los mecanismos de cada proveedor.

Con esto deberías poder levantar el entorno local, poblar datos de prueba y comenzar a iterar sobre la aplicación.
