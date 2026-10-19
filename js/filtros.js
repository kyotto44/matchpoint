/*
 * MatchPoint: filtros de partidos (resultados.html y calendario.html).
 *  - Filtro por liga (Todas, Premier League, LaLiga, Serie A, Bundesliga).
 *  - Búsqueda por equipo (solo en Resultados): ignora tildes y mayúsculas,
 *    y también encuentra por nombre completo o por sigla ("BVB", "Athletic Club").
 *  - "Solo mi equipo": aparece cuando hay un equipo favorito guardado.
 *  - Estado vacío con botón para quitar los filtros.
 *
 * Usa los datos que ya están en el HTML (data-partido, data-liga, data-team).
 * Sin JavaScript la página se ve completa, como antes: la barra de filtros
 * está oculta con el atributo hidden y este archivo la muestra.
 */
(function () {
  'use strict';

  var zona = document.querySelector('[data-filtros]');
  var partidos = Array.prototype.slice.call(document.querySelectorAll('[data-partido]'));
  if (!zona || !partidos.length) return;

  var grupos = Array.prototype.slice.call(document.querySelectorAll('[data-liga-grupo]'));
  var botonesLiga = Array.prototype.slice.call(zona.querySelectorAll('[data-filtro-liga]'));
  var botonFavorito = zona.querySelector('[data-filtro-favorito]');
  var nombreFavorito = zona.querySelector('[data-filtro-favorito-nombre]');
  var campoTexto = zona.querySelector('[data-filtro-texto]');
  var estado = zona.querySelector('[data-filtro-estado]');
  var vacio = document.querySelector('[data-filtro-vacio]');
  var vacioTexto = vacio ? vacio.querySelector('[data-filtro-vacio-texto]') : null;
  var botonLimpiar = vacio ? vacio.querySelector('[data-filtro-limpiar]') : null;

  var sufijo = estado ? estado.getAttribute('data-sufijo') || 'partidos' : 'partidos';
  var esCalendario = sufijo.indexOf('hoy') !== -1;
  var api = window.MatchPoint ? window.MatchPoint.favorito : null;

  var LIGAS = {
    'premier-league': 'la Premier League',
    laliga: 'LaLiga',
    'serie-a': 'la Serie A',
    bundesliga: 'la Bundesliga'
  };

  var filtro = { liga: 'todas', texto: '', soloFavorito: false };
  var temporizadorEstado = null;

  function normalizar(texto) {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Se preparan una sola vez los ids y el texto buscable de cada partido.
  partidos.forEach(function (partido) {
    var equipos = Array.prototype.slice.call(partido.querySelectorAll('[data-team]'));
    partido._ids = equipos.map(function (equipo) {
      return equipo.getAttribute('data-team');
    });
    partido._texto = normalizar(
      equipos
        .map(function (equipo) {
          return equipo.textContent + ' ' + (equipo.getAttribute('data-alias') || '');
        })
        .join(' ')
    );
  });

  function favoritoActual() {
    return api ? api.obtener() : null;
  }

  function textoEstado(visibles) {
    var total = partidos.length;
    if (visibles === 0) return 'Ningún partido coincide con los filtros.';
    if (visibles === total) return 'Mostrando los ' + total + ' ' + sufijo + '.';
    return 'Mostrando ' + visibles + ' de ' + total + ' ' + sufijo + '.';
  }

  function mensajeVacio(favorito, busqueda) {
    var liga = filtro.liga !== 'todas' ? LIGAS[filtro.liga] : '';
    var textoBuscado = '“' + filtro.texto.trim() + '”';

    if (filtro.soloFavorito && favorito) {
      if (busqueda) {
        return 'Ningún partido de ' + favorito.nombre + ' coincide con ' + textoBuscado + '.';
      }
      if (esCalendario) {
        return favorito.nombre + ' no tiene partidos' + (liga ? ' de ' + liga : '') + ' en el calendario de hoy.';
      }
      return 'No hay resultados de ' + favorito.nombre + (liga ? ' en ' + liga + '.' : ' en esta jornada.');
    }
    if (busqueda) {
      return (
        'Ningún equipo' + (liga ? ' de ' + liga : '') + ' coincide con ' + textoBuscado +
        '. Revisa cómo está escrito o busca por otro nombre.'
      );
    }
    return 'No hay partidos' + (liga ? ' de ' + liga : '') + ' en esta lista.';
  }

  function aplicar(demorarEstado) {
    var favorito = favoritoActual();
    var busqueda = normalizar(filtro.texto);
    var visibles = 0;

    partidos.forEach(function (partido) {
      var coincide =
        (filtro.liga === 'todas' || partido.getAttribute('data-liga') === filtro.liga) &&
        (!busqueda || partido._texto.indexOf(busqueda) !== -1) &&
        (!filtro.soloFavorito || (favorito && partido._ids.indexOf(favorito.id) !== -1));
      partido.hidden = !coincide;
      if (coincide) visibles += 1;
    });

    // En Resultados se oculta el título de la liga si se quedó sin partidos.
    grupos.forEach(function (grupo) {
      grupo.hidden = !grupo.querySelector('[data-partido]:not([hidden])');
    });

    if (vacio) {
      vacio.hidden = visibles > 0;
      if (!visibles && vacioTexto) vacioTexto.textContent = mensajeVacio(favorito, busqueda);
    }

    // Mientras se escribe, el mensaje para lectores de pantalla espera a que se termine de teclear.
    window.clearTimeout(temporizadorEstado);
    if (!estado) return;
    if (demorarEstado) {
      temporizadorEstado = window.setTimeout(function () {
        estado.textContent = textoEstado(visibles);
      }, 400);
    } else {
      estado.textContent = textoEstado(visibles);
    }
  }

  function marcarLiga(liga) {
    filtro.liga = liga;
    botonesLiga.forEach(function (boton) {
      boton.setAttribute('aria-pressed', boton.getAttribute('data-filtro-liga') === liga ? 'true' : 'false');
    });
  }

  function marcarSoloFavorito(activo) {
    filtro.soloFavorito = activo;
    if (botonFavorito) botonFavorito.setAttribute('aria-pressed', activo ? 'true' : 'false');
  }

  function actualizarBotonFavorito(favorito) {
    if (!botonFavorito) return;
    if (favorito) {
      nombreFavorito.textContent = favorito.nombre;
      botonFavorito.hidden = false;
    } else {
      botonFavorito.hidden = true;
      marcarSoloFavorito(false);
    }
  }

  botonesLiga.forEach(function (boton) {
    boton.addEventListener('click', function () {
      marcarLiga(boton.getAttribute('data-filtro-liga'));
      aplicar(false);
    });
  });

  if (botonFavorito) {
    botonFavorito.addEventListener('click', function () {
      marcarSoloFavorito(!filtro.soloFavorito);
      aplicar(false);
    });
  }

  if (campoTexto) {
    campoTexto.addEventListener('input', function () {
      filtro.texto = campoTexto.value;
      aplicar(true);
    });
    campoTexto.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && campoTexto.value) {
        evento.preventDefault();
        campoTexto.value = '';
        filtro.texto = '';
        aplicar(false);
      }
    });
  }

  if (botonLimpiar) {
    botonLimpiar.addEventListener('click', function () {
      marcarLiga('todas');
      marcarSoloFavorito(false);
      filtro.texto = '';
      if (campoTexto) campoTexto.value = '';
      aplicar(false);
      botonesLiga[0].focus();
    });
  }

  if (api) {
    api.alCambiar(function (favorito) {
      actualizarBotonFavorito(favorito);
      aplicar(false);
    });
  }

  actualizarBotonFavorito(favoritoActual());
  zona.hidden = false;
  aplicar(false);
})();
