var d = new Date();
var n = d.getTime();

importScripts('vendor/uuid.js');
importScripts('antity.js?' + n);
importScripts('byproduct.js?' + n);

var debugAntity = false;
var unitOfTime = 50;

let antity = 'world';

onmessage = function (e) {
  if (typeof e.data == 'object' && e.data.action) {
    switch (e.data.action) {
      case 'createAntity':
        createAntity(e.data);
        postMessage(e.data);
        break;
      case 'killAntity':
        antity.isAlive = -1;
        break;
      case 'killByproduct':
        antity.byproducts[e.data.ID].isAlive = -1;
        if (getByproductCount(antity) < 1 && antity.isAlive < 0) {
          this.close();
        }
        break;
    }
  }
};

function createAntity(data) {
  //console.log('Instantiating Antity...');
  antity = new Antity(data);
}

function getByproductCount(a) {
  return Object.keys(a.byproducts).length;
}
