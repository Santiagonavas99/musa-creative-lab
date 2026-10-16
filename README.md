# MUSA Creative Lab

**MUSA Creative Laboratory** es una aplicación web experimental para explorar la creatividad con ideas, retos, sesiones y referencias visuales.

## MVP actual

- Generador de ideas creativas y retos.
- Sesiones con temporizador.
- Galería de obras con fotos, reflexiones e historial.
- Ideas favoritas y **tableros de inspiración** personalizables: crear/renombrar, guardar una referencia en varios tableros y quitarla sin afectar los demás. Las referencias antiguas se migran a «Sin clasificar» en este navegador.
- Explorador visual con buscador interno: Unsplash, The Met, Art Institute of Chicago y Wikimedia Commons.
- Carrusel **CircularCarousel** de React Bits en Explorar, justo después de “¿Y si probamos algo raro?”, alimentado por las mismas fuentes, con referencias aleatorias en cada recarga y enlaces a las obras originales.
- Búsquedas externas a Pinterest y Behance (sin integración API oficial todavía).
- Páginas públicas: [Política de Privacidad](https://musa-creative-lab.vercel.app/politica-de-privacidad/) y [Términos de Uso](https://musa-creative-lab.vercel.app/terminos-de-uso/).

## Código y despliegue

La interfaz principal utiliza HTML, CSS y JavaScript; el carrusel se monta en una isla React con Vite, sin migrar el resto de la aplicación. La ruta \`api/inspiration.js\` es una función serverless en Vercel. \`main\` despliega automáticamente en [MUSA](https://musa-creative-lab.vercel.app/); las pull requests crean previsualizaciones para probar cambios.

La búsqueda de Unsplash requiere \`UNSPLASH_ACCESS_KEY\`, configurada en el servidor como variable de entorno de Vercel. **Nunca guardes secretos en el repositorio ni los envíes al navegador.**

## Cuentas privadas y despliegue

- Autenticación: Supabase Auth, confirmación de correo, recuperación y Recordarme.
- Datos por usuario: `public.musa_workspaces`, protegido mediante RLS por `auth.uid()` para búsquedas, retos, favoritos, obras, referencias y tableros.
- Fotografías: bucket privado `musa-artworks` con URLs firmadas.
- Proyecto Supabase independiente de MUSA: `ygcusertmukfifwpnlkp`. No usar Casa Clara ni NeoTeam.
- Variables en Vercel: `MUSA_SUPABASE_URL` y `MUSA_SUPABASE_PUBLISHABLE_KEY`; nunca exponer service_role.
- Confirmaciones: `https://musa-creative-lab.vercel.app/auth/callback`. El Site URL y Redirect URLs se configuran en Supabase Auth.
- SMTP actual de prueba: `loto1998k@gmail.com`, sustituible por `musacreativelaboratory@gmail.com`. [Guía SMTP](docs/configurar-correo-musa.md).
- Importación de datos `musa-v1` solo tras autorización explícita del dueño de la cuenta.
- Pruebas: `node scripts/check-static.cjs`, `node --test tests/auth.test.cjs tests/auth-routes.test.cjs` y `npm run build`.

## Privacidad

La aplicación guarda obras, favoritos, sesiones y tableros en Supabase con separación por cuenta; los datos antiguos del navegador requieren importación voluntaria. Los términos consultados en el explorador pasan por una función de MUSA y los servicios de imágenes seleccionados.

Para introducir Pinterest OAuth u otras integraciones, actualizar privacidad y permisos antes de desplegar.

Contacto de privacidad: **musacreativelaboratory@gmail.com**.

## Pruebas

GitHub Actions ejecuta \`node scripts/check-static.cjs\` para validar JavaScript y comprobar el flujo básico de búsqueda y guardado de referencias. La rama \`main\` debe fusionarse tras pruebas satisfactorias.
