var antities = new Array();
var loopCount = 0;

(function() {
  const world = $('#world');

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
            antities[i].lifespan--;
            antities[i].chooseDirection();
            antities[i].move();
            antities[i].generateByproduct();

            if (loopCount % 10 == 0) {
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
            }
            if (antities[i].lifespan <= 0) {
                if (antities.length == 1) {
                    antities[i].lifespan = 2500;
                } else {
                    antities[i].kill();
                }
            }
        } else {
            antities.splice(i, 1);
        }
    }

    loopCount++;
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
