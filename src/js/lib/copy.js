import {groupBy} from './array';

export function processCopySheet(copy) {
    var dict = groupBy(copy, r => r.key);
    // console.log(dict)
    Object.keys(dict).forEach(key => {
        dict[key] = dict[key][0].copy || `EMPTY COPY &lt;${key}&gt;`;
    })
    console.log(dict);
    return dict;
}
