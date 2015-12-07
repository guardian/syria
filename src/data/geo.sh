#!/bin/bash
ROOTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/../..
DATAIN="$ROOTDIR/data-in"
DATAOUT="$ROOTDIR/data-out"

rm -f $DATAOUT/syria-geo.json $DATAOUT/iraq-geo.json

ogr2ogr \
  -overwrite \
  -f GeoJSON \
  -where "ADM0_A3 IN ('SYR')" \
  $DATAOUT/syria-geo.json \
  $DATAIN/countries/ne_10m_admin_0_countries.shp


ogr2ogr \
  -overwrite \
  -f GeoJSON \
  -where "ADM0_A3 IN ('IRQ')" \
  $DATAOUT/iraq-geo.json \
  $DATAIN/countries/ne_10m_admin_0_countries.shp
