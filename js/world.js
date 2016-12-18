var antities = new Array();
var unitOfTime = 50;

(function() {
  const world = $('#world');

  let starter = {
    offsetX: Math.floor( $(window).width() / 2 ),
    offsetY: Math.floor( $(window).height() / 2 )
  };

  antities.push(new Antity(starter));

  $(document).click(function(e) {
    let spawnLocation = { left: '0px', top: '0px' };

    spawnLocation.left = e.offsetX + 'px';
    spawnLocation.top = e.offsetY + 'px';

    antities.push(new Antity(spawnLocation));
  });
}());
