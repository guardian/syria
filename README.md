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
$ npm run parseterritory
$ npm run parseairstrikes
$ npm run geo
```



Airstrike / territory historical rendering
--------------------------------
`$ npm run renderhistorical`

Running
--------
`$ npm start`

Open `http://localhost:8000/test-inline.html`
