'use strict';

// Load modules

var Code   = require('code'),
    Lab    = require('lab'),
    _      = require('lodash'),
    helper = require('./test-helper');

// Declare internals

//var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var expect = Code.expect;

describe('Accounts Controller', function () {
  var server;

  before(function (done) {
    server = helper.testApiServer(done);
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
      server.methods.createAccount(function (err, data) {
        expect(err).to.not.exist();
        expect(data).to.exist();
        expect(data.account).to.exist();

        token = data.token;
        expect(token).to.exist();

        accountId = data.account.id;

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

    it('should return error when attempting to use refresh token', function (done) {

      var request = { method: 'GET', url: '/accounts/' + accountId, headers : helper.authHeader(token, 'refresh') };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(403);
        expect(res.result.accounts).to.not.exist();

        return done();
      });
    });

  });

  describe('GET /accounts', function () {
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

    //it('should return account matching email address', function (done) {
      //var request = { method: 'GET', url: '/accounts/' + accountId};

      //server.inject(request, function (res) {
        //expect(res.statusCode).to.equal(200);

        //return done();
      //});
    //});
  });

});
