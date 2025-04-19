var d = new Date();
var n = d.getTime();

let Container = PIXI.Container
  , ParticleContainer = PIXI.ParticleContainer
  , autoDetectRenderer = PIXI.autoDetectRenderer
  , loader = PIXI.loader
  , resources = PIXI.loader.resources
  , Sprite = PIXI.Sprite
  , Graphics = PIXI.Graphics
  , Texture = PIXI.Texture
  , TextureCache = PIXI.utils.TextureCache
  , Rectangle = PIXI.Rectangle
  , BlurFilter = PIXI.filters.BlurFilter;

class World {
  constructor(workerScript) {
    this.workerScript = workerScript;
    this.unitOfTime = 1000 / 60;
    this.workers = {};
    this.sprites = {};
    this.antityCount = 0;
    this.eggCount = 0;
    this.dimensions = {
      width: $(window).width(),
      height: $(window).height()
    };
    
    // Worker pool configuration
    this.maxWorkers = 4; // Adjust based on system capabilities
    this.workerPool = [];
    this.workerEntities = {}; // Map workers to entities they handle
    
    // Object pool for byproducts
    this.byproductPool = [];
    this.poolSize = 100;
    
    // Spatial partitioning
    this.gridCellSize = 100; // Size of each grid cell
    this.grid = {}; // Grid cells indexed by "x,y"
    
    // Performance metrics
    this.metrics = {
      fps: 0,
      frameTime: 0,
      lastFrameTime: performance.now(),
      frameCount: 0,
      lastFpsUpdate: 0,
      renderTime: 0,
      messageCount: 0,
      messageRate: 0,
      lastMessageCount: 0,
      lastMessageRateUpdate: 0,
      entityCountByState: {
        young: 0,
        mature: 0,
        old: 0
      },
      byproductCount: 0,
      batchedMessages: 0,
      processedMessages: 0
    };
    
    // Entity limiter for performance control
    this.maxEntities = 1000; // Default maximum entities
    
    // Byproduct limits for performance
    this.byproductLimits = {
      perEntity: 10,  // Max byproducts per entity
      total: 2000     // Max total byproducts
    };

    loader
      .add('img/antity-spritesheet.png')
      .load(this.createWorld.bind(this));
      
    // Start metrics update interval
    this.metricsInterval = setInterval(this.updateMetricsDisplay.bind(this), 1000);
    
    // Add resurrection check interval - acts as a failsafe
    this.resurrectionInterval = setInterval(() => {
      if (this.antityCount === 0 && this.eggCount === 0) {
        console.log("Resurrection check - no entities found, creating new ones");
        this.startWorker();
      }
    }, 5000); // Check every 5 seconds
    
    // Culling system (only render what's visible)
    this.enableCulling = true;
    this.cullMargin = 100; // Buffer zone around visible area
    this.visibleEntities = new Set();
  }

  createWorld() {
    // Use WebGL renderer for best performance (works with proper web server)
    this.renderer = new autoDetectRenderer(this.dimensions.width, this.dimensions.height, {
      antialias: true,
      transparent: false,
      resolution: 1
    });
    this.renderer.backgroundColor = 0x111111;
    document.body.appendChild(this.renderer.view);

    this.stage = new Container();

    this.antityStage = new ParticleContainer();
    this.eggStage = new ParticleContainer();
    this.byproductStage = new ParticleContainer();

    this.stage.addChild(this.antityStage);
    this.stage.addChild(this.byproductStage);
    this.stage.addChild(this.eggStage);
    
    // Initialize object pool for byproducts
    this.initByproductPool();
    
    // Create worker pool
    this.createWorkerPool();
    
    // Set byproduct limits in workers
    this.updateByproductLimits();

    this.animate();
    this.startWorker();
  }
  
  // Initialize object pool for byproducts
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
  
  // Create and initialize worker pool
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
  
  // Update byproduct limits across all workers
  updateByproductLimits() {
    // Send to all workers
    for (let worker of this.workerPool) {
      worker.postMessage({
        action: 'setByproductLimit',
        perEntity: this.byproductLimits.perEntity,
        total: this.byproductLimits.total
      });
    }
  }

