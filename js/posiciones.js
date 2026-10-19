/*
 * MatchPoint: tabla de posiciones (posiciones.html).
 *  - Pestañas por liga con teclado (flechas izquierda/derecha, Inicio, Fin).
 *    La pestaña activa queda en la dirección (#laliga) para poder compartirla.
 *    Sin dirección, se abre la liga del equipo favorito si hay uno guardado.
 *  - Orden por columna: clic en un encabezado ordena; un segundo clic invierte.
 *    "#" vuelve al orden original. Los empates conservan la posición en la tabla.
 *
 * Sin JavaScript se ven las cuatro tablas una debajo de otra, como antes.
 */
(function () {
  'use strict';

  var api = window.MatchPoint ? window.MatchPoint.favorito : null;
  var cabecera = document.querySelector('header');

  /* ------------------------------------------------------------------
   * Pestañas
   * ------------------------------------------------------------------ */
  var lista = document.querySelector('[data-tabs]');
  var paneles = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
  var pestanas = lista ? Array.prototype.slice.call(lista.querySelectorAll('[role="tab"]')) : [];

  function panelPorId(id) {
    for (var i = 0; i < paneles.length; i += 1) {
      if (paneles[i].id === id) return paneles[i];
    }
    return null;
  }

  function activar(id, opciones) {
    var opcionesFinal = opciones || {};
    if (!panelPorId(id)) return false;
    pestanas.forEach(function (pestana) {
      var seleccionada = pestana.getAttribute('aria-controls') === id;
      pestana.setAttribute('aria-selected', seleccionada ? 'true' : 'false');
      pestana.tabIndex = seleccionada ? 0 : -1;
      if (seleccionada && opcionesFinal.foco) pestana.focus();
    });
    paneles.forEach(function (panel) {
      panel.hidden = panel.id !== id;
    });
    if (opcionesFinal.direccion && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + id);
    }
    return true;
  }

  // Al llegar con #liga se deja visible la fila de pestañas, no solo la tabla.
  function ajustarMargenDeDesplazamiento() {
    var margen = (cabecera ? cabecera.offsetHeight : 0) + lista.offsetHeight + 40;
    paneles.forEach(function (panel) {
      panel.style.scrollMarginTop = margen + 'px';
    });
  }

  function irAPanel(id) {
    var panel = panelPorId(id);
    if (!panel) return;
    ajustarMargenDeDesplazamiento();
    try {
      panel.scrollIntoView({ block: 'start', behavior: 'instant' });
    } catch (error) {
      panel.scrollIntoView(true);
    }
  }

  function ligaDelFavorito() {
    var favorito = api ? api.obtener() : null;
    if (!favorito) return null;
    for (var i = 0; i < paneles.length; i += 1) {
      var equipos = paneles[i].querySelectorAll('[data-team]');
      for (var j = 0; j < equipos.length; j += 1) {
        if (equipos[j].getAttribute('data-team') === favorito.id) return paneles[i].id;
      }
    }
    return null;
  }

  if (lista && paneles.length && pestanas.length) {
    paneles.forEach(function (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'tab-' + panel.id);
      // El nombre de la liga ya está en la pestaña; el título queda para lectores de pantalla.
      var titulo = panel.querySelector('h2');
      if (titulo) titulo.classList.add('sr-only');
    });
    lista.hidden = false;

    pestanas.forEach(function (pestana, indice) {
      pestana.addEventListener('click', function () {
        activar(pestana.getAttribute('aria-controls'), { direccion: true });
      });
      pestana.addEventListener('keydown', function (evento) {
        var total = pestanas.length;
        var destino = null;
        if (evento.key === 'ArrowRight') destino = (indice + 1) % total;
        else if (evento.key === 'ArrowLeft') destino = (indice - 1 + total) % total;
        else if (evento.key === 'Home') destino = 0;
        else if (evento.key === 'End') destino = total - 1;
        if (destino === null) return;
        evento.preventDefault();
        activar(pestanas[destino].getAttribute('aria-controls'), { foco: true, direccion: true });
      });
    });

    var desdeDireccion = decodeURIComponent(window.location.hash.slice(1));
    if (activar(desdeDireccion)) {
      irAPanel(desdeDireccion);
    } else {
      activar(ligaDelFavorito() || paneles[0].id);
    }

    // Enlaces del pie de página (posiciones.html#laliga) usados desde esta misma página.
    window.addEventListener('hashchange', function () {
      var id = decodeURIComponent(window.location.hash.slice(1));
      if (activar(id)) irAPanel(id);
    });
  }

  /* ------------------------------------------------------------------
   * Orden por columna
   * ------------------------------------------------------------------ */
  var COLUMNA = { pos: 0, equipo: 1, pj: 2, g: 3, e: 4, p: 5, dg: 6, pts: 7 };
  var NOMBRE_COLUMNA = {
    pos: 'posición',
    equipo: 'nombre del equipo',
    pj: 'partidos jugados',
    g: 'partidos ganados',
    e: 'partidos empatados',
    p: 'partidos perdidos',
    dg: 'diferencia de gol',
    pts: 'puntos'
  };
  var ICONO_ORDEN =
    '<svg class="orden-icono h-3 w-3" viewBox="0 0 12 12" aria-hidden="true">' +
    '<path class="flecha-arriba" fill="currentColor" d="M6 1.25 9.5 4.75h-7z"/>' +
    '<path class="flecha-abajo" fill="currentColor" d="M6 10.75 2.5 7.25h7z"/></svg>';

  var anuncio = document.createElement('p');
  anuncio.className = 'sr-only';
  anuncio.setAttribute('aria-live', 'polite');
  (document.querySelector('main') || document.body).appendChild(anuncio);

  function describirOrden(liga, clave, direccion) {
    if (clave === 'pos' && direccion === 'asc') return liga + ' en el orden original de la tabla.';
    var sentido;
    if (clave === 'equipo') sentido = direccion === 'asc' ? 'de la A a la Z' : 'de la Z a la A';
    else if (clave === 'pos') sentido = 'del último al primero';
    else sentido = direccion === 'asc' ? 'de menor a mayor' : 'de mayor a menor';
    return liga + ' ordenada por ' + NOMBRE_COLUMNA[clave] + ', ' + sentido + '.';
  }

  function iniciarOrden(tabla) {
    var cuerpo = tabla.tBodies[0];
    if (!cuerpo) return;
    var liga = tabla.getAttribute('data-liga-nombre') || 'La tabla';
    var filas = Array.prototype.slice.call(cuerpo.rows);
    var encabezados = Array.prototype.slice.call(tabla.querySelectorAll('th[data-orden]'));
    var actual = { clave: 'pos', direccion: 'asc' };

    filas.forEach(function (fila, indice) {
      fila._posicion = indice + 1;
      fila._equipo = fila.cells[COLUMNA.equipo].textContent.trim();
    });

    function valor(fila, clave) {
      if (clave === 'pos') return fila._posicion;
      if (clave === 'equipo') return fila._equipo;
      return parseInt(fila.cells[COLUMNA[clave]].textContent, 10) || 0;
    }

    function ordenar(clave, direccion, anunciar) {
      var signo = direccion === 'asc' ? 1 : -1;
      filas.sort(function (a, b) {
        var va = valor(a, clave);
        var vb = valor(b, clave);
        var resultado = clave === 'equipo' ? va.localeCompare(vb, 'es', { sensitivity: 'base' }) : va - vb;
        if (resultado === 0) return a._posicion - b._posicion;
        return resultado * signo;
      });
      var fragmento = document.createDocumentFragment();
      filas.forEach(function (fila) {
        fragmento.appendChild(fila);
      });
      cuerpo.appendChild(fragmento);

      actual = { clave: clave, direccion: direccion };
      encabezados.forEach(function (th) {
        if (th.getAttribute('data-orden') === clave) {
          th.setAttribute('aria-sort', direccion === 'asc' ? 'ascending' : 'descending');
        } else {
          th.removeAttribute('aria-sort');
        }
      });
      if (anunciar) anuncio.textContent = describirOrden(liga, clave, direccion);
    }

    encabezados.forEach(function (th) {
      var clave = th.getAttribute('data-orden');
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className =
        'orden-boton inline-flex min-h-[44px] items-center gap-1.5 rounded-sm uppercase tracking-wider ' +
        'transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 ' +
        'focus-visible:ring-amber-400' + (th.classList.contains('text-center') ? ' justify-center' : '');
      while (th.firstChild) boton.appendChild(th.firstChild);
      boton.insertAdjacentHTML('beforeend', ICONO_ORDEN);
      th.appendChild(boton);
      th.classList.remove('py-3');
      th.classList.add('py-0');

      boton.addEventListener('click', function () {
        var direccion;
        if (actual.clave === clave) {
          direccion = actual.direccion === 'asc' ? 'desc' : 'asc';
        } else {
          // Texto y posición empiezan de arriba hacia abajo; los números, del mayor al menor.
          direccion = clave === 'pos' || clave === 'equipo' ? 'asc' : 'desc';
        }
        ordenar(clave, direccion, true);
      });
    });

    ordenar('pos', 'asc', false);
  }

  Array.prototype.slice.call(document.querySelectorAll('.tabla-pos')).forEach(iniciarOrden);
})();
