var d = new Date();
var n = d.getTime();

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

world.antities = new Array();
world.plantities = new Array();

let renderer = new autoDetectRenderer(world.dimensions.width, world.dimensions.height, {
  antialias: true,
  transparent: false,
  resolution: 1
});

renderer.backgroundColor = 0x111111;
document.body.appendChild(renderer.view);

let worldStage = new Container();

loader
  .add('antity-type1-genome', 'js/antity-type1-genome.json?' + n)
  .add('antity-type2-genome', 'js/antity-type2-genome.json?' + n)
  .add('plantity-type1-genome', 'js/plantity-type1-genome.json?' + n)
  .add('img/antity-sprite-simple.png')
  .load(setup);

function setup() {
  world.target = {
    x: world.dimensions.width / 2,
    y: world.dimensions.height / 2
  };

  for (let i = 0; i < 100; i++) {
    let selectOrganism = Math.random();
    switch(true) {
      case (selectOrganism < 1):
        world.plantities.push(new Plantity('plantity-type1-genome'));
        break;
    }
  }

  for (let i = 0; i < 100; i++) {
    let selectOrganism = Math.random();
    switch(true) {
      case (selectOrganism < 0.5):
        world.antities.push(new Antity('antity-type1-genome'));
        break;
      case (selectOrganism < 1):
        world.antities.push(new Antity('antity-type2-genome'));
        break;
    }
  }

  world.antities.forEach(function(element) {
    worldStage.addChild(element.sprite);
  }, this);

  world.plantities.forEach(function(element) {
    worldStage.addChild(element.sprite);
  }, this);

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  world.antities.forEach(function(element) {
    element.update();
  }, this);

  world.plantities.forEach(function(element) {
    element.update();
  }, this);

  renderer.render(worldStage);
}

$('body').click(function(e) {
  e.preventDefault();

  world.target.x = e.offsetX;
  world.target.y = e.offsetY;
});

/****************
 * Class Antity *
 ****************/

class Antity {
  constructor(genome) {
    this.dna = resources[genome].data;
    this.genotype = {};

    this.sprite = new Sprite(frame('img/antity-sprite-simple.png', 0, 0, 32, 32));
    this.sprite.anchor.set(0.5, 0.5);

    let randomX = Math.floor((Math.random() * world.dimensions.width) + 1);
    let randomY = Math.floor((Math.random() * world.dimensions.height) + 1);
    this.sprite.position.set(randomX, randomY);
    this.isMoving = false;

    this.createGenotype();

    this.circular = true;

    this.sprite.scale.set(this.size / 50, this.size / 50);

    this.sprite.tint = stringToColour(this.genotype.diet + this.genotype.personality);

    this.target = {
      x: null,
      y: null
    };

    this.meal = null;

    this.status = 'hungry';
  }

  update() {

    switch(this.status) {
      case 'hungry':
        let foodTarget = this.findFoodTarget();
        this.target = foodTarget;
        this.isMoving = true;
        this.status = 'hunting';
        break;
      case 'eating':
        if (this.meal.energy > 0) {
          this.meal.energy--;
        } else {
          this.meal.sprite.visible = false;
          this.status = 'hungry';
          this.meal = null;
        }
        break;
      case 'hunting':
        break;
      default:
        break;
    }

    if (this.isMoving) {
      this.move();
      world.plantities.forEach(function(plantity) {
        if (this.sprite == null) {
          // Oh
        } else {
          if (bump.hit(this.sprite, plantity.sprite)) {
            this.status = 'eating';
            this.meal = plantity;
            this.isMoving = false;
          }
        }
      }, this);
    }

  }

  findFoodTarget() {
    let nearbyFood = {
      x: 0,
      y: 0,
      xDiff: 0,
      yDiff: 0,
      targetFood: null
    };

    world.plantities.forEach(function(plantity, index) {
    let xDiff = (plantity.sprite.x - this.sprite.x) * -1;
    let yDiff = (plantity.sprite.y - this.sprite.y) * -1;
      let candidate = ( ( xDiff * -1) < (yDiff * -1) ? 'x' : 'y' );

      if (xDiff < nearbyFood.xDiff) {
        nearbyFood.x = plantity.sprite.x;
        nearbyFood.xDiff = xDiff;
        nearbyFood.targetFood = (candidate == 'x' ? index : nearbyFood.targetFood);
        if (candidate == 'x') {
          nearbyFood.y = plantity.sprite.y;
        }
      }
      if (plantity.sprite.y - this.sprite.y < nearbyFood.yDiff) {
        nearbyFood.y = plantity.sprite.y;
        nearbyFood.yDiff = yDiff;
        nearbyFood.targetFood = (candidate == 'y' ? index : nearbyFood.targetFood);
        if (candidate == 'y') {
          nearbyFood.x = plantity.sprite.x;
        }
      }
    }, this);

    return nearbyFood;
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

  move() {
    let startX = this.sprite.x;
    let startY = this.sprite.y;
    let endX = this.target.x;
    let endY = this.target.y;
    let speed = this.speed;
    let elapsed = world.elapsed;

    let distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    let directionX = (endX - startX) / distance;
    let directionY = (endY - startY) / distance;

    if (this.isMoving) {
      this.sprite.x += directionX * speed * elapsed;
      this.sprite.y += directionY * speed * elapsed;

      if (Math.sqrt(Math.pow(this.sprite.x - startX, 2) + Math.pow(this.sprite.y - startY, 2)) >= distance) {
        this.sprite.x = endX;
        this.sprite.y = endY;
        this.isMoving = false;
      }
    }
  }
}

class Plantity {
  constructor(genome) {
    this.dna = resources[genome].data;
    this.genotype = {};

    this.sprite = new Sprite(frame('img/antity-sprite-simple.png', 0, 0, 32, 32));
    this.sprite.anchor.set(0.5, 0.5);

    let randomX = Math.floor((Math.random() * world.dimensions.width) + 1);
    let randomY = Math.floor((Math.random() * world.dimensions.height) + 1);
    this.sprite.position.set(randomX, randomY);

    this.createGenotype();

    this.circular = true;

    this.size = this.energy / 10;

    this.sprite.scale.set(this.size / 100, this.size / 100);

    this.sprite.tint = this.genotype.colour;
  }

  update() {
    this.size = this.energy / 10;
    this.sprite.scale.set(this.size / 100, this.size / 100);
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
