#!/usr/bin/env node
'use strict'

var argv = require('minimist')(process.argv.slice(2))

var tile = require('./libs/TileImg')
tile.make({ image: argv._[0]
          , minZoom: argv.minZoom
          , maxZoom: argv.maxZoom
          , zoom: argv.zoom
          , tileSize: argv.tileSize
          })