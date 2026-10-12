# MUSA Creative Laboratory

MUSA es un laboratorio creativo personal con **registro de cuentas privadas**, retos, temporizador, galería personal, favoritos, búsquedas visuales e historial creativo.

## Arquitectura y despliegue

- Frontend: \`index.html\` (CSS + JS), y \`auth.js\` (gestor de Supabase Auth, persistencia, trabajo personal y fotos).
- APIs de Vercel: \`api/inspiration.js\` (buscador) y \`api/auth-config.js\` (datos **públicos** de Supabase; nunca service-role).
- Supabase de MUSA: proyecto \`ygcusertmukfifwpnlkp\`, región \`us-east-2\` (Ohio). **No usar** proyectos Casa Clara ni NeoTeam.
- Base de datos: tabla \`public.musa_workspaces\` (JSONB, una fila por usuario, RLS por \`auth.uid()\`).
- Fotos: bucket **privado** \`musa-artworks\`, rutas \`<uid>/<id>.jpg\`, URLs firmadas de duración limitada.
- Migración versionada: \`supabase/migrations/20261012_musa_private_workspaces.sql\`.
- La rama \`main\` se despliega automáticamente en https://musa-creative-lab.vercel.app. Los PR se revisan en previews de Vercel.

### Variables de Vercel

Las siguientes variables están configuradas para Preview, Production y Development. **No incluyas claves secretas en GitHub ni en el HTML.**

- \`MUSA_SUPABASE_URL\`: URL del proyecto MUSA.
- \`MUSA_SUPABASE_PUBLISHABLE_KEY\`: clave pública de Supabase para acceso bajo RLS (no es secreta).
- \`UNSPLASH_ACCESS_KEY\`: clave privada de Unsplash (solo backend).

\`api/auth-config.js\` expone únicamente la URL y la clave **publicable** de Supabase, que la biblioteca JS necesita en el navegador; nunca usar \`service_role\`.

### Activación del correo de confirmación y recuperación

En el **panel del proyecto MUSA** de Supabase, en *Authentication → URL Configuration*:
- **Site URL:** \`https://musa-creative-lab.vercel.app\`
- **Redirect URLs:** \`https://musa-creative-lab.vercel.app/**\` (y, durante las pruebas, únicamente los previews explícitos aprobados).
- Confirmación de correo habilitada, salvo que se tome una decisión explícita de desactivarla.
- Configurar SMTP personalizado antes de invitar usuarios masivamente; el correo incorporado de Supabase está destinado a pruebas y está limitado.

Sin las URL autorizadas los enlaces de confirmación y recuperación podrían redirigir a la dirección por defecto del proyecto y no volver a MUSA.

### Primera cuenta

Registro inicial previsto: **loto1998k@gmail.com**. La persona titular deberá completar el formulario de registro y crear su contraseña; no generamos contraseñas en el chat ni las guardamos en GitHub.

### Aislamiento y migración de datos anteriores

- Las búsquedas, favoritos, retos completados, sesiones, obras e imágenes se mantienen por usuario autenticado.
- Supabase Auth mantiene la sesión en localStorage si marcas **Recordarme**, o en sessionStorage de la pestaña si no marcas.
- El viejo \`musa-v1\` de localStorage **no** se asigna automáticamente a cuentas nuevas. La importación solo puede solicitarla el usuario que sabe que son sus datos.
- La cuenta debe estar autenticada para mostrar el estudio; las reglas RLS impiden lecturas y escrituras cruzadas incluso si se manipula la interfaz.
- Si falla una sincronización, avisa al usuario y no permite salir silenciosamente mientras la última escritura falle.

## Pruebas

En cada PR, GitHub Actions valida:
- \`node scripts/check-static.cjs\` (sintaxis, UI, buscador, rutas legales).
- \`node --test tests/auth.test.cjs\` (simulación de dos cuentas, separación de datos, opción Recordarme).
- \`node --test tests/site.test.cjs\` (contratos generales del sitio).
- Contratos de API con el flujo existente \`MUSA API contracts\`.

## Plataformas de inspiración

Integración interna: Unsplash, The Metropolitan Museum of Art, Art Institute of Chicago y Wikimedia Commons.
Pinterest y Behance permanecen como enlaces externos hasta disponer de una API y permisos adecuados.

Política de privacidad: https://musa-creative-lab.vercel.app/politica-de-privacidad/
Contacto: musacreativelaboratory@gmail.com
