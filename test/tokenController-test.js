'use strict';

// Load modules

var Code   = require('code'),
    Lab    = require('lab'),
    //_      = require('lodash'),
    helper = require('./test-helper');

// Declare internals

//var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var expect = Code.expect;

describe('Token Controller', function () {
  var server;

  before(function (done) {
    server = helper.testApiServer(done);
  });

  describe('GET /tokens', function () {

    it('should return 200 OK for valid access token', function (done) {

      server.methods.createAccount(function (err, data) {
        var request = { method: 'GET', url: '/tokens', headers : helper.authHeader(data.token) };

        server.inject(request, function (res) {
          expect(res.statusCode).to.equal(200);

          return done();
        });

      });
    });

    it('should return 200 OK for valid refresh token', function (done) {

      server.methods.createAccount(function (err, data) {
        var request = { method: 'GET', url: '/tokens', headers : helper.authHeader(data.token, 'refresh') };

        server.inject(request, function (res) {
          expect(res.statusCode).to.equal(200);

          return done();
        });
      });

    });

    it('should return 400 Error for invalid access token', function (done) {
      var auth = { authorization : 'Bearer 123456.1283818283213'};
      var request = { method: 'GET', url: '/tokens', headers : auth };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(400);

        return done();
      });
    });

  });


  describe('POST /tokens', function () {

    it('should return new auth tokens', function (done) {

      server.methods.createAccount(function (err, data) {
        var request = { method: 'POST', url: '/tokens', headers : helper.authHeader(data.token) };

        server.inject(request, function (res) {
          expect(res.statusCode).to.equal(201);
          expect(res.result.tokens).to.have.length(1);
          expect(res.result.linked).to.not.exist();

          return done();
        });

      });
    });

    it('should return new auth tokens when using refresh token', function (done) {

      server.methods.createAccount(function (err, data) {
        var request = { method: 'POST', url: '/tokens', headers : helper.authHeader(data.token, 'refresh') };

        server.inject(request, function (res) {
          expect(res.statusCode).to.equal(201);
          expect(res.result.tokens).to.have.length(1);

          return done();
        });

      });
    });

    it('should return new auth tokens with linked account', function (done) {

      server.methods.createAccount(function (err, data) {
        var request = { method: 'POST', url: '/tokens?include=account', headers : helper.authHeader(data.token) };

        server.inject(request, function (res) {
          expect(res.statusCode).to.equal(201);
          expect(res.result.tokens).to.have.length(1);
          expect(res.result.linked).to.exist();
          expect(res.result.linked.accounts).to.have.length(1);

          return done();
        });

      });
    });

    it('should return 201 created when sending login email', function (done) {

      server.methods.createAccount(function (err, data) {
        var payload = {
          email : data.account.email
        };

        var request = { method: 'POST', url: '/tokens', payload : payload };

        server.inject(request, function (res) {
          expect(res.statusCode).to.equal(201);
          expect(res.result).to.equal('OK');

          return done();
        });

      });
    });

    it('should return 201 created when sending login email by username', function (done) {

      server.methods.createAccount(function (err, data) {
        var payload = {
          email : data.account.username
        };

        var request = { method: 'POST', url: '/tokens', payload : payload };

        server.inject(request, function (res) {
          expect(res.statusCode).to.equal(201);
          expect(res.result).to.equal('OK');

          return done();
        });
      });
    });

    it('should return 404 not found when attempting to send login email', function (done) {

      var payload = {
        email : 'dontexist@test.com'
      };

      var request = { method: 'post', url: '/tokens', payload : payload };

      server.inject(request, function (res) {
        expect(res.statusCode).to.equal(404);
        expect(res.result.message).to.equal('Account not found');

        return done();
      });
    });

  });
});
