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

    this.stage = new ParticleContainer();

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
    let aColor = 0x00aaff;
    let aTexture = TextureCache['img/antity-spritesheet.png'];
    let aRectangle = new Rectangle(0, 0, 32, 32);
    aTexture.frame = aRectangle;
    let antity = new Sprite(aTexture);
    antity.position.set(elementObject.offset.left - (antity.width / 2), elementObject.offset.top - (antity.height / 2));

    this.sprites[elementObject.ID] = antity;

    this.stage.addChild(this.sprites[elementObject.ID]);
  }

  moveAntity(elementObject) {
    let antity = this.sprites[elementObject.ID];
    antity.position.set(elementObject.offset.left - (antity.width / 2), elementObject.offset.top - (antity.height / 2));
  }

  killAntity(elementObject) {
    if (!elementObject.isAlive) {
      this.stage.removeChild(this.sprites[elementObject.ID]);
      console.log('Antity dead.');
      this.workers[elementObject.ID].postMessage(elementObject);
      //delete this.workers[elementObject.ID];
    }
    if (this.antityCount() < 1) {
      console.log('Resurrection!');
      this.startWorker();
    }
  }

  addByproduct(elementObject) {
    let bpBlur = 1;
    let bpColor = 0xffffff;
    let bpScale = 0.75;
    let bpTexture = TextureCache['img/antity-spritesheet.png'];
    let bpRectangle = new Rectangle(32, 24, 16, 16);

    if (elementObject.fertile) {
      bpBlur = 2;
      bpColor = 0x00dd33;
      bpScale = 1;
      bpRectangle = new Rectangle(32, 0, 24, 24);
    }

    bpTexture.frame = bpRectangle;
    let byproduct = new Sprite(bpTexture);
    byproduct.scale.set(bpScale, bpScale);
    byproduct.position.set(elementObject.offset.left - (byproduct.width / 2), elementObject.offset.top - (byproduct.height / 2));

    this.sprites[elementObject.ID] = byproduct;

    this.stage.addChild(this.sprites[elementObject.ID]);
  }

  fadeByproduct(elementObject) {
    this.sprites[elementObject.ID].alpha = elementObject.opacity;
  }

  killByproduct(elementObject) {
    if (!elementObject.isAlive) {
      this.stage.removeChild(this.sprites[elementObject.ID]);
      this.workers[elementObject.parentAntityId].postMessage(elementObject);
    }
  }

  antityCount() {
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
