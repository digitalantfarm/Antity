class Byproduct {
    constructor(parentAntityId, spawnLocation = undefined) {
        const byproductId = antities[parentAntityId].byproducts.length;
        this.ID = byproductId;
        this.isAlive = true;
        this.element = $('<div />');
        this.element.addClass('byproduct');
        this.element.attr({id: 'byproduct-' + byproductId});
        this.fertile = false;
        this.incubationPeriod = 100;
        this.parentAntityId = parentAntityId;

        this.viabilityProbability = 0.01;

        this.fertilise();

        if (spawnLocation !== undefined) {
            this.setLocation(spawnLocation);
        }

        $('#world').append($(this.element));

        this.cycleInterval = setInterval(function(that) {
            that.cycle();
        }, unitOfTime * 5, this);
    }

    cycle() {
        if (this.isAlive) {
            if (this.fertile) {
                if (this.incubationPeriod <= 0) {
                    this.hatch();
                } else {
                    this.incubationPeriod--;
                }
            } else {
                this.fade();
            }
        } else {
            antities[this.parentAntityId].byproducts.splice(antities[this.parentAntityId].byproducts.indexOf(this.ID), 1);
        }
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
            this.element.css('opacity', currentOpacity - 0.005);
        }
    }

    hatch() {
        antities.push(new Antity(this.element.offset()));

        this.kill();
    }

    kill() {
        this.element.remove();
        this.isAlive = false;
    }
}
