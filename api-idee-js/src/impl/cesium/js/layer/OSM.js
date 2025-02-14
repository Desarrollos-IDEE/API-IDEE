/**
 * @module IDEE/impl/layer/OSM
 */
import FacadeOSM from 'IDEE/layer/OSM';
import * as EventType from 'IDEE/event/eventtype';
import { isNullOrEmpty, extend } from 'IDEE/util/Utils';
import { OpenStreetMapImageryProvider, ImageryLayer, Rectangle } from 'cesium';
import Layer from './Layer';

/**
 * @classdesc
 * La API-IDEE permite visualizar la capa de Open Street Map.
 *
 * @api
 * @extends {IDEE.impl.layer.Layer}
 */
class OSM extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa OSM
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {IDEE.impl.Layer}
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
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import { Rectangle } from 'cesium';
   * {
   *  alpha: 0.5,
   *  show: true,
   *  rectangle: Rectangle.fromDegrees(-8.31, -5.69, 5.35, 8.07),
   *  ...
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
      * OSM haveOSMLayer. Existe alguna capa que necesite el attributions.
      */
    this.haveOSMLayer = false;

    /**
      * OSM visibility. Define si la capa es visible o no.
      * Verdadero por defecto.
      */
    if (options.visibility === false) {
      this.visibility = false;
    }
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
    // if this layer is base then it hides all base layers
    if ((visibility === true) && (this.transparent === false)) {
      // hides all base layers
      this.map.getBaseLayers().forEach((layer) => {
        if (!layer.equals(this) && layer.isVisible()) {
          layer.setVisible(false);
        }
      });

      // set this layer visible
      if (!isNullOrEmpty(this.cesiumLayer)) {
        this.cesiumLayer.show = visibility;
      }

      // updates resolutions and keep the bbox
      const oldBbox = this.map.getBbox();
      this.map.getImpl().updateResolutionsFromBaseLayer();
      if (!isNullOrEmpty(oldBbox)) {
        this.map.setBbox(oldBbox);
      }
    } else if (!isNullOrEmpty(this.cesiumLayer)) {
      this.cesiumLayer.show = visibility;
    }
  }

  /**
   * Este método añade la capa al mapa.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map) {
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);

    const source = this.updateSource_();
    const extent = this.facadeLayer_.getMaxExtent();
    this.cesiumLayer = new ImageryLayer(
      source,
      extend(
        {
          show: this.visibility,
          minimumTerrainLevel: this.minZoom,
          maximumTerrainLevel: this.maxZoom - 1,
          rectangle: Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]),
        },
        this.vendorOptions_,
        true,
      ),
    );
    if (this.opacity_) {
      this.setOpacity(this.opacity_);
    }
    const zIndex = this.facadeLayer_.isBase ? 0 : null;
    this.map.getMapImpl().imageryLayers.add(this.cesiumLayer, zIndex);
    // eslint-disable-next-line no-underscore-dangle
    this.cesiumLayer.imageryProvider._credit = undefined;

    /* Control attributions */
    // eslint-disable-next-line no-underscore-dangle
    // this.map.getImpl().getMapImpl().getControls().getArray()
    //   .forEach((cont) => {
    //     if (cont instanceof OLControlAttribution) {
    //       this.hasAttributtion = true;
    //     }
    //   }, this);
    // if (!this.hasAttributtion && !this.facadeLayer_.attribution) {
    //   this.map.getMapImpl().addControl(new OLControlAttribution({
    //     className: 'ol-attribution ol-unselectable ol-control ol-collapsed m-attribution',
    //     collapsible: true,
    //   }));
    //   this.hasAttributtion = false;
    // }

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
  setResolutions(resolutions) {}

  /**
   * Este método actualiza la capa de origen.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Array} resolutions Nuevas resoluciones a aplicar.
   * @api stable
   */
  updateSource_(resolutions) {
    let fileExtension;
    if (this.url) {
      const indexExtension = this.url.trim().indexOf('}.');
      fileExtension = this.url.substring(indexExtension + 2);
      const index = this.url.trim().indexOf('/{');
      this.url = this.url.substring(0, index);
    }
    const newSource = new OpenStreetMapImageryProvider({
      url: this.url,
      fileExtension,
    });
    return newSource;
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
   * Este método devuelve la resolución mínima.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  getMinResolution() {
    return undefined;
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
    return undefined;
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
    const cesiumMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.cesiumLayer)) {
      cesiumMap.imageryLayers.remove(this.cesiumLayer);
      this.cesiumLayer = null;
    }

    this.map.getLayers().forEach((layer) => {
      if (layer instanceof FacadeOSM) {
        this.haveOSMLayer = true;
      }
    });

    if (!this.haveOSMLayer) {
      /* Control attributions */
      // this.map.getImpl().getMapImpl().getControls().getArray()
      //   .forEach((data) => {
      //     if (data instanceof Credit) {
      //       this.map.getImpl().getMapImpl().removeControl(data);
      //     }
      //   });
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
   * @return {Cesium.ImageryLayer}
   * @api stable
   */
  cloneLayer() {
    let cesiumLayer = null;
    if (this.cesiumLayer != null) {
      cesiumLayer = this.cesiumLayer;
    }
    return cesiumLayer;
  }
}

export default OSM;
