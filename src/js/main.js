import mainHTML from '../templates/main.html!text'
import airstrikes from '../../data-out/ir-airstrikes.json!json'
import share from './lib/share'
import doT from 'olado/doT'
import {fetchJSON} from './lib/fetch'
import {processCopySheet} from './lib/copy'

var shareFn = share('Interactive title', 'http://gu.com/p/URL', null, null, '#Interactive');

const WINDOW = 7;
const DAY_MILLIS = 1000 * 60 * 60 * 24;

var latest = +new Date(airstrikes[0].date);
var earliest = +new Date(airstrikes[airstrikes.length - 1].date);
var totalDays = (latest - earliest) / DAY_MILLIS - WINDOW;

function pad(n) {
    return (n < 10 ? '0' : '') + n;
}

function getDate(timestamp) {
    var date = new Date(timestamp);
    return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join('-');
}

function render(el, data, config) {
    var ctx = {
        assetPath: config.assetPath,
        past: data.sheets.past,
        copy: processCopySheet(data.sheets.copy)
    };

    el.innerHTML = doT.template(mainHTML)(ctx);

    var sliderEl = el.querySelector('.js-dashboard-window');
    var canvasEl = el.querySelector('.js-dashboard-strikes');
    var textEl = el.querySelector('.js-dashboard-text');
    var ctx = canvasEl.getContext('2d');

    sliderEl.value = sliderEl.max = totalDays;
    sliderEl.addEventListener('input', () => {
        var days = parseInt(sliderEl.value);
        var startTimestamp = earliest + days * DAY_MILLIS;
        var start = getDate(startTimestamp);
        var end = getDate(startTimestamp + WINDOW * DAY_MILLIS);

        var windowStrikes = airstrikes.filter(airstrike => airstrike.date >= start && airstrike.date < end);
        canvasEl.width = canvasEl.width;
        ctx.fillStyle = '#b82266';
        windowStrikes.forEach(strike => {
            ctx.beginPath();
            ctx.arc(strike.geo.coord[0], strike.geo.coord[1], 5 + strike.strikes * 3, 0, 2*Math.PI);
            ctx.fill();
        });

        textEl.textContent = `${start} - ${end}`;
    });

    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });
}

export function init(el, context, config, mediator) {
    var dataUrl = 'http://interactive.guim.co.uk/docsdata-test/19lKOCtZFsQSnLeReaYY7wORrGBHFGcD8mpwLsjOpj1Y.json';
    fetchJSON(dataUrl).then(data => render(el, data, config))
}
