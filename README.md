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
https://docs.google.com/spreadsheets/d/1yjhDkO2KbBD57eM0SPio_IKCs24rbPWi7nP_Nfw1dak/pubhtml

Uses an AWS lambda which automatically triggers when the docs tool uploads a new version of the spreadsheet
to S3.

To build and test:
1. `npm run geo && grunt lambda_package`
1. Upload `build/lambda_0-0-1_latest.zip` to the AWS lambda
1. Use `test.json` to test

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
