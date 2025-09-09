const map = IDEE.map({
  container: 'map',
  layers: ['WMS*Limites%20provinciales%20de%20Andalucia*http://www.ideandalucia.es/wms/mta400v_2008?*Division_Administrativa*false,WMS*Ortofoto%20Andalucia%202013*http://www.ideandalucia.es/wms/ortofoto2013?*oca10_2013*false,WMS_FULL*http://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_modelo_altura_vege_incendio_la_granada_rio_tinto?*true,WMS*Nucleos%20de%20Poblacion*http://www.ideandalucia.es/wms/mta100v_2005?*Nucleos_de_Poblacion*true,WMS*Toponimia*http://www.ideandalucia.es/wms/mta100v_2005?*Toponimia_Nucleos_de_Poblacion*true'],
  controls: ['panzoom'],
  zoom: 5,
  center: [197028, 4182700],
});

window.map = map;
