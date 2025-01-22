/**
 * @module IDEE/impl/control/PrinterMapControl
 */

import { getValue } from '../../../facade/js/i18n/language';

export default class PrinterMapControl extends IDEE.impl.Control {
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

    this.errors = [];
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
      try {
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
        } else if ([IDEE.layer.type.XYZ,
          IDEE.layer.type.TMS, IDEE.layer.type.OSM].indexOf(layer.type)
          > -1) {
          success(this.encodeXYZ(layer));
        } else if (layer.type === IDEE.layer.type.MVT) {
          success(this.encodeMVT(layer));
        } else if (layer.type === IDEE.layer.type.MBTiles
          || layer.type === IDEE.layer.type.MBTilesVector) {
          this.errors.push(layer.name);
          success('');
        } else {
          success(this.encodeWFS(layer));
        }
      } catch (e) {
        this.errors.push(layer.name);
        success('');
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
      // styleProperty: '_gx_style',
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
    // const paramsFormat = params.FORMAT;
    const paramsStyles = [params.STYLES];
    encodedLayer = {
      baseURL: layerUrl,
      opacity: layerOpacity,
      type: 'WMS',
      layers: paramsLayers.join(',').split(','),
      // format: paramsFormat || 'image/jpeg',
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
      // format: params.FORMAT || 'image/jpeg',
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
    let layerUrl = layer.url;
    const layerOpacity = olLayer.getOpacity();
    const layerExtent = tileGrid.getExtent();
    const tileSize = tileGrid.getTileSize();
    const resolutions = tileGrid.getResolutions();

    if (layer.type === IDEE.layer.type.OSM) {
      layerUrl = layer.url || 'http://tile.openstreetmap.org/';
    }

    return {
      opacity: layerOpacity,
      baseURL: layerUrl,
      maxExtent: layerExtent,
      tileSize: [tileSize, tileSize],
      resolutions,
      type: 'osm',
    };
  }

  encodeMVT(layer) {
    let encodedLayer = null;
    // const projection = this.facadeMap_.getProjection();
    const features = layer.getFeatures();
    const layerName = layer.name;
    const layerOpacity = layer.getOpacity();
    const layerStyle = layer.getImpl().getLayer().getStyle();
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
      const geometry = feature.getImpl().getFeature().getGeometry();
      let featureStyle;
      const fStyle = feature.getImpl().getFeature().getStyleFunction();
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
        if (geometry.getType().toLowerCase() === 'multipolygon') {
          parseType = 'polygon';
        } else if (geometry.getType().toLowerCase() === 'multipoint') {
          parseType = 'point';
        } else if (geometry.getType().toLowerCase().indexOf('linestring') > -1) {
          parseType = 'line';
        } else {
          parseType = geometry.getType().toLowerCase();
        }

        const stroke = IDEE.utils.isNullOrEmpty(image)
          ? featureStyle.getStroke()
          : (image.getStroke && image.getStroke());
        const fill = IDEE.utils.isNullOrEmpty(image)
          ? featureStyle.getFill()
          : (image.getFill && image.getFill());

        let styleText;
        const lineDash = (featureStyle.getStroke() !== null
          && featureStyle.getStroke() !== undefined)
          ? featureStyle.getStroke().getLineDash()
          : undefined;
        const styleGeom = {
          type: parseType,
          fillColor: IDEE.utils.isNullOrEmpty(fill) || (layer.name.indexOf(' Reverse') > -1 && layer.name.indexOf('Cobertura') > -1) ? '#000000' : IDEE.utils.rgbaToHex(fill.getColor()).slice(0, 7),
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
          strokeLinecap: 'round',
        };

        if (layer.name === 'coordinateresult') {
          styleGeom.fillOpacity = 1;
          styleGeom.strokeOpacity = 1;
          styleGeom.fillColor = '#ffffff';
          styleGeom.strokeColor = '#ff0000';
          styleGeom.strokeWidth = 2;
        }

        if (layer.name === 'infocoordinatesLayerFeatures') {
          styleGeom.fillColor = '#ffffff';
          styleGeom.fillOpacity = 1;
          styleGeom.strokeWidth = 1;
          styleGeom.strokeColor = '#2690e7';
          styleGeom.strokeOpacity = 1;
          styleGeom.graphicName = 'cross';
          styleGeom.graphicWidth = 15;
          styleGeom.graphicHeight = 15;
        }

        if (layer.name.indexOf(' Reverse') > -1 && layer.name.indexOf('Cobertura') > -1) {
          styleGeom.fillColor = styleGeom.strokeColor;
          styleGeom.fillOpacity = 0.5;
        }

        if (lineDash !== undefined && lineDash !== null && lineDash.length > 0) {
          if (lineDash[0] === 1 && lineDash.length === 2) {
            styleGeom.strokeDashstyle = 'dot';
          } else if (lineDash[0] === 10) {
            styleGeom.strokeDashstyle = 'dash';
          } else if (lineDash[0] === 1 && lineDash.length > 2) {
            styleGeom.strokeDashstyle = 'dashdot';
          }
        }

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
        } else if (layer.name === 'infocoordinatesLayerFeatures') {
          text = true;
          styleText = {
            type: 'text',
            conflictResolution: 'false',
            fontFamily: 'Helvetica, sans-serif',
            fontStyle: 'normal',
            fontColor: '#ffffff',
            fontSize: '12px',
            label: `${feature.getId()}`,
            labelAlign: 'lb',
            labelXOffset: '4',
            labelYOffset: '3',
            haloColor: '#2690e7',
            haloRadius: '1',
            haloOpacity: '1',
          };
        }

        nameFeature = `draw${index}`;
        const extent = geometry.getExtent();
        if ((!IDEE.utils.isNullOrEmpty(geometry) && ol.extent.intersects(bbox, extent))
          || !IDEE.utils.isNullOrEmpty(text)) {
          const styleStr = JSON.stringify(styleGeom);
          const styleTextStr = JSON.stringify(styleText);
          let styleName = stylesNames[styleStr];
          let styleNameText = stylesNamesText[styleTextStr];

          if (IDEE.utils.isUndefined(styleName) || IDEE.utils.isUndefined(styleNameText)) {
            const symbolizers = [];
            let flag = 0;
            if (!IDEE.utils.isNullOrEmpty(geometry) && ol.extent.intersects(bbox, extent)
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

          let coordinates = geometry.getFlatCoordinates();
          coordinates = this.inflateCoordinatesArray(coordinates, 0, geometry.getEnds(), 2);
          const geoJSONFeature = {
            id: feature.getId(),
            type: 'Feature',
            geometry: {
              type: geometry.getType(),
              coordinates,
            },
          };

          /*
          if (projection.code !== 'EPSG:3857' && this.facadeMap_.getLayers()
            .some((layerParam) => (layerParam.type === IDEE.layer.type.OSM
              || layerParam.type === IDEE.layer.type.Mapbox))) {
            geoJSONFeature = geoJSONFormat.writeFeatureObject(feature.getImpl().getFeature(), {
              featureProjection: projection.code,
              dataProjection: 'EPSG:3857',
            });
          } else {
            geoJSONFeature = geoJSONFormat.writeFeatureObject(feature.getImpl().getFeature());
          }
          */

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
      // styleProperty: '_gx_style',
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
    const olLayer = layer.getImpl().getLayer();
    const features = olLayer.getSource().getFeatures();
    const layerName = layer.name;
    const layerOpacity = olLayer.getOpacity();
    let encodedFeatures = [];
    let style = '';
    let index = 1;
    let indexText = 1;
    let indexGeom = 1;
    const stylesNames = {};
    const stylesNamesText = {};
    features.forEach((feature) => {
      let encodedFeature = null;
      if (feature.getGeometry().getType().toLowerCase() === 'geometrycollection') {
        encodedFeature = this.encodeGeometryCollection_(layer, feature, style, index, indexGeom);
        if (encodedFeature.geojson.length > 0) {
          encodedFeatures = encodedFeatures.concat(encodedFeature.geojson);
          style += encodedFeature.style;
          index += encodedFeature.plusIndex;
          indexGeom += encodedFeature.plusIndexGeom;
        }
      } else {
        encodedFeature = this.encodeFeature_(
          layer,
          feature,
          style,
          index,
          indexText,
          indexGeom,
          stylesNames,
          stylesNamesText,
        );

        if (encodedFeature.geojson !== null) {
          encodedFeatures.push(encodedFeature.geojson);
          style = encodedFeature.style;
          index += encodedFeature.plusIndex;
          indexGeom += encodedFeature.plusIndexGeom;
          indexText += encodedFeature.plusIndexText;
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

  encodeFeature_(layer, feature, style, index, indexText, indexGeom, stylesNames, stylesNamesText) {
    let res = null;
    const projection = this.facadeMap_.getProjection();
    const olLayer = layer.getImpl().getLayer();
    const layerStyle = olLayer.getStyle();
    const geoJSONFormat = new ol.format.GeoJSON();
    let bbox = this.facadeMap_.getBbox();
    bbox = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
    const resolution = this.facadeMap_.getMapImpl().getView().getResolution();
    let nameFeature;
    let filter;
    let plusIndex = 0;
    let plusIndexText = 0;
    let plusIndexGeom = 0;
    const geometry = feature.getGeometry();
    let featureStyle;
    const fStyle = feature.getStyle();
    let newStyle = `${style}`;
    if (!IDEE.utils.isNullOrEmpty(fStyle)) {
      featureStyle = fStyle;
    } else if (!IDEE.utils.isNullOrEmpty(layerStyle)) {
      featureStyle = layerStyle;
    }

    if (featureStyle instanceof Function) {
      featureStyle = featureStyle.call(featureStyle, feature, resolution);
    }

    let styleIcon = null;
    if (featureStyle instanceof Array) {
      // SRC style has priority
      if (featureStyle.length > 1) {
        styleIcon = !IDEE.utils.isNullOrEmpty(featureStyle[1])
          && !IDEE.utils.isNullOrEmpty(featureStyle[1].getImage())
          && featureStyle[1].getImage().getGlyph
          ? featureStyle[1].getImage() : null;
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
      const lineDash = (featureStyle.getStroke() !== null
        && featureStyle.getStroke() !== undefined)
        ? featureStyle.getStroke().getLineDash()
        : undefined;
      const styleGeom = {
        type: parseType,
        fillColor: IDEE.utils.isNullOrEmpty(fill) || (layer.name.indexOf(' Reverse') > -1 && layer.name.indexOf('Cobertura') > -1) ? '#000000' : IDEE.utils.rgbaToHex(fill.getColor()).slice(0, 7),
        fillOpacity: IDEE.utils.isNullOrEmpty(fill)
          ? 0
          : IDEE.utils.getOpacityFromRgba(fill.getColor()),
        strokeColor: IDEE.utils.isNullOrEmpty(stroke) ? '#000000' : IDEE.utils.rgbaToHex(stroke.getColor()),
        strokeOpacity: IDEE.utils.isNullOrEmpty(stroke)
          ? 0
          : IDEE.utils.getOpacityFromRgba(stroke.getColor()),
        strokeWidth: IDEE.utils.isNullOrEmpty(stroke) ? 0 : (stroke.getWidth && stroke.getWidth()),
        pointRadius: IDEE.utils.isNullOrEmpty(image) ? '' : (image.getRadius && image.getRadius()),
        externalGraphic: IDEE.utils.isNullOrEmpty(image) ? '' : (image.getSrc && image.getSrc()),
        graphicHeight: imgSize[0],
        graphicWidth: imgSize[1],
        strokeLinecap: 'round',
      };

      if (layer.name === 'coordinateresult') {
        styleGeom.fillOpacity = 1;
        styleGeom.strokeOpacity = 1;
        styleGeom.fillColor = '#ffffff';
        styleGeom.strokeColor = '#ff0000';
        styleGeom.strokeWidth = 2;
      }

      if (layer.name === 'infocoordinatesLayerFeatures') {
        styleGeom.fillColor = '#ffffff';
        styleGeom.fillOpacity = 1;
        styleGeom.strokeWidth = 1;
        styleGeom.strokeColor = '#2690e7';
        styleGeom.strokeOpacity = 1;
        styleGeom.graphicName = 'cross';
        styleGeom.graphicWidth = 15;
        styleGeom.graphicHeight = 15;
      }

      if (layer.name.indexOf(' Reverse') > -1 && layer.name.indexOf('Cobertura') > -1) {
        styleGeom.fillColor = styleGeom.strokeColor;
        styleGeom.fillOpacity = 0.5;
      }

      if (lineDash !== undefined && lineDash !== null && lineDash.length > 0) {
        if (lineDash[0] === 1 && lineDash.length === 2) {
          styleGeom.strokeDashstyle = 'dot';
        } else if (lineDash[0] === 10) {
          styleGeom.strokeDashstyle = 'dash';
        } else if (lineDash[0] === 1 && lineDash.length > 2) {
          styleGeom.strokeDashstyle = 'dashdot';
        }
      }

      const imageIcon = !IDEE.utils.isNullOrEmpty(styleIcon)
        && styleIcon.getImage ? styleIcon.getImage() : null;
      if (!IDEE.utils.isNullOrEmpty(imageIcon)) {
        if (styleIcon.getRadius && styleIcon.getRadius()) {
          styleGeom.pointRadius = styleIcon.getRadius && styleIcon.getRadius();
        }

        if (styleIcon.getOpacity && styleIcon.getOpacity()) {
          styleGeom.graphicOpacity = styleIcon.getOpacity();
        }

        styleGeom.externalGraphic = imageIcon.toDataURL();
      }

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
      } else if (layer.name === 'infocoordinatesLayerFeatures') {
        text = true;
        styleText = {
          type: 'text',
          conflictResolution: 'false',
          fontFamily: 'Helvetica, sans-serif',
          fontStyle: 'normal',
          fontColor: '#ffffff',
          fontSize: '12px',
          label: `${feature.getId()}`,
          labelAlign: 'lb',
          labelXOffset: '4',
          labelYOffset: '3',
          haloColor: '#2690e7',
          haloRadius: '1',
          haloOpacity: '1',
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
            // eslint-disable-next-line no-param-reassign
            stylesNames[styleStr] = styleName;
            flag = 1;
            symbolizers.push(styleStr);
            plusIndexGeom += 1;
            plusIndex += 1;
          }
          if (!IDEE.utils.isNullOrEmpty(text) && IDEE.utils.isUndefined(styleNameText)) {
            styleNameText = indexText;
            // eslint-disable-next-line no-param-reassign
            stylesNamesText[styleTextStr] = styleNameText;
            symbolizers.push(styleTextStr);
            plusIndexText += 1;
            if (flag === 0) {
              plusIndex += 1;
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
            if (newStyle.indexOf(filter) === -1) {
              if (newStyle !== '') {
                // eslint-disable-next-line no-param-reassign
                newStyle += `,${a}`;
              } else {
                // eslint-disable-next-line no-param-reassign
                newStyle += `{${a},"version":"2"`;
              }
            } else {
              newStyle = '';
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

        res = geoJSONFeature;
      }
    }

    return {
      style: newStyle,
      geojson: res,
      plusIndex,
      plusIndexText,
      plusIndexGeom,
    };
  }

  encodeGeometryCollection_(layer, gc, style, index, indexGeom) {
    const res = [];
    const stylesNames = {};
    let nameFeature;
    let bbox = this.facadeMap_.getBbox();
    bbox = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
    let filter;
    let newStyle = `${style}`;
    let plusIndex = 0;
    let plusIndexGeom = 0;
    gc.getGeometry().getGeometries().forEach((geometry) => {
      let parseType;
      if (geometry.getType().toLowerCase() === 'multipolygon') {
        parseType = 'polygon';
      } else if (geometry.getType().toLowerCase() === 'multipoint') {
        parseType = 'point';
      } else if (geometry.getType().toLowerCase().indexOf('linestring') > -1) {
        parseType = 'line';
      } else {
        parseType = geometry.getType().toLowerCase();
      }

      if (parseType === 'polygon') {
        const styleGeom = {
          type: parseType,
          fillColor: '#3399CC',
          fillOpacity: 0,
          strokeColor: '#3399CC',
          strokeWidth: 2,
          strokeLinecap: 'round',
        };

        nameFeature = `draw${index}`;
        if (!IDEE.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox)) {
          const styleStr = JSON.stringify(styleGeom);
          let styleName = stylesNames[styleStr];
          if (IDEE.utils.isUndefined(styleName)) {
            const symbolizers = [];
            if (!IDEE.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox)
              && IDEE.utils.isUndefined(styleName)) {
              styleName = indexGeom;
              stylesNames[styleStr] = styleName;
              symbolizers.push(styleStr);
              plusIndexGeom += 1;
              plusIndex += 1;
            }

            if (styleName === undefined) {
              styleName = 0;
            }
            filter = `"[_gx_style ='${styleName}']"`;
            if (!IDEE.utils.isNullOrEmpty(symbolizers)) {
              const a = `${filter}: {"symbolizers": [${symbolizers}]}`;
              if (newStyle !== '') {
                // eslint-disable-next-line no-param-reassign
                newStyle += `,${a}`;
              } else {
                // eslint-disable-next-line no-param-reassign
                newStyle += `{${a},"version":"2"`;
              }
            }
          }

          const geoJSONFeature = {
            type: 'Feature',
            geometry: {
              type: geometry.getType(),
              coordinates: geometry.getCoordinates(),
            },
            properties: {
              _gx_style: styleName,
              name: nameFeature,
            },
          };

          res.push(geoJSONFeature);
        }
      }
    });

    return {
      style: newStyle,
      geojson: res,
      plusIndex,
      plusIndexGeom,
    };
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
          style: layer.getImpl().getLayer().getSource().getStyle() || 'default',
          type: 'WMTS',
          version: '1.3.0',
        };
      } catch (e) {
        IDEE.dialog.error(getValue('errorProjectionCapabilities'));
        return null;
      }
    });
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

  inflateCoordinates(flatCoordinates, offset, end, stride, optCoordinates) {
    const coordinates = optCoordinates !== undefined ? optCoordinates : [];
    let i = 0;
    for (let j = offset; j < end[0]; j += stride) {
      // eslint-disable-next-line no-plusplus
      coordinates[i++] = flatCoordinates.slice(j, j + stride);
    }

    coordinates.length = i;
    return coordinates;
  }

  inflateCoordinatesArray(flatCoordinates, offset, ends, stride, optCoordinatess) {
    const coordinatess = optCoordinatess !== undefined ? optCoordinatess : [];
    let i = 0;
    // eslint-disable-next-line no-plusplus
    for (let j = 0, jj = ends.length; j < jj; ++j) {
      const end = ends[j];
      // eslint-disable-next-line no-plusplus
      coordinatess[i++] = this.inflateCoordinates(
        flatCoordinates,
        offset,
        end,
        stride,
        coordinatess[i],
      );
      // eslint-disable-next-line no-param-reassign
      offset = end;
    }

    coordinatess.length = i;
    return coordinatess;
  }
}
