import { isNullOrEmpty, normalize, isArray } from 'IDEE/util/Utils';
import WMS from 'IDEE/layer/WMS';
import Section from 'IDEE/layer/Section';
import { get as getProj } from 'ol/proj';
import { getAllTextContent } from 'ol/xml';
import ImplUtils from '../../util/Utils';
import XML from '../XML';

/**
 * @classdesc
 * Formateador de capas WMC para la versión 1.1.0.
 *
 * @api
 * @extends {IDEE.impl.format.XML}
 */
class WMC110 extends XML {
  /**
   * Este método lee el valor de la escala mínima (MinScaleDenominator)
   * de un nodo XML.
   *
   * @public
   * @function
   * @param {Object} layerInfo Objeto que contiene la información de la capa.
   * @param {Element} node Nodo XML que contiene el valor de 'MinScaleDenominator'.
   * @api stable
   */
  readsldMinScaleDenominator(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    layerInfo.options.minScale = parseFloat(XML.getChildValue(node));
  }

  /**
   * Este método procesa un nodo XML que define una sección
   * (Section), creando la estructura jerárquica de
   * grupos y subgrupos.
   *
   * @public
   * @function
   * @param {Object|Array} obj Objeto contexto o array con [contexto, grupo actual].
   * @param {Element} node Nodo XML que representa el grupo de capas.
   * @api stable
   */
  readolgroup(obj, node) {
    const objVar = obj;
    if (isArray(objVar)) {
      const context = objVar[0];
      const currentSection = objVar[1];
      const sections = context.layerGroups;
      const section = new Section({
        idLayer: node.getAttribute('id'),
        title: node.getAttribute('title'),
        order: node.getAttribute('orderInsideGroupDisplay'),
      });
      if (isNullOrEmpty(currentSection)) {
        sections.push(section);
      } else {
        currentSection.addChild(section);
      }
      this.runChildNodes([context, section], node);
    } else {
      objVar.layerGroups = [];
      this.runChildNodes([objVar], node);
    }
  }

  /**
   * Este método procesa un nodo XML de capa WMC, construye el objeto de
   * información de la capa, configura sus parámetros y opciones, crea la capa
   * correspondiente y la añade al grupo correspondiente o al contexto.
   *
   * @public
   * @function
   * @param {Object} contextVar Objeto contexto que contiene la configuración y
   * las colecciones de capas.
   * @param {Element} node Nodo XML que representa la definición de la capa WMC.
   * @api stable
   */
  readwmcLayer(contextVar, node) {
    const context = contextVar;
    const layerInfo = {
      params: this.layerParams || {},
      options: {
        visibility: (node.getAttribute('hidden') !== '1'),
        queryable: (node.getAttribute('queryable') === '1'),
      },
      formats: [],
      styles: [],
    };
    this.runChildNodes(layerInfo, node);
    // set properties common to multiple objects on layer options/params
    layerInfo.params.isWMC = 'ok';
    layerInfo.params.layers = layerInfo.name;
    layerInfo.options.wmcMaxExtent = layerInfo.maxExtent;
    layerInfo.options.wmcGlobalMaxExtent = context.maxExtent;
    // create the layer
    const layer = this.getLayerFromInfo(layerInfo);

    const groupId = layerInfo.options.groupDisplayLayerSwitcher;
    const groupOrder = layerInfo.options.orderInsideGroupDisplayLayerSwitcher;
    const sections = context.layerGroups;

    const group = Section.findGroupById(groupId, sections);

    if (layerInfo.styles != null && layerInfo.styles[0] != null) {
      const firstStyle = layerInfo.styles[0];
      if (firstStyle.legend != null && firstStyle.legend.href) {
        const legendUrl = firstStyle.legend.href;
        layer.setLegendURL(legendUrl);
      }
    }

    if (!isNullOrEmpty(group)) {
      // -1 To match the addChild parameter (starts from 0)
      layer.setZIndex(parseInt(groupOrder - 1, 10));
      group.addLayers(layer);
    } else {
      if (isNullOrEmpty(context.layers)) {
        context.layers = [];
      }
      context.layers.push(layer);
    }
  }

  /**
   * Este método crea y devuelve una instancia de la capa WMS a
   * partir de la información de la capa proporcionada.
   *
   * @public
   * @function
   * @param {Object} layerInfo Objeto con información y opciones de la capa.
   * @return {WMS} Instancia de la capa WMS configurada.
   * @api stable
   */
  getLayerFromInfo(layerInfo) {
    const options = layerInfo.options;
    options.params = layerInfo.params;

    const layer = new WMS({
      name: layerInfo.name,
      legend: layerInfo.title,
      url: layerInfo.href,
      transparent: !/^1|(true)$/i.test(options.isBaseLayer),
      version: layerInfo.params.version,
    }, options);
    return layer;
  }

