'use strict'

var fs = require('fs')
  , path = require('path')
  , Q = require('Q')
  , TileImage = require('./TileImage')
  , TileUtil = require('./TileUtil')
  , TileLog = require('./TileLog')
  , cwd = process.cwd()

/**
 * Tile object
 * @type {Object}
 */
var TileImg = {}

/**
 * The method which takes care of running all the processes.
 * @param  {Object}       opts          The parsed process.argv.
 * @return {TileImg}      The instance.
 */
TileImg.make = function make(opts) {
  this.variables()

  var self = this
  this.init(opts)
    .then(this.verifyCommands.bind(this))
    .then(this.createWorkSpace.bind(this))
    .then(this.getImageDimension.bind(this))
    .then(this.setImageDimension.bind(this))
    .then(this.loopZAxis.bind(this))
    .then(this.cleanWorkSpace.bind(this))
    .then(this.placeHTMLFile.bind(this))
    .fail(function(err) {
      TileLog.error(err.message)
      process.exit(1)
    })
    .fin(function() {
      TileLog.success('Conversion Finished!')
      TileLog.success('Tiles Created in ' + self._tilesDir)
      process.exit(0)
    })
    .done()
  return this
}

/**
 * Method used to initialize and document TileImg instance properties.
 * @return {TileImg} The instance.
 */
TileImg.variables = function() {
  /**
   * Path of the directory used by TileImg for temporary resources.
   * @type {String}
   */
  this._tmpDir = path.join(cwd, '.tmp')

  /**
   * Path of the directory used by TileImg to place the map tiles.
   * @type {String}
   */
  this._tilesDir = path.join(cwd, 'tiles')

  /**
   * List of instance keys which contain workspace directory paths.
   * @type {Array}
   */
  this._workspaceKeys = ['_tilesDir', '_tmpDir']

  /**
   * Path of the directory used by TileImg to get necessary resources.
   * @type {String}
   */
  this._resources = path.join(__dirname, '../resources')

  /**
   * List of bash commands used by TileImg to convert the image.
   * @type {Array}
   */
  this._cmds = ['convert', 'identify']

  /**
   * Object used by TileImg to store any TileImage instances which it utilizes.
   * @type {Object}
   */
  this.images = {}

  /**
   * TileImage object which represents to the user's original image.
   * @type {Object}
   */
  this.images.main = Object.create(TileImage)

  /**
   * The size of each tile.
   * @type {Number}
   */
  this.tileSize = 256

  /**
   * The minimum zoom level.
   * @type {Number}
   */
  this.minZoom = 0

  /**
   * The maximum zoom level.
   * @type {Number}
   */
  this.maxZoom = 3

  return this
}

/**
 * Method used to initialize TileImg instance.
 * @param  {Object} opts The parsed process.argv.
 * @return {Q.Promise}      A promise.
 */
TileImg.init = function init(opts) {
  TileLog.title('Initialization')
  var self = this
  return Q.Promise(function _initPromise(res, rej) {
    /*
      If the user doesn't provide an image which TileImg can work on, the
      process will be stopped.
     */
    if(!opts.image)
      rej(new Error('Please provide an image.'))

    /**
     * If user enters a wrong range, the process will be stopped.
     */
    if(opts.minZoom > opts.maxZoom)
      rej(new Error('Min zoom is greater than max zoom.'))

    if(opts.zoom) {
      opts.minZoom = opts.zoom
      opts.maxZoom = opts.zoom
    }

    //Initialize instance variables.
    self.variables()
    self.minZoom = (opts.minZoom === undefined) ? 0 : opts.minZoom
    self.maxZoom = (opts.maxZoom === undefined) ? 2 : opts.maxZoom
    self.tileSize = (opts.tileSize === undefined) ? 256 : opts.tileSize

    //Initialize TileImage object which represents to the image to be tiled.
    self.images.main.init({ name: opts.image
                          , path: cwd
                          })

    TileLog.log('Image Name:  ', opts.image)
    TileLog.log('Min Zoom:    ', self.minZoom)
    TileLog.log('Max Zoom:    ', self.maxZoom)
    TileLog.log('Tile Size:   ', self.tileSize + 'px')

    res()
  })
}

/**
 * Method used to verify the existance of any command TileImg will be using
 * during the conversion.
 * @return {Q.Promise} A promise.
 */
TileImg.verifyCommands = function verifyCommands() {
  TileLog.title('Verifying Commands')
  var self = this
  return Q.Promise(function verifyCommandsPromise(res, rej) {
    var promises = []

    self._cmds.forEach(function(cmd) {
      TileLog.log('Verifying:   ', cmd)
      promises.push(TileUtil.exec('%s -version', [cmd]))
    })

    Q.all(promises)
      .then(res)
      .fail(rej)
      .done()
  })
}

/**
 * Method used to go through each workspace directory and create them using 
 * _checkDirectory() method.
 * @return {Q.Promise} A promise.
 */
