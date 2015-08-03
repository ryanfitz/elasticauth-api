'use strict';

// Load modules

var Code    = require('code'),
    Lab     = require('lab'),
    // _       = require('lodash'),
    helper  = require('./test-helper'),
    Account = require('../lib/models/account'),
    async   = require('async');

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
          expect(res.result.message).to.equal('OK');

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
          expect(res.result.message).to.equal('OK');

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

    it('should return token for other account when user has admin rights', function (done) {
      var authUser, token, user;

      var funcs = [
        function (callback) {
          return server.methods.createAccount(callback);
        },

        function (data, callback) {
          authUser = data.account;
          token = data.token;

          var attrs = {
            id: authUser.id,
            roles: ['user', 'admin']
          };

          return Account.update(attrs, callback);
        },

        function (acc, callback) {
          var request = { method: 'POST', url: '/tokens', headers : helper.authHeader(token) };
          return server.inject(request, function (res) {
            return callback(null, res);
          });
        },

        function (res, callback) {
          token = res.result.tokens[0];
          return server.methods.createAccount(callback);
        },

        function (data, callback) {
          user = data.account;

          var payload = {
            accountId: user.id
          };

          var request = {
            method: 'post',
            url: '/tokens?include=account',
            payload: payload,
            headers: helper.authHeader(token)
          };

          server.inject(request, function (res) {
            return callback(null, res);
          });
        }
      ];

      return async.waterfall(funcs, function (err, res) {
        expect(res.statusCode).to.equal(201);
        expect(res.result.tokens).to.have.length(1);
        expect(res.result.linked).to.exist();
        expect(res.result.linked.accounts).to.have.length(1);
        expect(res.result.linked.accounts[0].id).to.equal(user.id);

        return done();
      });
    });

    it('should return token for authenticated user when user does not have admin rights', function (done) {
      var authUser, token;

      var funcs = [
        function (callback) {
          return server.methods.createAccount(callback);
        },

        function (data, callback) {
          authUser = data.account;
          token = data.token;

          return server.methods.createAccount(callback);
        },

        function (data, callback) {
          var payload = {
            accountId: data.account.id
          };

          var request = {
            method: 'post',
            url: '/tokens?include=account',
            payload: payload,
            headers: helper.authHeader(token)
          };

          server.inject(request, function (res) {
            return callback(null, res);
          });
        }
      ];

      return async.waterfall(funcs, function (err, res) {
        expect(res.statusCode).to.equal(201);
        expect(res.result.tokens).to.have.length(1);
        expect(res.result.linked).to.exist();
        expect(res.result.linked.accounts).to.have.length(1);
        expect(res.result.linked.accounts[0].id).to.equal(authUser.id);

        return done();
      });
    });
  });
});