  animate() {
    // Track frame start time for performance metrics
    const startTime = performance.now();
    
    // Calculate time since last frame for FPS
    const currentTime = startTime;
    const deltaTime = currentTime - this.metrics.lastFrameTime;
    this.metrics.lastFrameTime = currentTime;
    
    // Update FPS counter (once per second)
    this.metrics.frameCount++;
    if (currentTime - this.metrics.lastFpsUpdate >= 1000) {
      this.metrics.fps = Math.round(this.metrics.frameCount * 1000 / (currentTime - this.metrics.lastFpsUpdate));
      this.metrics.frameCount = 0;
      this.metrics.lastFpsUpdate = currentTime;
    }
    
    // Perform animation frame
    requestAnimationFrame(this.animate.bind(this));
    
    // Apply visibility culling
    if (this.enableCulling) {
      this.cullEntities();
    }
    
    this.animateSprites();
    this.renderer.render(this.stage);
    
    // Measure render time
    this.metrics.renderTime = performance.now() - startTime;
  }
  
  // Perform visibility culling - only render what's visible
  cullEntities() {
    // Define visible area (viewport + margin)
    const margin = this.cullMargin;
    const visibleBounds = {
      left: -margin,
      top: -margin,
      right: this.dimensions.width + margin,
      bottom: this.dimensions.height + margin
    };
    
    // Reset visible entities set
    this.visibleEntities.clear();
    
    // Check each sprite
    for (let id in this.sprites) {
      const sprite = this.sprites[id];
      
      // Check if in visible area
      const isVisible = 
        sprite.position.x + sprite.width/2 >= visibleBounds.left &&
        sprite.position.x - sprite.width/2 <= visibleBounds.right &&
        sprite.position.y + sprite.height/2 >= visibleBounds.top &&
        sprite.position.y - sprite.height/2 <= visibleBounds.bottom;
      
      // Update visibility
      sprite.visible = isVisible;
      
      // Track visible entities
      if (isVisible) {
        this.visibleEntities.add(id);
      }
    }
  }
  
  // Animate sprites based on their state and frames
  animateSprites() {
    // Update all visible entities with animation frames
    for (let id in this.sprites) {
      let sprite = this.sprites[id];
      if (sprite.visible && sprite.type === 'Antity' && sprite.frames) {
        sprite.currentFrame = (sprite.currentFrame + sprite.animationSpeed) % sprite.frames.length;
        sprite.texture = sprite.frames[Math.floor(sprite.currentFrame)];
      }
    }
  }

  startWorker(spawnLocation = undefined) {
    // Check if entity limit is reached
    if (this.antityCount >= this.maxEntities) {
      console.log(`Entity limit (${this.maxEntities}) reached. Not spawning new entity.`);
      return null; // Return null to indicate no entity was created
    }
    
    let workerID = uuid.v4();
    let options = {
      action: 'createAntity',
      ID: workerID,
      offset: {},
      dimensions: this.dimensions,
      defaultLifespan: this.defaultLifespan || 1500 // Pass configurable lifespan
    };
    
    if (spawnLocation === undefined) {
      options.offset = {
        left: Math.floor($(window).width() / 2),
        top: Math.floor($(window).height() / 2)
      };
    } else {
      options.offset = spawnLocation;
    }
    
    // Find least busy worker in the pool
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
    this.metrics.messageCount++;
    
    return workerID; // Return the ID of the created entity
  }

  addAntity(elementObject) {
    this.antityCount++;
    this.metrics.entityCountByState.young++; // New entities are always young
    
    // Create animation frames array
    let frames = [
      this.frame('img/antity-spritesheet.png', 0, 0, 32, 32),
      // We'll use the same frame twice for now, but ideally would use different animation frames
      this.frame('img/antity-spritesheet.png', 0, 0, 32, 32)
    ];
    
    let antity = new Sprite(frames[0]);
    antity.frames = frames;
    antity.animationSpeed = 0.1;
    antity.currentFrame = 0;
    
    antity.type = 'Antity';
    antity.ID = elementObject.ID;
    antity.position.set(elementObject.offset.left, elementObject.offset.top);
    antity.anchor.x = 0.5;
    antity.anchor.y = 0.5;
    antity.state = 'young'; // Track state for metrics

    this.sprites[elementObject.ID] = antity;
    this.antityStage.addChild(this.sprites[elementObject.ID]);
    
    // Apply initial state coloring
    this.updateAntityState({
      ID: elementObject.ID,
      state: 'young'
    });
  }

  moveAntity(elementObject) {
    let antity = this.sprites[elementObject.ID];
    
    if (antity) {
      antity.position.set(elementObject.offset.left, elementObject.offset.top);
    }
  }

