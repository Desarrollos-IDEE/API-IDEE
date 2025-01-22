/**
 * @module IDEE/impl/control/GeorefimageControl
 */
import {
  encodeKML, encodeWMS, encodeImage, encodeGeoTIFF, encodeXYZ, encodeWMTS, encodeMVT,
} from './encoders';

export default class GeorefimageControl extends IDEE.impl.Control {
  /**
   * @classdesc
   * Main constructor of the measure conrol.
   *
   * @constructor
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(map) {
    super();
    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.facadeMap_ = map;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;
    map.getMapImpl().addControl(this);
  }

  /**
   * This function encodes a layer.
   * Esta función codifica una capa, se usa tanto en el control de
   * georreferenciación como en el de georreferenciación de imagen
   *
   * @public
   * @function
   * @param {Layer} layer to encode
   * @api stable
   */
  getParametrizedLayers(facadeMap, paramName, layers) {
    let others = facadeMap.getMapImpl().getLayers().getArray().filter((layer) => {
      return layer.getSource && !IDEE.utils.isNullOrEmpty(layer.getSource())
        // eslint-disable-next-line no-underscore-dangle
        && !IDEE.utils.isNullOrEmpty(layer.getSource().params_)
        && layer.getSource().getParams()[paramName] !== undefined;
    });

    others = others.filter((layer) => {
      return !(layers.some((l) => {
        return l.url !== undefined && l.url === layer.getSource().getUrl();
      }));
    });

    return others;
  }