  /**
   * Este método lee el valor del nodo que representa las unidades
   * y lo asigna a la propiedad 'units' del objeto dado.
   *
   * @public
   * @function
   * @param {Object} objVar Objeto donde se almacenará el valor de las unidades.
   * @param {Element} node Nodo XML que contiene el valor de las unidades.
   * @api stable
   */
  readolunits(objVar, node) {
    const obj = objVar;
    obj.units = XML.getChildValue(node);
  }

  /**
   * Este método obtiene los atributos de tamaño de las teselas de un nodo XML
   * y los asigna al objeto de contexto
   *
   * @public
   * @function
   * @param {Object} contextVar Objeto donde se almacenará la información del
   * tamaño de la tesela.
   * @param {Element} node Nodo XML que contiene los atributos 'width' y 'height'.
   * @api stable
   */
  readoltileSize(contextVar, node) {
    const context = contextVar;
    context.tileSize = {
      width: parseFloat(node.getAttribute('width')),
      height: parseFloat(node.getAttribute('height')),
    };
  }

  /**
   * Este método obtiene el valor del nodo que indica el grupo dentro del
   * selector de capas (LayerSwitcher) y lo asigna a las opciones de la capa.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene información de la capa
   * y sus opciones.
   * @param {Element} node Nodo XML que contiene el valor del grupo para el
   * LayerSwitcher.
   * @api stable
   */
  readolgroupDisplayLayerSwitcher(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    layerInfo.options.groupDisplayLayerSwitcher = (XML.getChildValue(node));
  }

  /**
   * Este método obtiene el valor del nodo que indica el orden dentro de un grupo en el
   * selector de capas (LayerSwitcher) y lo asigna a las opciones de la capa.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene información de la capa y sus opciones.
   * @param {Element} node Nodo XML que contiene el valor del orden dentro del grupo.
   * @api stable
   */
  readolorderInsideGroupDisplayLayerSwitcher(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    layerInfo.options.orderInsideGroupDisplayLayerSwitcher = XML.getChildValue(node);
  }

  /**
   * Este método obtiene el valor de '<MaxScaleDenominator>' desde un nodo SLD y lo asigna
   * como la escala máxima permitida en las opciones de la capa.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene información de la capa y sus opciones.
   * @param {Element} node Nodo XML '<MaxScaleDenominator>' que contiene el valor de
   * escala máxima.
   * @api stable
   */
  readsldMaxScaleDenominator(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    layerInfo.options.maxScale = parseFloat(XML.getChildValue(node));
  }

  /**
   * Este método procesa un nodo '<Style>' dentro de la información de capa WMC,
   * extrayendo detalles del estilo y almacenándolos en el objeto 'layerInfo'.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene información de la capa y sus parámetros.
   * @param {Element} node Nodo XML '<Style>'.
   * @api stable
   */
  readwmcStyle(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    const style = {};
    this.runChildNodes(style, node);

    if (node.getAttribute('current') === '1') {
      // three style types to consider
      // 1) linked SLD
      // 2) inline SLD
      // 3) named style
      // running child nodes always gets name, optionally gets href or body

      // MDRC_STYLE_LEGEND 06102008
      if (style.legend) {
        layerInfo.params.layerLegend = style.legend;
      }
      // //////////////////////////////////////////////
      if (style.href) {
        layerInfo.params.sld = style.href;
      } else if (style.body) {
        layerInfo.params.sld_body = style.body;
      } else {
        layerInfo.params.styles = style.name;
      }
    }
    layerInfo.styles.push(style);
  }

  /**
   * Este método procesa los nodos hijos del nodo '<General>' en un
   * contexto WMC.
   *
   * @public
   * @function
   * @param {Object} context Objeto donde se almacenará la información general del contexto.
   * @param {Element} node Nodo XML '<General>' que contiene información general del contexto.
   * @api stable
   */
  readwmcGeneral(context, node) {
    this.runChildNodes(context, node);
  }

  /**
   * Este método obtiene los atributos de un nodo '<BoundingBox>' WMC y
   * asigna la proyección y los límites geográficos al objeto contexto.
   *
   * @public
   * @function
   * @param {Object} contextVar Objeto donde se almacenan los datos del contexto,
   * como 'projection' y 'bounds'.
   * @param {Element} node Nodo XML '<BoundingBox>' con atributos 'SRS', 'minx',
   * 'miny', 'maxx', 'maxy'.
   * @api stable
   */
  readwmcBoundingBox(contextVar, node) {
    const context = contextVar;
    context.projection = node.getAttribute('SRS');
    context.bounds = [
      parseFloat(node.getAttribute('minx')),
      parseFloat(node.getAttribute('miny')),
      parseFloat(node.getAttribute('maxx')),
      parseFloat(node.getAttribute('maxy')),
    ];
  }

