class Antity {
    constructor(spawnOffset = undefined) {
        const antityId = antities.length;
        this.ID = antityId;
        if (debugAntity) {
            console.log('Antity ' + this.ID + ' was created.');
        }
        this.isAlive = true;
        this.maxLifespan = 1500;
        this.lifespan = this.maxLifespan;
        this.element = $('<div />');
        this.element.addClass('antity');
        this.element.addClass('birth');
        this.element.attr({id: 'antity-' + antityId});

        if(spawnOffset === undefined) {
            spawnOffset = {left: 0, top: 0};
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
            if (this.lifespan == this.maxLifespan) {
                this.element.removeClass('birth');
            }
            this.lifespan--;
            this.chooseDirection();
            this.doMove();
            this.generateByproduct();

            if (this.lifespan <= 0) {
                if (antities.length == 1) {
                    this.lifespan = this.maxLifespan / 10;
                } else {
                    this.kill();
                }
            }
        } else {
            /*
            if (this.byproducts.length == 0) {
                antities.splice(antities.indexOf(this), 1);
            }
            */
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
            if (debugAntity) {
                console.log('Antity ' + this.ID + ' created Byproduct ' + this.byproducts.length + '.');
            }
            this.byproducts.push(new Byproduct(this.ID, {left: coords.left, top: coords.top}));
        }
    }

    kill() {
        if (debugAntity) {
            console.log('Antity ' + this.ID + ' is now finished.');
        }
        this.element.addClass('death');
        setTimeout(function(that) {
            that.element.remove();
        }, 1500, this);
        this.isAlive = false;
    }
}
