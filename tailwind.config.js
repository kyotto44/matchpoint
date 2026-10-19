/**
 * Configuración de Tailwind CSS v3 para MatchPoint.
 * Antes vivía en un <script> dentro de cada página (Play CDN); ahora se compila a css/tailwind.css.
 * Comando: npm run build:css  (ver README.md)
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  // relative: true hace que las rutas se lean desde esta carpeta, sin importar desde dónde se ejecute el comando.
  // Se incluyen los .js porque ahí se arman botones (estrella de favorito, orden de la tabla) con clases de Tailwind.
  content: {
    relative: true,
    files: ['./*.html', './js/**/*.js'],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        zinc: {
          // Gris intermedio entre zinc-500 y zinc-400: mismo tono, pero con contraste AA
          // (5.4:1 sobre zinc-950 y 4.8:1 sobre zinc-900) para textos pequeños secundarios.
          450: '#84848d',
        },
      },
    },
  },
  plugins: [],
};