TileImg.createWorkSpace = function createWorkSpace() {
  TileLog.title('Creating Workspace')
  var self = this
  return Q.Promise(function createWorkSpacePromise(res, rej) {
    var promises = []

    self._workspaceKeys.forEach(function(key) {
      var promise = Q.Promise(function(ires, irej) {
        self._checkDirectory(ires, irej, key, self[key])
      })
      promises.push(promise)
    })

    Q.all(promises)
      .fail(rej)
      .fin(res)
      .done()
  })
}

TileImg._checkDirectory = function _checkDirectory(res, rej, key, tmp, c) {
  var self = this
  fs.stat(tmp, function(err) {
    if(err) {
      if(err.code === 'ENOENT') {
        self[key] = tmp
        TileLog.log('Creating:    ', self[key])
        TileUtil.mkdirp(self[key])
          .then(res)
      } else {
        rej(err)
      }
    } else {
      c = (c) ? c : 0
      c++
      self._checkDirectory(res, rej, key, self[key] + c, c)
    }
  })
}

/**
 * Method used to get the dimensions of the image to be converted.
 * @return {Q.Promise} A promise.
 */
TileImg.getImageDimension = function getImageDimension() {
  TileLog.title('Getting Image Dimension')
  TileLog.log('Retreiving image dimension')
  return TileUtil.exec('identify -format \'%%w,%%h\' %s'
    , [this.images.main.path()])
}

/**
 * Method used to configure the TileImg width and height based on the returned
 * value of getImageDimension(..)
 * @param {String}      stdout      The dimensions of the image to be converted.
 * @return {Q.Promise}  A promise.
 */
TileImg.setImageDimension = function setImageDimension(stdout) {
  var self = this
  return Q.Promise(function setImageDimensionPromise(res, rej) {
    var dimArr = stdout.split(',')
    TileLog.log('Image Size:  ', dimArr[0] + 'px x ' + dimArr[1] + 'px')
    self.images.main.width = dimArr[0]
    self.images.main.height = dimArr[1]
    res()
  })
}

/**
 * Method used to execute promises for each zoom level.
 * @return {Q.Promise} A promise.
 */
TileImg.loopZAxis = function loopZAxis() {
  TileLog.title('Creating Tiles')
  var self = this
  return Q.Promise(function loopZAxisPromise(res, rej) {
    var promises = []

    for(var z = (self.minZoom + 1); z <= (self.maxZoom + 1); z++) {
      promises.push(self.doAtZ(z))
    }

    Q.all(promises)
      .then(res)
      .fail(rej)
      .done()
  })
}

/**
 * Method used to execute promises which are to be executed at each zoom level
 * to create the image at zoom level 'z'.
 * @param  {Number}      z          Zoom Level.
 * @return {Q.Promise}   A promise.
 */
TileImg.doAtZ = function doAtZ(z) {
  var self = this
  return Q.Promise(function doAtZPromise(res, rej) {
    self._createImageAtZoom(z)
      .then(self._resizeImage.bind(self))
      .then(self._extentZoomImage.bind(self))
      .then(self.loopXAxis.bind(self))
      .fail(rej)
      .fin(res)
      .done()
  })
}

/**
 * Method used to instantiate and configure the TileImage instance of the image
 * at zoom level 'z'.
 * @param  {Number} z The zoom level.
 * @return {[type]}   [description]
 */
TileImg._createImageAtZoom = function _createImageAtZoom(z) {
  TileLog.log('Creating Image @ Zoom:  ', z)
  var self = this
  return Q.Promise(function _createImageAtZoomPromise(res, rej) {
    /**
     * This is the size that the biggest side of the users image should be at
     * a zoom level 'z'.
     * @type {Number}
     */
    var size = self.tileSize * Math.pow(2, z - 1)

    /**
     * The dimension of the maximum side of the user's image.
     * @type {Number}
     */
    var maxSideSize = (self.images.main.width > self.images.main.height)
      ? self.images.main.width : self.images.main.height

    /**
     * The scale with which the user's image will be resized.
     * @type {Number}
     */
    var scale = (size / maxSideSize) * 100

    /*
      Creating and configuring the TileImage instance for the image at zoom
      level 'z'
     */
    var zoomImage = Object.create(TileImage)
    zoomImage.init(
      { name: z + self.images.main.ext()
      , path: self._tmpDir
      , width: self.images.main.width * (size / maxSideSize)
      , height: self.images.main.height * (size / maxSideSize)
      })

    /**
     * The number of tiles the image will be having horizontally.
     * @type {Number}
     */
    var xTiles = Math.ceil(zoomImage.width / self.tileSize)

    /**
     * The number of tiles the image will be having vertically.
     * @type {Number}
     */
    var yTiles = Math.ceil(zoomImage.height / self.tileSize)

    /**
     * The width of the image to scale up to the number of tiles
     * on the x-axis.
     */
    zoomImage.width = (self.tileSize * xTiles)

    /**
     * The height of the image to scale up to the number of tiles
     * on the y-axis.
     */
    zoomImage.height = (self.tileSize * yTiles)

    res({ zoomImage: zoomImage
        , scale: scale
        , z: z
        , tiles: { x: xTiles
                 , y: yTiles
                 }
        })
  })
}

