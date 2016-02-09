import './polyfill/classList'
import './polyfill/pointerEvents'

import iframeMessenger from 'guardian/iframe-messenger'
import doT from 'olado/doT'
import ts2date from './lib/ts2date'
import slider from './lib/slider'
import { fetchJSON } from './lib/fetch'
import sheetURL from './lib/sheetURL'

import dashboardHTML from '../templates/dashboard.html!text'
import analysisHTML from '../templates/analysis.html!text'

const TIMELINE_WINDOW = 3;
const TIMELINE_HEIGHT = 60; // keep in sync with _dashboard.scss

const COLORS = {'syria': '#83003c', 'iraq': '#d37da3'};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function renderLocation(ctx, loc, radius) {
    ctx.beginPath();
    ctx.arc(loc.geo.coord[0], loc.geo.coord[1], radius, 0, 2 * Math.PI);
    ctx.fill();
}

function app(el, config, data) {
    iframeMessenger.enableAutoResize();

    var airstrikes = data.airstrikes, locations = data.map;

    const START = +new Date(airstrikes.meta.start);
    const END = +new Date(airstrikes.meta.end);
    const LIVE = ts2date(END, -TIMELINE_WINDOW * 2);

    var parts = airstrikes.meta.start.split('-').map(d => d.replace(/^0/, ''));
    var startDate = [parts[2], MONTHS[parseInt(parts[1]) - 1], parts[0]].join(' ');

    var ctx = {
        updated: data.updated,
        locations,
        timeline: airstrikes.timeline,
        countLen: airstrikes.timeline.counts.length,
        countMax: Math.max.apply(null, airstrikes.timeline.counts.map(c => (c.iraq || 0) + (c.syria || 0))),
        windowSize: TIMELINE_WINDOW * 2 + 1,
        timelineHeight: TIMELINE_HEIGHT,
        startDate,
        syriaTotal: airstrikes.timeline.counts.reduce((t, c) => t + (c.syria || 0), 0),
        iraqTotal: airstrikes.timeline.counts.reduce((t, c) => t + (c.iraq || 0), 0)
    };

    el.innerHTML = doT.template(dashboardHTML)(ctx);

    var strikesEl = el.querySelector('.js-dashboard-strikes');
    var strikesCtx = strikesEl.getContext('2d');
    var timelineEl = el.querySelector('.js-timeline');
    var timelineWindowEl = el.querySelector('.js-timeline-window');
    var analysisEl = el.querySelector('.js-analysis');
    var periodEl = el.querySelector('.js-period');
    var syriaPeriodEl = el.querySelector('.js-syria-period');
    var iraqPeriodEl = el.querySelector('.js-iraq-period');
    var analysisEl = el.querySelector('.js-analysis');

    function renderMap(start, end) {
        strikesEl.width = strikesEl.width; // clear canvas
        strikesCtx.globalAlpha = 0.7;

        var totals = {'iraq': 0, 'syria': 0};

        airstrikes.locations.forEach(loc => {
            var strikes = loc.strikes.filter(s => s.date >= start.cmp && s.date <= end.cmp);
            var total = strikes.reduce((sum, strike) => sum + strike.count, 0);

            if (total > 0) {
                strikesCtx.fillStyle = COLORS[loc.geo.country];
                renderLocation(strikesCtx, loc, Math.sqrt(total) * 5);
            }

            totals[loc.geo.country] += total;
        });

        periodEl.innerHTML = `from ${start.display} to ${end.display}`;
        syriaPeriodEl.textContent = totals.syria;
        iraqPeriodEl.textContent = totals.iraq;
        el.classList.toggle('is-in-past', end.cmp < LIVE.cmp);
    }

    slider(timelineEl, timelineWindowEl, 0, airstrikes.meta.days, TIMELINE_WINDOW, (min, max) => {
        var start = ts2date(START, min);
        var end = ts2date(START, max);

        renderMap(start, end);
    });

    renderMap(ts2date(END, -TIMELINE_WINDOW * 2), ts2date(END, 0));

    var dataURL = sheetURL('1pOi6PRFbTW4rA5WwlCJcB0QniUW6AX-PAwZlojYeAHE');
    fetchJSON(dataURL).then(resp => {
        analysisEl.innerHTML = doT.template(analysisHTML)(resp);
    });
};

window.init = function init(el, config) {
    fetchJSON(sheetURL('1yjhDkO2KbBD57eM0SPio_IKCs24rbPWi7nP_Nfw1dak', 'docsprocessed')).then(resp => {
        app(el, config, resp);
    });
}
