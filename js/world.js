let Container = PIXI.Container
  , autoDetectRenderer = PIXI.autoDetectRenderer
  , loader = PIXI.loader
  , resources = PIXI.loader.resources
  , Sprite = PIXI.Sprite
  , Graphics = PIXI.Graphics
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

    this.createWorld();

    this.startWorker();
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

    this.animate();
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
    let antity = new Graphics();
    antity.beginFill(0x00aaff);
    antity.lineStyle(1,0x00aaff, 1);
    antity.drawCircle(0, 0, 8);
    antity.endFill();
    antity.position.set(elementObject.offset.left, elementObject.offset.top);
    let antityBlur = new BlurFilter();
    antityBlur.blur = 3;
    antity.filters = [antityBlur];

    this.sprites[elementObject.ID] = antity;

    this.stage.addChild(this.sprites[elementObject.ID]);
  }

  moveAntity(elementObject) {
    this.sprites[elementObject.ID].position.set(elementObject.offset.left, elementObject.offset.top);
  }

  killAntity(elementObject) {
    if (!elementObject.isAlive) {
      this.stage.removeChild(this.sprites[elementObject.ID]);
      console.log('Antity dead.');
      this.workers[elementObject.ID].postMessage(elementObject);
    }
  }

  addByproduct(elementObject) {
    let byproduct = new Graphics();
    byproduct.beginFill(0xffffff);
    byproduct.lineStyle(1,0xffffff, 1);
    byproduct.drawCircle(0, 0, 2);
    byproduct.endFill();
    byproduct.position.set(elementObject.offset.left, elementObject.offset.top);
    let byproductBlur = new BlurFilter();
    byproductBlur.blur = 1;
    byproduct.filters = [byproductBlur];
    if (elementObject.fertile) {
      byproduct.tint = 0xdd0033;
    }

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
}
