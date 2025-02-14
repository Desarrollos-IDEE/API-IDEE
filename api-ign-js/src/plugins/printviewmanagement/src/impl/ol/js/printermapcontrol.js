/**
 * @module M/impl/control/PrinterMapControl
 */
import {
  encodeKML, encodeWMS, encodeImage, encodeGeoTIFF, encodeXYZ, encodeWMTS,
} from './encoders';

export default class PrinterMapControl extends M.impl.Control {
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
     * @type {M.Map}
     */
    this.facadeMap_ = map;

    this.errors = [];
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
      return layer.getSource && !M.utils.isNullOrEmpty(layer.getSource())
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
      try {
        // eslint-disable-next-line no-underscore-dangle
        if (layer.type === M.layer.type.KML && layer.getImpl().formater_.extractStyles_ !== false) {
          success(encodeKML(layer, this.facadeMap_));
        } else if (layer.type === M.layer.type.KML
          // eslint-disable-next-line no-underscore-dangle
          && layer.getImpl().formater_.extractStyles_ === false) {
          success(this.encodeWFS(layer));
        } else if (layer.type === M.layer.type.WMS) {
          success(encodeWMS(layer));
        } else if (layer.type === M.layer.type.WFS) {
          success(this.encodeWFS(layer));
        } else if (layer.type === M.layer.type.GeoJSON) {
          success(this.encodeWFS(layer));
        } else if (layer.type === M.layer.type.WMTS) {
          encodeWMTS(layer).then((encodedLayer) => {
            success(encodedLayer);
          });
        } else if (M.utils.isNullOrEmpty(layer.type) && layer instanceof M.layer.Vector) {
          success(this.encodeWFS(layer));
          // eslint-disable-next-line no-underscore-dangle
        } else if (layer.type === undefined && layer.className_ === 'ol-layer') {
          success(encodeImage(layer));
        } else if ([M.layer.type.XYZ, M.layer.type.TMS, M.layer.type.OSM].indexOf(layer.type)
          > -1) {
          success(encodeXYZ(layer));
        } else if (layer.type === M.layer.type.GeoTIFF) {
          success(encodeGeoTIFF(layer));
        } else if (layer.type === M.layer.type.MVT
          || layer.type === M.layer.type.MBTiles || layer.type === M.layer.type.MBTilesVector) {
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
   * @param {M.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  encodeWFS(layer) {
    let encodedLayer = null;
    const olLayer = layer.getImpl().getOL3Layer();
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
    const olLayer = layer.getImpl().getOL3Layer();
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
    if (!M.utils.isNullOrEmpty(fStyle)) {
      featureStyle = fStyle;
    } else if (!M.utils.isNullOrEmpty(layerStyle)) {
      featureStyle = layerStyle;
    }

    if (featureStyle instanceof Function) {
      featureStyle = featureStyle.call(featureStyle, feature, resolution);
    }

    let styleIcon = null;
    if (featureStyle instanceof Array) {
      // SRC style has priority
      if (featureStyle.length > 1) {
        styleIcon = !M.utils.isNullOrEmpty(featureStyle[1])
          && !M.utils.isNullOrEmpty(featureStyle[1].getImage())
          && featureStyle[1].getImage().getGlyph
          ? featureStyle[1].getImage()
          : null;
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
      const lineDash = (featureStyle.getStroke() !== null
        && featureStyle.getStroke() !== undefined)
        ? featureStyle.getStroke().getLineDash()
        : undefined;
      const styleGeom = {
        type: parseType,
        fillColor: M.utils.isNullOrEmpty(fill) || (layer.name.indexOf(' Reverse') > -1 && layer.name.indexOf('Cobertura') > -1) ? '#000000' : M.utils.rgbaToHex(fill.getColor()).slice(0, 7),
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

      const imageIcon = !M.utils.isNullOrEmpty(styleIcon)
        && styleIcon.getImage ? styleIcon.getImage() : null;
      if (!M.utils.isNullOrEmpty(imageIcon)) {
        if (styleIcon.getRadius && styleIcon.getRadius()) {
          styleGeom.pointRadius = styleIcon.getRadius && styleIcon.getRadius();
        }

        if (styleIcon.getOpacity && styleIcon.getOpacity()) {
          styleGeom.graphicOpacity = styleIcon.getOpacity();
        }

        styleGeom.externalGraphic = imageIcon.toDataURL();
      }

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
            // eslint-disable-next-line no-param-reassign
            stylesNames[styleStr] = styleName;
            flag = 1;
            symbolizers.push(styleStr);
            plusIndexGeom += 1;
            plusIndex += 1;
          }
          if (!M.utils.isNullOrEmpty(text) && M.utils.isUndefined(styleNameText)) {
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
          if (!M.utils.isNullOrEmpty(symbolizers)) {
            const a = `${filter}: {"symbolizers": [${symbolizers}]}`;
            if (newStyle.indexOf(filter) === -1) {
              if (newStyle !== '') {
                // eslint-disable-next-line no-param-reassign
                newStyle += `,${a}`;
              } else {
                // eslint-disable-next-line no-param-reassign
                newStyle += `{${a},"version":"2"`;
              }
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
        if (!M.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox)) {
          const styleStr = JSON.stringify(styleGeom);
          let styleName = stylesNames[styleStr];
          if (M.utils.isUndefined(styleName)) {
            const symbolizers = [];
            if (!M.utils.isNullOrEmpty(geometry) && geometry.intersectsExtent(bbox)
              && M.utils.isUndefined(styleName)) {
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
            if (!M.utils.isNullOrEmpty(symbolizers)) {
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
