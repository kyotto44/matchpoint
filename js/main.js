/*
 * MatchPoint: código compartido por las 5 páginas.
 *  1. Menú de navegación en celular.
 *  2. Pausa del carrusel de resultados (ticker).
 *  3. Equipo favorito: se guarda en localStorage y se resalta en todo el sitio.
 *
 * Se carga con <script defer>, así que el HTML ya está listo cuando corre.
 * Expone window.MatchPoint para que filtros.js y posiciones.js usen el favorito.
 */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------
   * Almacenamiento: localStorage puede fallar (modo privado, bloqueado),
   * por eso todo pasa por try/catch y el sitio sigue funcionando sin él.
   * ------------------------------------------------------------------ */
  var almacen = {
    leer: function (clave) {
      try {
        return window.localStorage.getItem(clave);
      } catch (error) {
        return null;
      }
    },
    guardar: function (clave, valor) {
      try {
        window.localStorage.setItem(clave, valor);
        return true;
      } catch (error) {
        return false;
      }
    },
    borrar: function (clave) {
      try {
        window.localStorage.removeItem(clave);
      } catch (error) {
        /* Sin almacenamiento disponible: no hay nada que borrar. */
      }
    }
  };

  /* ------------------------------------------------------------------
   * 1. Menú móvil
   * ------------------------------------------------------------------ */
  function iniciarMenu() {
    var boton = document.querySelector('[data-menu-boton]');
    var panel = document.getElementById('menu-movil');
    var fondo = document.querySelector('[data-menu-fondo]');
    if (!boton || !panel) return;

    var cabecera = boton.closest('header');
    var escritorio = window.matchMedia('(min-width: 768px)');
    var abierto = false;
    var temporizador = null;

    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') {
        cerrar(true);
      }
    }

    function abrir() {
      if (abierto) return;
      abierto = true;
      window.clearTimeout(temporizador);
      panel.hidden = false;
      if (fondo) fondo.hidden = false;
      // Se fuerza un cálculo de estilos para que la transición parta del estado cerrado.
      void panel.offsetHeight;
      panel.classList.add('is-abierto');
      if (fondo) fondo.classList.add('is-abierto');
      boton.setAttribute('aria-expanded', 'true');
      boton.setAttribute('aria-label', 'Cerrar menú');
      raiz.classList.add('menu-abierto');
      document.addEventListener('keydown', alPresionarTecla);
    }

    function cerrar(devolverFoco) {
      if (!abierto) return;
      abierto = false;
      panel.classList.remove('is-abierto');
      if (fondo) fondo.classList.remove('is-abierto');
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-label', 'Abrir menú');
      raiz.classList.remove('menu-abierto');
      document.removeEventListener('keydown', alPresionarTecla);
      // Se oculta del todo cuando termina la transición de salida (150 ms).
      temporizador = window.setTimeout(function () {
        if (!abierto) {
          panel.hidden = true;
          if (fondo) fondo.hidden = true;
        }
      }, movimientoReducido.matches ? 0 : 160);
      if (devolverFoco) boton.focus();
    }

    boton.addEventListener('click', function () {
      if (abierto) {
        cerrar(false);
      } else {
        abrir();
      }
    });

    if (fondo) {
      fondo.addEventListener('click', function () {
        cerrar(false);
      });
    }

    panel.addEventListener('click', function (evento) {
      if (evento.target.closest('a')) cerrar(false);
    });

    // Si el foco sale de la cabecera con Tab, el menú se cierra solo.
    cabecera.addEventListener('focusout', function (evento) {
      if (abierto && evento.relatedTarget && !cabecera.contains(evento.relatedTarget)) {
        cerrar(false);
      }
    });

    // Al pasar a pantalla de escritorio el menú móvil deja de tener sentido.
    var alCambiarTamano = function (consulta) {
      if (consulta.matches) cerrar(false);
    };
    if (escritorio.addEventListener) {
      escritorio.addEventListener('change', alCambiarTamano);
    } else if (escritorio.addListener) {
      escritorio.addListener(alCambiarTamano);
    }
  }

  /* ------------------------------------------------------------------
   * 2. Ticker: botón de pausa (WCAG 2.2.2) que se recuerda entre páginas
   * ------------------------------------------------------------------ */
  function iniciarTicker() {
    var ticker = document.querySelector('[data-ticker]');
    if (!ticker) return;
    var boton = ticker.querySelector('[data-ticker-boton]');
    if (!boton) return;

    var CLAVE = 'matchpoint:ticker-pausado';
    var iconoPausa = boton.querySelector('[data-icono-pausa]');
    var iconoPlay = boton.querySelector('[data-icono-play]');

    function aplicar(pausado) {
      ticker.classList.toggle('is-pausado', pausado);
      boton.setAttribute('aria-pressed', pausado ? 'true' : 'false');
      if (iconoPausa) iconoPausa.hidden = pausado;
      if (iconoPlay) iconoPlay.hidden = !pausado;
      boton.title = pausado ? 'Reanudar el carrusel' : 'Pausar el carrusel';
    }

    aplicar(almacen.leer(CLAVE) === '1');
    boton.hidden = false;

    boton.addEventListener('click', function () {
      var pausado = boton.getAttribute('aria-pressed') !== 'true';
      aplicar(pausado);
      if (pausado) {
        almacen.guardar(CLAVE, '1');
      } else {
        almacen.borrar(CLAVE);
      }
    });
  }

  /* ------------------------------------------------------------------
   * 3. Equipo favorito
   *    Cada nombre de equipo del sitio lleva data-team="id" (el mismo id en
   *    todas las páginas). Se guarda { id, nombre } en localStorage.
   * ------------------------------------------------------------------ */
  var CLAVE_FAVORITO = 'matchpoint:equipo-favorito';
  var oyentes = [];
  var favorito = leerFavorito();

  function leerFavorito() {
    var crudo = almacen.leer(CLAVE_FAVORITO);
    if (!crudo) return null;
    try {
      var dato = JSON.parse(crudo);
      if (dato && typeof dato.id === 'string' && typeof dato.nombre === 'string') {
        return { id: dato.id, nombre: dato.nombre };
      }
    } catch (error) {
      /* Valor dañado: se ignora y se trata como "sin favorito". */
    }
    return null;
  }

  function definirFavorito(nuevo) {
    favorito = nuevo;
    if (nuevo) {
      almacen.guardar(CLAVE_FAVORITO, JSON.stringify(nuevo));
    } else {
      almacen.borrar(CLAVE_FAVORITO);
    }
    pintarFavorito();
    avisar();
  }

  function avisar() {
    oyentes.forEach(function (oyente) {
      oyente(favorito);
    });
  }

  var ICONO_ESTRELLA =
    '<svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><path class="estrella" stroke="currentColor" ' +
    'stroke-width="1.75" stroke-linejoin="round" d="M12 2.75l2.83 5.73 6.32.92-4.57 4.46 1.08 6.29L12 17.18l-5.66 2.97 ' +
    '1.08-6.29L2.85 9.4l6.32-.92z"/></svg>';

  var CLASES_BOTON = {
    // Sobre la foto de la tarjeta de equipos
    tarjeta:
      'boton-fav absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-md ' +
      'border border-white/10 bg-zinc-950/60 text-zinc-300 backdrop-blur-sm transition ' +
      'hover:border-white/25 hover:text-amber-400 active:scale-95 aria-pressed:border-amber-400/70 ' +
      'aria-pressed:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
    // Dentro de la fila de la tabla de posiciones
    fila:
      'boton-fav boton-fav-fila relative -my-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ' +
      'text-zinc-500 transition hover:text-amber-400 active:scale-95 aria-pressed:text-amber-400 ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
  };

  function crearBotonEstrella(variante, id, nombreVisible, nombreGuardado) {
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = CLASES_BOTON[variante];
    boton.setAttribute('aria-pressed', 'false');
    boton.setAttribute('aria-label', 'Marcar ' + nombreVisible + ' como equipo favorito');
    boton.title = 'Equipo favorito';
    boton.setAttribute('data-fav-boton', id);
    boton.innerHTML = ICONO_ESTRELLA;
    boton.addEventListener('click', function () {
      if (favorito && favorito.id === id) {
        definirFavorito(null);
      } else {
        definirFavorito({ id: id, nombre: nombreGuardado });
        if (!movimientoReducido.matches) {
          boton.classList.remove('is-pop');
          void boton.offsetWidth;
          boton.classList.add('is-pop');
        }
      }
    });
    boton.addEventListener('animationend', function () {
      boton.classList.remove('is-pop');
    });
    return boton;
  }

  function iniciarBotonesFavorito() {
    // Tabla de posiciones: la estrella va al final de la celda del equipo.
    document.querySelectorAll('[data-fav-celda]').forEach(function (celda) {
      var id = celda.getAttribute('data-team');
      var nombre = celda.textContent.trim();
      var envoltura = document.createElement('div');
      envoltura.className = 'flex items-center justify-between gap-3';
      var texto = document.createElement('span');
      while (celda.firstChild) texto.appendChild(celda.firstChild);
      envoltura.appendChild(texto);
      envoltura.appendChild(crearBotonEstrella('fila', id, nombre, nombre));
      celda.appendChild(envoltura);
    });

    // Tarjetas de la página Equipos: la estrella va en la esquina superior derecha.
    document.querySelectorAll('[data-fav-tarjeta]').forEach(function (tarjeta) {
      var titulo = tarjeta.querySelector('[data-team]');
      if (!titulo) return;
      var visible = titulo.textContent.trim();
      var guardado = titulo.getAttribute('data-nombre') || visible;
      tarjeta.appendChild(crearBotonEstrella('tarjeta', titulo.getAttribute('data-team'), visible, guardado));
    });

    // Línea de estado: "Tu equipo favorito: X · Quitar"
    document.querySelectorAll('[data-fav-estado]').forEach(function (estado) {
      estado.innerHTML = '';
      var texto = document.createElement('p');
      texto.setAttribute('aria-live', 'polite');
      texto.tabIndex = -1;
      texto.setAttribute('data-fav-texto', '');
      var quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className =
        'inline-flex min-h-[44px] items-center rounded-md px-1 font-medium text-zinc-300 underline decoration-zinc-600 ' +
        'underline-offset-4 transition-colors hover:text-white hover:decoration-amber-400 sm:min-h-0 ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400';
      quitar.textContent = 'Quitar';
      quitar.setAttribute('data-fav-quitar', '');
      quitar.addEventListener('click', function () {
        definirFavorito(null);
        texto.focus();
      });
      estado.appendChild(texto);
      estado.appendChild(quitar);
      estado.hidden = false;
    });
  }

  function pintarFavorito() {
    var id = favorito ? favorito.id : null;

    document.querySelectorAll('[data-team]').forEach(function (elemento) {
      var esFavorito = id !== null && elemento.getAttribute('data-team') === id;
      elemento.classList.toggle('is-fav', esFavorito);

      // Texto solo para lectores de pantalla, salvo donde ya hay un botón de estrella que lo dice.
      var conBoton = elemento.hasAttribute('data-fav-celda') || elemento.closest('[data-fav-tarjeta]');
      var aviso = elemento.nextElementSibling;
      var tieneAviso = aviso && aviso.hasAttribute('data-fav-aviso');
      if (esFavorito && !conBoton && !tieneAviso) {
        var span = document.createElement('span');
        span.className = 'sr-only';
        span.setAttribute('data-fav-aviso', '');
        span.textContent = ' (tu equipo favorito)';
        elemento.insertAdjacentElement('afterend', span);
      } else if (!esFavorito && tieneAviso) {
        aviso.remove();
      }
    });

    document.querySelectorAll('[data-fav-contenedor]').forEach(function (contenedor) {
      contenedor.classList.toggle('has-fav', id !== null && !!contenedor.querySelector('.is-fav'));
    });

    document.querySelectorAll('[data-fav-boton]').forEach(function (boton) {
      boton.setAttribute('aria-pressed', id !== null && boton.getAttribute('data-fav-boton') === id ? 'true' : 'false');
    });

    document.querySelectorAll('[data-fav-estado]').forEach(function (estado) {
      var texto = estado.querySelector('[data-fav-texto]');
      var quitar = estado.querySelector('[data-fav-quitar]');
      if (!texto) return;
      texto.textContent = '';
      if (favorito) {
        texto.appendChild(document.createTextNode('Tu equipo favorito: '));
        var nombre = document.createElement('strong');
        nombre.className = 'font-semibold text-amber-400';
        nombre.textContent = favorito.nombre;
        texto.appendChild(nombre);
        texto.appendChild(document.createTextNode('. Lo verás resaltado en Resultados, Calendario y Posiciones.'));
        quitar.hidden = false;
      } else {
        texto.textContent =
          'Marca tu equipo favorito con la estrella y lo verás resaltado en Resultados, Calendario y Posiciones.';
        quitar.hidden = true;
      }
    });
  }

  // Si el favorito cambia en otra pestaña, esta se actualiza sola.
  window.addEventListener('storage', function (evento) {
    if (evento.key === CLAVE_FAVORITO) {
      favorito = leerFavorito();
      pintarFavorito();
      avisar();
    }
  });

  window.MatchPoint = {
    almacen: almacen,
    favorito: {
      obtener: function () {
        return favorito;
      },
      definir: definirFavorito,
      alCambiar: function (oyente) {
        oyentes.push(oyente);
      }
    }
  };

  iniciarMenu();
  iniciarTicker();
  iniciarBotonesFavorito();
  pintarFavorito();
})();
