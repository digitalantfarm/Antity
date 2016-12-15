(function() {
  const world = $('#world');

  const Droppings = $('<div />');
  Droppings.addClass('dropping');

  Droppings.doFade = function() {
    let currentOpacity = this.css('opacity');
    if (currentOpacity <= 0) {
      this.remove();
    } else {
      this.css('opacity', currentOpacity - 0.1);
    }
  }

  const Antity = $('<div />');
  Antity.addClass('antity');

  Antity.modDirection = {left: 1, top: 1};
  Antity.collectionPoos = [];

  Antity.doMove = function() {
    let coords = this.offset();
    this.offset({left: coords.left + this.modDirection.left, top: coords.top + this.modDirection.top});
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
      let poo1 = Droppings.clone();
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
    setTimeout(loop, 1);
  }

  loop();
}());
