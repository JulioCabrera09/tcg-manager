# Guía Rápida de Conexión a Supabase & Despliegue en Vercel
## TCG Ecosystem | Marketplace, Vitrinas C2C & SaaS ERP para Tiendas

---

### Paso 1: Configurar la Base de Datos en Supabase (2 minutos)

1. **Crea tu Proyecto en Supabase:**
   - Ve a [supabase.com](https://supabase.com) e inicia sesión o regístrate gratis.
   - Haz clic en **"New Project"**.
   - Asigna un nombre al proyecto (ej. `tcg-ecosystem-prod`), una contraseña segura para la base de datos y selecciona la región más cercana (ej. `US East / North Virginia` o `Sao Paulo`).

2. **Ejecuta el Script SQL:**
   - En el menú lateral izquierdo de tu proyecto Supabase, entra a **SQL Editor** (ícono de consola).
   - Abre el archivo local [`supabase/schema.sql`](supabase/schema.sql).
   - Copia todo su contenido y pégalo en el editor SQL de Supabase.
   - Haz clic en el botón verde **"Run"**.
   - *¡Listo!* Se crearán automáticamente todas las tablas:
     - `tenants`, `tenant_products`, `global_products`, `orders`, `order_items`
     - `tournaments`, `tournament_matches`, `tournament_participants`
     - `auctions`, `auction_bids`, `auction_messages`
     - `virtual_binders`, `binder_cards`, `card_offers`, `offer_messages`
     - Políticas de seguridad **Row Level Security (RLS)** y la publicación **Realtime** vía WebSockets.

3. **Copia las Credenciales de tu API:**
   - En el menú lateral, ve a **Project Settings** (ícono de engranaje) -> **API**.
   - Copia dos valores fundamentales:
     - **Project URL:** `https://tu-proyecto.supabase.co`
     - **Project API Keys (`anon` / `public`):** `eyJh...`

---

### Paso 2: Configuración Local para Pruebas Inmediatas

Crea un archivo llamado `.env.local` en la raíz de la carpeta `tcg-manager` con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Al reiniciar el servidor de desarrollo (`npm run dev`), verás en la barra de navegación superior la insignia verde pulsante:
**"Supabase Realtime Activo"**.

---

### Paso 3: Despliegue en Vercel (Producción)

#### Opción A: Despliegue con GitHub (Recomendado)
1. Sube tu código a tu repositorio de GitHub:
   ```bash
   git add .
   git commit -m "feat: integracion completa con Supabase Realtime y configuracion de Vercel"
   git push origin main
   ```
2. Entra a [vercel.com](https://vercel.com) y haz clic en **"Add New..."** -> **"Project"**.
3. Importa tu repositorio `tcg-manager`.
4. En la sección **Environment Variables**, añade:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL de Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anónima pública de Supabase.
   - `NEXT_PUBLIC_APP_URL`: La URL que te asigne Vercel (ej. `https://tcg-manager.vercel.app`).
5. Haz clic en **"Deploy"**. En menos de 2 minutos tu plataforma estará en vivo en todo el mundo.

#### Opción B: Despliegue directo mediante Vercel CLI
```bash
npx vercel
```
Sigue las instrucciones en pantalla, vincula tu proyecto y cuando te solicite las variables de entorno, introduce tu `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

### Paso 4: Cómo Probar el Funcionamiento en Tiempo Real (Realtime)

1. **Prueba de Pujas en Subastas:**
   - Abre la misma subasta (ej. `/subastas/auc-001`) en dos ventanas o navegadores distintos (o un teléfono y una PC).
   - En una ventana, realiza una puja (ej. subir $100 MXN).
   - Observa cómo la otra ventana actualiza instantáneamente el precio más alto y agrega la nueva puja al historial sin recargar.

2. **Prueba de Chat y Envío de Comprobantes:**
   - En la sección de Chat de la subasta o de negociación de carpetas, escribe un mensaje o adjunta una foto desde una ventana.
   - El mensaje y la foto aparecerán al instante en la otra ventana con la indicación de purga automática en 48 horas post-cierre.

3. **Prueba de Descuento de Inventario:**
   - Abre el **ERP de Tienda (`/dashboard`)** en una ventana y el **Marketplace (`/marketplace`)** en otra.
   - Al comprar o reservar una carta en el Marketplace, el stock se descuenta en vivo en el inventario del Dashboard y suena una notificación auditiva (`playBeep`).
