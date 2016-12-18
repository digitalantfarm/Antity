class Byproduct {
    constructor(parentAntityId, spawnLocation = undefined) {
        const byproductId = antities[parentAntityId].byproducts.length;
        this.ID = byproductId;
        console.log('Byproduct ' + this.ID + ' was created by Antity ' + parentAntityId + '.');
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
            /*
            try {
                let byproducts = antities[this.parentAntityId].byproducts;
                antities[this.parentAntityId].byproducts.splice(antities[this.parentAntityId].byproducts.indexOf(this.ID), 1);
            } catch(e) {
                console.log('Cleaning up Byproduct ' + this.ID + ' of Antity ' + this.parentAntityId);
                console.log(e);
            }
            */
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
        console.log('Byproduct ' + this.ID + ' hatched into Antity ' + antities.length + '.');
        antities.push(new Antity(this.element.offset()));

        this.kill();
    }

    kill() {
        console.log('Byproduct ' + this.ID + ' is now finished.');
        this.element.remove();
        this.isAlive = false;
    }
}
