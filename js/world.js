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

  startWorker() {
    let workerID = uuid.v4();
    this.workers[workerID] = new Worker(this.workerScript);
    this.workers[workerID].postMessage({
      action: 'createAntity',
      ID: workerID,
      offset: {
        left: Math.floor($(window).width() / 2),
        top: Math.floor($(window).height() / 2)
      },
      dimensions: this.dimensions
    });
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
    newElement.offset(elementObject.offset);

    this.elements[elementObject.ID] = newElement;
    $('#world').append(this.elements[elementObject.ID]);
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
    }
  }
}

var world = new World('js/worker.js');
