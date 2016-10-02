var Phonograph = require('../lib/phonograph');

describe("Phonograph", function() {
  var activationPromise;
  beforeEach(function() {
    // atom.workspaceView = new WorkspaceView();
    return activationPromise = atom.packages.activatePackage('phonograph');
  });
  return describe("when the phonograph:toggle event is triggered", function() {
    return it("attaches and then detaches the view", function() {
      expect(atom.workspaceView.find('.phonograph')).not.toExist();
      atom.workspaceView.trigger('phonograph:toggle');
      waitsForPromise(function() {
        return activationPromise;
      });
      return runs(function() {
        expect(atom.workspaceView.find('.phonograph')).toExist();
        atom.workspaceView.trigger('phonograph:toggle');
        return expect(atom.workspaceView.find('.phonograph')).not.toExist();
      });
    });
  });
});