  /**
   * Este método procesa el nodo '<LayerList>' de un contexto WMC
   * y extrae sus capas.
   *
   * @public
   * @function
   * @param {Object} contextVar Objeto donde se almacenará la lista de capas.
   * @param {Element} node Nodo XML '<LayerList>' que contiene las definiciones
   * de las capas.
   * @api stable
   */
  readwmcLayerList(contextVar, node) {
    const context = contextVar;
    context.layers = [];
    this.runChildNodes(context, node);
  }

  /**
   * Este método procesa todos los nodos hijos del nodo '<Extension>' y los añade
   * al objeto proporcionado.
   *
   * @public
   * @function
   * @param {Object} obj Objeto donde se almacenarán los datos extraídos de los nodos hijos.
   * @param {Element} node Nodo XML '<Extension>'.
   * @api stable
   */
  readwmcExtension(obj, node) {
    this.runChildNodes(obj, node);
  }

  /**
   * Este método obtiene los atributos de un nodo XML ('minx', 'miny', 'maxx', 'maxy')
   * y construye un bounding box, que se asigna a 'obj.maxExtent'. Si las proyecciones
   * de origen y destino difieren, transforma las coordenadas.
   *
   * @public
   * @function
   * @param {Object} objVar Objeto que recibirá la propiedad 'maxExtent'.
   * @param {Element} node Nodo XML con los atributos 'minx', 'miny', 'maxx', 'maxy'.
   * @api stable
   */
  readolmaxExtent(objVar, node) {
    const obj = objVar;
    const maxExtent = 'maxExtent';

    let extent = [
      parseFloat(node.getAttribute('minx')),
      parseFloat(node.getAttribute('miny')),
      parseFloat(node.getAttribute('maxx')),
      parseFloat(node.getAttribute('maxy')),
    ];

    let projDst = this.options.projection;
    let projSrc = obj.projection;
    if (!isNullOrEmpty(projDst) && !isNullOrEmpty(projSrc) && (projDst !== projSrc)) {
      projSrc = getProj(projSrc);
      projDst = getProj(projDst);
      extent = ImplUtils.transformExtent(extent, projSrc, projDst);
    }
    obj[maxExtent] = extent;
  }

  /**
   * Este método obtiene el valor del nodo '<transparent>' y lo asigna
   * a la propiedad 'transparent' dentro de 'layerInfo.params'.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene la información de la capa.
   * @param {Element} node Nodo XML que contiene la transparencia de la capa.
   * @api stable
   */
  readoltransparent(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    const transparent = 'transparent';
    const params = 'params';
    layerInfo[params][transparent] = XML.getChildValue(node);
  }

  /**
   * Este método obtiene el valor del nodo '<numZoomLevels>' y lo asigna
   * a la propiedad 'numZoomLevels' dentro de 'layerInfo.options'.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene la información de la capa.
   * @param {Element} node Nodo XML que contiene el número de niveles de zoom
   * disponibles.
   * @api stable
   */
  readolnumZoomLevels(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    const options = 'options';
    const numZoomLevels = 'numZoomLevels';
    layerInfo[options][numZoomLevels] = parseInt(XML.getChildValue(node), 10);
  }

  /**
   * Este método obtiene el valor numérico del nodo '<opacity>' y lo asigna
   * a la propiedad 'opacity' dentro de 'layerInfo.options'.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene la información de la capa.
   * @param {Element} node Nodo XML que contiene la opacidad.
   * @api stable
   */
  readolopacity(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    layerInfo.options.opacity = parseFloat(XML.getChildValue(node));
  }

  /**
   * Este método obtiene el valor del nodo '<singleTile>' y lo asigna
   * a la propiedad 'singleTile' dentro de 'layerInfo.options'.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene la información de la capa.
   * @param {Element} node Nodo XML cuyo contenido indica si la capa debe renderizarse
   * como una sola imagen.
   * @api stable
   */
  readolsingleTile(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    layerInfo.options.singleTile = (XML.getChildValue(node) === 'true');
  }

  /**
   * Este método obtiene el valor del nodo '<isBaseLayer>' y lo asigna
   * a la propiedad 'isBaseLayer' dentro de 'layerInfo.options'.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene la información de la capa.
   * @param {Element} node Nodo XML cuyo contenido indica si la capa es una capa base.
   * @api stable
   */
  readolisBaseLayer(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    layerInfo.options.isBaseLayer = (XML.getChildValue(node) === 'true');
  }

