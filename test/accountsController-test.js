'use strict';

// Load modules

var Code   = require('code'),
    Hapi   = require('hapi'),
    Lab    = require('lab'),
    _      = require('lodash'),
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

  describe('POST /accounts', function () {

    it('should return 201 created', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      var request = { method: 'POST', url: '/accounts', payload : data};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(201);

        return done();
      });
    });

    it('should return created account', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      var request = { method: 'POST', url: '/accounts', payload : data};

      server.inject(request, function (res) {
        expect(res.result.accounts).to.have.length(1);

        return done();
      });
    });

    it('should return linked token', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      var request = { method: 'POST', url: '/accounts', payload : data};

      server.inject(request, function (res) {
        expect(res.result.accounts).to.have.length(1);
        expect(res.result.linked.tokens).to.have.length(1);

        return done();
      });
    });
  });

  describe('GET /accounts/{id}', function () {
    var accountId,
        token;

    before(function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      var request = { method: 'POST', url: '/accounts', payload : data};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(201);
        var account = _.first(res.result.accounts);

        token = _.first(res.result.linked.tokens);

        expect(account).to.exist();
        expect(token).to.exist();
        accountId = account.id;

        return done();
      });
    });

    it('should return account without email', function (done) {
      var request = { method: 'GET', url: '/accounts/' + accountId};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        var account = _.first(res.result.accounts);
        expect(account.id).to.be.a.string();
        expect(account.href).to.be.a.string();
        expect(account.username).to.be.a.string();
        expect(account.email).to.not.exist();

        return done();
      });
    });

    it('should return account with email', function (done) {

      var request = { method: 'GET', url: '/accounts/' + accountId, headers : helper.authHeader(token) };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.result.accounts).to.have.length(1);

        var account = _.first(res.result.accounts);
        expect(account.id).to.be.a.string();
        expect(account.href).to.be.a.string();
        expect(account.username).to.be.a.string();
        expect(account.email).to.be.a.string();

        return done();
      });
    });

    it('should return 404 not found', function (done) {
      var request = { method: 'GET', url: '/accounts/9999999999'};

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(404);
        return done();
      });

    });


  });


});
