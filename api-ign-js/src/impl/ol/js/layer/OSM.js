/**
 * @module M/impl/layer/OSM
 */
import FacadeOSM from 'M/layer/OSM';
import * as LayerType from 'M/layer/Type';
import { isNullOrEmpty, generateResolutionsFromExtent, extend } from 'M/util/Utils';
import * as EventType from 'M/event/eventtype';
import OLLayerTile from 'ol/layer/Tile';
import OLControlAttribution from 'ol/control/Attribution';
import SourceOSM from 'ol/source/OSM';
import ImplMap from '../Map';
import Layer from './Layer';

/**
 * @classdesc
 * La API-CNIG permite visualizar la capa de Open Street Map.
 *
 * @api
 * @extends {M.impl.layer.Layer}
 */
class OSM extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa OSM
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.Layer}
  * @param {string|Mx.parameters.OSM} userParameters Parámetros para la construcción de la capa.
   * - attribution: Atribución de la capa.
   * - isBase: Indica si la capa es base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - name: Nombre de la capa en la leyenda.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - transparent: Falso si es una capa base, verdadero en caso contrario.
   * - type: Tipo de la capa.
   * - url: Url genera la OSM.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - opacity: Opacidad de capa, por defecto 1.
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - animated: Activa la animación para capas base o parámetros animados.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import SourceOSM from 'ol/source/OSM';
   * {
   *  opacity: 0.1,
   *  source: new SourceOSM({
   *    attributions: 'osm',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api stable
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
     * OSM resolutions_. Resoluciones de capa.
     */
    this.resolutions_ = null;

    /**
     * OSM facadeLayer_. Intancia de la fachada.
     */
    this.facadeLayer_ = null;

    /**
     * OSM hasAttributtion. La OSM no tiene atribuciones.
     */
    this.hasAttributtion = false;

    /**
     * OSM haveOSMorMapboxlayer. La OSM no es de Mapbox.
     */
    this.haveOSMorMapboxLayer = false;

    /**
     * OSM visibility. DDefine si la capa es visible o no.
     * Verdadero por defecto.
     */
    if (options.visibility === false) {
      this.visibility = false;
    }

    /**
     * OSM zIndex_. Índice de la capa, (+5).
     */
    this.zIndex_ = ImplMap.Z_INDEX[LayerType.OSM];
  }

  /**
   * Este método establece la visibilidad de esta capa.
   *
   * @function
   * @param {Boolean} visibility Verdadero es visible, falso si no.
   * @api stable
   */
  setVisible(visibility) {
    this.visibility = visibility;
    if (this.inRange() === true) {
      // if this layer is base then it hides all base layers
      if ((visibility === true) && (this.transparent === false)) {
        // hides all base layers
        this.map.getBaseLayers().forEach((layer) => {
          if (!layer.equals(this) && layer.isVisible()) {
            layer.setVisible(false);
          }
        });

        // set this layer visible
        if (!isNullOrEmpty(this.ol3Layer)) {
          this.ol3Layer.setVisible(visibility);
        }

        // updates resolutions and keep the bbox
        const oldBbox = this.map.getBbox();
        this.map.getImpl().updateResolutionsFromBaseLayer();
        if (!isNullOrEmpty(oldBbox)) {
          this.map.setBbox(oldBbox);
        }
      } else if (!isNullOrEmpty(this.ol3Layer)) {
        this.ol3Layer.setVisible(visibility);
      }
    }
  }

  /**
   * Este método añade la capa al mapa.
   *
   * @public
   * @function
   * @param {M.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map, addLayer = true) {
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);

    this.ol3Layer = new OLLayerTile(extend(
      { visible: this.visibility },
      this.vendorOptions_,
      true,
    ));
    this.updateSource_();
    if (this.opacity_) {
      this.setOpacity(this.opacity_);
    }

    if (addLayer) {
      this.map.getMapImpl().addLayer(this.ol3Layer);
    }

    this.map.getImpl().getMapImpl().getControls().getArray()
      .forEach((cont) => {
        if (cont instanceof OLControlAttribution) {
          this.hasAttributtion = true;
        }
      }, this);
    if (!this.hasAttributtion && !this.facadeLayer_.attribution) {
      this.map.getMapImpl().addControl(new OLControlAttribution({
        className: 'ol-attribution ol-unselectable ol-control ol-collapsed m-attribution',
        collapsible: true,
      }));
      this.hasAttributtion = false;
    }

    // recalculate resolutions
    this.map.getMapImpl().updateSize();
    const size = this.map.getMapImpl().getSize();
    const units = this.map.getProjection().units;
    this.resolutions_ = generateResolutionsFromExtent(
      this.facadeLayer_.getMaxExtent(),
      size,
      16,
      units,
    );

    // sets its visibility if it is in range
    if (this.isVisible() && !this.inRange()) {
      this.setVisible(false);
    }
    if (this.zIndex_ !== null) {
      this.setZIndex(this.zIndex_);
    }
    // sets the resolutions
    if (this.resolutions_ !== null) {
      this.setResolutions(this.resolutions_);
    }

    this.ol3Layer.setMaxZoom(this.maxZoom);
    this.ol3Layer.setMinZoom(this.minZoom);

    // activates animation for base layers or animated parameters
    const animated = ((this.transparent === false) || (this.options.animated === true));
    this.ol3Layer.set('animated', animated);

    // set the extent when the map changed
    this.map.on(EventType.CHANGE_PROJ, () => this.updateSource_());
  }

  /**
   * Este método establece las resoluciones para esta capa.
   *
   * @public
   * @function
   * @param {Array<Number>} resolutions Nuevas resoluciones a aplicar.
   * @api stable
   */
  setResolutions(resolutions) {
    this.resolutions_ = resolutions;
    this.updateSource_(resolutions);
  }

  /**
   * Este método actualiza la capa de origen.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Array} resolutions Nuevas resoluciones a aplicar.
   * @api stable
   */
  updateSource_(resolutions) {
    if (isNullOrEmpty(resolutions) && !isNullOrEmpty(this.map)) {
      this.map.getMapImpl().updateSize();
      const size = this.map.getMapImpl().getSize();
      const units = this.map.getProjection().units;
      const zoomLevels = 16;
      this.resolutions_ = generateResolutionsFromExtent(
        this.facadeLayer_.getMaxExtent(),
        size,
        zoomLevels,
        units,
      );
    }
    if (!isNullOrEmpty(this.ol3Layer) && isNullOrEmpty(this.vendorOptions_.source)) {
      const extent = this.facadeLayer_.getMaxExtent();
      const newSource = new SourceOSM({
        url: this.url,
      });
      this.ol3Layer.setSource(newSource);
      this.ol3Layer.setExtent(extent);
    }
  }

  /**
   * Este método establece la clase de la fachada OSM.
   * La fachada se refiere a
   * un patrón estructural como una capa de abstracción con un patrón de diseño.
   *
   * @function
   * @param {object} obj Fachada de la capa.
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Este método establece la extensión máxima para la capa Openlayers.
   *
   * @public
   * @function
   * @param {Mx.Extent} maxExtent Extensión máxima.
   * @api stable
   */
  setMaxExtent(maxExtent) {
    this.ol3Layer.setExtent(maxExtent);
  }

  /**
   * Este método devuelve la resolución mínima.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  getMinResolution() {
    // return this.resolutions_[this.resolutions_.length - 1];
  }

  /**
   * Este método obtiene la resolución máxima para
   * este OSM/WMS.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @api stable
   */
  getMaxResolution() {
    // return this.resolutions_[0];
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    const olMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.ol3Layer)) {
      olMap.removeLayer(this.ol3Layer);
      this.ol3Layer = null;
    }

    this.map.getLayers().forEach((layer) => {
      if (layer instanceof FacadeOSM) {
        this.haveOSMorMapboxLayer = true;
      }
    });

    if (!this.haveOSMorMapboxLayer) {
      this.map.getImpl().getMapImpl().getControls().getArray()
        .forEach((data) => {
          if (data instanceof OLControlAttribution) {
            this.map.getImpl().getMapImpl().removeControl(data);
          }
        });
    }
    this.map = null;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api stable
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof OSM) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
    }

    return equals;
  }

  /**
   * Este método devuelve un clon de capa de esta instancia.
   * @public
   * @function
   * @return {ol/layer/Tile}
   * @api stable
   */
  cloneOLLayer() {
    let olLayer = null;
    if (this.ol3Layer != null) {
      const properties = this.ol3Layer.getProperties();
      olLayer = new OLLayerTile(properties);
    }
    return olLayer;
  }
}

export default OSM;