  /**
   * Este método procesa la información del nodo '<Server>' dentro de un contexto
   * WMC.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto donde se almacena la información de la capa.
   * @param {Element} node Nodo XML '<Server>'.
   * @api stable
   */
  readoldisplayInLayerSwitcher(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    const nodeValue = normalize(XML.getChildValue(node));
    layerInfo.options.displayInLayerSwitcher = (nodeValue === 'true');
  }

  /**
   * Este método obtiene la versión del WMC.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto donde se almacena la versión del WMC.
   * @param {Element} node Nodo XML que contiene la versión del WMC.
   * @api stable
   */
  readwmcServer(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    layerInfo.params.version = node.getAttribute('version');
    this.runChildNodes(layerInfo, node);
  }

  /**
   * Este método procesa todos los nodos hijos del nodo XML que representa
   * una lista de formatos y los agrega al objeto 'layerInfo', normalmente usando
   * 'readwmcFormat' para cada uno.
   *
   * @public
   * @function
   * @param {Object} layerInfo Objeto donde se almacenará la información de los formatos
   * disponibles de la capa.
   * @param {Element} node Nodo XML que contiene los elementos '<Format>'.
   * @api stable
   */
  readwmcFormatList(layerInfo, node) {
    this.runChildNodes(layerInfo, node);
  }

  /**
   * Este método extrae el valor del formato desde un nodo XML y lo añade
   * a la lista de formatos del objeto 'layerInfo'.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene la información de la capa,
   * incluyendo 'formats' (array) y 'params' (objeto).
   * @param {Element} node Nodo XML que contiene el valor del formato.
   * @api stable
   */
  readwmcFormat(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    const format = XML.getChildValue(node);
    layerInfo.formats.push(format);
    if (node.getAttribute('current') === '1') {
      layerInfo.params.format = format;
    }
  }

  /**
   * Este método procesa los nodos hijos del nodo XML que contiene la lista
   * de estilos WMC y los asigna al objeto 'layerInfo'.
   *
   * @public
   * @function
   * @param {Object} layerInfo Objeto donde se almacenará la información de la capa.
   * @param {Element} node Nodo XML que contiene la lista de estilos.
   * @api stable
   */
  readwmcStyleList(layerInfo, node) {
    this.runChildNodes(layerInfo, node);
  }

  /**
   * Este método procesa los nodos hijos del nodo XML 'style' y los asigna al objeto 'style'.
   * Dependiendo del contenido, el objeto 'style' resultante puede tener
   * una propiedad 'href' (URL de estilo) o 'body' (contenido SLD embebido).
   *
   * @public
   * @function
   * @param {Object} style Objeto donde se añadirán las propiedades resultantes del estilo.
   * @param {Element} node Nodo XML que contiene el elemento 'Style'.
   * @api stable
   */
  readwmcSLD(style, node) {
    this.runChildNodes(style, node);
    // style either comes back with an href or a body property
  }

  /**
   * Este método Extrae todo el contenido textual del nodo XML
   * 'StyledLayerDescriptor' y lo asigna a la propiedad 'body'
   * del objeto 'sld'.
   *
   * @public
   * @function
   * @param {Object} sldVar Objeto donde se almacenará el contenido.
   * @param {Element} node Nodo XML 'StyledLayerDescriptor'
   * @api stable
   */
  readsldStyledLayerDescriptor(sldVar, node) {
    const sld = sldVar;
    const body = 'body';
    sld[body] = getAllTextContent(node);
  }

  /**
   * Este método obtiene un nodo XML y extrae el atributo 'xlink:href', asignándolo
   * a una propiedad del objeto dado.
   *
   * @public
   * @function
   * @param {Object} objVar Objeto al que se añadirá la propiedad 'href'.
   * @param {Element} node Nodo XML del que se extraerá el atributo 'xlink:href'.
   * @api stable
   */
  readwmcOnlineResource(objVar, node) {
    const obj = objVar;
    const href = 'href';
    const xlink = 'xlink';
    obj[href] = this.getAttributeNS(node, this.namespaces[xlink], 'href');
  }

  /**
   * Este método extrae el valor de un nodo XML y lo asigna a la
   * propiedad 'name' del objeto dado,
   * si el valor existe.
   *
   * @public
   * @function
   * @param {Object} objVar Objeto al que se añadirá la propiedad 'name'.
   * @param {Element} node Nodo XML del que se extraerá el valor.
   * @api stable
   */
  readwmcName(objVar, node) {
    const obj = objVar;
    const nameValue = XML.getChildValue(node);
    if (nameValue) {
      const nameAttr = 'name';
      obj[nameAttr] = nameValue;
    }
  }

