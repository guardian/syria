export default function sheetURL(sheetID, test=false) {
    var protocol = window.location.protocol === 'file:' ? 'https://' : '//';
    return `${protocol}interactive.guim.co.uk/docsdata${test ? '-test': ''}/${sheetID}.json`;
}
