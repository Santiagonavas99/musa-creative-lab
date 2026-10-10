# MUSA Creative Lab

MUSA es una aplicación web de inspiración y exploración creativa personal.

## Estado actual (MVP 1.0)

- Generador de ideas creativas
- Retos creativos
- Sesiones con temporizador
- Galería personal con imágenes
- Ideas favoritas
- Historial creativo
- Búsquedas externas a Pinterest, Behance, Unsplash y archivos de museos

Este repositorio contiene **la versión estática exacta recuperada del despliegue de Vercel** antes de conectar GitHub. La aplicación usa `localStorage`; todavía **no tiene backend, sincronización entre dispositivos ni integración interna con APIs**.

## Despliegue

El sitio consiste en `index.html` y `manifest.webmanifest` y no requiere compilación ni instalación de dependencias.

Conecta este repositorio en el proyecto de Vercel `musa-creative-lab`, usando rama de producción `main`, framework **Other** y directorio raíz `./`. Cada push a `main` generará un despliegue tras establecer la conexión Git en Vercel.

## Seguridad

No incluyas claves API en `index.html` ni en Git. Cuando conectemos Unsplash utilizaremos `UNSPLASH_ACCESS_KEY` configurada en variables de entorno de Vercel y una función de servidor que gestione las peticiones y atribuciones requeridas.

## Datos y privacidad

El MVP guarda favoritos, obras, sesiones e imágenes localmente en el navegador, sin sincronización. No se recomienda para almacenamiento definitivo de obras.
