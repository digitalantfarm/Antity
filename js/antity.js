class Antity {
  constructor(options) {
    this.options = options;
    this.ID = options.ID;
    //console.log('Antity ' + this.ID + ' was created.');
    this.isAlive = 1;
    
    // Use configured lifespan if provided, otherwise default
    this.maxLifespan = options.maxLifespan || 1500;
    this.lifespan = this.maxLifespan;
    
    this.offset = options.offset || {
      left: 0,
      top: 0
    };

    // Get configured movement speed or default
    const movementSpeed = options.movementSpeed || 1;
    this.directionModifier = {
      left: movementSpeed,
      top: movementSpeed
    };
    
    // Configure fertility rate for byproducts
    this.fertilityRate = options.fertilityRate || 0.01;
    
    this.byproducts = {};
    
    // Add position history for memory
    this.positionHistory = [];
    this.memoryLength = 10; // Remember last 10 positions
    
    // Add state tracking
    this.state = 'young'; // young, mature, old
    this.youngThreshold = this.maxLifespan * 0.7;
    this.oldThreshold = this.maxLifespan * 0.3;
    
    // Visual parameters for age effects
    this.baseScale = 1.0;
    this.scale = 0.8; // Initial scale for young entities
    this.baseAnimationSpeed = 0.1;
    this.animationSpeed = 0.15; // Initial animation speed for young entities
    
    // Environment awareness
    this.detectionRange = 50;
    this.nearbyElements = [];

    this.cycleInterval = setInterval(function (that) {
      that.cycle();
    }, unitOfTime, this);
  }

  cycle() {
    if (this.isAlive > 0) {
      this.lifespan--;
      
      // Update entity state based on remaining lifespan
      this.updateState();
      
      // Record current position for memory
      this.recordPosition();
      
      // Use memory to influence movement
      this.avoidRecentPositions();
      
      // Environmental awareness every 10 cycles
      if (this.lifespan % 10 === 0) {
        this.detectNearbyElements();
      }
      
      this.chooseDirection();
      this.doMove();
      this.generateByproduct();

      if (this.lifespan <= 0) {
        this.kill();
        //console.log(Object.keys(this.byproducts).length);
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
    // Use steering behavior for more natural movement
    this.steeringBehavior();
    
    // Keep some randomness but at lower probability
    const chanceLeft = Math.random();
    const chanceTop = Math.random();
    if (chanceLeft <= probability * 0.5) {
      this.directionModifier.left = this.directionModifier.left * -1;
    }
    if (chanceTop <= probability * 0.5) {
      this.directionModifier.top = this.directionModifier.top * -1;
    }
  }
  
  // Simplified steering behavior with more direct movement
  steeringBehavior() {
    // Much stronger movement values
    this.directionModifier.left = (Math.random() * 8) - 4; // -4 to 4
    this.directionModifier.top = (Math.random() * 8) - 4;  // -4 to 4
    
    // Add boundary avoidance - strong push away from edges
    const boundaryMargin = 100;
    
    if (this.offset.left < boundaryMargin) {
      // Near left edge, strongly push right
      this.directionModifier.left += 3;
    } else if (this.offset.left > this.options.dimensions.width - boundaryMargin) {
      // Near right edge, strongly push left
      this.directionModifier.left -= 3;
    }
    
    if (this.offset.top < boundaryMargin) {
      // Near top edge, strongly push down
      this.directionModifier.top += 3;
    } else if (this.offset.top > this.options.dimensions.height - boundaryMargin) {
      // Near bottom edge, strongly push up
      this.directionModifier.top -= 3;
    }
    
    // Ensure values are significant enough to see movement
    if (Math.abs(this.directionModifier.left) < 1) {
      this.directionModifier.left = Math.sign(this.directionModifier.left || 1) * 2;
    }
    if (Math.abs(this.directionModifier.top) < 1) {
      this.directionModifier.top = Math.sign(this.directionModifier.top || 1) * 2;
    }
  }

  generateByproduct(probability = 0.1) {
    // Adjust probability based on entity state
    let adjustedProbability = probability;
    
    if (this.state === 'mature') {
      // Mature entities have slightly higher chance of generating byproducts
      adjustedProbability = probability * 1.5;
    } else if (this.state === 'old') {
      // Old entities have lower chance of generating byproducts
      adjustedProbability = probability * 0.5;
    }
    
    // Use entity's configured fertility rate if available
    if (this.fertilityRate) {
      adjustedProbability = this.fertilityRate;
    }
    
    const chanceByproduct = Math.random();
    if (chanceByproduct <= adjustedProbability) {
      let byproductId = uuid.v4();
      // Pass entity state to byproduct for fertility adjustments
      this.byproducts[byproductId] = new Byproduct(byproductId, this.ID, this.offset, this.state);
    }
  }

  // Record position for memory
  recordPosition() {
    // Add current position to history
    this.positionHistory.unshift({
      left: this.offset.left,
      top: this.offset.top
    });
    
    // Trim history to memoryLength
    if (this.positionHistory.length > this.memoryLength) {
      this.positionHistory.pop();
    }
  }
  
  // Use position history to avoid looping/repetitive patterns
  avoidRecentPositions() {
    // If we have position history
    if (this.positionHistory.length > 3) {
      // Calculate center of recent positions
      let centerX = 0;
      let centerY = 0;
      
      // Use only a few recent positions
      const recentPositions = this.positionHistory.slice(0, 3);
      
      recentPositions.forEach(pos => {
        centerX += pos.left;
        centerY += pos.top;
      });
      
      centerX /= recentPositions.length;
      centerY /= recentPositions.length;
      
      // Move away from center of recent positions (avoid looping)
      if (Math.abs(this.offset.left - centerX) < 20 && 
          Math.abs(this.offset.top - centerY) < 20) {
        // We're close to where we've been recently - change direction
        this.directionModifier.left *= -1;
        this.directionModifier.top *= -1;
      }
    }
  }
  
  // Environmental awareness
  detectNearbyElements() {
    // Request nearby elements from worker
    this.action = 'detectNearby';
    postMessage(this);
  }
  
  // Respond to environmental elements
  respondToEnvironment(nearbyElements) {
    this.nearbyElements = nearbyElements;
    
    // If no nearby elements, just continue normal behavior
    if (!nearbyElements || nearbyElements.length === 0) return;
    
    // Simple response to environment - move toward/away from elements
    for (let element of nearbyElements) {
      if (element.type === 'food') {
        // Move toward food
        if (element.x > this.offset.left) {
          this.directionModifier.left = Math.abs(this.directionModifier.left);
        } else {
          this.directionModifier.left = -Math.abs(this.directionModifier.left);
        }
        
        if (element.y > this.offset.top) {
          this.directionModifier.top = Math.abs(this.directionModifier.top);
        } else {
          this.directionModifier.top = -Math.abs(this.directionModifier.top);
        }
        
        // Found food to move toward, stop looking at other elements
        break;
      } else if (element.type === 'barrier') {
        // Move away from barriers
        if (element.x > this.offset.left) {
          this.directionModifier.left = -Math.abs(this.directionModifier.left);
        } else {
          this.directionModifier.left = Math.abs(this.directionModifier.left);
        }
        
        if (element.y > this.offset.top) {
          this.directionModifier.top = -Math.abs(this.directionModifier.top);
        } else {
          this.directionModifier.top = Math.abs(this.directionModifier.top);
        }
      }
    }
  }
  
  // Update state based on lifespan and visual parameters
  updateState() {
    const oldState = this.state;
    
    if (this.lifespan > this.youngThreshold) {
      this.state = 'young';
    } else if (this.lifespan > this.oldThreshold) {
      this.state = 'mature';
    } else {
      this.state = 'old';
    }
    
    // Update visual parameters based on state
    this.updateVisualParameters();
    
    // Send state update to world - include visual parameters
    this.action = 'updateState';
    postMessage(this);
  }
  
  // Update visual parameters based on age/state
  updateVisualParameters() {
    let scale, animSpeed;
    
    // Scale changes with age
    if (this.state === 'young') {
      // Young antities are smaller but grow
      const growthProgress = 1 - ((this.lifespan - this.youngThreshold) / (this.maxLifespan - this.youngThreshold));
      scale = 0.7 + (growthProgress * 0.3); // 0.7 to 1.0
      animSpeed = this.baseAnimationSpeed * 1.5; // Faster animation when young
    } else if (this.state === 'mature') {
      // Mature antities are full size
      scale = 1.0;
      animSpeed = this.baseAnimationSpeed;
    } else {
      // Old antities shrink and slow down
      const ageProgress = 1 - (this.lifespan / this.oldThreshold);
      scale = 1.0 - (ageProgress * 0.3); // 1.0 to 0.7
      animSpeed = this.baseAnimationSpeed * (1 - (ageProgress * 0.5)); // Slow down with age
    }
    
    // Store for sending to world
    this.scale = scale;
    this.animationSpeed = animSpeed;
  }

  kill() {
    //console.log('Antity ' + this.ID + ' is now finished.');
    this.isAlive = 0;
    this.action = 'killAntity';
    postMessage(this);
  }
}
