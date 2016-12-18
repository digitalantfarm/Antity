class Antity {
    constructor(spawnOffset = undefined) {
        const antityId = antities.length;
        this.ID = antityId;
        this.isAlive = true;
        this.lifespan = 2500;
        this.element = $('<div />');
        this.element.addClass('antity');
        this.element.attr({id: 'antity-' + antityId});

        if(spawnOffset === undefined) {
            spawnOffset = {left: '0px', top: '0px'};
        }

        this.setLocation(spawnOffset);

        this.directionModifier = {left: 1, top: 1};
        this.byproducts = [];

        $('#world').append($(this.element));

        this.cycleInterval = setInterval(function(that) {
            that.cycle();
        }, unitOfTime, this);
    }

    cycle() {
        if (this.isAlive) {
            this.lifespan--;
            this.chooseDirection();
            this.doMove();
            this.generateByproduct();

            if (this.lifespan <= 0) {
                if (antities.length == 1) {
                    this.lifespan = 2500;
                } else {
                    this.kill();
                }
            }
        } else {
            antities.splice(antities.indexOf(this), 1);
        }
    }

    setLocation(offset) {
        this.element.offset(offset);
    }

    doMove() {
        let coords = this.element.offset();
        let newOffset = {
            left: coords.left,
            top: coords.top
        };
        let worldWidth = $(window).width();
        let worldHeight = $(window).height();

        if ( ( coords.left + this.directionModifier.left ) < 0 || ( coords.left + this.directionModifier.left ) > worldWidth ) {
            newOffset.left = coords.left - this.directionModifier.left;
        } else {
            newOffset.left = coords.left + this.directionModifier.left;
        }

        if ( ( coords.top + this.directionModifier.top ) < 0 || ( coords.top + this.directionModifier.top ) > worldHeight ) {
            newOffset.top = coords.top - this.directionModifier.top;
        } else {
            newOffset.top = coords.top + this.directionModifier.top;
        }

        this.element.offset(newOffset);
    }

    chooseDirection(probability = 0.1) {
        const chanceLeft = Math.random();
        const chanceTop = Math.random();
        if ( chanceLeft <= probability ) {
            this.directionModifier.left = this.directionModifier.left * -1;
        }
        if ( chanceTop <= probability ) {
            this.directionModifier.top = this.directionModifier.top * -1;
        }
    }

    generateByproduct(probability = 0.1) {
        const chanceByproduct = Math.random();
        if ( chanceByproduct <= probability ) {
            let coords = this.element.offset();
            this.byproducts.push(new Byproduct(this.ID, {left: coords.left, top: coords.top}));
        }
    }

    kill() {
        this.element.remove();
        this.isAlive = false;
    }
}
