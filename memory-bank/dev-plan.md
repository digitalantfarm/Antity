# Antity: Next Phase Development Plan

## Overview

This document outlines the specific implementation approach for the next phase of Antity development, building on the current functional prototype. The plan focuses on four key areas: AI enhancement, visual improvements, performance optimization, and enhanced user interaction.

## 1. AI Enhancement Implementation

### 1.1 Steering Behaviors

**File Changes:**
- `js/antity.js`: Add a new `steeringBehavior` method

```javascript
// Example implementation for steering behaviors
class Antity {
  // ... existing code ...
  
  steeringBehavior() {
    // Implement wandering behavior with perlin noise
    // Replace random direction changes with more fluid movement
    // Add boundary avoidance
  }
  
  // Update chooseDirection to use steering behavior
  chooseDirection(probability = 0.1) {
    // Use steering instead of simple random direction changes
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
}
```

### 1.2 Environmental Awareness

**File Changes:**
- `js/antity.js`: Add awareness methods
- `js/worker.js`: Enhance message passing to share entity awareness

```javascript
// In Antity class
detectNearbyElements(range = 50) {
  // Request nearby elements from worker
  this.action = 'detectNearby';
  this.detectionRange = range;
  postMessage(this);
}

respondToEnvironment(nearbyElements) {
  // Adjust behavior based on nearby elements
  // Move toward/away from certain elements
  // Prioritize movement toward fertile byproducts
}

// In cycle() method: add environmental awareness
cycle() {
  if (this.isAlive > 0) {
    this.lifespan--;
    
    // Add awareness every few cycles
    if (this.lifespan % 10 === 0) {
      this.detectNearbyElements();
    }
    
    this.chooseDirection();
    this.doMove();
    this.generateByproduct();

    if (this.lifespan <= 0) {
      this.kill();
    }
  }
}
```

### 1.3 Simple Memory Mechanism

**File Changes:**
- `js/antity.js`: Add memory properties and methods

```javascript
constructor(options) {
  // ... existing code ...
  
  // Add memory array to track recent movements
  this.positionHistory = [];
  this.memoryLength = 10; // Remember last 10 positions
}

// Add a method to store and use position history
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

// Add a method to avoid recently visited areas
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

// Update cycle method to use memory
cycle() {
  if (this.isAlive > 0) {
    this.lifespan--;
    
    // Record current position
    this.recordPosition();
    
    // Use memory to influence movement
    this.avoidRecentPositions();
    
    this.chooseDirection();
    this.doMove();
    this.generateByproduct();

    if (this.lifespan <= 0) {
      this.kill();
    }
  }
}
```

## 2. Visual Improvements Implementation

### 2.1 Enhanced Entity Animations

**File Changes:**
- `js/world.js`: Update sprite handling to include more animation frames
- Add new sprites to the spritesheet

```javascript
// In World class
addAntity(elementObject) {
  this.antityCount++;
  
  // Create animation frames array
  let frames = [
    this.frame('img/antity-spritesheet.png', 0, 0, 32, 32),
    this.frame('img/antity-spritesheet.png', 32, 0, 32, 32),
    // Add more frames as needed
  ];
  
  let antity = new Sprite(frames[0]);
  antity.frames = frames;
  antity.animationSpeed = 0.1;
  antity.currentFrame = 0;
  
  // Rest of the method remains the same
  antity.type = 'Antity';
  antity.ID = elementObject.ID;
  antity.position.set(elementObject.offset.left, elementObject.offset.top);
  antity.anchor.x = 0.5;
  antity.anchor.y = 0.5;

  this.sprites[elementObject.ID] = antity;
  this.antityStage.addChild(this.sprites[elementObject.ID]);
}

// Add animation update method to animate sprites
animateSprites() {
  // Animate all visible antities
  for (let id in this.sprites) {
    let sprite = this.sprites[id];
    if (sprite.visible && sprite.type === 'Antity' && sprite.frames) {
      sprite.currentFrame = (sprite.currentFrame + sprite.animationSpeed) % sprite.frames.length;
      sprite.texture = sprite.frames[Math.floor(sprite.currentFrame)];
    }
  }
}

// Update animate method to include sprite animation
animate() {
  requestAnimationFrame(this.animate.bind(this));
  this.animateSprites();
  this.renderer.render(this.stage);
}
```

