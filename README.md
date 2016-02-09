Setup
-----
```
$ npm install
```

Dashboard
---------
6 month window on airstrikes in Iraq and Syria, based on data released by US Department of Defense

Source: http://www.centcom.mil/ and http://www.defense.gov/News/Special-Reports/0814_Inherent-Resolve

Data used:
- `data-in/dashboard-airstrikes.tsv`: Structured airstrike data based on above links
- `data-in/dashboard-locations.tsv`: Locations to be shown on dashboard map
- `data-in/iraq-locations.tsv`: Locations of airstrikes in Iraq
- `data-in/syria-locations.tsv`: Locations of airstrikes in Syria

Steps:
```
$ mkdir -p data-out/dashboard
$ npm run geo
$ npm run parsedashboard
```

Campaign analysis
--------------------
Analysis from June 2014 to December 2015, based on data released by US Department of Defense and [The Carter Centre](http://www.cartercenter.org/SyriaMappingProject) using Palantir Technologies

Data used:
- `data-in/historical-locations.json`: Locations to be shown on rendered territory/airstrike maps
- The Carter Centre data

Steps:
```
$ mkdir -p data-out/historical
$ npm run geo
$ npm run parseterritory
$ npm run parseairstrikes
$ npm run parselocations
$ npm run parsekeyplaces
$ npm run renderhistorical
```

Running
--------
`$ npm start`

Open `http://localhost:8000/test-inline.html`
