class World {
  constructor(workerScript) {
    this.workerScript = workerScript;
    this.unitOfTime = 50;
    this.workers = {};
    this.elements = {};
    this.dimensions = {
      width: $(window).width(),
      height: $(window).height()
    };

    this.startWorker();
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

  listener(e) {
    switch(e.data.action) {
      case 'createAntity':
        world.addAntity(e.data);
        break;
      case 'moveAntity':
        world.moveAntity(e.data);
        break;
      case 'createByproduct':
        world.addByproduct(e.data);
        break;
      case 'fadeByproduct':
        world.fadeByproduct(e.data);
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