  /**
   * Este método extrae el valor de texto de un nodo XML y lo
   * asigna a la propiedad 'title' del objeto proporcionado,
   * si dicho valor existe.
   *
   * @public
   * @function
   * @param {Object} objVar Objeto al que se añadirá la propiedad 'title'.
   * @param {Element} node Nodo XML del que se extraerá el valor.
   * @api stable
   */
  readwmcTitle(objVar, node) {
    const obj = objVar;
    const title = XML.getChildValue(node);
    if (title) {
      const titleAttr = 'title';
      obj[titleAttr] = title;
    }
  }

  /**
   * Este método extrae la URL de metadatos desde un nodo XML y
   * la asigna a la propiedad 'layerInfo.options.metadataURL'.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene la propiedad 'options'
   * donde se asignará 'metadataURL'.
   * @param {Element} node Nodo XML que contiene un elemento 'OnlineResource'.
   * @api stable
   */
  readwmcMetadataURL(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    const metadataURL = {};
    const links = node.getElementsByTagName('OnlineResource');
    if (links.length > 0) {
      this.readwmcOnlineResource(metadataURL, links[0]);
    }
    const options = 'options';
    const metadataURLAttr = 'metadataURL';
    const href = 'href';
    layerInfo[options][metadataURLAttr] = metadataURL[href];
  }

  /**
   * Este método extrae el contenido HTML del nodo dado y lo asigna
   * a 'layerInfo.options.metadataUrl'.
   *
   * @public
   * @function
   * @param {Object} layerInfoVar Objeto que contiene la propiedad 'options'
   * donde se asignará 'metadataUrl'.
   * @param {Element} node Nodo XML del que se extraerá el valor.
   * @api stable
   */
  readwmcextmetadata(layerInfoVar, node) {
    const layerInfo = layerInfoVar;
    layerInfo.options.metadataUrl = node && node.innerHTML;
  }

  /**
   * Este método extrae el contenido textual de un nodo XML y lo asigna
   * a la propiedad 'abstract' del objeto proporcionado, si dicho contenido existe.
   *
   * @public
   * @function
   * @param {Object} objVar Objeto al que se añadirá la propiedad 'abstract'.
   * @param {Element} node Nodo XML del que se extraerá el valor.
   * @api stable
   */
  readwmcAbstract(objVar, node) {
    const obj = objVar;
    const abst = XML.getChildValue(node);
    if (abst) {
      const abstProp = 'abstract';
      obj[abstProp] = abst;
    }
  }

  /**
   * Este método extrae los atributos de coordenadas del nodo 'LatLonBoundingBox'
   * y los asigna como '[minx, miny, maxx, maxy]' en la propiedad 'llbbox'
   * del objeto 'layer'.
   *
   * @public
   * @function
   * @param {Object} layerVar Objeto al que se añadirá la propiedad 'llbbox'
   * con las coordenadas.
   * @param {Element} node Nodo XML que contiene los atributos
   * 'minx', 'miny', 'maxx', y 'maxy'.
   * @api stable
   */
  readwmcLatLonBoundingBox(layerVar, node) {
    const layer = layerVar;
    const llbbox = 'llbbox';
    layer[llbbox] = [
      parseFloat(node.getAttribute('minx')),
      parseFloat(node.getAttribute('miny')),
      parseFloat(node.getAttribute('maxx')),
      parseFloat(node.getAttribute('maxy')),
    ];
  }

  /**
   * Este método extrae información de una leyenda (LegendURL) de un nodo XML
   * y la asigna a la propiedad 'legend' del estilo dado.
   *
   * @public
   * @function
   * @param {Object} styleVar Objeto de estilo al que se le asignará
   * la propiedad 'legend'.
   * @param {Element} node Nodo XML que representa un 'LegendURL' y
   * puede contener un 'OnlineResource'.
   * @api stable
   */
  readwmcLegendURL(styleVar, node) {
    const style = styleVar;
    const legend = {
      width: node.getAttribute('width'),
      height: node.getAttribute('height'),
    };
    const links = node.getElementsByTagName('OnlineResource');
    if (links.length > 0) {
      this.readwmcOnlineResource(legend, links[0]);
    }
    const legendAttr = 'legend';
    style[legendAttr] = legend;
  }

  /**
   * Este método extrae todo el contenido del nodo XML proporcionado y lo asigna
   * a la propiedad 'body' del objeto SLD.
   *
   * @public
   * @function
   * @param {Object} sldVar Objeto al que se le asignará la propiedad 'body'.
   * @param {Element} node Nodo XML del que se extraerá el contenido.
   * @api stable
   */
  readsldFeatureTypeStyle(sldVar, node) {
    const sld = sldVar;
    const body = 'body';
    sld[body] = getAllTextContent(node);
  }

