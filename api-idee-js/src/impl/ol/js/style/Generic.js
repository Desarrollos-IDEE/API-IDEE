/**
 * @module IDEE/impl/style/Generic
 */
import { useproxy } from 'IDEE/api-idee';
import {
  isUndefined, isArray, isFunction, isDynamic, drawDynamicStyle,
  concatUrlPaths, addParameters, getImageSize,
} from 'IDEE/util/Utils';
import OLFeature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import OLStyleIcon from 'ol/style/Icon';
import OLGeomPolygon from 'ol/geom/Polygon';
import OLGeomLineString from 'ol/geom/LineString';
import { toContext as toContextRender } from 'ol/render';
import OLStyleFontsSymbol from '../ext/OLStyleFontSymbol';
import Simple from './Simple';
import { getLineStyle, getPointStyle, getPolygonStyle } from './builder';

/**
 * Objetos con los tipos de geometrías.
 * @const
 * @type {object}
 */
const GETTER_BY_GEOM = {
  Point: (...args) => getPointStyle(args[0].point, args[1], args[2]),
  LineString: (...args) => getLineStyle(args[0].line, args[1], args[2]),
  Polygon: (...args) => getPolygonStyle(args[0].polygon, args[1], args[2]),
  MultiPoint: (...args) => getPointStyle(args[0].point, args[1], args[2]),
  MultiLineString: (...args) => getLineStyle(args[0].line, args[1], args[2]),
  MultiPolygon: (...args) => getPolygonStyle(args[0].polygon, args[1], args[2]),
};

/**
 * @classdesc
 * Crea un estilo genérico.
 * @api
 */
