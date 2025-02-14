/**
 * @module M/impl/control/Georefimage2Control
 */

import { getValue } from '../../../facade/js/i18n/language';

export default class Georefimage2Control extends M.impl.Control {
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
     * @type {M.Map}
     */
    this.facadeMap_ = null;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
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
      return !M.utils.isNullOrEmpty(layer.getSource())
        // eslint-disable-next-line no-underscore-dangle
        && !M.utils.isNullOrEmpty(layer.getSource().params_)
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
      if (layer.type === M.layer.type.WMC) {
        // none
      } else if (layer.type === M.layer.type.KML) {
        success(this.encodeKML(layer));
      } else if (layer.type === M.layer.type.WMS) {
        success(this.encodeWMS(layer));
      } else if (layer.type === M.layer.type.WFS) {
        success(this.encodeWFS(layer));
      } else if (layer.type === M.layer.type.GeoJSON) {
        success(this.encodeWFS(layer));
      } else if (layer.type === M.layer.type.WMTS) {
        this.encodeWMTS(layer).then((encodedLayer) => {
          success(encodedLayer);
        });
      } else if (M.utils.isNullOrEmpty(layer.type) && layer instanceof M.layer.Vector) {
        success(this.encodeWFS(layer));
      // eslint-disable-next-line no-underscore-dangle
      } else if (layer.type === undefined && layer.className_ === 'ol-layer') {
        success(this.encodeImage(layer));
      } else if (layer.type === M.layer.type.XYZ || layer.type === M.layer.type.TMS) {
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
   * @param {M.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  encodeKML(layer) {
    let encodedLayer = null;

    const olLayer = layer.getImpl().getOL3Layer();
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
      if (!M.utils.isNullOrEmpty(styleId)) {
        styleId = styleId.replace('#', '');
      }
      const styleFn = feature.getStyle();
      if (!M.utils.isNullOrEmpty(styleFn)) {
        let featureStyle;
        try {
          featureStyle = styleFn(feature, resolution)[0];
        } catch (e) {
          featureStyle = styleFn.call(feature, resolution)[0];
        }
        if (!M.utils.isNullOrEmpty(featureStyle)) {
          const img = featureStyle.getImage();
          let imgSize = img.getImageSize();
          if (M.utils.isNullOrEmpty(imgSize)) {
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
          if (!M.utils.isNullOrEmpty(text)) {
            styleText = {
              conflictResolution: 'false',
              fontColor: M.utils.isNullOrEmpty(text.getFill()) ? '' : M.utils.rgbToHex(M.utils.isArray(text.getFill().getColor())
                ? `rgba(${text.getFill().getColor().toString()})`
                : text.getFill().getColor()),
              fontSize: '11px',
              fontFamily: 'Helvetica, sans-serif',
              fontWeight: 'bold',
              label: M.utils.isNullOrEmpty(text.getText()) ? feature.get('name') : text.getText(),
              labelAlign: text.getTextAlign(),
              labelXOffset: text.getOffsetX(),
              labelYOffset: text.getOffsetY(),
              labelOutlineColor: M.utils.isNullOrEmpty(text.getStroke()) ? '' : M.utils.rgbToHex(M.utils.isArray(text.getStroke().getColor())
                ? `rgba(${text.getStroke().getColor().toString()})`
                : text.getStroke().getColor()),
              labelOutlineWidth: M.utils.isNullOrEmpty(text.getStroke()) ? '' : text.getStroke().getWidth(),
              type: 'text',
            };
            styleText.fontColor = styleText.fontColor.slice(0, 7);
            styleText.labelOutlineColor = styleText.labelOutlineColor.slice(0, 7);
          }

          nameFeature = `draw${index}`;

          if ((!M.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox))
            || !M.utils.isNullOrEmpty(text)) {
            const styleStr = JSON.stringify(styleGeom);
            const styleTextStr = JSON.stringify(styleText);
            let styleName = stylesNames[styleStr];
            let styleNameText = stylesNamesText[styleTextStr];

            if (M.utils.isUndefined(styleName) || M.utils.isUndefined(styleNameText)) {
              const symbolizers = [];
              let flag = 0;
              if (!M.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox)
                && M.utils.isUndefined(styleName)) {
                styleName = indexGeom;
                stylesNames[styleStr] = styleName;
                flag = 1;
                symbolizers.push(styleStr);
                indexGeom += 1;
                index += 1;
              }
              if (!M.utils.isNullOrEmpty(text) && M.utils.isUndefined(styleNameText)) {
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

              if (!M.utils.isNullOrEmpty(symbolizers)) {
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
   * @param {M.layer.WMS} layer to encode
   * @api stable
   */
  encodeWMS(layer) {
    let encodedLayer = null;
    const olLayer = layer.getImpl().getOL3Layer();
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
      if (!M.utils.isNullOrEmpty(noCacheName) && !M.utils.isNullOrEmpty(noChacheUrl)) {
        encodedLayer.layers = [noCacheName];
        encodedLayer.baseURL = noChacheUrl;
      }
    } else {
      const noCacheName = layer.getNoChacheName();
      const noCacheUrl = layer.getNoChacheUrl();
      if (!M.utils.isNullOrEmpty(noCacheName) && !M.utils.isNullOrEmpty(noCacheUrl)) {
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
    const olLayer = layerImpl.getOL3Layer();
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
   * @param {M.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  encodeWFS(layer) {
    let encodedLayer = null;
    const continuePrint = true;
    if (continuePrint) {
      const projection = this.facadeMap_.getProjection();
      const olLayer = layer.getImpl().getOL3Layer();
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

        if (!M.utils.isNullOrEmpty(fStyle)) {
          featureStyle = fStyle;
        } else if (!M.utils.isNullOrEmpty(layerStyle)) {
          featureStyle = layerStyle;
        }

        if (featureStyle instanceof Function) {
          featureStyle = featureStyle.call(featureStyle, feature, resolution);
        }

        if (featureStyle instanceof Array) {
          // SRC style has priority
          if (featureStyle.length > 1) {
            featureStyle = (!M.utils.isNullOrEmpty(featureStyle[1].getImage())
              && featureStyle[1].getImage().getSrc)
              ? featureStyle[1]
              : featureStyle[0];
          } else {
            featureStyle = featureStyle[0];
          }
        }

        if (!M.utils.isNullOrEmpty(featureStyle)) {
          const image = featureStyle.getImage();
          const imgSize = M.utils
            .isNullOrEmpty(image) ? [0, 0] : (image.getImageSize() || [24, 24]);
          let text = featureStyle.getText();
          if (M.utils.isNullOrEmpty(text) && !M.utils.isNullOrEmpty(featureStyle.textPath)) {
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

          const stroke = M.utils.isNullOrEmpty(image)
            ? featureStyle.getStroke()
            : (image.getStroke && image.getStroke());
          const fill = M.utils.isNullOrEmpty(image)
            ? featureStyle.getFill()
            : (image.getFill && image.getFill());

          let styleText;
          const styleGeom = {
            type: parseType,
            fillColor: M.utils.isNullOrEmpty(fill) ? '#000000' : M.utils.rgbaToHex(fill.getColor()).slice(0, 7),
            fillOpacity: M.utils.isNullOrEmpty(fill)
              ? 0
              : M.utils.getOpacityFromRgba(fill.getColor()),
            strokeColor: M.utils.isNullOrEmpty(stroke) ? '#000000' : M.utils.rgbaToHex(stroke.getColor()),
            strokeOpacity: M.utils.isNullOrEmpty(stroke)
              ? 0
              : M.utils.getOpacityFromRgba(stroke.getColor()),
            strokeWidth: M.utils.isNullOrEmpty(stroke) ? 0 : (stroke.getWidth && stroke.getWidth()),
            pointRadius: M.utils.isNullOrEmpty(image) ? '' : (image.getRadius && image.getRadius()),
            externalGraphic: M.utils.isNullOrEmpty(image) ? '' : (image.getSrc && image.getSrc()),
            graphicHeight: imgSize[0],
            graphicWidth: imgSize[1],
          };
          if (!M.utils.isNullOrEmpty(text)) {
            let tAlign = text.getTextAlign();
            let tBLine = text.getTextBaseline();
            let align = '';
            if (!M.utils.isNullOrEmpty(tAlign)) {
              if (tAlign === M.style.align.LEFT) {
                tAlign = 'l';
              } else if (tAlign === M.style.align.RIGHT) {
                tAlign = 'r';
              } else if (tAlign === M.style.align.CENTER) {
                tAlign = 'c';
              } else {
                tAlign = '';
              }
            }
            if (!M.utils.isNullOrEmpty(tBLine)) {
              if (tBLine === M.style.baseline.BOTTOM) {
                tBLine = 'b';
              } else if (tBLine === M.style.baseline.MIDDLE) {
                tBLine = 'm';
              } else if (tBLine === M.style.baseline.TOP) {
                tBLine = 't';
              } else {
                tBLine = '';
              }
            }
            if (!M.utils.isNullOrEmpty(tAlign) && !M.utils.isNullOrEmpty(tBLine)) {
              align = tAlign.concat(tBLine);
            }
            const font = text.getFont();
            const fontWeight = !M.utils.isNullOrEmpty(font) && font.indexOf('bold') > -1 ? 'bold' : 'normal';
            let fontSize = '11px';
            if (!M.utils.isNullOrEmpty(font)) {
              const px = font.substr(0, font.indexOf('px'));
              if (!M.utils.isNullOrEmpty(px)) {
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
              fontColor: M.utils.isNullOrEmpty(text.getFill()) ? '#000000' : M.utils.rgbToHex(text.getFill().getColor()),
              fontSize,
              fontFamily: 'Helvetica, sans-serif',
              fontStyle: 'normal',
              fontWeight,
              conflictResolution: 'false',
              labelXOffset: text.getOffsetX(),
              labelYOffset: text.getOffsetY(),
              fillColor: styleGeom.fillColor || '#FF0000',
              fillOpacity: styleGeom.fillOpacity || 1,
              labelOutlineColor: M.utils.isNullOrEmpty(text.getStroke()) ? '' : M.utils.rgbToHex(text.getStroke().getColor() || '#FF0000'),
              labelOutlineWidth: M.utils.isNullOrEmpty(text.getStroke()) ? '' : text.getStroke().getWidth(),
              labelAlign: align,
            };
          }

          nameFeature = `draw${index}`;

          if ((!M.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox))
            || !M.utils.isNullOrEmpty(text)) {
            const styleStr = JSON.stringify(styleGeom);
            const styleTextStr = JSON.stringify(styleText);
            let styleName = stylesNames[styleStr];
            let styleNameText = stylesNamesText[styleTextStr];

            if (M.utils.isUndefined(styleName) || M.utils.isUndefined(styleNameText)) {
              const symbolizers = [];
              let flag = 0;
              if (!M.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox)
                && M.utils.isUndefined(styleName)) {
                styleName = indexGeom;
                stylesNames[styleStr] = styleName;
                flag = 1;
                symbolizers.push(styleStr);
                indexGeom += 1;
                index += 1;
              }
              if (!M.utils.isNullOrEmpty(text) && M.utils.isUndefined(styleNameText)) {
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
              if (!M.utils.isNullOrEmpty(symbolizers)) {
                const a = `${filter}: {"symbolizers": [${symbolizers}]}`;
                if (style !== '') {
                  style += `,${a}`;
                } else {
                  style += `{${a},"version":"2"`;
                }
              }
            }

            let geoJSONFeature;
            if (projection.code !== 'EPSG:3857' && this.facadeMap_.getLayers().some((layerParam) => (layerParam.type === M.layer.type.OSM || layerParam.type === M.layer.type.Mapbox))) {
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
   * @param {M.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  encodeWMTS(layer) {
    const layerImpl = layer.getImpl();
    const olLayer = layerImpl.getOL3Layer();
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
        M.dialog.error(getValue('errorProjectionCapabilities'));
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
        M.dialog.error(getValue('errorProjectionCapabilities'));
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
   * @param {M.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  encodeOSM(layer) {
    let encodedLayer = null;

    const layerImpl = layer.getImpl();
    const olLayer = layerImpl.getOL3Layer();
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
   * @param {M.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  encodeMapbox(layer) {
    let encodedLayer = null;

    const layerImpl = layer.getImpl();
    const olLayer = layerImpl.getOL3Layer();
    const layerSource = olLayer.getSource();
    const tileGrid = layerSource.getTileGrid();

    const layerUrl = M.utils.concatUrlPaths([M.config.MAPBOX_URL, layer.name]);
    const layerOpacity = olLayer.getOpacity();
    const layerExtent = tileGrid.getExtent();

    const tileSize = tileGrid.getTileSize();
    const resolutions = tileGrid.getResolutions();

    const customParams = {};
    customParams[M.config.MAPBOX_TOKEN_NAME] = M.config.MAPBOX_TOKEN_VALUE;
    encodedLayer = {
      opacity: layerOpacity,
      baseURL: layerUrl,
      customParams,
      maxExtent: layerExtent,
      tileSize: [tileSize, tileSize],
      resolutions,
      extension: M.config.MAPBOX_EXTENSION,
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
      const getCapabilitiesUrl = M.utils.getWMTSGetCapabilitiesUrl(url);
      const parser = new ol.format.WMTSCapabilities();
      M.remote.get(getCapabilitiesUrl).then((response) => {
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
