'use strict';

// Load modules

var Code = require('code'),
    Hapi = require('hapi'),
    Lab = require('lab'),
    helper = require('./test-helper');

// Declare internals

//var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;

var plugin = require('../');

describe('elasticauth-api', function () {

  it('should not return error', function (done) {

    var server = new Hapi.Server();
    server.connection({ host: 'localhost', port: 8080 });

    server.register( {
      register : plugin,
      options : { key : '123456'}
    }, function (err) {
      expect(err).to.not.exist();

      return done();
    });
  });

  it('should create child logger', function (done) {

    var server = new Hapi.Server();
    server.connection({ host: 'localhost', port: 8080 });

    var options = {
      log : helper.testLogger(),
      key : '123456'
    };

    server.register( {
      register : plugin,
      options : options
    }, function (err) {

      expect(err).to.not.exist();

      return done();
    });
  });


});