  /**
   * Este método procesa un nodo XML que contiene una lista de palabras
   * clave ('KeywordList') y las almacena en la propiedad 'keywords' del
   * objeto 'context'.
   *
   * @public
   * @param {Object} contextVar Objeto al que se le añadirá una propiedad 'keywords'.
   * @param {Element} node Nodo XML que contiene hijos con palabras clave.
   * @api stable
   */
  readwmcKeywordList(contextVar, node) {
    const context = contextVar;
    const keywords = 'keywords';
    context[keywords] = [];
    this.runChildNodes(context[keywords], node);
  }

  /**
   * Este método extrae el valor de un nodo XML que representa
   * una palabra clave y lo añade al array 'keywords'.
   *
   * @public
   * @function
   * @param {Array<string>} keywords Lista donde se añadirá la palabra clave extraída.
   * @param {Element} node Nodo XML que contiene el valor de la palabra clave.
   * @api stable
   */
  readwmcKeyword(keywords, node) {
    keywords.push(XML.getChildValue(node));
  }

  /**
   * Este método Extrae los atributos 'width', 'height', 'format' y
   * el enlace ('href') del nodo XML que representa el logo, y los
   * asigna al objeto 'context' bajo la propiedad 'logo'.
   *
   * @public
   * @function
   * @param {Object} contextVar Objeto donde se añadirá la propiedad 'logo'.
   * @param {Element} node Nodo XML que contiene los atributos del logo y
   * el recurso 'OnlineResource'.
   * @api stable
   */
  readwmcLogoURL(contextVar, node) {
    const context = contextVar;
    const logo = 'logo';
    context[logo] = {
      width: node.getAttribute('width'),
      height: node.getAttribute('height'),
      format: node.getAttribute('format'),
      href: this.getOnlineResource_href(node),
    };
  }

  /**
   * Este método extrae la URL de descripción desde un nodo XML que contiene
   * una etiqueta 'OnlineResource', y la asigna a la propiedad 'descriptionURL'
   * del objeto 'context'.
   *
   * @public
   * @function
   * @param {Object} contextVar Objeto donde se añadirá la propiedad 'descriptionURL'.
   * @param {Element} node Nodo XML que contiene un recurso en línea ('OnlineResource')
   * con la URL de descripción.
   * @api stable
   */
  readwmcDescriptionURL(contextVar, node) {
    const context = contextVar;
    const descriptionURL = 'descriptionURL';
    context[descriptionURL] = this.getOnlineResource_href(node);
  }

  /**
   * Este método procesa los nodos hijos del nodo XML que representa la
   * información de contacto y los asigna como propiedades de un objeto 'contact',
   * que luego se añade al objeto principal.
   *
   * @public
   * @function
   * @param {Object} objVar Objeto donde se añadirá la propiedad 'contactInformation'.
   * @param {Element} node Nodo XML que contiene la información de contacto.
   * @api stable
   */
  readwmcContactInformation(objVar, node) {
    const obj = objVar;
    const contact = {};
    this.runChildNodes(contact, node);
    const contactInformation = 'contactInformation';
    obj[contactInformation] = contact;
  }

  /**
   * Este método procesa los nodos hijos del nodo XML que representa los datos
   * de la persona de contacto principal y los asigna como propiedades de un objeto
   * 'personPrimary', que luego se añade al objeto 'contact'.
   *
   * @public
   * @function
   * @param {Object} contactVar Objeto donde se añadirá la propiedad 'personPrimary'.
   * @param {Element} node Nodo XML que contiene la información de la persona de
   * contacto principal.
   * @api stable
   */
  readwmcContactPersonPrimary(contactVar, node) {
    const contact = contactVar;
    const personPrimary = {};
    this.runChildNodes(personPrimary, node);
    const personPrimaryAttr = 'personPrimary';
    contact[personPrimaryAttr] = personPrimary;
  }

  /**
   * Este método extrae el nombre de la persona de contacto desde un nodo
   * XML y lo asigna a la propiedad 'person' del objeto 'primaryPerson',
   * si existe un valor.
   *
   * @public
   * @function
   * @param {Object} primaryPersonVar Objeto donde se añadirá la propiedad 'person'.
   * @param {Element} node Nodo XML que contiene el nombre de la persona.
   * @api stable
   */
  readwmcContactPerson(primaryPersonVar, node) {
    const primaryPerson = primaryPersonVar;
    const person = XML.getChildValue(node);
    if (person) {
      const personAttr = 'person';
      primaryPerson[personAttr] = person;
    }
  }

