class Antity {
  constructor(options) {
    this.options = options;
    this.ID = options.ID;
    console.log(this.ID);
    if (debugAntity) {
      console.log('Antity ' + this.ID + ' was created.');
    }
    this.isAlive = true;
    this.maxLifespan = 1500;
    this.lifespan = this.maxLifespan;
    this.offset = options.offset || {
      left: 0,
      top: 0
    };

    this.directionModifier = {
      left: 1,
      top: 1
    };
    this.byproducts = {};

    this.cycleInterval = setInterval(function (that) {
      that.cycle();
    }, unitOfTime, this);
  }

  cycle() {
    if (this.isAlive) {
      this.lifespan--;
      this.chooseDirection();
      this.doMove();
      this.generateByproduct();

      if (this.lifespan <= 0) {
        this.kill();
      }
    }
  }

  doMove() {
    let coords = this.offset;
    let newOffset = {
      left: coords.left,
      top: coords.top
    };

    if ((coords.left + this.directionModifier.left) < 0 || (coords.left + this.directionModifier.left) > this.options.dimensions.width) {
      newOffset.left = coords.left - this.directionModifier.left;
    } else {
      newOffset.left = coords.left + this.directionModifier.left;
    }

    if ((coords.top + this.directionModifier.top) < 0 || (coords.top + this.directionModifier.top) > this.options.dimensions.height) {
      newOffset.top = coords.top - this.directionModifier.top;
    } else {
      newOffset.top = coords.top + this.directionModifier.top;
    }

    this.offset = newOffset;
    this.action = 'moveAntity';
    postMessage(this);
  }

  chooseDirection(probability = 0.1) {
    const chanceLeft = Math.random();
    const chanceTop = Math.random();
    if (chanceLeft <= probability) {
      this.directionModifier.left = this.directionModifier.left * -1;
    }
    if (chanceTop <= probability) {
      this.directionModifier.top = this.directionModifier.top * -1;
    }
  }

  generateByproduct(probability = 0.1) {
    const chanceByproduct = Math.random();
    if (chanceByproduct <= probability) {
      if (debugAntity) {
        console.log('Antity ' + this.ID + ' created Byproduct ' + this.byproducts.length + '.');
      }
      let byproductId = uuid.v4();
      this.byproducts[byproductId] = new Byproduct(byproductId, this.ID, this.offset);
    }
  }

  kill() {
    if (debugAntity) {
      console.log('Antity ' + this.ID + ' is now finished.');
    }
    this.isAlive = false;
    this.action = 'killAntity';
    postMessage(this);
  }
}
