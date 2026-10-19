# Cambios al terminar MatchPoint

El diseño se conservó: misma estructura de páginas, colores, tipografías, imágenes y textos. Estos son los cambios y por qué se hicieron.

## Bugs corregidos

- **El menú no funcionaba en celular.** El botón de hamburguesa existía, pero no tenía código: en un celular no había forma de pasar a otra página. Ahora abre un panel con las cinco páginas, marca la actual y se cierra con Escape, tocando fuera o al elegir un enlace. Mientras está abierto, la página de atrás no se desplaza.
- **Enlaces muertos.** Había seis `href="#"` (cinco en Calendario y uno en Resultados). Ahora llevan a destinos reales, por ejemplo a la tabla de la liga correspondiente (`posiciones.html#laliga`).
- **Faltaba `<main>`** en las cinco páginas, lo que dificulta la navegación con lector de pantalla.
- **Voseo**: "Seguí", "Explorá" y similares pasaron a español neutro ("Sigue", "Explora").

## Funcionalidades nuevas (JavaScript)

- **Equipo favorito** (`js/main.js`): la estrella guarda el equipo en `localStorage` y lo resalta en Resultados, Calendario, Posiciones y el ticker. El resaltado usa una estrella además del color, para no depender solo del color. Si el navegador bloquea el almacenamiento, el favorito sigue funcionando en la página actual.
- **Filtros** (`js/filtros.js`): por liga, búsqueda por equipo que ignora tildes y mayúsculas y entiende siglas ("BVB"), y "Solo mi equipo". Cuando no hay coincidencias aparece un estado vacío con un botón para quitar los filtros. Los cambios se anuncian a lectores de pantalla.
- **Tabla de posiciones** (`js/posiciones.js`): pestañas por liga con teclado (flechas, Inicio, Fin), la liga activa en la dirección para compartirla, y orden por columna. En los empates se respeta la posición original.
- **Pausa del ticker**: el carrusel de marcadores tiene un botón de pausa que se recuerda entre páginas. Con "reducir movimiento" activado en el sistema, el ticker se queda quieto.
- **Mejora progresiva**: sin JavaScript se ve todo el contenido, como antes.

## Accesibilidad

- Enlace "Saltar al contenido" en todas las páginas.
- Foco de teclado visible con el amarillo de la marca.
- Página actual marcada con `aria-current="page"`.
- Botones y estrellas con área táctil de al menos 44 px, sin agrandar las filas de la tabla.
- Pestañas con los roles ARIA de pestañas, y encabezados ordenables con `aria-sort`.

## Rendimiento

- **Tailwind compilado.** Antes cada página cargaba el Play CDN de Tailwind, que genera el CSS en el navegador en cada visita y no está pensado para producción. Ahora la configuración vive en `tailwind.config.js` y se compila una vez a `css/tailwind.css` (ver README). Se comparó con capturas antes y después para confirmar que se ve igual.
- **Imágenes en WebP**: las fotos JPG (la del estadio pesaba 606 KB) se convirtieron a WebP y se agregaron versiones más pequeñas para celular. Las carpetas de imágenes pasaron de 2,6 MB a 1,7 MB, y lo que descargan las cinco páginas juntas bajó de unos 3,2 MB a 2,3 MB.
- `width` y `height` en las imágenes para evitar saltos de contenido, y carga diferida (`loading="lazy"`) en las que no se ven al abrir.

## Contenido y metadatos

- `meta description` y Open Graph en cada página.
- Favicon (`favicon.svg`) con el logo "MP".
- `package.json` con los comandos para compilar el CSS y `.gitignore` para no subir `node_modules`.

## Seguridad para publicar

- `netlify.toml` con cabeceras de seguridad: política de contenido (`Content-Security-Policy`) que solo permite los recursos que el sitio usa, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HTTPS obligatorio. Se probó en Chromium con esas cabeceras: todas las páginas cargan sin violaciones y pasan las mismas pruebas de antes.
- Caché del navegador: 30 días para imágenes y 1 hora para CSS y JS, para que quien vuelve no descargue todo otra vez.
- `.gitignore` para no subir por error archivos `.env`, la carpeta `.netlify/`, `node_modules/` ni archivos del editor o del sistema.
- Los 70 `style="clip-path: …"` del HTML pasaron a dos clases en `css/estilos.css` (`corte-diagonal` y `corte-esquina`). Se ve igual (comparado píxel a píxel) y la política de contenido no necesita permitir estilos en línea.
