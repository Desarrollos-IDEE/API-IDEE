Modificar:
  styles: Estilos de la capa.
por:
  styles: Estilos de la capa (IDEE.style.Raster u objeto que se enviará internamente a vendorOptions)

Modificar:
  styles: {
    gamma: 0.5,
  },
por:
  style: new IDEE.style.Raster({
    gamma: 0.5,
  }),

Añadir después de:
  options: Estas opciones se mandarán a la implementación de la capa.
esto:
  predefinedStyles: Array de estilos IDEE.style.Raster, aparecen en el selector de capas "LayerSwitcher" para cambiar el estilo de la capa.