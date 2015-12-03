#!/bin/bash
ROOTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/../..
DATAIN="$ROOTDIR/data-in"
DATAOUT="$ROOTDIR/data-out"

ogr2ogr \
  -overwrite \
  -f GeoJSON \
  -where "ADM0_A3 IN ('SYR')" \
  $DATAOUT/geo.json \
  $DATAIN/countries/ne_10m_admin_0_countries.shp
