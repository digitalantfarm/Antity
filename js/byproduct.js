class Byproduct {
    constructor(byproductId) {
        this.element = $('<div />');
        this.element.addClass('byproduct');
        this.element.attr({id: byproductId});

        $('#world').append($(this.element));
    }

    setLocation(offset) {
        this.element.offset(offset);
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