### 2.2 Visual Effects for Key Events

**File Changes:**
- `js/world.js`: Add visual effects methods

```javascript
// Add hatching animation
hatchByproduct(elementObject) {
  // Create particle effect at hatching location
  let particles = new PIXI.particles.ParticleContainer();
  
  // Add 5-10 particle sprites that expand outward
  for (let i = 0; i < 8; i++) {
    let particle = new Sprite(this.frame('img/antity-spritesheet.png', 56, 24, 8, 8));
    
    // Position at egg location
    particle.position.set(elementObject.offset.left, elementObject.offset.top);
    particle.anchor.x = 0.5;
    particle.anchor.y = 0.5;
    
    // Set random velocity
    particle.vx = Math.random() * 4 - 2;
    particle.vy = Math.random() * 4 - 2;
    
    // Add to particle container
    particles.addChild(particle);
  }
  
  this.stage.addChild(particles);
  
  // Animate particles
  let lifetime = 0;
  let animateParticles = () => {
    lifetime++;
    
    // Move and fade particles
    for (let i = 0; i < particles.children.length; i++) {
      let particle = particles.children[i];
      particle.position.x += particle.vx;
      particle.position.y += particle.vy;
      particle.alpha = 1 - (lifetime / 30);
    }
    
    // Remove particles after animation completes
    if (lifetime >= 30) {
      this.stage.removeChild(particles);
      return;
    }
    
    requestAnimationFrame(animateParticles);
  };
  
  animateParticles();
  
  // Start new entity
  world.startWorker(elementObject.offset);
}
```

### 2.3 Visual Distinction for Entity States

**File Changes:**
- `js/antity.js`: Add state tracking
- `js/world.js`: Update visual representation based on state

```javascript
// In Antity class
constructor(options) {
  // ... existing code ...
  
  // Add state tracking
  this.state = 'young'; // young, mature, old
  
  // Adjust lifespan tracking to update state
  this.youngThreshold = this.maxLifespan * 0.7;
  this.oldThreshold = this.maxLifespan * 0.3;
}

// Add method to update state based on lifespan
updateState() {
  if (this.lifespan > this.youngThreshold) {
    this.state = 'young';
  } else if (this.lifespan > this.oldThreshold) {
    this.state = 'mature';
  } else {
    this.state = 'old';
  }
  
  // Send state update to world
  this.action = 'updateState';
  postMessage(this);
}

// Update cycle to include state
cycle() {
  if (this.isAlive > 0) {
    this.lifespan--;
    this.updateState();
    // ... rest of method
  }
}

// In World class
// Add method to update visual based on state
updateAntityState(elementObject) {
  let antity = this.sprites[elementObject.ID];
  
  switch(elementObject.state) {
    case 'young':
      antity.tint = 0xaaffaa; // Greenish for young
      break;
    case 'mature':
      antity.tint = 0xffffff; // White for mature
      break;
    case 'old':
      antity.tint = 0xffaaaa; // Reddish for old
      break;
  }
}

// Update listener to handle state updates
listener(e) {
  switch(e.data.action) {
    // ... existing cases
    case 'updateState':
      world.updateAntityState(e.data);
      break;
  }
}
```

## 3. Performance Optimization Implementation

### 3.1 Worker Pooling

**File Changes:**
- `js/world.js`: Create worker pool
- `js/worker.js`: Modify to handle multiple entities

