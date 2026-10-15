// Entorno de desarrollo: crea IDEE.config con sus métodos get/set antes de
// cargar configuration_filtered.js, que lo reutiliza.
import { addConfigAccessors } from 'IDEE/util/ConfigAccessor';

const config = (configKey, configValue) => {
  config[configKey] = configValue;
};

if (!window.IDEE) {
  window.IDEE = {};
  window.M = window.IDEE;
}
window.IDEE.config = addConfigAccessors(config);
