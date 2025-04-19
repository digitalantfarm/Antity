class Byproduct {
  constructor(byproductId, parentAntityId, spawnLocation = undefined, parentState = 'mature') {
    this.ID = byproductId;
    this.parentAntityId = parentAntityId;
    this.isAlive = 1;
    this.offset = spawnLocation;
    this.opacity = 1;
    this.fadeStep = 0.003; // Reduced fade rate to give eggs more time to hatch
    this.fertile = false;
    this.incubationPeriod = 50; // Reduced from 100 to speed up hatching
    this.parentState = parentState;

    // Base fertility rate - higher value to ensure some eggs will hatch
    this.viabilityProbability = 0.2; // Increased from 0.01 to 0.2
    
    // Adjust fertility based on parent entity state
    this.adjustFertilityByParentState();
    
    // Determine if this byproduct is fertile
    this.fertilise();

    this.cycleInterval = setInterval(function (that) {
      that.cycle();
    }, unitOfTime * 5, this);

    if (this.fertile) {
      //console.log('Laid an egg!');
    }

    this.action = 'createByproduct';
    // Use the sendMessage method for consistency
    this.sendMessage(this);
  }

  cycle() {
    if (this.isAlive > 0) {
      if (this.fertile) {
        if (this.incubationPeriod <= 0) {
          // Debug hatching status
          console.log(`Egg ${this.ID} is hatching!`);
          this.hatch();
        } else {
          this.incubationPeriod--;
          
          // Periodically log incubation progress
          if (this.incubationPeriod % 10 === 0) {
            console.log(`Egg ${this.ID} incubating: ${this.incubationPeriod} cycles remaining`);
          }
        }
      } else {
        this.fade();
      }
    }
  }

  setLocation(offset) {
    this.element.offset(offset);
  }

  // Adjust fertility based on parent entity state
  adjustFertilityByParentState() {
    // Parent entity state affects fertility rate
    if (this.parentState === 'mature') {
      // Mature entities have higher fertility rate
      this.viabilityProbability = this.viabilityProbability * 2;
    } else if (this.parentState === 'young') {
      // Young entities have slightly lower fertility rate
      this.viabilityProbability = this.viabilityProbability * 0.75;
    } else if (this.parentState === 'old') {
      // Old entities have much lower fertility rate
      this.viabilityProbability = this.viabilityProbability * 0.3;
    }
    
    // Check for fertilityRate in the global scope more safely
    if (typeof fertilityRate !== 'undefined' && fertilityRate !== null) {
      this.viabilityProbability = fertilityRate;
    }
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

    this.sendMessage(this);
  }

  hatch() {
    console.log(`Byproduct ${this.ID} hatching! Parent: ${this.parentAntityId}`);

    // Make sure hatch message is sent without batching
    this.action = 'hatchByproduct';
    // Bypass message queue for critical hatching message - use direct postMessage
    postMessage(this);

    // Ensure we clear this byproduct properly
    this.kill();
  }

  kill() {
    this.isAlive = 0;
    this.action = 'killByproduct';
    this.sendMessage(this);
  }

  // Message sending helper that's consistent with Antity
  sendMessage(message) {
    // First try to use the queueMessage function for batching if available
    if (typeof queueMessage === 'function') {
      queueMessage({...message}); // Clone to avoid passing functions
    } else {
      // Fall back to direct postMessage (always safe)
      postMessage({...message}); // Use spread to create a new object
    }
  }
}
