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
    }
  }
};

function createAntity(data) {
  console.log('Instantiating Antity...');
  antity = new Antity(data);
  console.log(antity);
}



/*
const world = $('#world');

let starter = {
  left: Math.floor( $(window).width() / 2 ),
  top: Math.floor( $(window).height() / 2 )
};

antities.push(new Antity(starter));

$(document).click(function(e) {
  let spawnLocation = { left: 0, top: 0 };

  spawnLocation.left = e.offsetX;
  spawnLocation.top = e.offsetY;

  antities.push(new Antity(spawnLocation));
});
*/
