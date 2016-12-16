(function() {
  const world = $('#world');

  const antities = new Array();

  function createAntity(event = undefined) {
    let spawnLocation = { left: '0px', top: '0px' };

    if (event !== undefined) {
      spawnLocation.left = event.offsetX + 'px';
      spawnLocation.top = event.offsetY + 'px';
    }

    let antityId = 'antity-' + antities.length;
    let newAnt = new Antity(antityId, spawnLocation);
    antities.push(newAnt);
  }

  function loop() {
    for( let i = 0; i < antities.length; i++) {
      antities[i].chooseDirection();
      antities[i].move();
      antities[i].generateByproduct();

      for( let j = 0; j < antities[i].byproducts.length; j++ ) {
          antities[i].byproducts[j].fade();
      }
    }

    setTimeout(loop, 50);
  }

  let starter = {
    offsetX: Math.floor( $(window).width() / 2 ),
    offsetY: Math.floor( $(window).height() / 2 )
  };

  createAntity(starter);

  loop();

  $(document).click(function(e) {
    createAntity(e);
    //console.log(antities);
  });
}());
