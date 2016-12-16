class Byproduct {
    constructor(byproductId) {
        this.ID = byproductId;
        this.isAlive = true;
        this.element = $('<div />');
        this.element.addClass('byproduct');
        this.element.attr({id: byproductId});
        this.fertile = false;
        this.incubationPeriod = 1000;
        this.parentAntityId = undefined;

        this.viabilityProbability = 0.01;

        this.fertilise();

        $('#world').append($(this.element));
    }

    setLocation(offset) {
        this.element.offset(offset);
    }

    fertilise() {
        const chance = Math.random();
        if ( chance <= this.viabilityProbability ) {
            this.fertile = true;
            this.element.addClass('fertile');
        }
    }

    fade() {
        let currentOpacity = this.element.css('opacity');
        if (currentOpacity <= 0) {
            this.kill();
        } else {
            this.element.css('opacity', currentOpacity - 0.0005);
        }
    }

    hatch() {
        let antityId = 'antity-' + antities.length;
        let newAnt = new Antity(antityId, this.element.offset());
        antities.push(newAnt);

        this.kill();
    }

    kill() {
        this.element.remove();
        this.isAlive = false;
    }
}
