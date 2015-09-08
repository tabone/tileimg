'use strict'

/**
 * TileImage object.
 * @type {Object}
 */
var TileImage = {}

/**
 * Method used intialize and document the TileImage Instance properties.
 * @return {TileImage} The instance.
 */
TileImage.variables = function variables() {
  /**
   * Image name.
   * @type {String}
   */
  this.name = ''

  /**
   * Image width.
   * @type {Number}
   */
  this.width = -1

  /**
   * Image height.
   * @type {Number}
   */
  this.height = -1

  /**
   * Image path.
   * @type {String}
   */
  this._path = ''

  return this
}

/**
 * Initialization method.
 * @param  {Object} opts    Values for instance properties.
 * @return {TileImage}      The instance.
 */
TileImage.init = function init(opts) {
  this.variables()
  this.name = (opts.name === undefined) ? this.name : opts.name
  this.width = (opts.width === undefined) ? this.width : opts.width
  this.height = (opts.height === undefined) ? this.height : opts.height
  this.path(opts.path || this._path)
  return this
}

/**
 * Method used to extract the image extension from its name.
 * @return {String} The image extension.
 */
TileImage.ext = function ext() {
  var arr = this.name.split('.')
  return '.' + arr[arr.length - 1]
}

/**
 * Method used for retrieving the image path (when no arguments are supplied)
 * and to assign it (when a path is provided as an argument).
 * @param  {String}       path          The image new path.
 * @return {TileImage}    The instance.
 */
TileImage.path = function path(path) {
  if(!arguments.length) return require('path').join(this._path, this.name)
  this._path = path
  return this
}

module.exports = TileImage