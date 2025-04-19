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

// Message batching system to reduce communication overhead
let messageQueue = [];
let lastMessageSend = Date.now();
const MESSAGE_BATCH_INTERVAL = 100; // Send batched messages every 100ms
const MAX_BATCH_SIZE = 50; // Maximum messages per batch

// Byproduct management
let MAX_BYPRODUCTS_PER_ENTITY = 10; // Limit byproducts per entity
let MAX_TOTAL_BYPRODUCTS = 2000; // Global limit for all byproducts
let totalByproductCount = 0;

// Start message batching interval
const batchInterval = setInterval(sendBatchedMessages, MESSAGE_BATCH_INTERVAL);

// Function to send batched messages
function sendBatchedMessages() {
  if (messageQueue.length === 0) return;
  
  // Sort messages by priority (move, state updates first)
  messageQueue.sort((a, b) => {
    // Priority: 1. Kill messages, 2. Move messages, 3. State updates, 4. Others
    const getPriority = (msg) => {
      if (msg.action === 'killAntity' || msg.action === 'killByproduct') return 0;
      if (msg.action === 'moveAntity') return 1; 
      if (msg.action === 'updateState') return 2;
      return 3;
    };
    return getPriority(a) - getPriority(b);
  });
  
  // Take messages up to batch size limit
  const messagesToSend = messageQueue.splice(0, MAX_BATCH_SIZE);
  
  // Combine similar messages (e.g., multiple move updates for same entity)
  const uniqueMessages = {};
  messagesToSend.forEach(msg => {
    // Use ID + action as key to avoid duplicates
    const key = msg.ID + "-" + msg.action;
    // Always keep the most recent message for each entity+action
    uniqueMessages[key] = msg;
  });
  
  // Send the batch as a single message
  postMessage({
    action: 'batchedMessages',
    messages: Object.values(uniqueMessages)
  });
  
  lastMessageSend = Date.now();
}

// Queue a message instead of sending immediately
function queueMessage(message) {
  // Critical messages (like kills) get sent immediately
  if (message.action === 'killAntity') {
    postMessage(message);
    return;
  }
  
  messageQueue.push({...message}); // Clone the message to avoid reference issues
  
  // If queue is getting large, send immediately
  if (messageQueue.length >= MAX_BATCH_SIZE) {
    sendBatchedMessages();
  }
}

onmessage = function (e) {
  if (isPaused && e.data.action !== 'resumeSimulation') {
    // Don't process messages while paused (except resume command)
    return;
  }
  
  if (typeof e.data == 'object' && e.data.action) {
    switch (e.data.action) {
      case 'createAntity':
        createAntity(e.data);
        postMessage(e.data); // Still send immediate confirmation for entity creation
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
            totalByproductCount--;
            checkWorkerStatus();
          }
        }
        break;
      case 'updateState':
        // Just acknowledge the state update from an entity
        break;
      case 'detectNearby':
        // Process environmental awareness request - reduce frequency
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
      case 'setByproductLimit':
        // Update byproduct limits
        if (typeof e.data.perEntity === 'number') {
          MAX_BYPRODUCTS_PER_ENTITY = e.data.perEntity;
        }
        if (typeof e.data.total === 'number') {
          MAX_TOTAL_BYPRODUCTS = e.data.total;
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
  
  // Add byproduct limits information, but don't pass the function directly
  data.useMessageQueue = true; // Flag to indicate batch messaging should be used
  data.byproductLimits = {
    perEntity: MAX_BYPRODUCTS_PER_ENTITY,
    total: MAX_TOTAL_BYPRODUCTS,
    current: totalByproductCount
  };
  
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
  totalByproductCount = 0;
  
  // Count active entities and byproducts
  for (let id in entities) {
    let entity = entities[id];
    if (entity.isAlive > 0) {
      activeEntities++;
    }
    const entityByproducts = getByproductCount(entity);
    totalByproductCount += entityByproducts;
  }
  
  // NEVER close the worker completely - this prevents resurrection
  // Just report inactive status if needed
  if (activeEntities === 0 && totalByproductCount === 0 && totalEntities > 0) {
    // Send any remaining messages
    sendBatchedMessages();
    
    // Notify main thread this worker is idle but don't close
    postMessage({
      action: 'workerIdle',
      workerId: self.id
    });
  }
}

// Register a new byproduct and check against limits
function registerByproduct(antityId) {
  // Check if we're at the global limit
  if (totalByproductCount >= MAX_TOTAL_BYPRODUCTS) {
    return false;
  }
  
  // Check if entity is at its individual limit
  const entity = entities[antityId];
  if (entity && getByproductCount(entity) >= MAX_BYPRODUCTS_PER_ENTITY) {
    return false;
  }
  
  // We're within limits, so increment counter
  totalByproductCount++;
  return true;
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
