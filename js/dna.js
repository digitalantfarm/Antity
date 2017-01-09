var d = new Date();
var n = d.getTime();
var timerDisplay = $('#worldTimer');

let Container = PIXI.Container
  , ParticleContainer = PIXI.ParticleContainer
  , autoDetectRenderer = PIXI.autoDetectRenderer
  , loader = PIXI.loader
  , resources = PIXI.loader.resources
  , Sprite = PIXI.Sprite
  , Graphics = PIXI.Graphics
  , TextureCache = PIXI.utils.TextureCache
  , Rectangle = PIXI.Rectangle
  , BlurFilter = PIXI.filters.BlurFilter
  , Texture = PIXI.Texture
  , bump = new Bump(PIXI);

let world = {};

world.dimensions = {
  width: $(window).width(),
  height: $(window).height()
};

world.elapsed = 0.1;

world.antities = {};
world.plantities = {};

let renderer = new autoDetectRenderer(world.dimensions.width, world.dimensions.height, {
  antialias: true,
  transparent: false,
  resolution: 1
});

renderer.backgroundColor = 0x111111;
document.body.appendChild(renderer.view);

let worldStage = new Container();

let plantityBiome = new Container();
worldStage.addChild(plantityBiome);

let antityBiome = new Container();
worldStage.addChild(antityBiome);

loader
  .add('antity-type1-genome', 'js/antity-type1-genome.json?' + n)
  .add('antity-type2-genome', 'js/antity-type2-genome.json?' + n)
  .add('plantity-type1-genome', 'js/plantity-type1-genome.json?' + n)
  .add('img/antity-sprite-blur.png')
  .load(setup);

function setup() {
  world.target = {
    x: world.dimensions.width / 2,
    y: world.dimensions.height / 2
  };

  for (let i = 0; i < 100; i++) {
    let selectOrganism = Math.random();
    let newPlantityID = uuid.v4();
    switch(true) {
      case (selectOrganism < 1):
        world.plantities[newPlantityID] = new Plantity('plantity-type1-genome');
        break;
    }
  }

  for (let i = 0; i < 100; i++) {
    let selectOrganism = Math.random();
    let newAntityID = uuid.v4();
    switch(true) {
      case (selectOrganism < 0.5):
        world.antities[newAntityID] = new Antity('antity-type1-genome');
        break;
      case (selectOrganism < 1):
        world.antities[newAntityID] = new Antity('antity-type2-genome');
        break;
    }
  }

  Object.keys(world.plantities).forEach(function(element) {
    plantityBiome.addChild(world.plantities[element].sprite);
  }, this);

  Object.keys(world.antities).forEach(function(element) {
    antityBiome.addChild(world.antities[element].sprite);
  }, this);

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  Object.keys(world.antities).forEach(function(element) {
    world.antities[element].update();
  }, this);

  Object.keys(world.plantities).forEach(function(element) {
    world.plantities[element].update();
  }, this);

  let nD = new Date();
  let nN = (nD.getHours() < 10 ? '0' : '') + nD.getHours() + ':' + (nD.getMinutes() < 10 ? '0' : '') + nD.getMinutes() + ':' + (nD.getSeconds() < 10 ? '0' : '') + nD.getSeconds() + '.' + (nD.getMilliseconds() < 10 ? '00' : (nD.getMilliseconds() < 100 ? '0' : '')) + nD.getMilliseconds();
  timerDisplay.html(nN);
  renderer.render(worldStage);
}

/****************
 * Class Antity *
 ****************/

