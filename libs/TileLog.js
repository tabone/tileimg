'use strict'

var chalk = require('chalk')

/**
 * TileLog Object
 * @type {Object}
 */
var TileLog = {}

/**
 * Method used to log a section title
 * @param  {String}   msg       The message to be displayed.
 * @return {TileLog}  The instance
 */
TileLog.title = function title(msg) {
  console.log(chalk.white.bgBlue.bold(' ')
    + chalk.blue.bold(' ' + msg))
  return this
}

/**
 * Method used to log normal processing.
 * @param  {String}   title     Name of process.
 * @param  {String}   msg       Dynamic value.
 * @return {TileLog}  The instance
 */
TileLog.log = function log(title, msg) {
  msg = (msg !== undefined) ? msg : '' 
  console.log(chalk.white.bgYellow.bold(' ')
    + chalk.yellow.bold(' ' + title) + ' ' + msg)
  return this
}

/**
 * Method used to log successful processing.
 * @param  {String} msg The message to be displayed
 * @return {TileLog}  The instance
 */
TileLog.success = function success(msg) {
  console.log(chalk.white.bgGreen.bold(' ')
    + chalk.green.bold(' ' + msg))
  return this
}

/**
 * Method used to display errors.
 * @param  {String} msg The message to be displayed
 * @return {TileLog}  The instance
 */
TileLog.error = function error(msg) {
  console.error(chalk.white.bgRed.bold(' ')
    + chalk.red.bold(' ' + msg))
  return this
}

module.exports = TileLog
