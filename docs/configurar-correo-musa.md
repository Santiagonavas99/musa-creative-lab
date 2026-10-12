# Configurar Gmail SMTP para las cuentas de MUSA

Esta guía corresponde **solo** al proyecto de Supabase MUSA (`ygcusertmukfifwpnlkp`), bajo `musacreativelaboratory@gmail.com`. No cambiar configuraciones de Casa Clara ni NeoTeam.

## 1. Autorizar SMTP con Google (paso del propietario)

1. Entra en [Google Seguridad](https://myaccount.google.com/security) con **musacreativelaboratory@gmail.com**.
2. Activa **Verificación en dos pasos**, si aún no está habilitada.
3. Abre [Contraseñas de aplicaciones de Google](https://myaccount.google.com/apppasswords). Si la cuenta es elegible, crea una con el nombre `MUSA Supabase`.
4. Google te dará una contraseña de aplicación; **no es la contraseña de inicio de sesión habitual**. No la pegues en GitHub, Vercel, este chat ni ningún documento. Introdúcela **directamente en el formulario SMTP del panel de Supabase**.
5. Si la opción no aparece por restricciones de seguridad, no intentes desactivar protecciones. Usa un proveedor transaccional compatible con Supabase, como Brevo o Resend, siguiendo sus instrucciones de dominio.

Referencia: https://support.google.com/accounts/answer/185833

## 2. Completar Custom SMTP de Supabase

Abre [el panel del proyecto MUSA](https://supabase.com/dashboard/project/ygcusertmukfifwpnlkp) y dirígete a **Authentication → SMTP Settings** (o **Authentication → Settings → SMTP** si cambia la navegación). Habilita **Custom SMTP** y completa:

| Campo | Valor |
|---|---|
| Sender email | `musacreativelaboratory@gmail.com` |
| Sender name | `MUSA Creative Lab` |
| SMTP host | `smtp.gmail.com` |
| SMTP port | `465` |
| SMTP username | `musacreativelaboratory@gmail.com` |
| SMTP password | Contraseña de aplicación de Google, **solo en Supabase** |
| SSL/TLS | Activado, si la interfaz lo solicita |

Guarda la configuración. Si la conectividad con el puerto 465 da problemas, Supabase también documenta el puerto **587** para `smtp.gmail.com`; comprueba el ajuste TLS apropiado. No configures `smtp-relay.gmail.com` si estás usando el SMTP normal de Gmail.

Referencia: https://supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y

## 3. Autorizar enlaces de confirmación y recuperación

En **Authentication → URL Configuration**:

- **Site URL:** `https://musa-creative-lab.vercel.app`
- **Redirect URLs:** agrega `https://musa-creative-lab.vercel.app/**` (sin borrar otras que realmente utilices).
- Para probar la rama de registro **antes del merge**, agrega además la **URL exacta del preview actual de Vercel**, con el sufijo `/**`. Cada commit puede generar una URL nueva; verifica el preview desde el PR antes de probar correos.
- Revisa que **Authentication → Providers → Email** tenga Email habilitado, y que la confirmación de correo esté activada para validar el registro.
- No habilites `Autoconfirm` para saltarte los correos ni abras el registro público antes de verificar los mensajes.

Referencia: https://supabase.com/docs/guides/auth/redirect-urls

## 4. Prueba de aceptación

Desde el **preview del PR de MUSA** (no desde el sitio de producción, que aún no tiene el sistema):

1. Abre **Crear cuenta** y usa `loto1998k@gmail.com`.
2. Define una contraseña de al menos 8 caracteres (nunca la compartas con el asistente).
3. Confirma que llega el correo y que el enlace regresa al mismo preview autorizado.
4. Comprueba que puedes entrar, activar **Recordarme**, crear una idea favorita, cerrar y reabrir la pestaña y conservar la sesión y el favorito.
5. Prueba recuperación de contraseña, verifica que llega el correo y que puedes actualizarla.
6. Con una **segunda cuenta de prueba**, comprueba que la galería, búsquedas, historial, sesiones y favoritos de la primera no aparecen.
7. Revisa **Authentication → Users**: la primera cuenta debe figurar confirmada; las contraseñas no deben ser visibles.
8. Revisa los workflows CI de PR #8 y el estado de Preview en Vercel. **Solo fusionar a main cuando los correos y el aislamiento estén confirmados.**

## Notas de alcance

- **Gmail personal es adecuado como prueba inicial**, pero no debe considerarse solución de entrega garantizada para una base grande de usuarios.
- Supabase ofrece un servidor SMTP predeterminado limitado a destinatarios autorizados del equipo; Gmail SMTP personalizado es necesario para registrar terceros sin un servicio alternativo.
- El dominio gratuito `*.vercel.app` sirve para los enlaces de confirmación y recuperación. No hace falta comprar dominio para el MVP.
- La conexión SMTP no se configura mediante variables de Vercel: las credenciales se guardan en **Supabase**.
