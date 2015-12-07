#!/bin/bash
ROOTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/../..
DATAIN="$ROOTDIR/data-in"
DATAOUT="$ROOTDIR/data-out"

rm -f $DATAOUT/historical-geo.json $DATAOUT/dashboard-geo.json

ogr2ogr \
  -overwrite \
  -f GeoJSON \
  -where "ADM0_A3 IN ('SYR')" \
  $DATAOUT/historical-geo.json \
  $DATAIN/countries/ne_10m_admin_0_countries.shp


ogr2ogr \
  -overwrite \
  -f GeoJSON \
  -where "ADM0_A3 IN ('IRQ', 'SYR')" \
  $DATAOUT/dashboard-geo.json \
  $DATAIN/countries/ne_10m_admin_0_countries.shp
