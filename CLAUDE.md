# Faro Digital — contexto para Claude

Este archivo es público (el repositorio y GitHub Pages son públicos). No pongas aquí
correos privados, cuentas, contraseñas, claves ni notas internas del negocio.

## Quién
- Julio C. Chinea, pastor, dueño de Faro Digital. No es programador.
- Háblale en español sencillo, paso a paso. Envía capturas de pantalla para revisar.
- Su teléfono Android está en inglés: da los nombres de menús y botones en inglés.
- Trabaja desde varias computadoras: **todo se guarda en GitHub** (commit + push al
  terminar cada cambio). No dejes trabajo solo en archivos locales.

## El negocio
- Páginas web bilingües (español/inglés) para iglesias y escuelas/academias cristianas.
- Ya no se dirige a negocios en general y no se menciona "Fort Myers" en el sitio.
- Nunca inventes testimonios ni reseñas. Las 5 estrellas aparecen una sola vez.
- No mostrar trabajos pasados (MCA, Rosa de Sarón) en el sitio.

## El sitio
- Publicado en https://farodigitalfl.com con GitHub Pages (archivo `CNAME`).
- Páginas: index, iglesias, escuelas, servicios, proceso, contacto, más 4 páginas SEO
  (iglesias hispanas, escuela cristiana bilingüe, ofrendas en línea, qué debe tener la
  página de una iglesia). `sitemap.xml` y `robots.txt` en la raíz.
- Estilos y scripts compartidos: `assets/site.css`, `assets/site.js`, tokens en
  `assets/faro.css`. Medición en `assets/track.js` (Supabase: tablas `leads` y `events`)
  y Microsoft Clarity en todas las páginas.
- Cuando cambie CSS/JS, sube el `?v=N` de los enlaces en todos los `.html` (caché).

## Marca (v4) — ver `brand.html`
- Logo: palabra "FARO" (A sin barra, la O es un aro naranja neón); símbolo = el aro con punto.
- Colores: grafito #171A20, blanco, niebla #F4F4F4, neón #FF5E00 (texto sobre neón siempre
  grafito), neón para texto #C24600. Letra: Figtree.
- Estilo: paneles de foto a pantalla completa, botones de 4px, menú transparente que se
  vuelve blanco, bloques de color 50/50, botones redondeados, pie de página en columnas.
- A Julio NO le gusta lo que parece hecho por IA: decoraciones inventadas (órbitas, puntos
  flotantes, líneas que caen), títulos en cursiva con cambio de color, filas apretadas,
  pantallas curvas o giradas. Le gusta el color vivo y las interacciones reales al pasar
  el mouse.

## Pendientes
- Definir precios de los paquetes (propuesta hecha el 27 nov 2026, esperando decisión).
- DBA o LLC en Sunbiz.
- Perfil de Google Business.
- WhatsApp Business con la foto de perfil nueva.
- Gmail "Enviar como" para los correos del dominio.
- Buscar los primeros clientes (empezar por iglesias conocidas).