  // Check if we need to resurrect the simulation
  checkForResurrection() {
    // Extra debug logging
    console.log(`Checking resurrection need: entities=${this.antityCount}, eggs=${this.eggCount}`);
    
    // If there are no entities or eggs, resurrect
    if (this.antityCount === 0 && this.eggCount === 0) {
      console.log("No entities remain - resurrecting simulation");
      
      // Force reset any tracking that might be out of sync
      this.antityCount = 0;
      this.eggCount = 0;
      this.metrics.entityCountByState.young = 0;
      this.metrics.entityCountByState.mature = 0;
      this.metrics.entityCountByState.old = 0;
      
      // Create a new entity with a slight delay for stability
      setTimeout(() => this.startWorker(), 500);
    }
  }

  killAntity(elementObject) {
    if (elementObject.isAlive == 0) {
      this.antityCount--;
      
      // Update metrics by state count
      const antity = this.sprites[elementObject.ID];
      if (antity && antity.state) {
        this.metrics.entityCountByState[antity.state]--;
      }
      
      if (this.sprites[elementObject.ID]) {
        this.sprites[elementObject.ID].visible = false;
        this.antityStage.removeChild(this.sprites[elementObject.ID]);
        
        // Notify worker
        this.workers[elementObject.ID].postMessage(elementObject);
        this.metrics.messageCount++;
        
        // Remove from sprites dictionary
        delete this.sprites[elementObject.ID];
      }
      
      // Check if we need to resurrect - moved from the end to ensure it's called after each kill
      this.checkForResurrection();
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
    
    if (fertile) {
      this.eggStage.addChild(byproduct);
    } else {
      this.byproductStage.addChild(byproduct);
    }
    
    return byproduct;
  }

  addByproduct(elementObject) {
    if (elementObject.fertile) {
      this.eggCount++;
    } else {
      this.metrics.byproductCount++;
    }

    // Get byproduct from pool
    let byproduct = this.getByproductFromPool(elementObject.fertile);
    
    byproduct.type = (elementObject.fertile ? 'Egg' : 'Byproduct');
    byproduct.ID = elementObject.ID;
    byproduct.position.set(elementObject.offset.left, elementObject.offset.top);
    byproduct.anchor.x = 0.5;
    byproduct.anchor.y = 0.5;
    byproduct.alpha = 1.0;
    byproduct.parentAntityId = elementObject.parentAntityId;

    this.sprites[elementObject.ID] = byproduct;
  }

  fadeByproduct(elementObject) {
    if (this.sprites[elementObject.ID]) {
      this.sprites[elementObject.ID].alpha = elementObject.opacity;
    }
  }

  killByproduct(elementObject) {
    if (!elementObject.isAlive) {
      let byproduct = this.sprites[elementObject.ID];
      
      // Update count
      if (byproduct) {
        if (byproduct.type === 'Egg') {
          this.eggCount--;
        } else {
          this.metrics.byproductCount--;
        }
        
        // Return to pool instead of removing
        byproduct.visible = false;
        byproduct.inUse = false;
        
        // Remove from sprites dictionary
        delete this.sprites[elementObject.ID];
        
        // Notify worker
        if (elementObject.parentAntityId && this.workers[elementObject.parentAntityId]) {
          this.workers[elementObject.parentAntityId].postMessage(elementObject);
          this.metrics.messageCount++;
        }
      }
    }
  }

  frame(src, x, y, w, h) {
    let texture, imageFrame;

    if (typeof src === 'string') {
      if (TextureCache[src]) {
        texture = new Texture(TextureCache[src]);
      }
    } else if (src instanceof Texture) {
      texture = new Texture(src);
    }

    if (!texture) {
      console.log(`Please load the ${src} texture into the cache.`);
    } else {
      imageFrame = new Rectangle(x, y, w, h);
      texture.frame = imageFrame;
      return texture;
    }
  }

  getAntityCount() {
    return Object.keys(this.workers).length;
  }

  // Update metrics displayed in the dashboard
  updateMetricsDisplay() {
    // Update FPS
    document.getElementById('fps-counter').textContent = this.metrics.fps;
    if (this.metrics.fps < 30) {
      document.getElementById('fps-counter').className = 'metric-value metric-danger';
    } else if (this.metrics.fps < 50) {
      document.getElementById('fps-counter').className = 'metric-value metric-warning';
    } else {
      document.getElementById('fps-counter').className = 'metric-value';
    }
    
    // Update entity counts with limit
    document.getElementById('entity-counter').textContent = `${this.antityCount}/${this.maxEntities}`;
    
    // Add visual indicator if near limit
    if (this.antityCount > this.maxEntities * 0.9) {
      document.getElementById('entity-counter').className = 'metric-value metric-danger';
    } else if (this.antityCount > this.maxEntities * 0.7) {
      document.getElementById('entity-counter').className = 'metric-value metric-warning';
    } else {
      document.getElementById('entity-counter').className = 'metric-value';
    }
    document.getElementById('young-counter').textContent = this.metrics.entityCountByState.young;
    document.getElementById('mature-counter').textContent = this.metrics.entityCountByState.mature;
    document.getElementById('old-counter').textContent = this.metrics.entityCountByState.old;
    
    // Update entity state chart
    if (this.antityCount > 0) {
      const youngPercent = (this.metrics.entityCountByState.young / this.antityCount * 100) + '%';
      const maturePercent = (this.metrics.entityCountByState.mature / this.antityCount * 100) + '%';
      const oldPercent = (this.metrics.entityCountByState.old / this.antityCount * 100) + '%';
      
      document.querySelector('#entity-state-chart .state-young').style.width = youngPercent;
      document.querySelector('#entity-state-chart .state-mature').style.width = maturePercent;
      document.querySelector('#entity-state-chart .state-old').style.width = oldPercent;
    } else {
      document.querySelector('#entity-state-chart .state-young').style.width = '0%';
      document.querySelector('#entity-state-chart .state-mature').style.width = '0%';
      document.querySelector('#entity-state-chart .state-old').style.width = '0%';
    }
    
    // Update byproduct counts
    document.getElementById('byproduct-counter').textContent = this.metrics.byproductCount;
    document.getElementById('egg-counter').textContent = this.eggCount;
    
    // Update render time
    document.getElementById('render-time').textContent = this.metrics.renderTime.toFixed(2) + ' ms';
    if (this.metrics.renderTime > 16) {
      document.getElementById('render-time').className = 'metric-value metric-danger';
    } else if (this.metrics.renderTime > 10) {
      document.getElementById('render-time').className = 'metric-value metric-warning';
    } else {
      document.getElementById('render-time').className = 'metric-value';
    }
    
    // Calculate and update message rate
    const messagesSinceLastUpdate = this.metrics.messageCount - this.metrics.lastMessageCount;
    this.metrics.messageRate = messagesSinceLastUpdate;
    this.metrics.lastMessageCount = this.metrics.messageCount;
    
    // Show batched message stats
    const batchEfficiency = this.metrics.batchedMessages > 0 ? 
      (this.metrics.processedMessages / this.metrics.batchedMessages).toFixed(1) : 0;
    document.getElementById('message-counter').textContent = 
      `${this.metrics.messageRate} msg/sec (${batchEfficiency}x)`;
    
    // Update memory usage if performance.memory is available (Chrome only)
    if (performance.memory) {
      const memoryUsage = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
      document.getElementById('memory-usage').textContent = memoryUsage + ' MB';
      
      if (memoryUsage > 100) {
        document.getElementById('memory-usage').className = 'metric-value metric-danger';
      } else if (memoryUsage > 50) {
        document.getElementById('memory-usage').className = 'metric-value metric-warning';
      } else {
        document.getElementById('memory-usage').className = 'metric-value';
      }
    } else {
      document.getElementById('memory-usage').textContent = 'N/A';
    }
  }

  // Process batched messages
  processBatch(batch) {
    if (!batch.messages || !Array.isArray(batch.messages)) {
      return;
    }
    
    this.metrics.batchedMessages++;
    this.metrics.processedMessages += batch.messages.length;
    
    // Process each message in the batch
    for (const message of batch.messages) {
      this.processMessage(message);
    }
  }
  
  // Process an individual message
  processMessage(message) {
    switch(message.action) {
      case 'moveAntity':
        this.moveAntity(message);
        break;
      case 'killAntity':
        this.killAntity(message);
        break;
      case 'createByproduct':
        this.addByproduct(message);
        break;
      case 'fadeByproduct':
        this.fadeByproduct(message);
        break;
      case 'killByproduct':
        this.killByproduct(message);
        break;
      case 'updateState':
        this.updateAntityState(message);
        break;
    }
  }

  listener(e) {
    // Track message counts for metrics
    world.metrics.messageCount++;
    
    // Handle batched messages
    if (e.data.action === 'batchedMessages') {
      world.processBatch(e.data);
      return;
    }
    
    // Handle individual messages
    switch(e.data.action) {
      case 'createAntity':
        world.addAntity(e.data);
        break;
      case 'moveAntity':
        world.moveAntity(e.data);
        break;
      case 'killAntity':
        world.killAntity(e.data);
        break;
      case 'createByproduct':
        world.addByproduct(e.data);
        break;
      case 'fadeByproduct':
        world.fadeByproduct(e.data);
        break;
      case 'hatchByproduct':
        world.hatchByproduct(e.data);
        break;
      case 'killByproduct':
        world.killByproduct(e.data);
        break;
      case 'updateState':
        world.updateAntityState(e.data);
        break;
      case 'detectNearby':
        world.handleNearbyDetection(e.data);
        break;
      case 'workerIdle':
        // Track worker as idle but don't terminate it
        world.checkForResurrection();
        break;
    }
  }
  
  // Add hatching animation visual effect
  hatchByproduct(elementObject) {
    console.log("World received hatchByproduct message:", elementObject);
    
    // Create particle effect for hatching
    let particles = new Container();
    
    // Add 8 particle sprites that expand outward
    for (let i = 0; i < 8; i++) {
      let particle = new Sprite(this.frame('img/antity-spritesheet.png', 32, 24, 8, 8));
      
      // Position at egg location
      particle.position.set(elementObject.offset.left, elementObject.offset.top);
      particle.anchor.x = 0.5;
      particle.anchor.y = 0.5;
      
      // Set random velocity
      particle.vx = Math.cos(i * Math.PI / 4) * 2;
      particle.vy = Math.sin(i * Math.PI / 4) * 2;
      
      // Add to particle container
      particles.addChild(particle);
    }
    
    this.stage.addChild(particles);
    
    // Immediately spawn new entity for reliability
    console.log("Spawning new entity from hatched egg at", elementObject.offset);
    world.startWorker(elementObject.offset);
    
    // Animate particles
    let lifetime = 0;
    const maxLifetime = 30;
    
    const animateParticles = () => {
      lifetime++;
      
      // Move and fade particles
      for (let i = 0; i < particles.children.length; i++) {
        let particle = particles.children[i];
        particle.position.x += particle.vx;
        particle.position.y += particle.vy;
        particle.alpha = 1 - (lifetime / maxLifetime);
      }
      
      // Remove particles after animation completes
      if (lifetime >= maxLifetime) {
        this.stage.removeChild(particles);
        return;
      }
      
      requestAnimationFrame(animateParticles);
    };
    
    animateParticles();
  }
  
  // Update visuals based on entity state
  updateAntityState(elementObject) {
    let antity = this.sprites[elementObject.ID];
    if (!antity) return;
    
    // Update metrics if state has changed
    if (antity.state && antity.state !== elementObject.state) {
      this.metrics.entityCountByState[antity.state]--;
      this.metrics.entityCountByState[elementObject.state]++;
    }
    
    // Update antity's state
    antity.state = elementObject.state;
    
    // Update visual appearance based on state
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
    
    // Apply scale if provided
    if (elementObject.scale) {
      antity.scale.set(elementObject.scale, elementObject.scale);
    }
    
    // Apply animation speed if provided
    if (elementObject.animationSpeed) {
      antity.animationSpeed = elementObject.animationSpeed;
    }
  }
  
  // Handle environmental detection requests from entities
  handleNearbyDetection(elementObject) {
    // This would be used to inform entities about nearby objects
    // Currently, our environment is empty, but this will be filled
    // in Phase 4 when we add environment elements
    
    // For now, just send an empty array back to the entity
    let environmentData = [];
    
    // If we have any environment objects, we would collect them here
    if (this.environmentObjects && this.environmentObjects.length > 0) {
      // This will be implemented in Phase 4
    }
    
    // Send environment data back to the worker
    this.workers[elementObject.ID].postMessage({
      action: 'updateEnvironment',
      environment: environmentData
    });
    this.metrics.messageCount++;
  }
  
  // Create environment container (will be filled in Phase 4)
  initializeEnvironment() {
    // Only initialize if stage is defined
    if (this.stage) {
      // Create environment layer if it doesn't exist
      if (!this.environmentStage) {
        this.environmentStage = new Container();
        this.stage.addChildAt(this.environmentStage, 0);
        
        // Initialize environment objects array
        this.environmentObjects = [];
      }
    }
  }
  
  // Set byproduct limits and update UI
  setByproductLimits(perEntity, total) {
    this.byproductLimits.perEntity = perEntity;
    this.byproductLimits.total = total;
    
    // Update in workers
    this.updateByproductLimits();
  }
}

var world = new World('js/worker.js?' + n);

function click2create() {
  $(document).click(function(e) {
    let spawnLocation = { left: 0, top: 0 };

    spawnLocation.left = e.offsetX;
    spawnLocation.top = e.offsetY;

    world.startWorker(spawnLocation);
  });

  return 'You can now click anywhere on the page to create more Antities.';
}

// Initialize environment when document is ready
$(document).ready(function() {
  world.initializeEnvironment();
  
  // Enable click to create entities
  click2create();
});
