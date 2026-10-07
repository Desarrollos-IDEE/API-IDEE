/**
 * @module IDEE/impl/layer/KMZ
 */
import OLSourceVector from 'ol/source/Vector';
import * as EventType from 'IDEE/event/eventtype';
import { getValue } from 'IDEE/i18n/language';
import ImplUtils from '../util/Utils';
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
    if (this.vendorOptions_.source) return;
    const generation = this.loadGeneration_;
    this.requestFeatures_(force).then((response) => {
      this.olLayer.setSource(new OLSourceVector());
      this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
      this.loaded_ = true;
      this.facadeVector_.addFeatures(response.features);
      this.facadeVector_.resumeAutoRefresh();
      this.fire(EventType.LOAD, [response.features]);
      if (response.screenOverlay) {
        this.setScreenOverlayImg(ImplUtils.addOverlayImage(response.screenOverlay, this.map));
      }
    }).catch((error) => {
      if (this.map && generation === this.loadGeneration_) {
        this.loadFeaturesPromise_ = null;
        this.facadeVector_.fire(EventType.LOAD_ERROR, [error]);
      }
    });
  }

  refresh() {
    if (this.map) this.updateSource_(true);
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
