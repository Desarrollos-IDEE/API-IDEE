/* eslint-disable */
/**
 * Control que dibuja el perfil topográfico de una feature.
 * @module IDEE/impl/ol/js/ext/Profil
 * @example import Profil from 'IDEE/impl/ol/js/ext/Profil';
 */
import OLControl from 'ol/control/Control';
import OLFeature from 'ol/Feature';
import OLGeomPoint from 'ol/geom/Point';
import { transform } from 'ol/proj';
import { getDistance } from 'ol/sphere';
import OLStyle from 'ol/style/Style';
import OLStyleCircle from 'ol/style/Circle';
import OLStyleFill from 'ol/style/Fill';
import { dragElement } from 'IDEE/util/Utils';
import { getValue } from 'IDEE/i18n/language';

const DEFAULT_UNITS = {
  altitudeUnits: 'm',
  distanceUnitsM: 'm',
  distanceUnitsKM: 'km',
};

const DEFAULT_CHART = {
  margin: { top: 10, left: 40, bottom: 30, right: 10 },
  fontSize: 10,
  titleFontSize: 12,
  lineWidth: 3,
};

const DEFAULT_COLORS = {
  line: '#368',
  marker: '#ff0000',
};

/**
 * Gráficas que puede representar el control.
 * - PROFILE: perfil topográfico (altitud).
 * - ELEVATION_GAIN: desnivel acumulado positivo.
 * @const
 * @type {Object}
 */
const GRAPHS = Object.freeze({
  PROFILE: 'profile',
  ELEVATION_GAIN: 'elevationGain',
});

/**
 * Normaliza las gráficas a representar: admite un array o un texto separado
 * por comas, descarta valores desconocidos o repetidos y las ordena (perfil
 * arriba). Si no queda ninguna, representa el perfil.
 * @param {Array<String>|String} graphs gráficas indicadas.
 * @return {Array<String>} gráficas a representar.
 */
const normalizeGraphs = (graphs) => {
  let list = [];
  if (typeof graphs === 'string') list = graphs.split(',');
  else if (Array.isArray(graphs)) list = graphs;
  list = list.map((graph) => String(graph).trim());
  const result = [GRAPHS.PROFILE, GRAPHS.ELEVATION_GAIN].filter((graph) => list.indexOf(graph) !== -1);
  return result.length ? result : [GRAPHS.PROFILE];
};

/**
 * @classdesc
 * Control que dibuja el perfil topográfico de una feature
 *
 * @extends {ol.control.Control}
 * @fires over, out, show
 * @api
 */
