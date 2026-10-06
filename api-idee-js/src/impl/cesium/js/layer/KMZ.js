/**
 * @module IDEE/impl/layer/KMZ
 */
import * as EventType from 'IDEE/event/eventtype';
import { getValue } from 'IDEE/i18n/language';
import KML from './KML';
import LoaderKMZ from '../loader/KMZ';

/**
 * @classdesc
 * Implementación KMZ con el comportamiento vectorial KML del motor.
 * @api
 */
class KMZ extends KML {
  constructor(options, vendorOptions) {
    super(options, vendorOptions);
    this.loadGeneration_ = 0;
  }

  /**
   * Crea el cargador específico de esta capa con el mapa y formato actuales.
   * @private
   * @returns {LoaderKMZ} Cargador KMZ.
   */
  getLoader() {
    return new LoaderKMZ(this.map, this.url, this.formater_);
  }

  requestFeatures_(force = false) {
    if (force || !this.loadFeaturesPromise_) {
      const generation = this.loadGeneration_;
      // eslint-disable-next-line no-underscore-dangle
      this.loadFeaturesPromise_ = this.loader_.loadInternal_(
        this.map.getProjection(),
        this.scaleLabel,
        this.layers,
        this.removeFolderChildren,
        this.label_,
        this.clampToGround,
        this.url,
        true,
      ).then((response) => {
        if (!this.map || generation !== this.loadGeneration_) {
          throw new Error(getValue('exception').kmz_load_cancelled);
        }
        return response;
      });
    }
    return this.loadFeaturesPromise_;
  }

  updateSource_(force) {
    const generation = this.loadGeneration_;
    // La carga explícita establece una nueva referencia; no es una edición local.
    const facade = this.facadeVector_;
    const onLoad = () => {
      facade.un(EventType.LOAD, onLoad);
      if (this.map && generation === this.loadGeneration_) facade.resumeAutoRefresh();
    };
    facade.on(EventType.LOAD, onLoad);
    // La promesa conserva el rechazo para quien consulte la carga.
    // eslint-disable-next-line no-underscore-dangle
    const loading = super.updateSource_(force);
    loading?.catch((error) => {
      facade.un(EventType.LOAD, onLoad);
      if (this.map && generation === this.loadGeneration_) {
        this.loadFeaturesPromise_ = null;
        this.facadeVector_.fire(EventType.LOAD_ERROR, [error]);
      }
    });
  }

  refresh() {
    if (this.map) {
      this.loadFeaturesPromise_ = null;
      this.updateSource_(true);
    }
  }

  setURL(url) {
    this.facadeVector_.stopAutoRefresh();
    this.loadGeneration_ += 1;
    this.url = url;
    this.loadFeaturesPromise_ = null;
    if (this.map) {
      this.loader_ = this.getLoader();
      this.loaded_ = false;
      this.updateSource_(true);
      this.facadeVector_.startAutoRefresh();
    }
  }

  destroy() {
    this.facadeVector_.stopAutoRefresh();
    this.loadGeneration_ += 1;
    this.loadFeaturesPromise_ = null;
    if (this.screenOverlayImg_) this.screenOverlayImg_.remove();
    this.screenOverlayImg_ = null;
    if (this.map) {
      this.map.un(EventType.CHANGE_PROJ, this.changeProjectionHandler_, this);
      super.destroy();
    }
  }
}

export default KMZ;
