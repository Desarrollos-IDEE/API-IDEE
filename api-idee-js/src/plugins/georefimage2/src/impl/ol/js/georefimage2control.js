/**
 * @module IDEE/impl/control/Georefimage2Control
 */

import { getValue } from '../../../facade/js/i18n/language';

export default class Georefimage2Control extends IDEE.impl.Control {
  /**
   * @classdesc
   * Main constructor of the measure conrol.
   *
   * @constructor
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor() {
    super();
    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.facadeMap_ = null;
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
   *
   * @public
   * @function
   * @param {Layer} layer to encode
   * @api stable
   */
  getParametrizedLayers(paramName, layers) {
    let others = this.facadeMap_.getMapImpl().getLayers().getArray().filter((layer) => {
      return !IDEE.utils.isNullOrEmpty(layer.getSource())
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
      if (layer.type === IDEE.layer.type.WMC) {
        // none
      } else if (layer.type === IDEE.layer.type.KML) {
        success(this.encodeKML(layer));
      } else if (layer.type === IDEE.layer.type.WMS) {
        success(this.encodeWMS(layer));
      } else if (layer.type === IDEE.layer.type.WFS) {
        success(this.encodeWFS(layer));
      } else if (layer.type === IDEE.layer.type.GeoJSON) {
        success(this.encodeWFS(layer));
      } else if (layer.type === IDEE.layer.type.WMTS) {
        this.encodeWMTS(layer).then((encodedLayer) => {
          success(encodedLayer);
        });
      } else if (IDEE.utils.isNullOrEmpty(layer.type) && layer instanceof IDEE.layer.Vector) {
        success(this.encodeWFS(layer));
      // eslint-disable-next-line no-underscore-dangle
      } else if (layer.type === undefined && layer.className_ === 'ol-layer') {
        success(this.encodeImage(layer));
      } else if (layer.type === IDEE.layer.type.XYZ || layer.type === IDEE.layer.type.TMS) {
        success(this.encodeXYZ(layer));
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
  encodeKML(layer) {
    let encodedLayer = null;

    const olLayer = layer.getImpl().getLayer();
    const features = olLayer.getSource().getFeatures();
    const layerName = layer.name;
    const layerOpacity = olLayer.getOpacity();
    const geoJSONFormat = new ol.format.GeoJSON();
    let bbox = this.facadeMap_.getBbox();
    bbox = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
    const resolution = this.facadeMap_.getMapImpl().getView().getResolution();

    const encodedFeatures = [];
    let indexText = 1;
    let indexGeom = 1;
    let index = 1;
    let style = '';
    const stylesNames = {};
    const stylesNamesText = {};
    let nameFeature;
    let filter;

    features.forEach((feature) => {
      const geometry = feature.getGeometry();
      let styleId = feature.get('styleUrl');
      if (!IDEE.utils.isNullOrEmpty(styleId)) {
        styleId = styleId.replace('#', '');
      }
      const styleFn = feature.getStyle();
      if (!IDEE.utils.isNullOrEmpty(styleFn)) {
        let featureStyle;
        try {
          featureStyle = styleFn(feature, resolution)[0];
        } catch (e) {
          featureStyle = styleFn.call(feature, resolution)[0];
        }
        if (!IDEE.utils.isNullOrEmpty(featureStyle)) {
          const img = featureStyle.getImage();
          let imgSize = img.getImageSize();
          if (IDEE.utils.isNullOrEmpty(imgSize)) {
            imgSize = [64, 64];
          }

          let parseType;
          if (feature.getGeometry().getType().toLowerCase() === 'multipolygon') {
            parseType = 'polygon';
          } else if (feature.getGeometry().getType().toLowerCase() === 'multipoint') {
            parseType = 'point';
          } else {
            parseType = feature.getGeometry().getType().toLowerCase();
          }

          const stroke = featureStyle.getStroke();
          let styleText;
          const styleGeom = {
            id: styleId,
            externalGraphic: img.getSrc(),
            graphicHeight: imgSize[0],
            graphicWidth: imgSize[1],
            graphicOpacity: img.getOpacity(),
            strokeWidth: stroke.getWidth(),
            type: parseType,
          };
          const text = (featureStyle.getText && featureStyle.getText());
          if (!IDEE.utils.isNullOrEmpty(text)) {
            styleText = {
              conflictResolution: 'false',
              fontColor: IDEE.utils.isNullOrEmpty(text.getFill()) ? '' : IDEE.utils.rgbToHex(IDEE.utils.isArray(text.getFill().getColor())
                ? `rgba(${text.getFill().getColor().toString()})`
                : text.getFill().getColor()),
              fontSize: '11px',
              fontFamily: 'Helvetica, sans-serif',
              fontWeight: 'bold',
              label: IDEE.utils.isNullOrEmpty(text.getText()) ? feature.get('name') : text.getText(),
              labelAlign: text.getTextAlign(),
              labelXOffset: text.getOffsetX(),
              labelYOffset: text.getOffsetY(),
              labelOutlineColor: IDEE.utils.isNullOrEmpty(text.getStroke()) ? '' : IDEE.utils.rgbToHex(IDEE.utils.isArray(text.getStroke().getColor())
                ? `rgba(${text.getStroke().getColor().toString()})`
                : text.getStroke().getColor()),
              labelOutlineWidth: IDEE.utils.isNullOrEmpty(text.getStroke()) ? '' : text.getStroke().getWidth(),
              type: 'text',
            };
            styleText.fontColor = styleText.fontColor.slice(0, 7);
            styleText.labelOutlineColor = styleText.labelOutlineColor.slice(0, 7);
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
                  style += `{${a}, "version": "2"`;
                }
              }
            }

            const geoJSONFeature = geoJSONFormat.writeFeatureObject(feature);
            geoJSONFeature.properties = {
              name: nameFeature,
              _gx_style: styleName + styleNameText,
            };
            encodedFeatures.push(geoJSONFeature);
          }
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

    return encodedLayer;
  }

  /**
   * This function encodes a WMS layer.
   *
   * @public
   * @function
   * @param {IDEE.layer.WMS} layer to encode
   * @api stable
   */
  encodeWMS(layer) {
    let encodedLayer = null;
    const olLayer = layer.getImpl().getLayer();
    const layerUrl = layer.url;
    const layerOpacity = olLayer.getOpacity();
    const params = olLayer.getSource().getParams();
    const paramsLayers = [params.LAYERS];
    const paramsStyles = [params.STYLES];
    encodedLayer = {
      baseURL: layerUrl,
      opacity: layerOpacity,
      type: 'WMS',
      layers: paramsLayers.join(',').split(','),
      styles: paramsStyles.join(',').split(','),
    };

    /** ***********************************
     MAPEO DE CAPAS TILEADA.
    ************************************ */
    // eslint-disable-next-line no-underscore-dangle
    if (layer._updateNoCache) {
      // eslint-disable-next-line no-underscore-dangle
      layer._updateNoCache();
      const noCacheName = layer.getNoCacheName();
      const noChacheUrl = layer.getNoCacheUrl();
      if (!IDEE.utils.isNullOrEmpty(noCacheName) && !IDEE.utils.isNullOrEmpty(noChacheUrl)) {
        encodedLayer.layers = [noCacheName];
        encodedLayer.baseURL = noChacheUrl;
      }
    } else {
      const noCacheName = layer.getNoChacheName();
      const noCacheUrl = layer.getNoChacheUrl();
      if (!IDEE.utils.isNullOrEmpty(noCacheName) && !IDEE.utils.isNullOrEmpty(noCacheUrl)) {
        encodedLayer.layers = [noCacheName];
        encodedLayer.baseURL = noCacheUrl;
      }
    }

    /** *********************************  */

    // defaults
    encodedLayer.customParams = {
      // service: 'WMS',
      // version: '1.1.1',
      // request: 'GetMap',
      // styles: '',
      // format: 'image/jpeg',
    };

    const propKeys = Object.keys(params);
    propKeys.forEach((key) => {
      if ('iswmc,transparent'.indexOf(key.toLowerCase()) !== -1) {
        encodedLayer.customParams[key] = params[key];
      }
    });
    return encodedLayer;
  }

  /**
   * This function encodes a OL Image layer.
   *
   * @public
   * @function
   * @param {IMAGE} layer to encode
   * @api stable
   */
  encodeImage(layer) {
    let encodedLayer = null;
    const olLayer = layer;
    const params = olLayer.getSource().getParams();
    const paramsLayers = [params.LAYERS];
    const paramsStyles = [params.STYLES];
    encodedLayer = {
      baseURL: olLayer.getSource().getUrl(),
      opacity: olLayer.getOpacity(),
      type: 'WMS',
      layers: paramsLayers.join(',').split(','),
      styles: paramsStyles.join(',').split(','),
    };

    encodedLayer.customParams = {
      IMAGEN: params.IMAGEN,
      transparent: true,
      iswmc: false,
    };

    return encodedLayer;
  }

  encodeXYZ(layer) {
    const layerImpl = layer.getImpl();
    const olLayer = layerImpl.getLayer();
    const layerSource = olLayer.getSource();
    const tileGrid = layerSource.getTileGrid();
    const layerUrl = layer.url;
    const layerOpacity = olLayer.getOpacity();
    const layerExtent = tileGrid.getExtent();
    const tileSize = tileGrid.getTileSize();
    const resolutions = tileGrid.getResolutions();
    return {
      opacity: layerOpacity,
      baseURL: layerUrl,
      maxExtent: layerExtent,
      tileSize: [tileSize, tileSize],
      resolutions,
      type: 'osm',
    };
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
            strokeColor: IDEE.utils.isNullOrEmpty(stroke) ? '#000000' : IDEE.utils.rgbaToHex(stroke.getColor()),
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
  encodeWMTS(layer) {
    const layerImpl = layer.getImpl();
    const olLayer = layerImpl.getLayer();
    const layerSource = olLayer.getSource();

    const layerUrl = layer.url;
    const layerName = layer.name;
    const layerOpacity = olLayer.getOpacity();
    const layerReqEncoding = layerSource.getRequestEncoding();
    const matrixSet = layer.matrixSet;

    /**
     * @see http: //www.mapfish.org/doc/print/protocol.html#layers-params
     */
    return layer.getImpl().getCapabilities().then((capabilities) => {
      const matrixIdsObj = capabilities.Contents.TileMatrixSet.filter((tileMatrixSet) => {
        return (tileMatrixSet.Identifier === matrixSet);
      })[0];

      try {
        return {
          baseURL: layerUrl,
          imageFormat: layer.options.imageFormat || layer.options.format || 'image/png',
          layer: layerName,
          matrices: matrixIdsObj.TileMatrix.map((tileMatrix, i) => {
            return {
              identifier: tileMatrix.Identifier,
              matrixSize: [tileMatrix.MatrixHeight, tileMatrix.MatrixWidth],
              scaleDenominator: tileMatrix.ScaleDenominator,
              tileSize: [tileMatrix.TileWidth, tileMatrix.TileHeight],
              topLeftCorner: tileMatrix.TopLeftCorner,
            };
          }),
          matrixSet,
          opacity: layerOpacity,
          requestEncoding: layerReqEncoding,
          style: 'default',
          type: 'WMTS',
          version: '1.0.0',
        };
      } catch (e) {
        IDEE.dialog.error(getValue('errorProjectionCapabilities'));
        return null;
      }
    });
  }

  encodeWMTSNoLayer(url, layerName, projection) {
    const matrixSet = projection !== 'EPSG:3857' ? projection : 'GoogleMapsCompatible';
    return this.getWMTSCapabilities(url).then((capabilities) => {
      const matrixIdsObj = capabilities.Contents.TileMatrixSet.filter((tileMatrixSet) => {
        return (tileMatrixSet.Identifier === matrixSet);
      })[0];

      try {
        return {
          baseURL: url,
          imageFormat: 'image/jpeg',
          layer: layerName,
          matrices: matrixIdsObj.TileMatrix.map((tileMatrix, i) => {
            return {
              identifier: tileMatrix.Identifier,
              matrixSize: [tileMatrix.MatrixHeight, tileMatrix.MatrixWidth],
              scaleDenominator: tileMatrix.ScaleDenominator,
              tileSize: [tileMatrix.TileWidth, tileMatrix.TileHeight],
              topLeftCorner: tileMatrix.TopLeftCorner,
            };
          }),
          matrixSet,
          opacity: 1,
          requestEncoding: 'KVP',
          style: 'default',
          type: 'WMTS',
          version: '1.0.0',
        };
      } catch (e) {
        IDEE.dialog.error(getValue('errorProjectionCapabilities'));
        return null;
      }
    });
  }

  encodeWMSNoLayer(url, layerName, projection) {
    const encodedLayer = {
      baseURL: url,
      opacity: 1,
      type: 'WMS',
      layers: [layerName],
      styles: [''],
      customParams: {
        version: '1.3.0',
      },
    };

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
   * This function reprojects map on selected SRS.
   *
   * @function
   * @param {string} origin - EPSG:25830
   * @param {array<number>} coordinates pair
   * @api
   */
  reproject(origin, coordinates) {
    const originProj = ol.proj.get(origin);
    const destProj = ol.proj.get('EPSG:4326');
    const coordinatesTransform = ol.proj.transform(coordinates, originProj, destProj);
    return coordinatesTransform;
  }

  transformExt(box, code, currProj) {
    return ol.proj.transformExtent(box, code, currProj);
  }

  transform(box, code, currProj) {
    return ol.proj.transform(box, code, currProj);
  }

  getWMTSCapabilities(url) {
    const capabilitiesPromise = new Promise((success, fail) => {
      const getCapabilitiesUrl = IDEE.utils.getWMTSGetCapabilitiesUrl(url);
      const parser = new ol.format.WMTSCapabilities();
      IDEE.remote.get(getCapabilitiesUrl).then((response) => {
        const getCapabilitiesDocument = response.xml;
        const parsedCapabilities = parser.read(getCapabilitiesDocument);
        try {
          parsedCapabilities.Contents.Layer.forEach((l) => {
            const name = l.Identifier;
            l.Style.forEach((s) => {
              const layerText = response.text.split('Layer>').filter((text) => text.indexOf(`Identifier>${name}<`) > -1)[0];
              /* eslint-disable no-param-reassign */
              s.LegendURL = layerText.split('LegendURL')[1].split('xlink:href="')[1].split('"')[0];
            });
          });
        /* eslint-disable no-empty */
        } catch (err) {}
        success.call(this, parsedCapabilities);
      });
    });

    return capabilitiesPromise;
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