  /**
   * Este método extrae el nombre de la organización desde
   * un nodo XML y lo asigna a la propiedad 'organization' del objeto
   * 'primaryPerson', si existe un valor.
   *
   * @public
   * @function
   * @param {Object} primaryPersonVar Objeto donde se añadirá la propiedad 'organization'.
   * @param {Element} node Nodo XML que contiene el nombre de la organización.
   * @api stable
   */
  readwmcContactOrganization(primaryPersonVar, node) {
    const primaryPerson = primaryPersonVar;
    const organization = XML.getChildValue(node);
    if (organization) {
      const organizationAttr = 'organization';
      primaryPerson[organizationAttr] = organization;
    }
  }

  /**
   * Este método extrae el cargo o puesto de contacto desde un
   * nodo XML y lo asigna a la propiedad 'position' del objeto 'contact',
   * si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactVar Objeto donde se añadirá la propiedad 'position'.
   * @param {Element} node Nodo XML que contiene el puesto de contacto.
   * @api stable
   */
  readwmcContactPosition(contactVar, node) {
    const contact = contactVar;
    const position = XML.getChildValue(node);
    if (position) {
      const positionAttr = 'position';
      contact[positionAttr] = position;
    }
  }

  /**
   * Este método procesa los nodos hijos del nodo XML que representa
   * la dirección de contacto y lo asigna al objeto 'contact'.
   *
   * @public
   * @function
   * @param {Object} contactVar Objeto donde se añadirá la propiedad 'contactAddress'.
   * @param {Element} node Nodo XML que contiene la información de dirección de contacto.
   * @api stable
   */
  readwmcContactAddress(contactVar, node) {
    const contact = contactVar;
    const contactAddress = {};
    this.runChildNodes(contactAddress, node);
    const contactAddressAttr = 'contactAddress';
    contact[contactAddressAttr] = contactAddress;
  }

  /**
   * Este método extrae el tipo de dirección desde un nodo XML y lo asigna
   * a la propiedad 'type' del objeto 'contactAddress', si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactAddressVar Objeto donde se añadirá la propiedad 'type'.
   * @param {Element} node Nodo XML que contiene el tipo de dirección.
   * @api stable
   */
  readwmcAddressType(contactAddressVar, node) {
    const contactAddress = contactAddressVar;
    const type = XML.getChildValue(node);
    if (type) {
      const typeAttr = 'type';
      contactAddress[typeAttr] = type;
    }
  }

  /**
   * Este método extrae la dirección desde un nodo XML y la asigna
   * a la propiedad 'address' del objeto 'contactAddress', si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactAddressVar Objeto donde se añadirá la propiedad 'address'.
   * @param {Element} node Nodo XML que contiene la dirección.
   * @api stable
   */
  readwmcAddress(contactAddressVar, node) {
    const contactAddress = contactAddressVar;
    const address = XML.getChildValue(node);
    if (address) {
      const addressAttr = 'address';
      contactAddress[addressAttr] = address;
    }
  }

  /**
   * Este método extrae el nombre de la ciudad desde un nodo XML y lo asigna
   * a la propiedad 'city' del objeto 'contactAddress', si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactAddressVar Objeto donde se añadirá la propiedad 'city'.
   * @param {Element} node Nodo XML que contiene el nombre de la ciudad.
   * @api stable
   */
  readwmcCity(contactAddressVar, node) {
    const contactAddress = contactAddressVar;
    const city = XML.getChildValue(node);
    if (city) {
      const cityAttr = 'city';
      contactAddress[cityAttr] = city;
    }
  }

  /**
   * Este método extrae el nombre del estado o provincia desde un
   * nodo XML y lo asigna a la propiedad 'stateOrProvince' del objeto 'contactAddress',
   * si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactAddressVar Objeto donde se añadirá la propiedad 'stateOrProvince'.
   * @param {Element} node Nodo XML que contiene el nombre del estado o provincia.
   * @api stable
   */
  readwmcStateOrProvince(contactAddressVar, node) {
    const contactAddress = contactAddressVar;
    const stateOrProvince = XML.getChildValue(node);
    if (stateOrProvince) {
      const stateOrProvinceAttr = 'stateOrProvince';
      contactAddress[stateOrProvinceAttr] = stateOrProvince;
    }
  }

  /**
   * Este método extrae el código postal desde un nodo XML y lo asigna
   * a la propiedad 'postcode' del objeto 'contactAddress', si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactAddressVar Objeto donde se añadirá la propiedad 'postcode'.
   * @param {Element} node Nodo XML que contiene el código postal.
   * @api stable
   */
  readwmcPostCode(contactAddressVar, node) {
    const contactAddress = contactAddressVar;
    const postcode = XML.getChildValue(node);
    if (postcode) {
      const postcodeAttr = 'postcode';
      contactAddress[postcodeAttr] = postcode;
    }
  }