```javascript
// In World class
constructor(workerScript) {
  // ... existing code ...
  
  // Worker pool configuration
  this.maxWorkers = 4; // Adjust based on system capabilities
  this.workerPool = [];
  this.workerEntities = {}; // Map workers to entities they handle
}

createWorkerPool() {
  // Create initial worker pool
  for (let i = 0; i < this.maxWorkers; i++) {
    let worker = new Worker(this.workerScript);
    worker.onmessage = this.listener;
    worker.id = i;
    worker.entities = []; // Entities this worker manages
    this.workerPool.push(worker);
  }
}

// Replace startWorker with pooled version
startWorker(spawnLocation = undefined) {
  let workerID = uuid.v4();
  let options = {
    action: 'createAntity',
    ID: workerID,
    offset: {},
    dimensions: this.dimensions
  };
  
  if (spawnLocation === undefined) {
    options.offset = {
      left: Math.floor($(window).width() / 2),
      top: Math.floor($(window).height() / 2)
    };
  } else {
    options.offset = spawnLocation;
  }
  
  // Find least busy worker
  let leastBusyWorker = this.workerPool[0];
  for (let worker of this.workerPool) {
    if (worker.entities.length < leastBusyWorker.entities.length) {
      leastBusyWorker = worker;
    }
  }
  
  // Add entity to worker
  leastBusyWorker.entities.push(workerID);
  this.workers[workerID] = leastBusyWorker;
  this.workerEntities[workerID] = leastBusyWorker.id;
  
  // Send creation message
  leastBusyWorker.postMessage(options);
}
```

### 3.2 Rendering Optimizations

**File Changes:**
- `js/world.js`: Add spatial partitioning and visibility culling

```javascript
// Add spatial grid for optimization
createSpatialGrid() {
  this.gridCellSize = 100; // Size of each grid cell
  this.grid = {}; // Grid cells indexed by "x,y"
}

// Update entity position in spatial grid
updateEntityInGrid(entity) {
  // Calculate grid cell for entity
  const gridX = Math.floor(entity.position.x / this.gridCellSize);
  const gridY = Math.floor(entity.position.y / this.gridCellSize);
  const gridKey = `${gridX},${gridY}`;
  
  // Remove from old cell
  if (entity.gridKey && this.grid[entity.gridKey]) {
    const index = this.grid[entity.gridKey].indexOf(entity.ID);
    if (index !== -1) {
      this.grid[entity.gridKey].splice(index, 1);
    }
  }
  
  // Add to new cell
  if (!this.grid[gridKey]) {
    this.grid[gridKey] = [];
  }
  this.grid[gridKey].push(entity.ID);
  
  // Update entity's grid reference
  entity.gridKey = gridKey;
}

// Optimize rendering with visibility culling
optimizeRendering() {
  // Get viewport bounds with small margin
  const margin = 50;
  const viewLeft = -margin;
  const viewRight = this.dimensions.width + margin;
  const viewTop = -margin;
  const viewBottom = this.dimensions.height + margin;
  
  // Determine visible grid cells
  const startGridX = Math.floor(viewLeft / this.gridCellSize);
  const endGridX = Math.floor(viewRight / this.gridCellSize);
  const startGridY = Math.floor(viewTop / this.gridCellSize);
  const endGridY = Math.floor(viewBottom / this.gridCellSize);
  
  // Track visible and invisible entities
  const visibleEntities = new Set();
  
  // Add entities from visible cells to the visible set
  for (let x = startGridX; x <= endGridX; x++) {
    for (let y = startGridY; y <= endGridY; y++) {
      const gridKey = `${x},${y}`;
      if (this.grid[gridKey]) {
        this.grid[gridKey].forEach(id => visibleEntities.add(id));
      }
    }
  }
  
  // Update sprite visibility
  for (let id in this.sprites) {
    const sprite = this.sprites[id];
    sprite.visible = visibleEntities.has(id);
  }
}
```

### 3.3 Memory Optimization

**File Changes:**
- `js/world.js`: Add object pooling for byproducts
- `js/worker.js`: Improve cleanup

