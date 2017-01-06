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
  , Texture = PIXI.Texture;

let world = {};

world.dimensions = {
  width: $(window).width(),
  height: $(window).height()
};

world.elapsed = 0.1;

world.antities = new Array();

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
  .add('img/antity-spritesheet.png')
  .load(setup);

function setup() {
  world.target = {
    x: world.dimensions.width / 2,
    y: world.dimensions.height / 2
  };

  for (let i = 0; i < 1000; i++) {
    let selectOrganism = Math.random();
    switch(true) {
      case (selectOrganism < 0.3):
        world.antities.push(new Antity('antity-type1-genome'));
        break;
      case (selectOrganism < 0.6):
        world.antities.push(new Antity('antity-type2-genome'));
        break;
      default:
        world.antities.push(new Plantity('plantity-type1-genome'));
        break;
    }
    /*
    if ( Math.random() > 0.5 ) {
      world.antities.push(new Antity('antity-type1-genome'));
    } else {
      world.antities.push(new Antity('antity-type2-genome'));
    }
    */
  }

  world.antities.forEach(function(element) {
    worldStage.addChild(element.sprite);
  }, this);

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  world.antities.forEach(function(element) {
    if (element instanceof Antity) {
      element.move(world.target);
    }
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

    this.sprite = new Sprite(frame('img/antity-spritesheet.png', 32, 24, 16, 16));
    this.sprite.anchor.set(0.5, 0.5);

    let randomX = Math.floor((Math.random() * world.dimensions.width) + 1);
    let randomY = Math.floor((Math.random() * world.dimensions.height) + 1);
    this.sprite.position.set(randomX, randomY);
    this.isMoving = false;

    this.createGenotype();

    this.sprite.scale.set(this.size / 50, this.size / 50);

    this.sprite.tint = stringToColour(this.genotype.diet + this.genotype.personality);

    this.target = {
      x: world.target.x,
      y: world.target.y
    };
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
    if (target.x !== this.target.x && target.y !== this.target.y) {
      this.target = {
        x: target.x,
        y: target.y
      };
      this.isMoving = true;
    }

    let startX = this.sprite.x;
    let startY = this.sprite.y;
    let endX = target.x;
    let endY = target.y;
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

    this.sprite = new Sprite(frame('img/antity-spritesheet.png', 32, 24, 16, 16));
    this.sprite.anchor.set(0.5, 0.5);

    let randomX = Math.floor((Math.random() * world.dimensions.width) + 1);
    let randomY = Math.floor((Math.random() * world.dimensions.height) + 1);
    this.sprite.position.set(randomX, randomY);

    this.createGenotype();

    this.sprite.scale.set(this.size / 50, this.size / 50);

    this.sprite.tint = this.genotype.colour;

    this.food = this.size * this.energy;
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
