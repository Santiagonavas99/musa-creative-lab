# MUSA — Pull requests, CI y Vercel Preview

## Principio de seguridad

Cada mejora se crea desde main en su propia rama de funcionalidad, corrección, prueba o CI. Se abre un pull request en borrador y se prueba usando la URL Preview que Vercel genera para esa rama. El Preview no cambia el dominio principal. No fusionar ni desplegar con --prod durante la revisión.

## Cómo revisar cada PR

1. Abre el PR en GitHub y revisa la pestaña Checks; las comprobaciones deben pasar.
2. En GitHub → Conversation / Deployments, abre el enlace Visit Preview de Vercel. Alternativamente, Vercel → proyecto musa-creative-lab → Deployments → despliegue con nombre de la rama y entorno Preview.
3. Confirma Ready. Si el despliegue indica Error, revisa los build logs y corrige el PR. Ready por sí solo no garantiza que el código funcione.
4. Prueba las rutas afectadas en móvil y escritorio. Comprueba inicio, privacidad y términos cuando el cambio tenga impacto global.
5. Si afecta el explorador, prueba búsqueda, cambio de proveedores, atribuciones, enlaces de origen y referencias guardadas.
6. Revisa errores de consola y respuestas Network. Valida el comportamiento sin credenciales si corresponde.
7. Solo después de revisar, pasa el PR a Ready for review y solicita aprobación. Fusiona si los checks obligatorios están verdes y hay revisión explícita.

## Seguridad y configuración

- La rama de producción de Vercel es main. Las demás ramas tienen deploys Preview automáticos por la integración Git existente.
- La cuenta de Vercel tiene protección de autenticación para los Previews. Accede mediante tu sesión autorizada o usa una opción de compartir con autorización temporal; nunca desactives SSO global para facilitar una prueba.
- Revisa Vercel → Project Settings → Environment Variables. Si quieres buscar en Unsplash desde Preview, asigna UNSPLASH_ACCESS_KEY al target Preview; jamás incluyas su valor en commits, comentarios o capturas.
- El MVP guarda información en localStorage. Cuando incorpore Supabase u otra base remota, usa un proyecto de pruebas para Preview: no apuntes los Previews a los datos reales de producción.
- Cuando se agreguen OAuth y cuentas, separa URL de callback de Preview y entornos de autenticación antes de hacer pruebas con usuarios.
- Si Preview falla por configuración, documenta el problema y resuélvelo en Vercel; no codifiques valores secretos en archivos públicos.

## Protección obligatoria de main (paso manual)

Los workflows ejecutan comprobaciones, pero por sí solos no impiden fusionar. Configura en GitHub → Settings → Rules → Rulesets (o Branches) una regla para main que:

1. Exija pull request para fusionar, con aprobación si hay colaboradores.
2. Exija checks de GitHub Actions: Static syntax + UI smoke + site contracts y API request validation + provider normalization cuando estén integrados.
3. Exija el check de Vercel que confirme que se desplegó el Preview correctamente.
4. Bloquee force pushes y eliminación de main.

La conexión de GitHub actual no permite configurar reglas de protección mediante este PR. Este documento no instala esas reglas automáticamente.

## Orden de integración recomendado

1. PR de CI estático y contratos del sitio.
2. PR de tests de la API de inspiración.
3. PR del proceso de QA y Previews.
4. Nuevas funcionalidades como cuentas individuales y desafíos, cada una con su PR y Preview propios.

Tras subir un commit, revisa el enlace al despliegue más reciente de la rama; cada push puede crear un Preview nuevo.
