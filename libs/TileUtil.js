'use strict'
var fs = require('fs')
  , ejs = require('ejs')
  , Q = require('q')
  , sprintf = require('sprintf-js')
  , _exec = require('child_process').exec
  , _rimraf = require('rimraf')
  , _mkdirp = require('mkdirp')

/**
 * TileUtil Object
 * @type {Object}
 */
var TileUtil = {}

/**
 * child_process.exec using promises. This method is used to execute bash
 * commands. In order to make the cmd more readable for developers, it also
 * utilizes sprintf-js.
 * @param  {String}       cmd           The command to be executed. Note that it
 *                                      may also have sprintf-js placeholders.
 * @param  {Array}        val           Array of values to be placed within the
 *                                      'cmd' placeholders through sprintf-js.
 * @param  {Any}          ret           Value to be returned if the promise is
 *                                      resolved. Note that if this is undefined
 *                                      it will send stdout by default.
 * @return {Q.Promise}     A promise.
 */
TileUtil.exec = function exec(cmd, val, ret) {
  return Q.Promise(function execPromise(res, rej) {
    val = (val !== undefined) ? val : []
    cmd = require('sprintf-js').vsprintf(cmd, val)
    _exec(cmd, function(err, stdout, stderr) {
      if(err) rej(err)
      res((ret === undefined) ? stdout : ret)
    })
  })
}

/**
 * rimraf using promises.
 * @param  {String}         path        The path to delete.
 * @param  {Any}            ret         Value to be returned if promise is
 *                                      resolved.
 * @return {Q.Promise}      A promise.
 */
TileUtil.rimraf = function rimraf(path, ret) {
  return Q.Promise(function rimrafPromise(res, rej) {
    _rimraf(path, function (err) {
      if(err) rej(err)
      res(ret)
    })
  })
}

/**
 * mkdirp using promises.
 * @param  {String}         path        The path to create.
 * @param  {Any}            ret         Value to be returned if promise is
 *                                      resolved.
 * @return {Q.Promise}      A promise.
 */
TileUtil.mkdirp = function mkdirp(path, ret) {
  return Q.Promise(function mkdirpPromise(res, rej) {
    _mkdirp(path, function (err) {
      if(err) rej(err)
      res(ret)
    })
  })
}

/**
 * mkdirp.sync using promises.
 * @param  {String}         path        The path to create.
 * @param  {Any}            ret         Value to be returned if promise is
 *                                      resolved.
 * @return {Q.Promise}      A promise.
 */
TileUtil.mkdirpSync = function mkdirpSync(path, ret) {
  return Q.Promise(function mkdirpSyncPromise(res, rej) {
    _mkdirp.sync(path)
    res(ret)
  })
}

/**
 * Method used to copy a file from one place to another.
 * @param  {String}         from        The path of the file to be copied.
 * @param  {String}         to          The path where the file should be copied
 *                                      to.
 * @param   {Object}        context     The context to be applied on copied file
 *                                      using ejs.
 * @param  {Any}            ret         Value to be returned if promise is
 *                                      resolved.
 * @return {Q.Promise}      A promise.
 */
TileUtil.copyFile = function copyFile(from, to, context, ret) {
  return Q.Promise(function copyFilePromise(res, rej) {
    fs.readFile(from, function(err, data) {
      if(err) rej(err)
      data = ejs.render(data.toString('utf-8'), context || {})
      fs.writeFile(to, data, function(err) {
        if(err) rej(err)
        res(ret)
      })
    })
  })
}

module.exports = TileUtil