```javascript
// In World class
constructor(workerScript) {
  // ... existing code ...
  
  // Object pool for byproducts
  this.byproductPool = [];
  this.poolSize = 100;
}

// Initialize object pool
initByproductPool() {
  // Create pool of byproduct sprites
  for (let i = 0; i < this.poolSize; i++) {
    let byproduct = new Sprite(this.frame('img/antity-spritesheet.png', 32, 24, 16, 16));
    byproduct.visible = false;
    byproduct.inUse = false;
    this.byproductPool.push(byproduct);
    this.byproductStage.addChild(byproduct);
  }
}

// Get byproduct from pool instead of creating new
getByproductFromPool(fertile = false) {
  // Find unused byproduct in pool
  for (let i = 0; i < this.byproductPool.length; i++) {
    if (!this.byproductPool[i].inUse) {
      let byproduct = this.byproductPool[i];
      byproduct.inUse = true;
      byproduct.visible = true;
      
      // Update texture based on fertility
      if (fertile) {
        byproduct.texture = this.frame('img/antity-spritesheet.png', 32, 0, 24, 24);
      } else {
        byproduct.texture = this.frame('img/antity-spritesheet.png', 32, 24, 16, 16);
      }
      
      return byproduct;
    }
  }
  
  // If no available objects in pool, create a new one (fallback)
  let texture = fertile ? 
    this.frame('img/antity-spritesheet.png', 32, 0, 24, 24) : 
    this.frame('img/antity-spritesheet.png', 32, 24, 16, 16);
    
  let byproduct = new Sprite(texture);
  byproduct.inUse = true;
  byproduct.visible = true;
  this.byproductPool.push(byproduct);
  this.byproductStage.addChild(byproduct);
  
  return byproduct;
}

// Replace byproduct creation with pooled version
addByproduct(elementObject) {
  let byproduct = this.getByproductFromPool(elementObject.fertile);
  
  byproduct.type = (elementObject.fertile ? 'Egg' : 'Byproduct');
  byproduct.ID = elementObject.ID;
  byproduct.position.set(elementObject.offset.left, elementObject.offset.top);
  byproduct.anchor.x = 0.5;
  byproduct.anchor.y = 0.5;
  byproduct.alpha = 1.0;
  
  this.sprites[elementObject.ID] = byproduct;
  
  if (elementObject.fertile) {
    this.eggCount++;
  }
}

// Return to pool instead of removing
killByproduct(elementObject) {
  if (!elementObject.isAlive) {
    let byproduct = this.sprites[elementObject.ID];
    
    if (elementObject.fertile) {
      this.eggCount--;
    }
    
    // Return to pool instead of removing
    byproduct.visible = false;
    byproduct.inUse = false;
    
    // Remove from sprites dictionary
    delete this.sprites[elementObject.ID];
    
    // Notify worker
    this.workers[elementObject.parentAntityId].postMessage(elementObject);
  }
}
```

## 4. Enhanced User Interaction Implementation

### 4.1 Simulation Controls

**File Changes:**
- `index.html`: Add control panel UI
- `js/world.js`: Add control handlers

```html
<!-- Control panel HTML to add to index.html -->
<div id="control-panel">
  <div class="control-group">
    <label for="simulation-speed">Speed:</label>
    <input type="range" id="simulation-speed" min="10" max="100" value="50">
  </div>
  
  <div class="control-group">
    <label for="entity-limit">Entity Limit:</label>
    <input type="range" id="entity-limit" min="5" max="50" value="20">
    <span id="entity-limit-value">20</span>
  </div>
  
  <div class="control-group">
    <button id="pause-button">Pause</button>
    <button id="clear-button">Clear All</button>
  </div>
</div>
```

