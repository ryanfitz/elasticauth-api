'use strict';

// Load modules

var Code   = require('code'),
    Lab    = require('lab'),
    helper = require('./test-helper'),
    tokenModel  = require('../lib/models/token');

// Declare internals

//var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var expect = Code.expect;

describe('tokens', function () {
  var token;

  before(function (done) {
    var privateKey = '8138sdfhj1h12hjjsd1';
    token = tokenModel(privateKey);
    return done();
  });

  describe('#create', function () {

    it('should return token', function (done) {

      var acc = {
        id : '123456',
        email : helper.randomEmail(),
        username : helper.randomUsername(),
        name : 'testuser',
        roles : ['user']
      };

      token.create(acc, function (err, result) {
        expect(err).to.not.exist();
        expect(result).to.be.an.object();

        expect(result.accountID).to.equal('123456');
        expect(result.accessToken).to.be.an.string();
        expect(result.refreshToken).to.be.an.string();
        expect(result.type).to.equal('Bearer');
        expect(result.expires).to.be.a.number();
        return done();
      });
    });

  });

  describe('#verify', function () {

    it('should return decoded access token with accesstoken scopes', function (done) {

      var acc = {
        id : '123456',
        email : helper.randomEmail(),
        username : helper.randomUsername(),
        name : 'testuser'
      };

      token.create(acc, function (err, result) {
        expect(err).to.not.exist();

        token.verify(result.accessToken, function (err, decoded) {
          expect(err).to.not.exist();
          expect(decoded).to.exist();

          expect(decoded.user).to.equal('123456');
          expect(decoded.name).to.equal('testuser');
          expect(decoded.scope).to.deep.equal(['accesstoken']);
          return done();
        });

      });
    });

    it('should return decoded access token with multiple scopes', function (done) {

      var acc = {
        id : '123456',
        email : helper.randomEmail(),
        username : helper.randomUsername(),
        name : 'testuser',
        roles : ['user']
      };

      token.create(acc, function (err, result) {
        expect(err).to.not.exist();

        token.verify(result.accessToken, function (err, decoded) {
          expect(err).to.not.exist();
          expect(decoded).to.exist();

          expect(decoded.user).to.equal('123456');
          expect(decoded.name).to.equal('testuser');
          expect(decoded.scope).to.deep.equal(['user', 'accesstoken']);
          return done();
        });

      });
    });

    it('should return decoded refresh token', function (done) {

      var acc = {
        id : '123456',
        email : helper.randomEmail(),
        username : helper.randomUsername(),
        name : 'testuser',
        roles : ['user']
      };

      token.create(acc, function (err, result) {
        expect(err).to.not.exist();

        token.verify(result.refreshToken, function (err, decoded) {
          expect(err).to.not.exist();
          expect(decoded).to.exist();

          expect(decoded.user).to.equal('123456');
          expect(decoded.scope).to.deep.equal(['refreshtoken']);
          return done();
        });

      });
    });
  });
});
