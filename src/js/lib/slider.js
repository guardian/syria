import Hammer from './hammer.min'

function bound(v, min, max) {
    return Math.min(max, Math.max(min, v));
}

export default function (el, thumbEl, min, max, windowSize, onchange) {
    var range = max - min;

    var xMin, xWidth, xStep;
    // Attempting to reduce scroll interference
    var scrollY, isFirst;

    var value;

    function premove(evt) {
        var rect = el.getBoundingClientRect();
        xMin = rect.left;
        xWidth = rect.width;
        xStep = xWidth / range;
        scrollY = window.pageYOffset;
        isFirst = true;

        if (evt.type === 'panstart') {
            document.body.style.MozUserSelect = 'none';
        }
    }

    function move(evt) {
        var x = Math.floor(evt.center.x - xMin);
        var isPan = evt.type === 'pan';

        if (window.pageYOffset === scrollY && (!isPan || !isFirst && evt.direction & Hammer.DIRECTION_HORIZONTAL)
                && x >= 0 && x <= xWidth) {
            let newValue = bound(Math.round(x / xStep) - windowSize, min, max - windowSize * 2 - 1);
            if (newValue != value) {
                value = newValue;
                thumbEl.style.left = (newValue / range * 100) + '%';
                onchange(value + min, value + min + windowSize * 2);
            }
        }

        isFirst = false;

        if (evt.pointerType === 'mouse') {
            evt.preventDefault();
        }
    }

    function postmove() {
        document.body.style.MozUserSelect = '';
        if (window.pageYOffset === scrollY) {
            onchange(value + min, value + min + windowSize * 2);
        }
    }

    if (window.GuardianJSInterface) {
        el.addEventListener('touchstart', () => {
            window.GuardianJSInterface.registerRelatedCardsTouch(true);
        });

        el.addEventListener('touchend', () => {
            window.GuardianJSInterface.registerRelatedCardsTouch(false);
        });
    }

    var hammer = new Hammer(el);
    hammer.on('panstart tap press', premove)
    hammer.on('pan tap press', move);
    hammer.on('panend', postmove);
    hammer.get('tap').set({'interval': 0, 'threshold': 10});
}