class Profil extends OLControl {
  /**
   * Constructor principal de la clase.
   *
   * Los textos que no se indican se toman de la sección "profile" de las traducciones de
   * la API, en el idioma activo.
   *
   * @constructor
   * @param {Object} [options] Opciones del control.
   * - info: textos y unidades (zmin, zmax, altitude, distance, distanceP, time,
   *   elevationGain, xtitle, ytitle, altitudeUnits, distanceUnitsM, distanceUnitsKM).
   * - graphs: gráficas a representar, apiladas y con el mismo eje de distancias
   *   (Profil.GRAPHS): 'profile' (perfil) y 'elevationGain' (desnivel acumulado).
   *   Array o texto separado por comas. Por defecto ['profile'].
   * - title: título del panel.
   * - target: si se indica, el panel se crea sin título ni botones.
   * - className: clase del panel. Por defecto 'ol-profil'.
   * - controlClassName: clase de control del panel. Por defecto 'ol-control'.
   * - downloadClassName: clase del icono del botón de descarga. Por defecto 'icon-download'.
   * - draggable: añade el botón para arrastrar el panel. Por defecto false.
   * - centered: centra el panel en el mapa al mostrarlo con show(). Por defecto false.
   * - width, height: tamaño de cada gráfica en píxeles. Por defecto 300 x 150.
   * - chart: aspecto del gráfico ({ margin: { top, left, bottom, right },
   *   fontSize, titleFontSize, lineWidth }).
   * - colors: colores de la curva y del marcador del mapa ({ line, marker }).
   *   Por defecto '#368' y '#ff0000'.
   * - titles: títulos de los botones del panel ({ close, download, move }).
   * - pointLayer: origen de datos (ol.source.Vector) donde se marca la posición del
   *   cursor sobre el mapa. Se vacía al cerrar el panel.
   * - feature: geometría que se dibuja al crear el control. Un MultiLineString se dibuja
   *   por partes: la distancia no cuenta los huecos y la curva se corta entre partes.
   * @api
   */
  constructor(opt_options) {
    super({});
    var options = opt_options || {};
    var texts = getValue('profile') || {};
    this.info = Object.assign({}, DEFAULT_UNITS, texts.info, options.info);
    this.fileName_ = texts.file_name || 'profile.png';
    var self = this;
    var className = options.className || 'ol-profil';
    var controlClassName = options.controlClassName || 'ol-control';
    var chart = Object.assign({}, DEFAULT_CHART, options.chart);
    var titles = Object.assign({
      close: texts.close,
      download: texts.download,
      move: texts.move,
    }, options.titles);
    this.colors_ = Object.assign({}, DEFAULT_COLORS, options.colors);
    this.draggable_ = Boolean(options.draggable) && !options.target;
    this.centered_ = Boolean(options.centered);
    this.graphs_ = normalizeGraphs(options.graphs);
    this.hasElevationGain_ = this.graphs_.indexOf(GRAPHS.ELEVATION_GAIN) !== -1;
    this.pointLayer_ = options.pointLayer;

    var element;
    if (options.target) {
      element = document.createElement('div');
      if (options.draggable) element.id = 'containerTopo';
      element.classList.add(className);
    } else {
      element = document.createElement('div');
      if (options.draggable) element.id = 'containerTopo';
      element.className = (className + ' ol-unselectable ' + controlClassName + ' ol-collapsed').trim();
      let elementTitle = document.createElement('p');
      if (options.draggable) elementTitle.id = 'titleTopo';
      elementTitle.textContent = options.title || texts.title || '';
      element.appendChild(elementTitle);
      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('class', 'profile-close-button');
      if (titles.close) {
        button.setAttribute('title', titles.close);
        button.setAttribute('aria-label', titles.close);
      }
      const close = () => this.close();
      button.addEventListener('click', close);
      button.addEventListener('touchstart', close);
      elementTitle.appendChild(button);

      const button2 = document.createElement('button');
      button2.setAttribute('type', 'button');
      button2.setAttribute('class', 'profile-download-button ' + (options.downloadClassName || 'icon-download'));
      if (titles.download) {
        button2.setAttribute('title', titles.download);
        button2.setAttribute('aria-label', titles.download);
      }
      const download = (e) => {
        const image = this.getImage();
        const a = document.createElement('a');
        a.href = image;
        a.download = this.fileName_;
        a.click();
        a.remove();
      };
      button2.addEventListener('click', download);
      button2.addEventListener('touchstart', download);
      elementTitle.appendChild(button2);

      if (options.draggable) {
        const buttonMove = document.createElement('button');
        const imgMove = document.createElement('img');
        imgMove.setAttribute('src', 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_mover.svg');
        imgMove.setAttribute('alt', titles.move || '');

        buttonMove.appendChild(imgMove);

        if (titles.move) {
          buttonMove.setAttribute('title', titles.move);
          buttonMove.setAttribute('aria-label', titles.move);
        }
        buttonMove.setAttribute('type', 'button');
        buttonMove.setAttribute('id', 'buttonTopoMove');
        buttonMove.setAttribute('class', 'profile-move-button icon-move');

        elementTitle.appendChild(buttonMove);
      }
    }

    var div_inner = document.createElement('div');
    div_inner.classList.add('ol-inner');
    element.appendChild(div_inner);
    var div = document.createElement('div');
    div.style.position = 'relative';
    div_inner.appendChild(div);

    var ratio = this.ratio = 2;
    this.canvas_ = document.createElement('canvas');
    this.canvas_.width = (options.width || 300) * ratio;
    this.graphHeight_ = (options.height || 150) * ratio;
    this.canvas_.height = this.graphHeight_ * this.graphs_.length;

    var styles = {
      'msTransform': 'scale(0.5,0.5)',
      'msTransformOrigin': '0 0',
      'webkitTransform': 'scale(0.5,0.5)',
      'webkitTransformOrigin': '0 0',
      'mozTransform': 'scale(0.5,0.5)',
      'mozTransformOrigin': '0 0',
      'transform': 'scale(0.5,0.5)',
      'transformOrigin': '0 0'
    };

    Object.keys(styles).forEach(function(style) {
      if (style in self.canvas_.style) {
        self.canvas_.style[style] = styles[style];
      }
    });

    var div_to_canvas = document.createElement('div');
    div.appendChild(div_to_canvas);
    div_to_canvas.style.width = this.canvas_.width / ratio + 'px';
    div_to_canvas.style.height = this.canvas_.height / ratio + 'px';
    div_to_canvas.appendChild(this.canvas_);
    div_to_canvas.addEventListener('click', function(e) { self.onMove(e); });
    div_to_canvas.addEventListener('mousemove', function(e) { self.onMove(e); });

    this.element = element;

    // Aspecto del gráfico
    this.fontSize_ = chart.fontSize;
    this.titleFontSize_ = chart.titleFontSize;
    this.lineWidth_ = chart.lineWidth;

    // Offset in px
    this.margin_ = {
      top: chart.margin.top * ratio,
      left: chart.margin.left * ratio,
      bottom: chart.margin.bottom * ratio,
      right: chart.margin.right * ratio,
    };
    if (!this.info.ytitle) this.margin_.left -= 20 * ratio;
    if (!this.info.xtitle) this.margin_.bottom -= 20 * ratio;

    // Cursor
    this.bars_ = this.graphs_.map((graph, index) => {
      var bar = document.createElement('div');
      bar.classList.add('ol-profilbar');
      bar.style.top = ((index * this.graphHeight_ + this.margin_.top) / ratio) + 'px';
      bar.style.height = (this.graphHeight_ - this.margin_.top - this.margin_.bottom) / ratio + 'px';
      div.appendChild(bar);
      return bar;
    });
    this.bar_ = this.bars_[0];

    this.cursor_ = document.createElement('div');
    this.cursor_.classList.add('ol-profilcursor');
    div.appendChild(this.cursor_);

    this.popup_ = document.createElement('div');
    this.popup_.classList.add('ol-profilpopup');
    this.cursor_.appendChild(this.popup_);

    this.cursors_ = [this.cursor_];
    for (var g = 1; g < this.graphs_.length; g++) {
      var cursor = document.createElement('div');
      cursor.classList.add('ol-profilcursor');
      div.appendChild(cursor);
      this.cursors_.push(cursor);
    }

    // Track information
    var t = document.createElement('table');
    t.cellPadding = '0';
    t.cellSpacing = '0';
    t.style.width = this.canvas_.width / ratio + 'px';
    div.appendChild(t);

    var firstTr = document.createElement('tr');
    firstTr.classList.add('track-info');
    t.appendChild(firstTr);
    var div_zmin = document.createElement('td');
    div_zmin.innerHTML = (this.info.zmin || 'Zmin') + ': <span class="zmin">';
    firstTr.appendChild(div_zmin);
    var div_zmax = document.createElement('td');
    div_zmax.innerHTML = (this.info.zmax || 'Zmax') + ': <span class="zmax">';
    firstTr.appendChild(div_zmax);
    var div_distance = document.createElement('td');
    div_distance.innerHTML = (this.info.distance || 'Distance') + ': <span class="dist">';
    firstTr.appendChild(div_distance);
    if (this.hasElevationGain_) {
      var div_gain = document.createElement('td');
      div_gain.innerHTML = (this.info.elevationGain || 'Elevation gain') + ': <span class="gain">';
      firstTr.appendChild(div_gain);
    }
    var secondTr = document.createElement('tr');
    secondTr.classList.add('point-info')
    t.appendChild(secondTr);
    var div_altitude = document.createElement('td');
    div_altitude.innerHTML = (this.info.altitude || 'Altitude') + ': <span class="z">';
    secondTr.appendChild(div_altitude);
    var div_distance2 = document.createElement('td');
    div_distance2.innerHTML = (this.info.distanceP || 'Partial distance') + ': <span class="dist">';
    secondTr.appendChild(div_distance2);
    var div_time2 = document.createElement('td');
    div_time2.innerHTML = (this.info.time || 'Time') + ': <span class="time">';
    secondTr.appendChild(div_time2);
    if (this.hasElevationGain_) {
      var div_gain2 = document.createElement('td');
      div_gain2.innerHTML = (this.info.elevationGain || 'Elevation gain') + ': <span class="gain">';
      secondTr.appendChild(div_gain2);
    }

    // Array of data
    this.tab_ = [];

    // Posición del cursor sobre el mapa
    this.marker_ = null;
    if (options.pointLayer) {
      this.marker_ = new OLFeature(new OLGeomPoint([0, 0]));
      this.marker_.setStyle([]);
      options.pointLayer.addFeature(this.marker_);
    }
    this.on(['over', 'out'], function(e) { self.onHover_(e); });

    // Show feature
    if (options.feature) {
      this.setGeometry(options.feature);
    }
  }

  /**
   * Añade el control al mapa. Si el panel es arrastrable, activa el arrastre
   * en cuanto el panel está en el documento.
   * @param {ol.Map} map mapa
   * @api
   */
  setMap(map) {
    super.setMap(map);
    if (map && this.draggable_) {
      dragElement('containerTopo', 'buttonTopoMove');
      dragElement('containerTopo', 'titleTopo');
    }
  }

  /**
   * Muestra la altitud del punto del perfil bajo el cursor y lo marca sobre el mapa.
   * @param {Object} e evento over u out
   * @private 
   */
  onHover_(e) {
    if (e.type === 'over') {
      var value = this.graphs_[0] === GRAPHS.ELEVATION_GAIN ? Number(e.elevationGain.toFixed(2)) : e.coord[2];
      this.popup(value + ' ' + (this.info.altitudeUnits || 'm'));
    }
    if (this.marker_) {
      if (e.type === 'over') {
        this.marker_.setGeometry(new OLGeomPoint(e.coord));
        this.marker_.setStyle([new OLStyle({
          image: new OLStyleCircle({
            radius: 7,
            fill: new OLStyleFill({
              color: this.colors_.marker,
            }),
          }),
        })]);
      } else {
        this.marker_.setStyle([]);
      }
    }
  }

  /**
   * Muestra información en el popup
   * @param {string} info Información a mostrar en el popup
   * @api
   */
  popup(info) {
    this.popup_.innerHTML = info;
  }

  /**
   * Muestra la posición del cursor sobre el perfil y la altitud en el popup.
   * @param {MouseEvent} e evento click o mousemove
   * @api
   */
  onMove(e) {
    if (this.tab_.length) {
      var box_canvas = this.canvas_.getBoundingClientRect();
      var pos = {
        top: box_canvas.top + window.pageYOffset - document.documentElement.clientTop,
        left: box_canvas.left + window.pageXOffset - document.documentElement.clientLeft
      };

      var dx = e.pageX - pos.left;
      var dy = e.pageY - pos.top;
      var ratio = this.ratio;
      if (dx > this.margin_.left / ratio && dx < (this.canvas_.width - this.margin_.right) / ratio
        && dy > this.margin_.top / ratio && dy < (this.canvas_.height - this.margin_.bottom) / ratio) {
        var d = (dx * ratio - this.margin_.left) / this.scale_[0];
        var p0 = this.tab_[0];
        for (var i = 1, p; p = this.tab_[i]; i++) {
          if (p[0] >= d) {
            if (d < (p[0] + p0[0]) / 2) p = p0;
            break;
          }
          p0 = p;
        }
        this.showAt_(dx, p || this.tab_[this.tab_.length - 1], e.type == 'click');
      } else {
        if (this.bar_.parentElement.classList.contains('over')) {
          this.bars_.forEach((bar) => { bar.style.display = 'none'; });
          this.cursors_.forEach((cursor) => { cursor.style.display = 'none'; });
          this.bar_.parentElement.classList.remove('over');
          this.dispatchEvent({ type: 'out' });
        }
      }
    }
  }

  /**
   * Coloca el cursor del perfil a una fracción de la longitud de una de sus partes (la
   * parte 0 si la geometría es un LineString). Se busca por distancia y no por cercanía
   * en el mapa para que un recorrido de ida y vuelta no salte a la otra pasada.
   * @param {Number} part índice de la parte
   * @param {Number} fraction fracción de la parte, de 0 a 1
   * @api
   */
  setPositionAt(part, fraction) {
    var points = this.tab_.filter(function(p) { return p[5] === part; });
    if (!points.length) return;
    var start = points[0][0];
    var target = start + (points[points.length - 1][0] - start) * Math.min(1, Math.max(0, fraction));
    var best = points.reduce(function(found, p) {
      return Math.abs(p[0] - target) < Math.abs(found[0] - target) ? p : found;
    }, points[0]);
    this.showAt_((best[0] * this.scale_[0] + this.margin_.left) / this.ratio, best, false);
  }

  /**
   * Dibuja la barra y los cursores en una posición del perfil y lanza el evento over.
   * @param {Number} dx posición horizontal en el panel (px)
   * @param {Array} p punto del perfil
   * @param {Boolean} click indica si la posición procede de un clic
   * @private
   */
  showAt_(dx, p, click) {
    var ratio = this.ratio;
    this.bars_.forEach((bar) => {
      bar.style.left = dx + 'px';
      bar.style.display = 'block';
    });
    if (p) {
      for (var k = 0; k < this.cursors_.length; k++) {
        var layout = this.graphLayout_[k];
        this.cursors_[k].style.left = dx + 'px';
        this.cursors_[k].style.top = (layout.top + this.graphHeight_ - this.margin_.bottom + p[layout.value] * layout.scy + layout.dy) / ratio + 'px';
        this.cursors_[k].style.display = 'block';
      }
    } else {
      this.cursors_.forEach((cursor) => { cursor.style.display = 'none'; });
    }
    this.bar_.parentElement.classList.add('over');
    this.element.querySelector('.point-info .z').textContent = `${p[1].toFixed(2).replace(".", ",")} ${this.info.altitudeUnits}`;
    this.element.querySelector('.point-info .dist').textContent = `${(p[0] / 1000).toFixed(2).replace(".", ",")} ${this.info.distanceUnitsKM}`;
    this.element.querySelector('.point-info .time').textContent = p[2];
    if (this.hasElevationGain_) this.element.querySelector('.point-info .gain').textContent = `${p[4].toFixed(2).replace(".", ",")} ${this.info.altitudeUnits}`;
    if (dx > this.canvas_.width / ratio / 2) this.popup_.classList.add('ol-left');
    else this.popup_.classList.remove('ol-left');
    this.dispatchEvent({ type: 'over', click: click, coord: p[3], time: p[2], distance: p[0], elevationGain: p[4] });
  }

  /**
   * Muestra el panel
   * @api
   */
  show() {
    this.element.classList.remove('ol-collapsed');
    if (this.centered_) this.center_();
    this.dispatchEvent({ type: 'show', show: true });
  }

  /**
   * Centra el panel en su contenedor sin que se salga por arriba ni por la izquierda.
   * @private
   */
  center_() {
    var parent = this.element.parentElement;
    if (parent) {
      this.element.style.left = Math.max(0, (parent.clientWidth - this.element.offsetWidth) / 2) + 'px';
      this.element.style.top = Math.max(0, (parent.clientHeight - this.element.offsetHeight) / 2) + 'px';
    }
  }

  /**
   * Oculta el panel
   * @api
   */
  hide() {
    this.element.classList.add('ol-collapsed');
    this.dispatchEvent({ type: 'show', show: false });
  }

  /**
   * Activa o desactiva el panel
   * @api
   */
  toggle() {
    this.element.classList.toggle('ol-collapsed');
    var b = this.element.classList.contains('ol-collapsed');
    this.dispatchEvent({ type: 'show', show: !b });
  }

  /**
   * Devuelve true si el panel está visible
   * @api
   * @returns {boolean} true si el panel está visible
   */
  isShown() {
    return (!this.element.classList.contains('ol-collapsed'));
  }

  /**
   * Cierra el panel: lo quita del mapa y vacía pointLayer.
   * @api
   */
  close() {
    var map = this.getMap();
    if (map) {
      map.removeControl(this);
    } else {
      this.element.remove();
    }
    if (this.pointLayer_) {
      this.pointLayer_.clear();
    }
  }

  /**
   * Define la geometría para dibujar el perfil.
   * @param {ol.Feature|ol.geom} g geometría.
   * @param {Object} options 
   * - projection {ol.ProjectionLike} proyección de la geometría, por defecto la del mapa
   * - zunit {m|km} unidades de altitud, por defecto m
   * - unit {m|km} unidades de distancia, por defecto km
   * - zmin {Number|undefined} altitud mínima, por defecto 0
   * - zmax {Number|undefined} altitud máxima, por defecto la máxima de la geometría
   * - graduation {Number|undefined} graduación de altitud, por defecto 100
   * - amplitude {integer|undefined} amplitud de altitud, por defecto zmax-zmin
   * @api
   */
  setGeometry(g, options) {
    if (!options) options = {};
    if (g instanceof OLFeature) g = g.getGeometry();
    var canvas = this.canvas_;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Solo se dibujan geometrías con Z
    if (/Z/.test(g.getLayout())) {
      // No time
      if (/IDEE/.test(g.getLayout())) this.element.querySelector('.time').parentElement.style.display = 'block';
      else this.element.querySelector('.time').parentElement.style.display = 'none';

      var parts;
      switch (g.getType()) {
        case 'LineString':
          parts = [g.getCoordinates()];
          break;
        case 'MultiLineString':
          parts = g.getCoordinates().filter(function(part) { return part.length > 0; });
          break;
        default:
          return;
      }
      if (!parts.length) return;

      // Distance beetween 2 coords
      var proj = options.projection || this.getMap().getView().getProjection();

      function dist2d(p1, p2) {
        return getDistance(
          transform(p1, proj, 'EPSG:4326'),
          transform(p2, proj, 'EPSG:4326'))
      }

      function getTime(t0, t1) {
        var time = '-';
        if (t0 && t1) {
          var dt = (t1 - t0) / 60; // mn
          var ti = Math.trunc(dt / 60);
          var mn = Math.trunc(dt - ti * 60);
          time = ti + 'h' + (mn < 10 ? '0' : '') + mn + 'mn';
        }
        return time;
      }

      var zmin = Infinity,
        zmax = -Infinity;
      var d = 0, gain = 0, t = this.tab_ = [];
      var first = parts[0][0];
      parts.forEach(function(c, part) {
        for (var i = 0, p; p = c[i]; i++) {
          var z = p[2];
          if (z < zmin) zmin = z;
          if (z > zmax) zmax = z;
          if (i > 0) {
            d += dist2d(c[i - 1], p);
            gain += Math.max(0, z - c[i - 1][2]);
          }
          t.push([d, z, getTime(first[3], p[3]), p, gain, part]);
        }
      });

      // Info
      this.element.querySelector('.track-info .zmin').textContent = `${(zmin.toFixed(2)).replace(".", ",")} ${this.info.altitudeUnits}`;
      this.element.querySelector('.track-info .zmax').textContent = `${(zmax.toFixed(2)).replace(".", ",")} ${this.info.altitudeUnits}`;
      if (d > 1000) {
        this.element.querySelector('.track-info .dist').textContent = `${((d / 1000).toFixed(2)).replace(".", ",")} ${this.info.distanceUnitsKM}`;
      } else {
        this.element.querySelector('.track-info .dist').textContent = `${((d).toFixed(2)).replace(".", ",")} ${this.info.distanceUnitsM}`;
      }
      if (this.hasElevationGain_) {
        this.element.querySelector('.track-info .gain').textContent = `${(gain.toFixed(2)).replace(".", ",")} ${this.info.altitudeUnits}`;
      }

      var series = {};
      series[GRAPHS.PROFILE] = { value: 1, min: zmin, max: zmax, title: this.info.ytitle, options: options };
      series[GRAPHS.ELEVATION_GAIN] = {
        value: 4,
        min: 0,
        max: gain,
        title: (this.info.elevationGain || 'Elevation gain') + ' (' + (this.info.altitudeUnits || 'm') + ')',
        options: { graduation: options.graduation, zunit: options.zunit, unit: options.unit },
      };
      this.graphLayout_ = this.graphs_.map((graph, index) => this.drawGraph_(ctx, index * this.graphHeight_, d, series[graph]));
      this.scale_ = [this.graphLayout_[0].scx, this.graphLayout_[0].scy];
      this.dy_ = this.graphLayout_[0].dy;
    }
  }

  /**
   * Dibuja una gráfica en su franja del canvas: ejes, escalas, títulos y curva.
   * @param {CanvasRenderingContext2D} ctx contexto del canvas
   * @param {Number} top posición vertical de la franja en el canvas
   * @param {Number} d distancia total
   * @param {Object} serie valores a dibujar (value: posición del valor en cada punto,
   * min, max, title y options de la escala)
   * @return {Object} escala de la gráfica (top, value, scx, scy, dy)
   * @private
   */
  drawGraph_(ctx, top, d, serie) {
    var options = serie.options;
    var t = this.tab_;
    var i, p;

    // Margin
    ctx.setTransform(1, 0, 0, 1, this.margin_.left, top + this.graphHeight_ - this.margin_.bottom);
    var ratio = this.ratio;

    var w = this.canvas_.width - this.margin_.right - this.margin_.left;
    var h = this.graphHeight_ - this.margin_.top - this.margin_.bottom;
    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5 * ratio;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -h);
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();

    var zmin = serie.min,
      zmax = serie.max;

    // Set graduation
    var grad = options.graduation || 100;
    while (true) {
      zmax = Math.ceil(zmax / grad) * grad;
      zmin = Math.floor(zmin / grad) * grad;
      var nbgrad = (zmax - zmin) / grad;
      if (h / nbgrad < 15 * ratio) {
        grad *= 2;
      } else break;
    }

    // Set amplitude
    if (typeof(options.zmin) == 'number' && zmin > options.zmin) zmin = options.zmin;
    if (typeof(options.zmax) == 'number' && zmax < options.zmax) zmax = options.zmax;
    var amplitude = options.amplitude;
    if (amplitude) {
      zmax = Math.max(zmin + amplitude, zmax);
    }
    if (zmax === zmin) zmax = zmin + grad;

    // Scales lines
    var scx = w / d;
    var scy = -h / (zmax - zmin);
    var dy = -zmin * scy;
    // Draw
    ctx.font = (this.fontSize_ * ratio) + 'px arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    // Scale Z
    ctx.beginPath();
    for (i = zmin; i <= zmax; i += grad) {
      if (options.zunit != 'km') ctx.fillText(i, -4 * ratio, i * scy + dy);
      else ctx.fillText((i / 1000).toFixed(1), -4 * ratio, i * scy + dy);
      ctx.moveTo(-2 * ratio, i * scy + dy);
      if (i != 0) ctx.lineTo(d * scx, i * scy + dy);
      else ctx.lineTo(0, i * scy + dy);
    }
    // Scale X
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.setLineDash([ratio, 3 * ratio]);
    var unit = options.unit || 'km';
    var step;
    if (d > 1000) {
      step = Math.round(d / 1000) * 100;
      if (step > 1000) step = Math.ceil(step / 1000) * 1000;
    } else {
      unit = 'm';
      if (d > 100) step = Math.round(d / 100) * 10;
      else if (d > 10) step = Math.round(d / 10);
      else if (d > 1) step = Math.round(d) / 10;
      else step = d;
    }
    for (i = 0; i <= d; i += step) {
      var txt = (unit == 'm') ? i : (i / 1000);
      ctx.fillText(Math.round(txt * 10) / 10, i * scx, 4 * ratio);
      ctx.moveTo(i * scx, 2 * ratio);
      ctx.lineTo(i * scx, 0);
    }
    ctx.font = (this.titleFontSize_ * ratio) + 'px arial';
    ctx.fillText(this.info.xtitle.replace('(km)', '(' + unit + ')'), w / 2, 18 * ratio);
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(serie.title, h / 2, -this.margin_.left);
    ctx.restore();

    ctx.stroke();

    ctx.strokeStyle = this.colors_.line;
    ctx.lineWidth = this.lineWidth_;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (i = 0; p = t[i]; i++) {
      if (i == 0 || p[5] !== t[i - 1][5]) ctx.moveTo(p[0] * scx, p[serie.value] * scy + dy);
      else ctx.lineTo(p[0] * scx, p[serie.value] * scy + dy);
    }
    ctx.stroke();

    return { top: top, value: serie.value, scx: scx, scy: scy, dy: dy };
  }

  /**
   * Obtiene la imagen del perfil
   * @param {string|undefined} type formato de imagen o 'canvas' para obtener la imagen del canvas, por defecto image/png.
   * @param {Number|undefined} encoderOptions entre 0 y 1 indicando la calidad de la imagen image/jpeg o image/webp, por defecto 0.92.
   * @returns {string} data uri de la imagen solicitada
   */
  getImage(type, encoderOptions) {
    if (type === 'canvas') return this.canvas_;
    return this.canvas_.toDataURL(type, encoderOptions);
  }
}

/**
 * Gráficas que puede representar el control (opción graphs).
 * @const
 * @type {Object}
 * @api
 */
Profil.GRAPHS = GRAPHS;

export default Profil;