class Generic extends Simple {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Object} options Opciones del estilo.
   * - Point. Punto.
   * - Polygon. Polígono.
   * - Line. Linea.
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base.
   * @api stable
   */
  constructor(options = {}, vendorOptions = undefined) {
    super(options, vendorOptions);

    /**
     * @private
     * @type {object}
     */
    this.styles_ = {};
  }

  /**
   * Este método devuelve el "canvas" en formato imagen.
   *
   * @function
   * @public
   * @return {String} "Url del Canvas".
   * @api stable
   */
  toImage() {
    const imgSizeW = 30;
    const imgSizeH = 15;
    let loadImagePoint = null;
    let loadImagePoly = null;
    let loadImageLine = null;
    const dinamic = drawDynamicStyle();
    const promises = [];
    let iconWidth = 0;

    // Polygon image
    if (!isUndefined(this.options_.polygon)) {
      loadImagePoly = (d) => new Promise((resolve, reject) => {
        const img = new Image();

        // onload / onerror
        img.onload = () => resolve(img);
        img.onerror = reject;

        // img

        const namesToSkip = ['label'];
        if (isDynamic(this.options_.polygon, namesToSkip) === true) {
          img.src = d;
          img.width = imgSizeW;
          img.height = imgSizeH;
          img.crossOrigin = 'anonymous';
        } else {
          const getterPolygon = GETTER_BY_GEOM.Polygon;
          const stylesPolygon = getterPolygon(this.options_, this, this.layer_);
          const canvasPO = document.createElement('canvas');
          canvasPO.width = imgSizeW;
          canvasPO.height = imgSizeH;
          const ctxPO = canvasPO.getContext('2d');
          const vectorContextPol = toContextRender(ctxPO);
          vectorContextPol.setStyle(stylesPolygon[0], 0, 0);
          const canvasSize = [25, 12];
          const maxW = Math.floor(canvasSize[0]);
          const maxH = Math.floor(canvasSize[1]);
          const minW = (canvasSize[0] - maxW);
          const minH = (canvasSize[1] - maxH);
          vectorContextPol.drawGeometry(new OLGeomPolygon([
            [
              [minW + 3, minH + 3],
              [maxW - 3, minH + 3],
              [maxW - 3, maxH - 3],
              [minW + 3, maxH - 3],
              [minW + 3, minH + 3],
            ],
          ]));
          img.src = canvasPO.toDataURL();
        }
      });
      promises.push(loadImagePoly(dinamic));
    }

    // Line image
    if (!isUndefined(this.options_.line)) {
      loadImageLine = (d) => new Promise((resolve, reject) => {
        const img = new Image();

        // onload / onerror
        img.onload = () => resolve(img);
        img.onerror = reject;

        // img

        img.width = imgSizeW;
        img.height = imgSizeH;

        const namesToSkip = ['label'];
        if (isDynamic(this.options_.line, namesToSkip) === true) {
          img.src = d;
          img.crossOrigin = 'anonymous';
        } else {
          const getterLine = GETTER_BY_GEOM.LineString;
          const stylesLine = getterLine(this.options_, this, this.layer_);
          const canvasLI = document.createElement('canvas');
          canvasLI.width = 30;
          canvasLI.height = 30;
          const ctxLI = canvasLI.getContext('2d');
          const vectorContextLin = toContextRender(ctxLI);
          vectorContextLin.setStyle(stylesLine[0], 0, 0);
          const x = 25;
          const y = 15;
          const stroke = isUndefined(stylesLine[0].getStroke())
            ? 1.5
            : stylesLine[0].getStroke().getWidth();
          vectorContextLin.drawGeometry(new OLGeomLineString([
            [0 + (stroke / 2), 0 + (stroke / 2)],
            [(x / 3), (y / 2) - (stroke / 2)],
            [(2 * x) / 3, 0 + (stroke / 2)],
            [x - (stroke / 2), (y / 2) - (stroke / 2)],
          ]));
          img.src = canvasLI.toDataURL();
        }
      });
      promises.push(loadImageLine(dinamic));
    }

    // Point image
    if (!isUndefined(this.options_.point)) {
      loadImagePoint = (d) => new Promise((resolve, reject) => {
        const img = new Image();

        if (this.options_.point.icon) {
          if (this.options_.point.icon.src) {
            getImageSize(this.options_.point.icon.src).then((imgx) => {
              img.onload = () => resolve(img);
              img.onerror = reject;
              if (!this.options_.point.icon.src.startsWith(window.location.origin) && useproxy) {
                const proxyImageURL = concatUrlPaths([IDEE.config.PROXY_URL, '/image']);
                img.crossOrigin = 'anonymous';
                img.src = addParameters(proxyImageURL, {
                  url: this.options_.point.icon.src,
                });
              } else {
                img.crossOrigin = 'anonymous';
                img.src = this.options_.point.icon.src;
              }
              img.width = imgSizeW > imgx.width ? imgSizeW : imgx.width;
              img.height = imgSizeW > imgx.height ? imgSizeW : imgx.height;
              iconWidth = img.width;
            });
          } else if (this.options_.point.icon.form) { // es un FORM
            img.onload = () => resolve(img);
            img.width = imgSizeW;
            img.height = imgSizeW;
            const getterPoint = GETTER_BY_GEOM.Point;
            const stylesPoint = getterPoint(this.options_, this, this.layer_);
            const imageFormPoint = stylesPoint[1].getImage().getImage(1);
            if (imageFormPoint != null && imageFormPoint) {
              img.src = imageFormPoint.toDataURL();
            }
          }
        } else {
          // onload / onerror
          img.onload = () => resolve(img);
          img.onerror = reject;

          // img
          img.width = imgSizeW;
          img.height = imgSizeH;

          const namesToSkip = ['label'];
          if (isDynamic(this.options_.point, namesToSkip) === true) {
            img.src = d;
            img.crossOrigin = 'anonymous';
          } else {
            const getterPoint = GETTER_BY_GEOM.Point;
            const stylesPoint = getterPoint(this.options_, this, this.layer_);
            stylesPoint[0].getImage().setRadius(5);
            const imageURLPoint = stylesPoint[0].getImage().getImage(1).toDataURL();
            img.src = imageURLPoint;
          }
        }
        iconWidth = img.width;
      });
      promises.push(loadImagePoint(dinamic));
    }

    // Canvas / Context
    const canvasGL = document.createElement('canvas');
    canvasGL.height = 20;
    const ctxGL = canvasGL.getContext('2d');

    const positions = [0, 35, 70];
    let cont = 0;

    // Loading images
    return Promise.all(promises).then((values) => {
      const lngt = values.length;
      if (lngt === 1) {
        canvasGL.width = iconWidth !== 0 ? iconWidth : 35;
      } else if (lngt === 2) {
        canvasGL.width = 70 + iconWidth;
      } else {
        canvasGL.width = 100 + iconWidth;
      }
      let height = 0;
      values.forEach((image) => {
        if (image.height > height) {
          height = image.height;
        }
      });
      canvasGL.height = height;
      values.forEach((image) => {
        ctxGL.drawImage(image, positions[cont], 0);
        cont += 1;
      });
      return canvasGL.toDataURL();
    });
  }

  /**
   * Este método actualiza las opciones de la fachada
   * (patrón estructural como una capa de abstracción con un patrón de diseño).
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @param {object} options Opciones.
   * @return {object} Devuelve los estilos actualizados.
   * @function
   * @api stable
   */
  updateFacadeOptions(options, vendorOptions) {
    this.olStyleFn_ = (feature) => {
      if (vendorOptions) {
        // Generic vendorOptions, aplica su estilo a los POINT,LINE,POLYGON a la vez.
        // #FIX_ST_VE_OP no esta diseñado de tal forma que solo se use una vez vendorOptions,
        // aquí seguirá enviando el vendorOptions como resultado ya que solo se define a
        // través de la styleFuntion. Por lo que se intenta arreglar de esta manera.
        // this.updateFacadeOptions(options);
        // eslint-disable-next-line no-underscore-dangle
        // this.layer_.getImpl().olLayer.styleFunction_ = this.olStyleFn_;
        if (isArray(vendorOptions)) {
          return vendorOptions;
        }
        return [vendorOptions];
      }
      const idFeature = JSON.stringify(feature.getProperties());
      let styles = [];
      this.styles_ = [];
      let featureVariable = feature;
      if (!(featureVariable instanceof OLFeature || featureVariable instanceof RenderFeature)) {
        featureVariable = this;
      } else {
        const geometry = featureVariable.getGeometry();
        const type = geometry.getType();

        if (type === 'GeometryCollection' && isFunction(geometry.getGeometries)) {
          // Un GeometryCollection no tiene una entrada propia en GETTER_BY_GEOM,
          // por lo que se recorren sus sub-geometrías para obtener un estilo por
          // cada tipo presente (evitando duplicar el mismo getter).
          const processedTypes = new Set();
          geometry.getGeometries().forEach((subGeom) => {
            const subType = subGeom.getType();
            if (processedTypes.has(subType)) {
              return;
            }
            processedTypes.add(subType);
            const getter = GETTER_BY_GEOM[subType];
            if (isFunction(getter)) {
              styles = styles.concat(getter(options, featureVariable, this.layer_));
            }
          });
          this.styles_[idFeature] = styles;
        } else {
          const getter = GETTER_BY_GEOM[type];

          if (isFunction(getter)) {
            styles = getter(options, featureVariable, this.layer_);
            this.styles_[idFeature] = styles;
          }
        }
      }
      return styles;
    };
  }

  /**
   * Este método dibuja la geometría en el "canvas".
   *
   * @public
   * @function
   * @param {Object} vectorContext Vector que se dibujará en el "canvas".
   * @api stable
   */
  drawGeometryToCanvas(vectorContext) {}

  /**
   * Este método actualiza el "canvas".
   *
   * @public
   * @function
   * @param {HTMLCanvasElement} canvas Nuevo "canvas".
   * @api stable
   */
  updateCanvas(canvas) {}

  /**
   * Este método devuelve el tamaño del "canvas".
   *
   * @public
   * @function
   * @returns {Array} Tamaño.
   * @api stable
   */
  getCanvasSize() {
    return 0;
  }

  /**
   * Este método devuelve el radio de una imagen.
   *
   * @public
   * @function
   * @param {object} image OLStyleIcon (ol/style/Icon) o OLStyleFontsSymbol (ol/style/RegularShape).
   * @api stable
   */
  getRadius_(image) {
    let r;
    if (image instanceof OLStyleIcon) {
      r = 25;
    } else if (image instanceof OLStyleFontsSymbol) {
      r = image.getRadius();
    } else {
      r = this.olStyleFn_()[0].getImage().getRadius();
    }

    return r;
  }
}

export default Generic;
