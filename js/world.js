let Container = PIXI.Container
  , ParticleContainer = PIXI.ParticleContainer
  , autoDetectRenderer = PIXI.autoDetectRenderer
  , loader = PIXI.loader
  , resources = PIXI.loader.resources
  , Sprite = PIXI.Sprite
  , Graphics = PIXI.Graphics
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

    loader
      .add('img/antity-spritesheet.png')
      .load(this.createWorld.bind(this));
  }

  createWorld() {
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

    this.animate();
    this.startWorker();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.stage);
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
    this.workers[workerID] = new Worker(this.workerScript);
    this.workers[workerID].postMessage(options);
    this.workers[workerID].onmessage = this.listener;
  }

  addAntity(elementObject) {
    this.antityCount++;
    let aTexture = TextureCache['img/antity-spritesheet.png'];
    let aRectangle = new Rectangle(0, 0, 32, 32);
    aTexture.frame = aRectangle;
    let antity = new Sprite(aTexture);
    antity.position.set(elementObject.offset.left - (antity.width / 2), elementObject.offset.top - (antity.height / 2));
    antity.anchor.x = 0.5;
    antity.anchor.y = 0.5;

    this.sprites[elementObject.ID] = antity;

    this.antityStage.addChild(this.sprites[elementObject.ID]);
  }

  moveAntity(elementObject) {
    let antity = this.sprites[elementObject.ID];
    antity.position.set(elementObject.offset.left - (antity.width / 2), elementObject.offset.top - (antity.height / 2));
  }

  killAntity(elementObject) {
    if (!elementObject.isAlive) {
      this.antityCount--;
      this.sprites[elementObject.ID].visible = false;
      //this.antityStage.removeChild(this.sprites[elementObject.ID]);
      console.log('Antity dead.');
      this.workers[elementObject.ID].postMessage(elementObject);
    }
    if (this.antityCount < 1 && this.eggCount < 1) {
      console.log('Resurrection!');
      this.startWorker();
    }
  }

  addByproduct(elementObject) {
    let bpTexture = TextureCache['img/antity-spritesheet.png'];
    let bpRectangle = new Rectangle(32, 24, 16, 16);

    if (elementObject.fertile) {
      this.eggCount++;
      bpRectangle = new Rectangle(32, 0, 24, 24);
    }

    bpTexture.frame = bpRectangle;
    let byproduct = new Sprite(bpTexture);
    byproduct.position.set(elementObject.offset.left - (byproduct.width / 2), elementObject.offset.top - (byproduct.height / 2));
    byproduct.anchor.x = 0.5;
    byproduct.anchor.y = 0.5;

    this.sprites[elementObject.ID] = byproduct;

    if (elementObject.fertile) {
      this.eggStage.addChild(this.sprites[elementObject.ID]);
    } else {
      this.byproductStage.addChild(this.sprites[elementObject.ID]);
    }
  }

  fadeByproduct(elementObject) {
    this.sprites[elementObject.ID].alpha = elementObject.opacity;
  }

  killByproduct(elementObject) {
    if (!elementObject.isAlive) {
      if (elementObject.fertile) {
        this.eggCount--;
        this.sprites[elementObject.ID].visible = false;
        //this.eggStage.removeChild(this.sprites[elementObject.ID]);
      } else {
        this.sprites[elementObject.ID].visible = false;
        //this.byproductStage.removeChild(this.sprites[elementObject.ID]);
      }
      this.workers[elementObject.parentAntityId].postMessage(elementObject);
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
        console.log('Hatching!');
        world.startWorker(e.data.offset);
        break;
      case 'killByproduct':
        world.killByproduct(e.data);
        break;
    }
  }
}

var world = new World('js/worker.js');

function click2create() {
  $(document).click(function(e) {
    let spawnLocation = { left: 0, top: 0 };

    spawnLocation.left = e.offsetX;
    spawnLocation.top = e.offsetY;

    world.startWorker(spawnLocation);
  });

  return 'You can now click anywhere on the page to create more Antities.';
}