```javascript
// In World class
initializeControls() {
  // Speed control
  $('#simulation-speed').on('input', function() {
    const speed = 110 - $(this).val(); // Inverse relationship
    world.unitOfTime = speed;
    
    // Update all workers with new speed
    for (let worker of world.workerPool) {
      worker.postMessage({
        action: 'updateSpeed',
        unitOfTime: speed
      });
    }
  });
  
  // Entity limit control
  $('#entity-limit').on('input', function() {
    const limit = parseInt($(this).val());
    $('#entity-limit-value').text(limit);
    world.entityLimit = limit;
    
    // If current count exceeds new limit, remove excess
    if (world.antityCount > limit) {
      // Find excess entities
      const excessCount = world.antityCount - limit;
      const entityIds = Object.keys(world.sprites)
        .filter(id => world.sprites[id].type === 'Antity')
        .slice(0, excessCount);
      
      // Remove excess entities
      entityIds.forEach(id => {
        world.workers[id].postMessage({
          action: 'killAntity',
          ID: id
        });
      });
    }
  });
  
  // Pause button
  let paused = false;
  $('#pause-button').on('click', function() {
    paused = !paused;
    
    // Update button text
    $(this).text(paused ? 'Resume' : 'Pause');
    
    // Send pause/resume to all workers
    for (let worker of world.workerPool) {
      worker.postMessage({
        action: paused ? 'pauseSimulation' : 'resumeSimulation'
      });
    }
  });
  
  // Clear button
  $('#clear-button').on('click', function() {
    // Kill all entities
    for (let id in world.sprites) {
      if (world.sprites[id].type === 'Antity') {
        world.workers[id].postMessage({
          action: 'killAntity',
          ID: id
        });
      } else if (world.sprites[id].type === 'Byproduct' || world.sprites[id].type === 'Egg') {
        world.killByproduct({
          ID: id,
          isAlive: 0,
          fertile: world.sprites[id].type === 'Egg',
          parentAntityId: world.sprites[id].parentAntityId
        });
      }
    }
  });
}
```

### 4.2 Entity Parameter Controls

**File Changes:**
- `index.html`: Add entity parameter controls
- `js/world.js`: Add parameter handling

```html
<!-- Entity parameter controls to add to index.html -->
<div id="entity-controls">
  <h3>Entity Parameters</h3>
  
  <div class="control-group">
    <label for="lifespan">Lifespan:</label>
    <input type="range" id="lifespan" min="500" max="3000" value="1500">
    <span id="lifespan-value">1500</span>
  </div>
  
  <div class="control-group">
    <label for="movement-speed">Movement Speed:</label>
    <input type="range" id="movement-speed" min="1" max="5" value="1">
    <span id="movement-speed-value">1</span>
  </div>
  
  <div class="control-group">
    <label for="fertility-rate">Fertility Rate:</label>
    <input type="range" id="fertility-rate" min="1" max="10" value="1">
    <span id="fertility-rate-value">1%</span>
  </div>
</div>
```

```javascript
// In World class
initializeEntityControls() {
  // Entity parameters object
  this.entityParams = {
    lifespan: 1500,
    movementSpeed: 1,
    fertilityRate: 0.01
  };
  
  // Lifespan control
  $('#lifespan').on('input', function() {
    const lifespan = parseInt($(this).val());
    $('#lifespan-value').text(lifespan);
    world.entityParams.lifespan = lifespan;
    
    // Update all workers
    for (let worker of world.workerPool) {
      worker.postMessage({
        action: 'updateParams',
        params: world.entityParams
      });
    }
  });
  
  // Movement speed control
  $('#movement-speed').on('input', function() {
    const speed = parseInt($(this).val());
    $('#movement-speed-value').text(speed);
    world.entityParams.movementSpeed = speed;
    
    // Update all workers
    for (let worker of world.workerPool) {
      worker.postMessage({
        action: 'updateParams',
        params: world.entityParams
      });
    }
  });
  
  // Fertility rate control
  $('#fertility-rate').on('input', function() {
    const rate = parseInt($(this).val()) / 100;
    $('#fertility-rate-value').text($(this).val() + '%');
    world.entityParams.fertilityRate = rate;
    
    // Update all workers
    for (let worker of world.workerPool) {
      worker.postMessage({
        action: 'updateParams',
        params: world.entityParams
      });
    }
  });
}

// Update startWorker to include current parameters
startWorker(spawnLocation = undefined) {
  // Existing code...
  
  // Add entity parameters to options
  options.params = this.entityParams;
  
  // Rest of existing code...
}
```

