# MUSA Creative Lab

**MUSA Creative Laboratory** es una aplicación web experimental para explorar la creatividad con ideas, retos, sesiones y referencias visuales.

## MVP actual

- Generador de ideas creativas y retos.
- Sesiones con temporizador.
- Galería de obras con fotos, reflexiones e historial.
- Ideas y referencias visuales favoritas.
- Explorador visual con buscador interno: Unsplash, The Met, Art Institute of Chicago y Wikimedia Commons.
- Carrusel **CircularCarousel** de React Bits en Explorar, justo después de “¿Y si probamos algo raro?”, alimentado por las mismas fuentes, con referencias aleatorias en cada recarga y enlaces a las obras originales.\n- Búsquedas externas a Pinterest y Behance (sin integración API oficial todavía).
- Páginas públicas: [Política de Privacidad](https://musa-creative-lab.vercel.app/politica-de-privacidad/) y [Términos de Uso](https://musa-creative-lab.vercel.app/terminos-de-uso/).

## Código y despliegue

La interfaz principal utiliza HTML, CSS y JavaScript; el carrusel se monta en una isla React con Vite, sin migrar el resto de la aplicación. la ruta \`api/inspiration.js\` es una función serverless en Vercel. \`main\` despliega automáticamente en [MUSA](https://musa-creative-lab.vercel.app/); las pull requests crean previsualizaciones para probar cambios.

La búsqueda de Unsplash requiere \`UNSPLASH_ACCESS_KEY\`, configurada en el servidor como variable de entorno de Vercel. **Nunca guardes secretos en el repositorio ni los envíes al navegador.**

## Privacidad

El MVP guarda obras, imágenes, favoritos y sesiones mediante \`localStorage\`, en el navegador del usuario, sin registro ni sincronización. Los términos consultados en el explorador pasan por una función de MUSA y los servicios de imágenes seleccionados.

Si se añaden cuentas, guardado en la nube, Pinterest OAuth o analítica, deberán actualizarse la Política de Privacidad, los permisos y las medidas de seguridad antes de desplegar.

Contacto de privacidad: **musacreativelaboratory@gmail.com**.

## Pruebas

GitHub Actions ejecuta \`node scripts/check-static.cjs\` para validar JavaScript y comprobar el flujo básico de búsqueda y guardado de referencias. La rama \`main\` debe fusionarse tras pruebas satisfactorias.
