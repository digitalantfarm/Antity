class Byproduct {
  constructor(byproductId, parentAntityId, spawnLocation = undefined) {
    this.ID = byproductId;
    this.parentAntityId = parentAntityId;
    if (debugAntity) {
      console.log('Byproduct ' + this.ID + ' was created by Antity ' + parentAntityId + '.');
    }
    this.isAlive = true;
    this.offset = spawnLocation;
    this.opacity = 1;
    this.fadeStep = 0.005;
    this.fertile = false;
    this.incubationPeriod = 100;

    this.viabilityProbability = 0.01;

    this.fertilise();

    this.cycleInterval = setInterval(function (that) {
      that.cycle();
    }, unitOfTime * 5, this);

    if (this.fertile) {
      console.log('Laid an egg!');
    }

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
    }
  }

  setLocation(offset) {
    this.element.offset(offset);
  }

  fertilise() {
    const chance = Math.random();
    if (chance <= this.viabilityProbability) {
      this.fertile = true;
    }
  }

  fade() {
    if (this.opacity <= 0) {
      this.kill();
    } else {
      this.action = 'fadeByproduct';
      this.opacity = this.opacity - this.fadeStep;
    }

    postMessage(this);
  }

  hatch() {
    if (debugAntity) {
      console.log('Byproduct ' + this.ID + ' hatched into Antity ' + antities.length + '.');
    }

    this.action = 'hatchByproduct';
    postMessage(this);

    this.kill();
  }

  kill() {
    if (debugAntity) {
      console.log('Byproduct ' + this.ID + ' is now finished.');
    }
    this.isAlive = false;
    this.action = 'killByproduct';
    postMessage(this);
  }
}