### 4.3 Environmental Influence

**File Changes:**
- `index.html`: Add environmental controls
- `js/world.js`: Add environment implementation

```html
<!-- Environmental controls to add to index.html -->
<div id="environment-controls">
  <h3>Environment</h3>
  
  <div class="control-group">
    <button id="add-food">Add Food</button>
    <button id="add-barrier">Add Barrier</button>
  </div>
  
  <div class="control-group">
    <label for="environment-type">Current Tool:</label>
    <select id="environment-type">
      <option value="none">None</option>
      <option value="food">Food</option>
      <option value="barrier">Barrier</option>
    </select>
  </div>
</div>
```

```javascript
// In World class
initializeEnvironment() {
  // Create environment layer
  this.environmentStage = new Container();
  this.stage.addChildAt(this.environmentStage, 0);
  
  // Environment objects
  this.environmentObjects = [];
  this.currentTool = 'none';
  
  // Environment controls
  $('#environment-type').on('change', function() {
    world.currentTool = $(this).val();
  });
  
  // Add click handler for placing environment objects
  $(this.renderer.view).on('click', function(e) {
    if (world.currentTool === 'none') return;
    
    const x = e.offsetX;
    const y = e.offsetY;
    
    if (world.currentTool === 'food') {
      world.addFood(x, y);
    } else if (world.currentTool === 'barrier') {
      world.addBarrier(x, y);
    }
  });
  
  // Preset buttons
  $('#add-food').on('click', function() {
    $('#environment-type').val('food').change();
  });
  
  $('#add-barrier').on('click', function() {
    $('#environment-type').val('barrier').change();
  });
}

// Add food at location
addFood(x, y) {
  const food = new Sprite(this.frame('img/antity-spritesheet.png', 56, 0, 16, 16));
  food.position.set(x, y);
  food.anchor.x = 0.5;
  food.anchor.y = 0.5;
  food.type = 'food';
  
  this.environmentStage.addChild(food);
  this.environmentObjects.push({
    type: 'food',
    sprite: food,
    position: { x, y },
    radius: 20
  });
  
  // Update environment info for workers
  this.updateEnvironmentInfo();
}

// Add barrier at location
addBarrier(x, y) {
  const barrier = new Graphics();
  barrier.beginFill(0x333333);
  barrier.drawCircle(0, 0, 30);
  barrier.endFill();
  barrier.position.set(x, y);
  
  this.environmentStage.addChild(barrier);
  this.environmentObjects.push({
    type: 'barrier',
    sprite: barrier,
    position: { x, y },
    radius: 30
  });
  
  // Update environment info for workers
  this.updateEnvironmentInfo();
}

// Send environment data to workers
updateEnvironmentInfo() {
  // Create simplified environment data
  const envData = this.environmentObjects.map(obj => ({
    type: obj.type,
    x: obj.position.x,
    y: obj.position.y,
    radius: obj.radius
  }));
  
  // Send to all workers
  for (let worker of this.workerPool) {
    worker.postMessage({
      action: 'updateEnvironment',
      environment: envData
    });
  }
}
```

## Implementation Timeline

### Phase 1: Core AI Enhancement (Week 1)
1. Implement steering behaviors
2. Add position memory
3. Test basic behaviors

### Phase 2: Visual Improvements (Week 2)
1. Enhance sprite animations
2. Add visual effects for events
3. Implement state-based visuals

### Phase 3: Performance Optimization (Week 3)
1. Implement worker pooling
2. Add spatial partitioning
3. Optimize memory usage with object pooling

### Phase 4: User Interface (Week 4)
1. Create control panel UI
2. Implement simulation
