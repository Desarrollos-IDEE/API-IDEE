/**
 * IDEE.Map/IDEE.map test
 *
 * @testsuite
 */
describe('IDEE.map', () => {

  /**
   * Constructor test
   */
  describe('constructor', () => {
    it('Creates a new map', () => {
      const map = IDEE.map({ container: 'map' });
      expect(map).to.be.a(IDEE.Map);
    });
    it('Destroys the map', () => {
      const map = IDEE.map({ container: 'map' });
      map.destroy();
      expect(map.getMapImpl()).to.be(null);
    });

    /**
     * Default controls
     */
    describe('Default controls', () => {
      const map = IDEE.map({ container: 'map' });
      it('There is an array of controls in the map', () => {
        expect(map.getControls()).to.be.an(Array);
      });
      it('There is only one control in the map', () => {
        expect(map.getControls()).to.have.length(1);
      });
      it('The control is an instance of IDEE.control.Panzoom', () => {
        expect(map.getControls()[0]).to.be.a(IDEE.control.Panzoom);
      });
    });

    /**
     * Default WMC
     */
    describe('Default WMC', () => {
      const map = IDEE.map({ container: 'map' });
      it('There is an array of wmc layers in the map', () => {
        expect(map.getWMC()).to.be.an(Array);
      });
      it('There is only one wmc layer in the map', () => {
        expect(map.getWMC()).to.have.length(1);
      });
      it('The wmc layer is an instance of IDEE.layer.WMC', () => {
        expect(map.getWMC()[0]).to.be.a(IDEE.layer.WMC);
      });
      it('The name of default wmc layer', () => {
        expect(map.getWMC()[0].name).to.be(IDEE.config.predefinedWMC.names[0]);
      });
    });

    /**
     * Param predefined wmcfile
     */
    describe('Param predefined wmcfile', () => {
      const map = IDEE.map({ container: 'map', wmcfile: IDEE.config.predefinedWMC.predefinedNames[1] });
      it('There is an array of wmc layers in the map', () => {
        expect(map.getWMC()).to.be.an(Array);
      });
      it('There is only one wmc layer in the map', () => {
        expect(map.getWMC()).to.have.length(1);
      });
      it('The wmc layer is an instance of IDEE.layer.WMC', () => {
        expect(map.getWMC()[0]).to.be.a(IDEE.layer.WMC);
      });
      it('The name of default wmc layer', () => {
        expect(map.getWMC()[0].name).to.be(IDEE.config.predefinedWMC.names[1]);
      });
    });

    /**
     * Param url wmcfile
     */
    describe('Param url wmcfile', () => {
      const map = IDEE.map({ container: 'map', wmcfile: IDEE.config.predefinedWMC.urls[1] + '*WMC' });
      it('There is an array of wmc layers in the map', () => {
        expect(map.getWMC()).to.be.an(Array);
      });
      it('There is only one wmc layer in the map', () => {
        expect(map.getWMC()).to.have.length(1);
      });
      it('The wmc layer is an instance of IDEE.layer.WMC', () => {
        expect(map.getWMC()[0]).to.be.a(IDEE.layer.WMC);
      });
      it('The name of default wmc layer', () => {
        expect(map.getWMC()[0].name).to.be('wmc');
      });
    });

    /**
     * Param center
     */
    describe('Param center', () => {
      it('Center array type', () => {
        const map = IDEE.map({ container: 'map', center: [0, 0] });
        expect(map.getCenter()).to.eql({ x: 0, y: 0 });
      });
      it('Center string type', () => {
        const map = IDEE.map({ container: 'map', center: '0,0' });
        expect(map.getCenter()).to.eql({ x: 0, y: 0 });
      });
      it('Center object type', () => {
        const map = IDEE.map({ container: 'map', center: { x: 0, y: 0 } });
        expect(map.getCenter()).to.eql({ x: 0, y: 0 });
      });
      it('Set center array type', () => {
        const map = IDEE.map({ container: 'map' });
        map.setCenter([0, 0]);
        expect(map.getCenter()).to.eql({ x: 0, y: 0 });
      });
      it('Set center string type', () => {
        const map = IDEE.map({ container: 'map' });
        map.setCenter('0,0');
        expect(map.getCenter()).to.eql({ x: 0, y: 0 });
      });
      it('Set center object type', () => {
        const map = IDEE.map({ container: 'map' });
        map.setCenter({ x: 0, y: 0 });
        expect(map.getCenter()).to.eql({ x: 0, y: 0 });
      });
    });

  });
});