  /**
   * Este método extrae el nombre del país desde un nodo XML y lo asigna
   * a la propiedad 'country' del objeto 'contactAddress', si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactAddressVar Objeto donde se añadirá la propiedad 'country'.
   * @param {Element} node Nodo XML que contiene el nombre del país.
   * @api stable
   */
  readwmcCountry(contactAddressVar, node) {
    const contactAddress = contactAddressVar;
    const country = XML.getChildValue(node);
    if (country) {
      const countryAttr = 'country';
      contactAddress[countryAttr] = country;
    }
  }

  /**
   * Este método extrae el número de teléfono desde un nodo XML y lo asigna
   * a la propiedad 'phone' del objeto 'contact', si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactVar Objeto donde se añadirá la propiedad 'phone'.
   * @param {Element} node Nodo XML que contiene el número de teléfono.
   * @api stable
   */
  readwmcContactVoiceTelephone(contactVar, node) {
    const contact = contactVar;
    const phone = XML.getChildValue(node);
    if (phone) {
      const phoneAttr = 'phone';
      contact[phoneAttr] = phone;
    }
  }

  /**
   * Este método extrae el número de fax desde un nodo XML y lo asigna
   * a la propiedad 'fax' del objeto 'contact', si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactVar Objeto donde se añadirá la propiedad 'fax'.
   * @param {Element} node Nodo XML que contiene el número de fax.
   * @api stable
   */
  readwmcContactFacsimileTelephone(contactVar, node) {
    const contact = contactVar;
    const fax = XML.getChildValue(node);
    if (fax) {
      const faxAttr = 'fax';
      contact[faxAttr] = fax;
    }
  }

  /**
   * Este método extrae la dirección de correo electrónico desde un nodo
   * XML y la asigna a la propiedad 'email' del objeto 'contact',
   * si existe un valor.
   *
   * @public
   * @function
   * @param {Object} contactVar Objeto donde se añadirá la propiedad 'email'.
   * @param {Element} node Nodo XML que contiene el valor del correo electrónico.
   * @api stable
   */
  readwmcContactElectronicMailAddress(contactVar, node) {
    const contact = contactVar;
    const email = XML.getChildValue(node);
    if (email) {
      const emailAttr = 'email';
      contact[emailAttr] = email;
    }
  }

  /**
   * Este método extrae la URL de datos desde un nodo XML
   * usando 'getOnlineResource_href' y la asigna a la propiedad 'dataURL'
   * del objeto 'layerContext'.
   *
   * @public
   * @function
   * @param {Object} layerContextVar Objeto al que se le asignará la propiedad 'dataURL'.
   * @param {Element} node Nodo XML que contiene la información del recurso en línea.
   * @api stable
   */
  readwmcDataURL(layerContextVar, node) {
    const layerContext = layerContextVar;
    const dataURL = 'dataURL';
    layerContext[dataURL] = this.getOnlineResource_href(node);
  }

  /**
   * Este método procesa un nodo XML que contiene una lista de
   * dimensiones ('DimensionList') y crea una propiedad 'dimensions'
   * en el objeto 'layerContext'.
   *
   * @public
   * @function
   * @param {Object} layerContextVar Objeto al que se le añadirá la propiedad
   * 'dimensions' como objeto.
   * @param {Element} node Nodo XML que contiene las definiciones de las
   * dimensiones.
   * @api stable
   */
  readwmcDimensionList(layerContextVar, node) {
    const layerContext = layerContextVar;
    const dimensions = 'dimensions';
    layerContext[dimensions] = {};
    this.runChildNodes(layerContext[dimensions], node);
  }

  /**
   * Este método obtiene un nodo XML que describe una dimensión
   * y la añade al objeto 'dimensions' usando el nombre de la
   * dimensión como clave.
   *
   * @public
   * @function
   * @param {Object} dimensionsVar Objeto donde se almacenarán las dimensiones,
   * indexadas por nombre.
   * @param {Element} node Nodo XML que contiene la definición de la dimensión
   * y sus atributos.
   * @api stable
   */
  readwmcDimension(dimensionsVar, node) {
    const dimensions = dimensionsVar;
    const name = node.getAttribute('name').toLowerCase();

    const dim = {
      name,
      units: node.getAttribute('units') || '',
      unitSymbol: node.getAttribute('unitSymbol') || '',
      userValue: node.getAttribute('userValue') || '',
      nearestValue: node.getAttribute('nearestValue') === '1',
      multipleValues: node.getAttribute('multipleValues') === '1',
      current: node.getAttribute('current') === '1',
      default: node.getAttribute('default') || '',
    };
    const values = XML.getChildValue(node);

    const valuesAttr = 'values';
    dim[valuesAttr] = values.split(',');

    const nameAttr = 'name';
    dimensions[dim[nameAttr]] = dim;
  }
}

export default WMC110;
