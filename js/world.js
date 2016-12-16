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
        if (antities[i].isAlive) {
            antities[i].chooseDirection();
            antities[i].move();
            antities[i].generateByproduct();

            for( let j = 0; j < antities[i].byproducts.length; j++ ) {
                if (antities[i].byproducts[j].isAlive) {
                    if (antities[i].byproducts[j].fertile) {
                        if (antities[i].byproducts[j].incubationPeriod <= 0) {
                            antities[i].byproducts[j].hatch();
                        } else {
                            antities[i].byproducts[j].incubationPeriod--;
                        }
                    } else {
                        antities[i].byproducts[j].fade();
                    }
                } else {
                    antities[i].byproducts.splice(j, 1);
                }
            }
        } else {
            antities.splice(i, 1);
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