  /**
   * This function encodes a layer.
   *
   * @public
   * @function
   * @param {Layer} layer to encode
   * @api stable
   */
  encodeLayer(layer) {
    return (new Promise((success, fail) => {
      if (layer.type === IDEE.layer.type.MVT) {
        success(encodeMVT(layer, this.facadeMap_));
      } else if (layer.type === IDEE.layer.type.KML
          // eslint-disable-next-line no-underscore-dangle
          && layer.getImpl().formater_.extractStyles_ !== false) {
        success(encodeKML(layer, this.facadeMap_));
      } else if (layer.type === IDEE.layer.type.KML
          // eslint-disable-next-line no-underscore-dangle
          && layer.getImpl().formater_.extractStyles_ === false) {
        success(this.encodeWFS(layer));
      } else if (layer.type === IDEE.layer.type.WMS) {
        success(encodeWMS(layer));
      } else if (layer.type === IDEE.layer.type.WFS) {
        success(this.encodeWFS(layer));
      } else if (layer.type === IDEE.layer.type.GeoJSON) {
        success(this.encodeWFS(layer));
      } else if (layer.type === IDEE.layer.type.WMTS) {
        encodeWMTS(layer).then((encodedLayer) => {
          success(encodedLayer);
        });
      } else if (IDEE.utils.isNullOrEmpty(layer.type) && layer instanceof IDEE.layer.Vector) {
        success(this.encodeWFS(layer));
        // eslint-disable-next-line no-underscore-dangle
      } else if (layer.type === undefined && layer.className_ === 'ol-layer') {
        success(encodeImage(layer));
      } else if ([IDEE.layer.type.XYZ, IDEE.layer.type.TMS, IDEE.layer.type.OSM].indexOf(layer.type)
        > -1) {
        success(encodeXYZ(layer));
      } else if (layer.type === IDEE.layer.type.GeoTIFF) {
        success(encodeGeoTIFF(layer));
      } else {
        success(this.encodeWFS(layer));
      }
    }));
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  encodeWFS(layer) {
    let encodedLayer = null;
    const continuePrint = true;
    if (continuePrint) {
      const projection = this.facadeMap_.getProjection();
      const olLayer = layer.getImpl().getLayer();
      const features = olLayer.getSource().getFeatures();
      const layerName = layer.name;
      const layerOpacity = olLayer.getOpacity();
      const layerStyle = olLayer.getStyle();
      const geoJSONFormat = new ol.format.GeoJSON();
      let bbox = this.facadeMap_.getBbox();
      bbox = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
      const resolution = this.facadeMap_.getMapImpl().getView().getResolution();

      const encodedFeatures = [];
      let nameFeature;
      let filter;
      let index = 1;
      let indexText = 1;
      let indexGeom = 1;
      let style = '';
      const stylesNames = {};
      const stylesNamesText = {};
      features.forEach((feature) => {
        const geometry = feature.getGeometry();
        let featureStyle;
        const fStyle = feature.getStyle();

        if (!IDEE.utils.isNullOrEmpty(fStyle)) {
          featureStyle = fStyle;
        } else if (!IDEE.utils.isNullOrEmpty(layerStyle)) {
          featureStyle = layerStyle;
        }

        if (featureStyle instanceof Function) {
          featureStyle = featureStyle.call(featureStyle, feature, resolution);
        }

        if (featureStyle instanceof Array) {
          // SRC style has priority
          if (featureStyle.length > 1) {
            featureStyle = (!IDEE.utils.isNullOrEmpty(featureStyle[1].getImage())
              && featureStyle[1].getImage().getSrc)
              ? featureStyle[1]
              : featureStyle[0];
          } else {
            featureStyle = featureStyle[0];
          }
        }

        if (!IDEE.utils.isNullOrEmpty(featureStyle)) {
          const image = featureStyle.getImage();
          const imgSize = IDEE.utils
            .isNullOrEmpty(image) ? [0, 0] : (image.getImageSize() || [24, 24]);
          let text = featureStyle.getText();
          if (IDEE.utils.isNullOrEmpty(text) && !IDEE.utils.isNullOrEmpty(featureStyle.textPath)) {
            text = featureStyle.textPath;
          }

          let parseType;
          if (feature.getGeometry().getType().toLowerCase() === 'multipolygon') {
            parseType = 'polygon';
          } else if (feature.getGeometry().getType().toLowerCase() === 'multipoint') {
            parseType = 'point';
          } else if (feature.getGeometry().getType().toLowerCase().indexOf('linestring') > -1) {
            parseType = 'line';
          } else {
            parseType = feature.getGeometry().getType().toLowerCase();
          }

          const stroke = IDEE.utils.isNullOrEmpty(image)
            ? featureStyle.getStroke()
            : (image.getStroke && image.getStroke());
          const fill = IDEE.utils.isNullOrEmpty(image)
            ? featureStyle.getFill()
            : (image.getFill && image.getFill());

          let styleText;
          const styleGeom = {
            type: parseType,
            fillColor: IDEE.utils.isNullOrEmpty(fill) ? '#000000' : IDEE.utils.rgbaToHex(fill.getColor()).slice(0, 7),
            fillOpacity: IDEE.utils.isNullOrEmpty(fill)
              ? 0
              : IDEE.utils.getOpacityFromRgba(fill.getColor()),
            strokeColor: IDEE.utils.isNullOrEmpty(stroke) ? '#000000' : IDEE.utils.rgbaToHex(stroke.getColor()).slice(0, 7),
            strokeOpacity: IDEE.utils.isNullOrEmpty(stroke)
              ? 0
              : IDEE.utils.getOpacityFromRgba(stroke.getColor()),
            strokeWidth: IDEE.utils.isNullOrEmpty(stroke)
              ? 0 : (stroke.getWidth && stroke.getWidth()),
            pointRadius: IDEE.utils.isNullOrEmpty(image) ? '' : (image.getRadius && image.getRadius()),
            externalGraphic: IDEE.utils.isNullOrEmpty(image) ? '' : (image.getSrc && image.getSrc()),
            graphicHeight: imgSize[0],
            graphicWidth: imgSize[1],
          };
          if (!IDEE.utils.isNullOrEmpty(text)) {
            let tAlign = text.getTextAlign();
            let tBLine = text.getTextBaseline();
            let align = '';
            if (!IDEE.utils.isNullOrEmpty(tAlign)) {
              if (tAlign === IDEE.style.align.LEFT) {
                tAlign = 'l';
              } else if (tAlign === IDEE.style.align.RIGHT) {
                tAlign = 'r';
              } else if (tAlign === IDEE.style.align.CENTER) {
                tAlign = 'c';
              } else {
                tAlign = '';
              }
            }
            if (!IDEE.utils.isNullOrEmpty(tBLine)) {
              if (tBLine === IDEE.style.baseline.BOTTOM) {
                tBLine = 'b';
              } else if (tBLine === IDEE.style.baseline.MIDDLE) {
                tBLine = 'm';
              } else if (tBLine === IDEE.style.baseline.TOP) {
                tBLine = 't';
              } else {
                tBLine = '';
              }
            }
            if (!IDEE.utils.isNullOrEmpty(tAlign) && !IDEE.utils.isNullOrEmpty(tBLine)) {
              align = tAlign.concat(tBLine);
            }
            const font = text.getFont();
            const fontWeight = !IDEE.utils.isNullOrEmpty(font) && font.indexOf('bold') > -1 ? 'bold' : 'normal';
            let fontSize = '11px';
            if (!IDEE.utils.isNullOrEmpty(font)) {
              const px = font.substr(0, font.indexOf('px'));
              if (!IDEE.utils.isNullOrEmpty(px)) {
                const space = px.lastIndexOf(' ');
                if (space > -1) {
                  fontSize = px.substr(space, px.length).trim().concat('px');
                } else {
                  fontSize = px.concat('px');
                }
              }
            }
            styleText = {
              type: 'text',
              label: text.getText(),
              fontColor: IDEE.utils.isNullOrEmpty(text.getFill()) ? '#000000' : IDEE.utils.rgbToHex(text.getFill().getColor()),
              fontSize,
              fontFamily: 'Helvetica, sans-serif',
              fontStyle: 'normal',
              fontWeight,
              conflictResolution: 'false',
              labelXOffset: text.getOffsetX(),
              labelYOffset: text.getOffsetY(),
              fillColor: styleGeom.fillColor || '#FF0000',
              fillOpacity: styleGeom.fillOpacity || 1,
              labelOutlineColor: IDEE.utils.isNullOrEmpty(text.getStroke()) ? '' : IDEE.utils.rgbToHex(text.getStroke().getColor() || '#FF0000'),
              labelOutlineWidth: IDEE.utils.isNullOrEmpty(text.getStroke()) ? '' : text.getStroke().getWidth(),
              labelAlign: align,
            };
          }

          nameFeature = `draw${index}`;

          if ((!IDEE.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox))
            || !IDEE.utils.isNullOrEmpty(text)) {
            const styleStr = JSON.stringify(styleGeom);
            const styleTextStr = JSON.stringify(styleText);
            let styleName = stylesNames[styleStr];
            let styleNameText = stylesNamesText[styleTextStr];

            if (IDEE.utils.isUndefined(styleName) || IDEE.utils.isUndefined(styleNameText)) {
              const symbolizers = [];
              let flag = 0;
              if (!IDEE.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox)
                && IDEE.utils.isUndefined(styleName)) {
                styleName = indexGeom;
                stylesNames[styleStr] = styleName;
                flag = 1;
                symbolizers.push(styleStr);
                indexGeom += 1;
                index += 1;
              }
              if (!IDEE.utils.isNullOrEmpty(text) && IDEE.utils.isUndefined(styleNameText)) {
                styleNameText = indexText;
                stylesNamesText[styleTextStr] = styleNameText;
                symbolizers.push(styleTextStr);
                indexText += 1;
                if (flag === 0) {
                  index += 1;
                  symbolizers.push(styleStr);
                }
              }
              if (styleName === undefined) {
                styleName = 0;
              }
              if (styleNameText === undefined) {
                styleNameText = 0;
              }
              filter = `"[_gx_style ='${styleName + styleNameText}']"`;
              if (!IDEE.utils.isNullOrEmpty(symbolizers)) {
                const a = `${filter}: {"symbolizers": [${symbolizers}]}`;
                if (style !== '') {
                  style += `,${a}`;
                } else {
                  style += `{${a},"version":"2"`;
                }
              }
            }

            let geoJSONFeature;
            if (projection.code !== 'EPSG:3857' && this.facadeMap_.getLayers().some((layerParam) => (layerParam.type === IDEE.layer.type.OSM || layerParam.type === IDEE.layer.type.Mapbox))) {
              geoJSONFeature = geoJSONFormat.writeFeatureObject(feature, {
                featureProjection: projection.code,
                dataProjection: 'EPSG:3857',
              });
            } else {
              geoJSONFeature = geoJSONFormat.writeFeatureObject(feature);
            }
            geoJSONFeature.properties = {
              _gx_style: styleName + styleNameText,
              name: nameFeature,
            };
            encodedFeatures.push(geoJSONFeature);
          }
        }
      }, this);

      if (style !== '') {
        style = JSON.parse(style.concat('}'));
      } else {
        style = {
          '*': {
            symbolizers: [],
          },
          version: '2',
        };
      }

      encodedLayer = {
        type: 'Vector',
        style,
        geoJson: {
          type: 'FeatureCollection',
          features: encodedFeatures,
        },
        name: layerName,
        opacity: layerOpacity,
      };
    }
    return encodedLayer;
  }

  /**
   * This function
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  encodeOSM(layer) {
    let encodedLayer = null;

    const layerImpl = layer.getImpl();
    const olLayer = layerImpl.getLayer();
    const layerSource = olLayer.getSource();
    const tileGrid = layerSource.getTileGrid();

    const layerUrl = layer.url || 'http://tile.openstreetmap.org/';
    const layerName = layer.name;
    const layerOpacity = olLayer.getOpacity();
    const tiled = layerImpl.tiled;
    const layerExtent = tileGrid.getExtent();
    const tileSize = tileGrid.getTileSize();
    const resolutions = tileGrid.getResolutions();
    encodedLayer = {
      baseURL: layerUrl,
      opacity: layerOpacity,
      singleTile: !tiled,
      layer: layerName,
      maxExtent: layerExtent,
      tileSize: [tileSize, tileSize],
      resolutions,
      type: 'OSM',
      extension: 'png',
    };
    return encodedLayer;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  encodeMapbox(layer) {
    let encodedLayer = null;

    const layerImpl = layer.getImpl();
    const olLayer = layerImpl.getLayer();
    const layerSource = olLayer.getSource();
    const tileGrid = layerSource.getTileGrid();

    const layerUrl = IDEE.utils.concatUrlPaths([IDEE.config.MAPBOX_URL, layer.name]);
    const layerOpacity = olLayer.getOpacity();
    const layerExtent = tileGrid.getExtent();

    const tileSize = tileGrid.getTileSize();
    const resolutions = tileGrid.getResolutions();

    const customParams = {};
    customParams[IDEE.config.MAPBOX_TOKEN_NAME] = IDEE.config.MAPBOX_TOKEN_VALUE;
    encodedLayer = {
      opacity: layerOpacity,
      baseURL: layerUrl,
      customParams,
      maxExtent: layerExtent,
      tileSize: [tileSize, tileSize],
      resolutions,
      extension: IDEE.config.MAPBOX_EXTENSION,
      type: 'xyz',
      path_format: '/${z}/${x}/${y}.png',
    };

    return encodedLayer;
  }

  /**
   * This function destroys this control, clearing the HTML
   * and unregistering all events
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
  }
}