/**
 * Method used to resize the image at zoom level 'z' based on the scale
 * calculated within _createImageAtZoom(..)
 * @param  {Object} obj Object returned from _createImageAtZoom(..) promise.
 * @return {Q.Promise}     A promise.
 */
TileImg._resizeImage = function _resizeImage(obj) {
  TileLog.log('Resizing Image @ Zoom:  ', obj.z)
  return TileUtil.exec('convert %s -resize %s%% %s'
    , [this.images.main.path(), obj.scale, obj.zoomImage.path()], obj)
}

/**
 * Method used to extend the image at zoom level 'z' based on the width and
 * height calculated within _createImageAtZoom(..)
 * @param  {Number}     z           The zoom level.
 * @return {Q.Promise}  A promise
 */
TileImg._extentZoomImage = function _extentZoomImage(obj) {
  TileLog.log('Extending Image @ Zoom: ', obj.z)
  return TileUtil.exec('convert %s -background \'none\' -gravity NorthWest '
    + '-extent %sx%s %s', [obj.zoomImage.path(), obj.zoomImage.width
      , obj.zoomImage.height, obj.zoomImage.path()]
    , obj)
}

/**
 * Method used to execute promises for each row of tiles.
 * @return {Q.Promise} A promise.
 */
TileImg.loopXAxis = function loopXAxis(obj) {
  var self = this
  return Q.Promise(function loopXAxisPromise(res, rej) {
    var promises = []

    for(var x = 1; x <= obj.tiles.x; x++) {
      obj = Object.create(obj)
      obj.x = x
      promises.push(self.doAtX(obj))
    }

    Q.all(promises)
      .then(res)
      .fail(rej)
      .done()
  })
}

/**
 * Method used to execute promises which are to be executed at each row of tiles
 * to create the image at zoom level 'z'.
 * @param  {Number}      z          Zoom Level.
 * @return {Q.Promise}   A promise.
 */
TileImg.doAtX = function doAtX(obj) {
  var self = this
  return Q.Promise(function doAtXPromise(res, rej) {
    obj.coord = {}
    /**
     * This is the top left x coordinate from which to start croping the zoom
     * level image.
     * @type {Number}
     */
    obj.coord.x = (self.tileSize * obj.x) - self.tileSize

    obj.dir = path.join( self._tilesDir
                       , (obj.z - 1).toString()
                       , (obj.x - 1).toString()
                       )

    TileLog.log('Creating Dir:  ', obj.dir)
    TileUtil.mkdirpSync(obj.dir, obj)
      .then(self.loopYAxis.bind(self))
      .fail(rej)
      .fin(res)
      .done()
  })
}

TileImg.loopYAxis = function loopYAxis(obj) {
  var self = this
  return Q.Promise(function loopYAxisPromise(res, rej) {
    var promises = []

    for(var y = 1; y <= obj.tiles.y; y++) {
      obj = Object.create(obj)
      obj.coord.y = (self.tileSize * y) - self.tileSize
      obj.y = y
      promises.push(self._cropTileImage(obj))
    }

    Q.all(promises)
      .fail(rej)
      .fin(res)
      .done()
  })
}

TileImg._cropTileImage = function _cropTileImage(obj) {
  var tilePath = path.join(obj.dir, ((obj.y)-1).toString()
      + obj.zoomImage.ext())

  TileLog.log('Creating Tile: ', tilePath)
  return TileUtil.exec('convert %s -crop %sx%s+%s+%s %s',
    [ obj.zoomImage.path()
    , this.tileSize
    , this.tileSize
    , obj.coord.x
    , obj.coord.y
    , tilePath
    ])
}

/**
 * Method used to remove _tmpDir directory.
 * @return {Q.Promise} A promise.
 */
TileImg.cleanWorkSpace = function cleanWorkSpace() {
  TileLog.log('Clean Workspace: ', this._tmpDir)
  return TileUtil.rimraf(this._tmpDir)
}

/**
 * Method used to copy the file located at resources/index.html to the tiles
 * directory for the user to test the tiles created.
 * @return {Q.Promise} A promise
 */
TileImg.placeHTMLFile = function placeHTMLFile() {
  TileLog.log('Creating Test HTML File.')
  return TileUtil.copyFile(path.join(this._resources, 'index.html')
    , path.join(this._tilesDir, 'index.html'), { minZoom: this.minZoom
                                               , maxZoom: this.maxZoom
                                               })
}

module.exports = TileImg
