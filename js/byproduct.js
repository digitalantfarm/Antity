class Byproduct {
  constructor(byproductId, parentAntityId, spawnLocation = undefined) {
    this.ID = byproductId;
    this.parentAntityId = parentAntityId;
    if (debugAntity) {
      console.log('Byproduct ' + this.ID + ' was created by Antity ' + parentAntityId + '.');
    }
    this.isAlive = true;
    this.offset = spawnLocation;
    this.fertile = false;
    this.incubationPeriod = 100;

    this.viabilityProbability = 0.01;

    this.fertilise();

    this.cycleInterval = setInterval(function (that) {
      that.cycle();
    }, unitOfTime * 5, this);

    this.action = 'createByproduct';
    postMessage(this);
  }

  cycle() {
    if (this.isAlive) {
      if (this.fertile) {
        if (this.incubationPeriod <= 0) {
          this.hatch();
        } else {
          this.incubationPeriod--;
        }
      } else {
        this.fade();
      }
    } else {
      /*
      try {
        let byproducts = antities[this.parentAntityId].byproducts;
        antities[this.parentAntityId].byproducts.splice(antities[this.parentAntityId].byproducts.indexOf(this.ID), 1);
      } catch(e) {
        console.log('Cleaning up Byproduct ' + this.ID + ' of Antity ' + this.parentAntityId);
        console.log(e);
      }
      */
    }
  }

  setLocation(offset) {
    this.element.offset(offset);
  }

  fertilise() {
    const chance = Math.random();
    if (chance <= this.viabilityProbability) {
      this.fertile = true;
      //this.element.addClass('fertile');
    }
  }

  fade() {
    /*
    let currentOpacity = this.element.css('opacity');
    if (currentOpacity <= 0) {
      this.kill();
    } else {
      this.element.css('opacity', currentOpacity - 0.005);
    }
    */
  }

  hatch() {
    if (debugAntity) {
      console.log('Byproduct ' + this.ID + ' hatched into Antity ' + antities.length + '.');
    }
    //antities.push(new Antity(this.element.offset()));

    //this.kill();
  }

  kill() {
    if (debugAntity) {
      console.log('Byproduct ' + this.ID + ' is now finished.');
    }
    this.element.addClass('death');
    setTimeout(function (that) {
      that.element.remove();
    }, 1500, this);
    this.isAlive = false;
  }
}
