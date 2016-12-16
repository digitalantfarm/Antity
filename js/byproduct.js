class Byproduct {
    constructor(byproductId) {
        this.element = $('<div />');
        this.element.addClass('byproduct');
        this.element.attr({id: byproductId});
        this.fertile = false;

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
            this.element.remove();
        } else {
            this.element.css('opacity', currentOpacity - 0.0005);
        }
    }
}
