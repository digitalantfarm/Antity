let Container = PIXI.Container
  , autoDetectRenderer = PIXI.autoDetectRenderer
  , loader = PIXI.loader
  , resources = PIXI.loader.resources
  , Sprite = PIXI.Sprite
  , Graphics = PIXI.Graphics
  , BlurFilter = PIXI.filters.BlurFilter;

class World {
  constructor() {
    this.unitOfTime = 1000 / 60;
    this.antities = {};
    this.elements = {};
    this.dimensions = {
      width: $(window).width(),
      height: $(window).height()
    };

    this.createWorld();
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

    let antity = new Graphics();
    antity.beginFill(0x00aaff);
    antity.lineStyle(1,0x00aaff, 1);
    antity.drawCircle(0, 0, 4);
    antity.endFill();
    antity.position.set(this.dimensions.width / 2, this.dimensions.height / 2);
    let antityBlur = new BlurFilter();
    antityBlur.blur = 3;
    antity.filters = [antityBlur];

    antity.scale.x = 2;
    antity.scale.y = 2;

    this.antity = antity;

    this.stage.addChild(this.antity);

    let byproduct = new Graphics();
    byproduct.beginFill(0xffffff);
    byproduct.lineStyle(1,0xffffff, 1);
    byproduct.drawCircle(0, 0, 2);
    byproduct.endFill();
    byproduct.position.set(this.dimensions.width / 2, this.dimensions.height / 2);
    let byproductBlur = new BlurFilter();
    byproductBlur.blur = 1;
    byproduct.filters = [byproductBlur];

    this.byproduct = byproduct;

    this.stage.addChild(this.byproduct);

    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.antity.position.x -= 0.5;
    this.antity.position.y -= 0.5;

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
    let newElement = $('<div />');
    newElement.attr({id: 'antity-' + elementObject.ID});
    newElement.addClass('antity');
    //newElement.addClass('birth');
    newElement.offset(elementObject.offset);

    this.elements[elementObject.ID] = newElement;
    $('#world').append(this.elements[elementObject.ID]);
  }

  moveAntity(elementObject) {
    let el = $('#antity-' + elementObject.ID);
    el.offset(elementObject.offset);
  }

  killAntity(elementObject) {
    if (!elementObject.isAlive) {
      $('#antity-' + elementObject.ID).remove();
      console.log('Antity dead.');
      this.workers[elementObject.ID].postMessage(elementObject);
    }
  }

  addByproduct(elementObject) {
    let newElement = $('<div />');
    newElement.attr({id: 'byproduct-' + elementObject.ID});
    newElement.addClass('byproduct');
    if (elementObject.fertile) {
      newElement.addClass('fertile');
    }
    newElement.offset(elementObject.offset);

    this.elements[elementObject.ID] = newElement;
    $('#world').append(this.elements[elementObject.ID]);
  }

  fadeByproduct(elementObject) {
    let el = $('#byproduct-' + elementObject.ID);
    el.css({opacity: elementObject.opacity});
  }

  killByproduct(elementObject) {
    if (!elementObject.isAlive) {
      $('#byproduct-' + elementObject.ID).remove();
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

/*
$(document).click(function(e) {
  let spawnLocation = { left: 0, top: 0 };

  spawnLocation.left = e.offsetX;
  spawnLocation.top = e.offsetY;

  //antities.push(new Antity(spawnLocation));
  world.startWorker(spawnLocation);
});
*/
