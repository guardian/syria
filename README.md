Setup
-----
`$ npm install`

Create data output directories:
```
$ mkdir -p data-out/historical
$ mkdir -p data-out/dashboard
```

Data processing
---------------
```
$ npm run geo
$ npm run parseterritory
$ npm run parseairstrikes
$ npm run parselocations
$ npm run parsedashboard
$ npm run parsekeyplaces
```



Airstrike / territory rendering
--------------------------------
```
$ npm run renderhistorical
```

Running
--------
`$ npm start`

Open `http://localhost:8000/test-inline.html`
