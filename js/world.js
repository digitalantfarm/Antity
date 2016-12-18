var debugAntity = false;
var antities = new Array();
var unitOfTime = 50;

(function() {
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
}());
