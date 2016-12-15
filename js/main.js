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
      let pooID = 'poo-' + this.collectionPoos.length;
      poo1.attr({id: pooID});
      this.collectionPoos.push(poo1);
      world.append(poo1);
      poo1.offset({left: coords.left, top: coords.top});
    }
  }

  let ant1 = Antity;
  const spawnLocation = { left: function() {
    return Math.floor($(window).width() / 2) + 'px';
  }, top: function() {
    return Math.floor($(window).height() / 2) + 'px';
  } };
  ant1.css('left', spawnLocation.left);
  ant1.css('top', spawnLocation.top);
  world.append(ant1);
  ant1.offset(spawnLocation);

  function loop() {
    ant1.doChooseDirection();
    ant1.doMove();
    ant1.doPoo();
    $('.dropping').each(function() {
      doFade($(this));
    });
    setTimeout(loop, 1);
  }

  loop();
}());
