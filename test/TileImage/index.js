'use strict'

var TileImage = require('../../libs/TileImage')
  , assert = require('assert')

describe('TileImage module', function() {
  var tileImage = undefined
    , ext = '.png'
    , opts = { name: 'bg' + ext
             , width: 10
             , height: 10
             , path: 'any/dir'
             }

  beforeEach(function() {
    tileImage = Object.create(TileImage)
  })

  describe('constructor method', function() {
    beforeEach(function() {
      tileImage.init(opts)
    })

    it('should assign opts.name to tileImage.name.', function() {
      assert(opts.name === tileImage.name)
    })

    it('should assign opts.width to tileImage.width.', function() {
      assert(opts.width === tileImage.width)
    })

    it('should assign opts.height to tileImage.height.', function() {
      assert(opts.height === tileImage.height)
    })

    it('should assign opts.path to tileImage.path.', function() {
      assert(opts.path === tileImage._path)
    })

    it('should assign opts.name to tileImage.path.', function() {
      assert(opts.path === tileImage._path)
    })
  })

  describe('instance methods', function() {
    beforeEach(function() {
      tileImage.init(opts)
    })

    describe('ext() method', function() {
      it('should return the image extension.', function() {
        assert(ext === tileImage.ext())
      })
    })

    describe('path() method', function() {
      describe('no args', function() {
        it('should change tileImage.path.', function() {
          var newPath = 'this/is/a/new/path'
          tileImage.path(newPath)
          assert(tileImage._path === newPath)
        })
      })

      describe('with args', function() {
        it('should return full path of the image.', function() {
          assert(tileImage.path() === opts.path + '/' + opts.name)
        })
      })
    })
  })
})