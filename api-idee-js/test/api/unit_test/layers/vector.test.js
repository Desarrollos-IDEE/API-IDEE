describe('IDEE.layer.Vector', () => {
  describe('constructor', () => {
    it('Creates a new IDEE.layer.Vector', () => {
      const vector = new IDEE.layer.Vector({});
      expect(vector).to.be.a(IDEE.layer.Vector);
      expect(vector).to.be.a(IDEE.Layer);
    });
    it('Name parameter is correct', () => {
      const vector = new IDEE.layer.Vector({ name: 'layer_vector' });
      expect(vector.name).to.eql('layer_vector');
    });
  });
});
