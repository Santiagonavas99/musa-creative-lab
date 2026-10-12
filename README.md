# MUSA Creative Lab

**MUSA Creative Laboratory** es una aplicación web experimental para explorar la creatividad con ideas, retos, sesiones y referencias visuales.

## MVP actual

- Registro por correo y contraseña con Supabase Auth, «Recordarme» y recuperación de contraseña.
- Generador de ideas creativas y retos con progreso personal.
- Sesiones con temporizador.
- Galería de obras con fotos, reflexiones e historial.
- Ideas y referencias visuales favoritas.
- Explorador visual con buscador interno: Unsplash, The Met, Art Institute of Chicago y Wikimedia Commons.
- Carrusel **CircularCarousel** de React Bits en Explorar, justo después de “¿Y si probamos algo raro?”, alimentado por las mismas fuentes, con referencias aleatorias en cada recarga y enlaces a las obras originales.
- Búsquedas externas a Pinterest y Behance (sin integración API oficial todavía).
- Páginas públicas: [Política de Privacidad](https://musa-creative-lab.vercel.app/politica-de-privacidad/) y [Términos de Uso](https://musa-creative-lab.vercel.app/terminos-de-uso/).

## Código y despliegue

La interfaz principal utiliza HTML, CSS y JavaScript, el carrusel se monta en una isla React con Vite y el sistema de cuentas se implementa en `public/auth.js` para incluirse correctamente en `dist`. La ruta \`api/inspiration.js\` es una función serverless en Vercel. \`main\` despliega automáticamente en [MUSA](https://musa-creative-lab.vercel.app/); las pull requests crean previsualizaciones para probar cambios.

La búsqueda de Unsplash requiere \`UNSPLASH_ACCESS_KEY\`, configurada en el servidor como variable de entorno de Vercel. **Nunca guardes secretos en el repositorio ni los envíes al navegador.**

## Datos y privacidad

Las cuentas se alojan **exclusivamente en el proyecto Supabase MUSA** `ygcusertmukfifwpnlkp` (`us-east-2`). No utilizar los proyectos de Casa Clara ni de NeoTeam.

El registro, autenticación y recuperación usan Supabase Auth. Favoritos, búsquedas, progreso de retos, sesiones e historial se guardan en `public.musa_workspaces`, una fila por usuario con políticas **RLS**. Las fotografías se guardan en el bucket privado `musa-artworks` con URLs firmadas.

La sesión solo se mantiene permanentemente si el usuario marca **Recordarme**. Las obras antiguas almacenadas en `localStorage` se importan solo con la confirmación explícita de su propietario.

Variables configuradas en Vercel: `MUSA_SUPABASE_URL` y `MUSA_SUPABASE_PUBLISHABLE_KEY` (publicable, nunca usar `service_role` en navegador). `api/auth-config.js` suministra los datos públicos al cliente.

**Antes de activar el registro en producción:** configurar Site URL, Redirect URLs y Custom SMTP en el panel de Supabase MUSA. La guía está en [Configurar Gmail SMTP](docs/configurar-correo-musa.md). Gmail no requiere dominio propio para la primera prueba.

Primera cuenta solicitada: `loto1998k@gmail.com`. Su propietario debe registrarla y elegir su contraseña cuando la confirmación por correo funcione.

Migración: `supabase/migrations/20261012_musa_private_workspaces.sql` (ya aplicada al proyecto correcto de MUSA).



Contacto de privacidad: **musacreativelaboratory@gmail.com**.

## Pruebas

GitHub Actions ejecuta `node scripts/check-static.cjs`, `node --test tests/auth.test.cjs` y `node --test tests/site.test.cjs` para validar la interfaz, el carrusel y el aislamiento entre cuentas. La rama \`main\` debe fusionarse tras pruebas satisfactorias.
