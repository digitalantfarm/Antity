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

    loader
      .add('img/antity-spritesheet.png')
      .load(this.createWorld.bind(this));
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

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.animateSprites();
    this.renderer.render(this.stage);
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
  }

  addAntity(elementObject) {
    this.antityCount++;
    
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
    //antity.position.set(elementObject.offset.left - (antity.width / 2), elementObject.offset.top - (antity.height / 2));
    antity.position.set(elementObject.offset.left, elementObject.offset.top);
  }

  killAntity(elementObject) {
    if (elementObject.isAlive == 0) {
      this.antityCount--;
      //console.log(elementObject.ID);
      //console.log(this.sprites[elementObject.ID]);
      //console.log(this.sprites[elementObject.ID].visible);
      this.sprites[elementObject.ID].visible = false;
      this.antityStage.removeChild(this.sprites[elementObject.ID]);
      //console.log('Antity dead.');
      this.workers[elementObject.ID].postMessage(elementObject);
    }
    if (this.antityCount < 1 && this.eggCount < 1) {
      //console.log('Resurrection!');
      this.startWorker();
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
    this.sprites[elementObject.ID].alpha = elementObject.opacity;
  }

  killByproduct(elementObject) {
    if (!elementObject.isAlive) {
      let byproduct = this.sprites[elementObject.ID];
      
      // Update count
      if (elementObject.fertile) {
        this.eggCount--;
      }
      
      // Return to pool instead of removing
      if (byproduct) {
        byproduct.visible = false;
        byproduct.inUse = false;
        
        // Remove from sprites dictionary
        delete this.sprites[elementObject.ID];
      }
      
      // Notify worker
      this.workers[elementObject.parentAntityId].postMessage(elementObject);
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

  listener(e) {
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
        //console.log('Hatching!');
        // Add hatching visual effect
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
    }
  }
  
  // Add hatching animation visual effect
  hatchByproduct(elementObject) {
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
        // Start new entity
        world.startWorker(elementObject.offset);
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
});