class Antity {
  constructor(genome) {
    this.dna = resources[genome].data;
    this.genotype = {};

    this.sprite = new Sprite(frame('img/antity-sprite-blur.png', 0, 0, 256, 256));
    this.sprite.anchor.set(0.5, 0.5);

    let randomX = Math.floor((Math.random() * world.dimensions.width) + 1);
    let randomY = Math.floor((Math.random() * world.dimensions.height) + 1);
    this.sprite.position.set(randomX, randomY);
    this.isMoving = false;

    this.createGenotype();

    this.isAlive = true;

    this.circular = true;

    this.sprite.scale.set(this.size / 1000, this.size / 1000);

    this.sprite.tint = stringToColour(this.genotype.diet + this.genotype.personality);
    BlurFilter.blur = 25;
    this.sprite.filters = new Array();
    this.sprite.filters.push(BlurFilter);

    this.targetID = null;

    this.mealID = null;

    this.status = 'wandering';
  }

  update() {
    switch(this.status) {
      case 'eating':
        this.isMoving = false;
        if (world.plantities[this.mealID].energy > 0) {
          world.plantities[this.mealID].energy -= 10;
        } else {
          this.status = 'wandering';
          this.mealID = null;
        }
        break;
      case 'hungry':
        this.isMoving = true;
        let foodTarget = this.findFoodTarget();
        if (foodTarget == null) {
          this.targetID = null;
          this.status = 'wandering';
        } else {
          this.targetID = foodTarget;
          this.status = 'hunting';
        }
        break;
      case 'hunting':
        this.isMoving = true;
        break;
      case 'wandering':
        this.isMoving = true;
        break;
      default:
        this.status = 'wandering';
        break;
    }

    if (this.isMoving) {
      let collisionID = this.hasCollision();
      if (collisionID) {
        this.targetID = collisionID;
        this.mealID = collisionID;
        this.isMoving = false;
        this.status = 'eating';
      } else {
        if (this.status == 'wandering') {
          let chance = Math.random();
          if (this.destination == undefined) {
            this.destination = this.findRandomLocation();
          }
          if (chance < 0.01) {
            this.destination = this.findRandomLocation();
          }
          this.move(this.destination);
        } else {
          this.move(world.plantities[this.targetID].sprite);
        }
      }
    }
  }

  hasCollision() {
    let ID = false;

    Object.keys(world.plantities).forEach(function(plantity) {
      if (world.plantities[plantity].isAlive) {
        if (bump.hit(this.sprite, world.plantities[plantity].sprite)) {
          ID = plantity;
        }
      }
    }, this);

    return ID;
  }

  findFoodTarget() {
    let foundFood = null;
    let foodDistance = null;

    Object.keys(world.plantities).forEach(function(plantity) {
      if (world.plantities[plantity].isAlive) {
        if (!foundFood) {
          foundFood = plantity;
          foodDistance = Math.sqrt(Math.pow(world.plantities[plantity].sprite.x - this.sprite.x, 2) + Math.pow(world.plantities[plantity].sprite.y - this.sprite.y, 2));
        }

        let newFoodDistance = Math.sqrt(Math.pow(world.plantities[plantity].sprite.x - this.sprite.x, 2) + Math.pow(world.plantities[plantity].sprite.y - this.sprite.y, 2));

        if (newFoodDistance < foodDistance) {
          foundFood = plantity;
          foodDistance = newFoodDistance;
        }
      }
    }, this);

    return foundFood;
  }

  findRandomLocation() {
    let coords = {
      x: Math.floor((Math.random() * world.dimensions.width) + 1),
      y: Math.floor((Math.random() * world.dimensions.height) + 1)
    };

    return coords;
  }

  createGenotype() {
    let deviations = {};
    this.dna.chromosomes.forEach(function(chromosome) {
      chromosome.genes.forEach(function(gene) {
        let properties = Object.keys(gene);
        properties.forEach(function(p) {
          if (p.indexOf('Deviation') >= 0) {
            deviations[p] = gene[p];
          }
        }, this);
      }, this);
    }, this);
    this.dna.chromosomes.forEach(function(chromosome) {
      chromosome.genes.forEach(function(gene) {
        let properties = Object.keys(gene);
        properties.forEach(function(p) {
          if (p != 'isDominant' && p.indexOf('Deviation') < 0) {
            let newAttributeValue = gene[p];
            if (Object.keys(deviations).indexOf(p + 'Deviation') >= 0) {
              let deviation = deviations[p + 'Deviation'];
              let lowerLimit = gene[p] - deviation;
              let upperLimit = gene[p] + deviation;
              newAttributeValue = Math.floor((Math.random() * upperLimit) + lowerLimit);
            }
            this[p] = newAttributeValue;
            this.genotype[p] = newAttributeValue;
          }
        }, this);
      }, this);
    }, this);
  }

