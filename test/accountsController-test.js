'use strict';

// Load modules

var Code   = require('code'),
    Hapi   = require('hapi'),
    Lab    = require('lab'),
    vogels = require('vogels'),
    helper = require('./test-helper');

// Declare internals

//var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var expect = Code.expect;

var plugin = require('../');

describe('Accounts Controller', function () {
  var server = new Hapi.Server();
  server.connection();

  before(function (done) {
    var driver = helper.localDynamoDB();
    vogels.dynamoDriver(driver);

    var options = {
      log : helper.testLogger(),
      key : 'BbZijuoXAdr85UzyijKARZimKfrSmQ6fv8kZ7OFfc'
    };

    server.register( {
      register : plugin,
      options : options
    }, function (err) {
      expect(err).to.not.exist();

      return done();
    });
  });

  it('should return 201 created', function (done) {
    var data = {
      email : helper.randomEmail(),
      username : helper.randomUsername()
    };

    var request = { method: 'POST', url: '/accounts', payload : data};

    server.inject(request, function (res) {
      //console.log('asdf', res.result);
      expect(res.statusCode).to.equal(201);
      return done();
    });
  });

});
