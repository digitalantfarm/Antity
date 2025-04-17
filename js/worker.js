var d = new Date();
var n = d.getTime();

importScripts('vendor/uuid.js');
importScripts('antity.js?' + n);
importScripts('byproduct.js?' + n);

var debugAntity = false;
var unitOfTime = 50;
var isPaused = false;

// Support multiple entities per worker
let entities = {};
// Environment data storage
let environment = [];
// Default entity parameters
let defaultParams = {
  lifespan: 1500,
  movementSpeed: 1,
  fertilityRate: 0.01
};

onmessage = function (e) {
  if (isPaused && e.data.action !== 'resumeSimulation') {
    // Don't process messages while paused (except resume command)
    return;
  }
  
  if (typeof e.data == 'object' && e.data.action) {
    switch (e.data.action) {
      case 'createAntity':
        createAntity(e.data);
        postMessage(e.data);
        break;
      case 'killAntity':
        if (entities[e.data.ID]) {
          entities[e.data.ID].isAlive = -1;
          // Check if we should close this worker
          checkWorkerStatus();
        }
        break;
      case 'killByproduct':
        if (e.data.parentAntityId && entities[e.data.parentAntityId]) {
          let antity = entities[e.data.parentAntityId];
          if (antity.byproducts[e.data.ID]) {
            antity.byproducts[e.data.ID].isAlive = -1;
            checkWorkerStatus();
          }
        }
        break;
      case 'updateState':
        // Just acknowledge the state update from an entity
        break;
      case 'detectNearby':
        // Process environmental awareness request
        if (entities[e.data.ID]) {
          respondToNearbyDetection(e.data);
        }
        break;
      case 'updateEnvironment':
        // Update stored environment data
        if (e.data.environment) {
          environment = e.data.environment;
        }
        break;
      case 'updateSpeed':
        // Update simulation speed
        if (typeof e.data.unitOfTime === 'number') {
          unitOfTime = e.data.unitOfTime;
        }
        break;
      case 'pauseSimulation':
        isPaused = true;
        break;
      case 'resumeSimulation':
        isPaused = false;
        break;
      case 'updateParams':
        // Update entity parameters
        if (e.data.params) {
          updateEntityParams(e.data.params);
        }
        break;
      case 'setLifespan':
        // Update default lifespan for new entities
        if (typeof e.data.lifespan === 'number') {
          defaultParams.lifespan = e.data.lifespan;
        }
        break;
    }
  }
};

function createAntity(data) {
  //console.log('Instantiating Antity...');
  
  // Apply default parameters if specified
  if (data.defaultLifespan && typeof data.defaultLifespan === 'number') {
    defaultParams.lifespan = data.defaultLifespan;
  }
  
  // Extend data with parameter values before creating entity
  data.maxLifespan = defaultParams.lifespan;
  data.movementSpeed = defaultParams.movementSpeed;
  data.fertilityRate = defaultParams.fertilityRate;
  
  let newAntity = new Antity(data);
  entities[data.ID] = newAntity;
}

function getByproductCount(a) {
  return Object.keys(a.byproducts).length;
}

// Check if this worker still has active entities or byproducts
function checkWorkerStatus() {
  let totalEntities = Object.keys(entities).length;
  let activeEntities = 0;
  let totalByproducts = 0;
  
  // Count active entities and byproducts
  for (let id in entities) {
    let entity = entities[id];
    if (entity.isAlive > 0) {
      activeEntities++;
    }
    totalByproducts += getByproductCount(entity);
  }
  
  // If nothing is active and no byproducts remain, we can close this worker
  if (activeEntities === 0 && totalByproducts === 0 && totalEntities > 0) {
    this.close();
  }
}

// Process nearby element detection request
function respondToNearbyDetection(entityData) {
  // Entity is requesting information about nearby elements
  let entity = entities[entityData.ID];
  if (!entity) return;
  
  // Find nearby environment elements
  let nearbyElements = [];
  
  if (environment && environment.length > 0) {
    // Simple distance check for each environment element
    for (let element of environment) {
      let distance = Math.sqrt(
        Math.pow(element.x - entity.offset.left, 2) + 
        Math.pow(element.y - entity.offset.top, 2)
      );
      
      if (distance <= entity.detectionRange) {
        nearbyElements.push(element);
      }
    }
  }
  
  // Also detect other entities (not implemented yet)
  // This would require knowledge of all entity positions
  
  // Return the detected elements to the entity
  if (entity.respondToEnvironment) {
    entity.respondToEnvironment(nearbyElements);
  }
}

// Update parameters for all entities
function updateEntityParams(params) {
  // Update default parameters for new entities
  if (params.lifespan) {
    defaultParams.lifespan = params.lifespan;
  }
  if (params.movementSpeed) {
    defaultParams.movementSpeed = params.movementSpeed;
  }
  if (params.fertilityRate) {
    defaultParams.fertilityRate = params.fertilityRate;
  }
  
  // Update existing entities
  for (let id in entities) {
    let entity = entities[id];
    
    // Update lifespan for entities
    if (params.lifespan && entity.maxLifespan) {
      // Store the original lifespan proportion
      const proportion = entity.lifespan / entity.maxLifespan;
      
      // Update max lifespan
      entity.maxLifespan = params.lifespan;
      
      // Update current lifespan proportionally to preserve state
      entity.lifespan = Math.round(proportion * params.lifespan);
      
      // Update thresholds
      entity.youngThreshold = entity.maxLifespan * 0.7;
      entity.oldThreshold = entity.maxLifespan * 0.3;
      
      // Trigger state update
      entity.updateState();
    }
    
    // Update movement speed
    if (params.movementSpeed) {
      // Scale the direction modifiers
      let scaleFactor = params.movementSpeed;
      
      // Only update if different from current
      if (Math.abs(entity.directionModifier.left) !== scaleFactor ||
          Math.abs(entity.directionModifier.top) !== scaleFactor) {
        
        // Preserve direction, change magnitude
        entity.directionModifier.left = Math.sign(entity.directionModifier.left) * scaleFactor;
        entity.directionModifier.top = Math.sign(entity.directionModifier.top) * scaleFactor;
      }
    }
    
    // Update fertility rate for byproduct generation
    if (params.fertilityRate && entity.byproducts) {
      // This will affect newly created byproducts
      entity.fertilityRate = params.fertilityRate;
    }
  }
}