  move(target) {
    let startX = this.sprite.x;
    let startY = this.sprite.y;
    let endX = target.x;
    let endY = target.y;
    let speed = this.speed;
    let elapsed = world.elapsed;

    let distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

    if (distance > 0) {
      let directionX = (endX - startX) / distance;
      let directionY = (endY - startY) / distance;

      if (this.isMoving) {
        let movementX = directionX * speed * elapsed;
        let movementY = directionY * speed * elapsed;

        this.sprite.x += movementX;
        this.sprite.y += movementY;

        if (Math.sqrt(Math.pow(this.sprite.x - startX, 2) + Math.pow(this.sprite.y - startY, 2)) >= distance) {
          this.sprite.x = endX;
          this.sprite.y = endY;
          this.isMoving = false;
        }
      }
    } else {
      this.isMoving = false;
    }
  }
}

class Plantity {
  constructor(genome) {
    this.dna = resources[genome].data;
    this.genotype = {};

    this.sprite = new Sprite(frame('img/antity-sprite-blur.png', 0, 0, 256, 256));
    this.sprite.anchor.set(0.5, 0.5);

    let randomX = Math.floor((Math.random() * world.dimensions.width) + 1);
    let randomY = Math.floor((Math.random() * world.dimensions.height) + 1);
    this.sprite.position.set(randomX, randomY);

    this.createGenotype();

    this.isAlive = true;

    this.circular = true;

    this.size = this.energy / 10;

    this.sprite.scale.set(this.size / 1000, this.size / 1000);

    this.sprite.tint = this.genotype.colour;

    BlurFilter.blur = 25;
    this.sprite.filters = new Array();
    this.sprite.filters.push(BlurFilter);
  }

  update() {
    if (this.energy <= 0) {
      this.isAlive = false;
      this.sprite.visible = false;
    } else {
      this.size = this.energy / 10;
      this.sprite.scale.set(this.size / 1000, this.size / 1000);
    }
  }

  createGenotype() {
    let deviations = {};
    this.dna.chromosomes.forEach(function(chromosome) {
      chromosome.genes.forEach(function(gene) {
        let properties = Object.keys(gene);
        properties.forEach(function(p) {
          if (p.indexOf('Deviation') >= 0) {
            deviations[p] = gene[p];
          }
        }, this);
      }, this);
    }, this);
    this.dna.chromosomes.forEach(function(chromosome) {
      chromosome.genes.forEach(function(gene) {
        let properties = Object.keys(gene);
        properties.forEach(function(p) {
          if (p != 'isDominant' && p.indexOf('Deviation') < 0) {
            let newAttributeValue = gene[p];
            if (Object.keys(deviations).indexOf(p + 'Deviation') >= 0) {
              let deviation = deviations[p + 'Deviation'];
              let lowerLimit = gene[p] - deviation;
              let upperLimit = gene[p] + deviation;
              newAttributeValue = Math.floor((Math.random() * upperLimit) + lowerLimit);
            }
            this[p] = newAttributeValue;
            this.genotype[p] = newAttributeValue;
          }
        }, this);
      }, this);
    }, this);
  }
}

/***********
 * Helpers *
 ***********/

function frame(src, x, y, w, h) {
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

function stringToColour(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '0x';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

$(document).click(function(e) {
  let newPlantityID = uuid.v4();
  world.plantities[newPlantityID] = new Plantity('plantity-type1-genome');
  plantityBiome.addChild(world.plantities[newPlantityID].sprite);
});
