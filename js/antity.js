class Antity {
    constructor(antityId, spawnOffset = {left: 0, top: 0}) {
        this.ID = antityId;
        this.isAlive = true;
        this.lifespan = 5000;
        this.element = $('<div />');
        this.element.addClass('antity');
        this.element.attr({id: antityId});

        this.element.css({left: spawnOffset.left, top: spawnOffset.top});

        this.directionModifier = {left: 1, top: 1};
        this.byproducts = [];

        $('#world').append($(this.element));
    }

    setLocation(offset) {
        this.element.offset(offset);
    }

    move() {
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
            let byproductId = 'byproduct-' + this.byproducts.length;
            let newByproduct = new Byproduct(byproductId);
            newByproduct.parentAntityId = this.ID;
            newByproduct.setLocation({left: coords.left, top: coords.top});
            this.byproducts.push(newByproduct);
        }
    }

    kill() {
        this.element.remove();
        this.isAlive = false;
    }
}
