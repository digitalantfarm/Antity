(function() {
  const world = $('#world');

  const Droppings = $('<div />');
  Droppings.addClass('dropping');

  const doFade = function(thing) {
    let currentOpacity = thing.css('opacity');
    if (currentOpacity <= 0) {
      thing.remove();
    } else {
      thing.css('opacity', currentOpacity - 0.0005);
    }
  }

  const Antity = $('<div />');
  Antity.addClass('antity');

  Antity.modDirection = {left: 1, top: 1};
  Antity.collectionPoos = [];

  Antity.doMove = function() {
    let coords = this.offset();
    let newOffset = {left: coords.left, top: coords.top};
    let worldWidth = $(window).width();
    let worldHeight = $(window).height();

    if ( ( coords.left + this.modDirection.left ) < 0 || ( coords.left + this.modDirection.left ) > worldWidth ) {
      newOffset.left = coords.left - this.modDirection.left;
    } else {
      newOffset.left = coords.left + this.modDirection.left;
    }

    if ( ( coords.top + this.modDirection.top ) < 0 || ( coords.top + this.modDirection.top ) > worldHeight ) {
      newOffset.top = coords.top - this.modDirection.top;
    } else {
      newOffset.top = coords.top + this.modDirection.top;
    }

    this.offset(newOffset);
  }

  Antity.doChooseDirection = function(probability = 0.1) {
    const chanceLeft = Math.random();
    const chanceTop = Math.random();
    if ( chanceLeft <= probability ) {
      this.modDirection.left = this.modDirection.left * -1;
    }
    if ( chanceTop <= probability ) {
      this.modDirection.top = this.modDirection.top * -1;
    }
  }

  Antity.doPoo = function(probability = 0.1) {
    const chancePoo = Math.random();
    if ( chancePoo <= probability ) {
      let coords = this.offset();
      let poo1 = Droppings.clone(true);
      //let poo1 = jQuery.extend(true, {}, Droppings);
      let pooID = 'poo-' + this.collectionPoos.length;
      poo1.attr({id: pooID});
      poo1.offset({left: coords.left, top: coords.top});
      this.collectionPoos.push(poo1);
      world.append(this.collectionPoos[this.collectionPoos.length - 1]);
    }
  }

  const antities = new Array();

  function createAntity(event = undefined) {
    let spawnLocation = { left: '0px', top: '0px' };

    if (event !== undefined) {
      spawnLocation.left = event.offsetX + 'px';
      spawnLocation.top = event.offsetY + 'px';
    }

    let newAnt = jQuery.extend(true, {}, Antity);
    //let newAnt = Antity;
    //let newAnt = Antity.clone(true, true);
    let antID = 'antity-' + antities.length;
    newAnt.attr({id: antID});
    newAnt.css('left', spawnLocation.left);
    newAnt.css('top', spawnLocation.top);
    antities.push(newAnt);
    world.append(antities[antities.length - 1]);
  }

  function loop() {
    for( let i = 0; i < antities.length; i++) {
      antities[i].doChooseDirection();
      antities[i].doMove();
      antities[i].doPoo();
    }

    $('.dropping').each(function() {
      doFade($(this));
    });
    setTimeout(loop, 50);
  }

  let starter = {
    offsetX: $(window).width() / 2,
    offsetY: $(window).height() / 2
  };
  createAntity(starter);
  loop();

  $(document).click(function(e) {
    createAntity(e);
    //console.log(antities);
  });
}());
