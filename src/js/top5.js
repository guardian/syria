import doT from 'olado/doT'

import top5HTML from '../templates/top5.html!text'
import locations from '../../data-out/top5-locations.json!json'

window.init = function init(el, config) {
    var ctx = {locations};
    el.innerHTML = doT.template(top5HTML)(ctx);
}

