# Navegación MUSA / Navigation 15

La navegación de MUSA conserva cuatro rutas internas y el menú hamburguesa actual. El subrayado móvil no se usa: el efecto de recorrido queda limitado al menú horizontal de escritorio y al foco del teclado.

## Estado de integración

- **Interacción equivalente de Navigation 15**: implementada en `public/nav-motion.js` y `public/nav-motion.css` sin migrar el menú de MUSA ni cambiar textos, rutas o el estado activo.
- **React Bits Pro**: registries configurados en `components.json` con `Authorization: Bearer ${REACTBITS_LICENSE_KEY}`.
- **Bloque original licenciado**: **pendiente**. No hay una `REACTBITS_LICENSE_KEY` disponible en este proyecto, por lo que no se ha descargado ni instalado el bloque de pago. No se ha suplantado ni copiado código privado.

## Instalar el bloque oficial más adelante

1. Configurar una licencia React Bits **Pro o Ultimate** propia en `.env.local` (`REACTBITS_LICENSE_KEY=...`) manteniéndola fuera de Git. No ponerla en código frontend ni exponerla como `VITE_*`.
2. Inicializar shadcn/ui de manera compatible con el actual Vite/React del proyecto y verificar los aliases (sin convertir la navegación principal en React ni alterar el carrusel).
3. Desde la raíz del proyecto, ejecutar:

```bash
npx shadcn@latest add @reactbits-pro/navigation-15
```

4. Revisar el código instalado y **extraer solo el comportamiento de underline** a la navegación existente, manteniendo `Inicio`, `Explorar`, `Mi estudio`, `Actividad`, la pastilla activa #D7FF42 sin subrayado y el hover más claro #EFFFD0. Probar mobile, focus, navegación entre rutas, hover sobre el ítem activo y reduced motion.

La implementación actual entrega ya el comportamiento visual solicitado mientras la descarga Pro está bloqueada por credenciales. La licencia es personal: no publicarla en GitHub, Vercel Preview ni chats.
