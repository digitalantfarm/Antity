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
      action: 'createElement',
      ID: workerID,
      offset: {
        left: Math.floor($(window).width() / 2),
        top: Math.floor($(window).height() / 2)
      },
      dimensions: this.dimensions
    });
    this.workers[workerID].onmessage = this.listener;
  }

  doCreateElement(elementObject) {
    this.elements[elementObject.ID] = $('<div />');
    $('#world').append(this.elements[elementObject.ID]);
  }

  listener(e) {
    if (e.data.action == 'createElement') {
      world.doCreateElement(e.data);
    }
  }
}

var world = new World('js/worker.js');
