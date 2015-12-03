import reqwest from 'reqwest'
import mainHTML from '../templates/main.html!text'
import share from './lib/share'
import doT from 'olado/doT'

var shareFn = share('Interactive title', 'http://gu.com/p/URL', null, null, '#Interactive');

export function init(el, context, config, mediator) {

    var imgs = [
        {src: 'data-out/frames/2014-01-01.png', date: 'January 2014'},
        {src: 'data-out/frames/2014-06-01.png', date: 'January to June 2014'},
        {src: 'data-out/frames/2015-01-01.png', date: 'June 2014 to January 2015'},
        {src: 'data-out/frames/2015-02-01.png', date: 'January to February 2015'},
        {src: 'data-out/frames/2015-06-01.png', date: 'February to June 2015'},
        {src: 'data-out/frames/2015-07-01.png', date: 'June to July 2015'},
        {src: 'data-out/frames/2015-08-01.png', date: 'July to August 2015'},
        {src: 'data-out/frames/2015-12-01.png', date: 'August to December 2015'},
    ]
    el.innerHTML = doT.template(mainHTML)({assetPath: config.assetPath, imgs: imgs});


    [].slice.apply(el.querySelectorAll('.interactive-share')).forEach(shareEl => {
        var network = shareEl.getAttribute('data-network');
        shareEl.addEventListener('click',() => shareFn(network));
    });
}
