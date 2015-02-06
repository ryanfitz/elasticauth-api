'use strict';

// Load modules

var Code             = require('code'),
    Lab              = require('lab'),
    _                = require('lodash'),
    vogels           = require('vogels'),
    helper           = require('./test-helper'),
    Account          = require('../lib/models/account'),
    credentialManger = require('../lib/dataManagers/credentialManager'),
    accountManager   = require('../lib/dataManagers/accountManager');

// Declare internals

//var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var expect = Code.expect;

describe('Account Manager', { timeout: 10000 }, function () {
  var manager;

  before({timeout : 10000}, function (done) {
    var driver = helper.localDynamoDB();
    vogels.dynamoDriver(driver);

    var logger = helper.testLogger();
    var credsManger = credentialManger(logger);

    manager = accountManager(credsManger, logger);

    vogels.createTables(function (err) {
      expect(err).to.not.exist();

      return done();
    });
  });

  describe('#create', function () {

    it('should create new account', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      manager.create(data, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc).to.exist();

        return done();
      });

    });

    it('should return error when email is taken', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      manager.create(data, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc).to.exist();

        manager.create({email : data.email, username : helper.randomUsername()}, function (error, acc2) {
          expect(error).to.exist();
          expect(error.message).to.equal('email already exists');
          expect(acc2).to.not.exist();

          return done();
        });
      });
    });

    it('should return error when username is taken', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      manager.create(data, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc).to.exist();

        manager.create({email : helper.randomEmail(), username : data.username}, function (error, acc2) {
          expect(error).to.exist();
          expect(error.message).to.equal('username already exists');
          expect(acc2).to.not.exist();

          return done();
        });
      });
    });

    it('should return validation error when email is not given', function (done) {
      var data = {
        username : helper.randomUsername()
      };

      manager.create(data, function (err, acc) {
        expect(err).to.exist();
        expect(err.message).to.equal('email is required');
        expect(acc).to.not.exist();

        return done();
      });
    });

    it('should return validation error when username is not given', function (done) {
      var data = {
        email : helper.randomEmail()
      };

      manager.create(data, function (err, acc) {
        expect(err).to.exist();
        expect(err.message).to.equal('username is required');
        expect(acc).to.not.exist();

        return done();
      });
    });

  });

  describe('#remove', function () {

    it('should remove existing account', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      manager.create(data, function (err, acc) {
        expect(err).to.not.exist();

        manager.remove(acc.id, function(remErr) {
          expect(remErr).to.not.exist();

          Account.get(acc.id, function (getErr, getAcc) {
            expect(getErr).to.not.exist();
            expect(getAcc).to.not.exist();
            return done();
          });
        });
      });

    });

    it('should not return error when account with id doesnt exist', function (done) {
      manager.remove('fakeAccid', function(err) {
        expect(err).to.not.exist();

        return done();
      });

    });
  });

  describe('#find', function () {
    var accountId;

    before(function (done) {
      var d = {email : helper.randomEmail(), username : helper.randomUsername()};
      manager.create(d, function (err, acc) {
        expect(err).to.not.exist();
        accountId = acc.id;

        return done();
      });
    });


    it('should return single account with id', function (done) {

      manager.find({id : accountId}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.username).to.be.a.string();
        expect(acc.email).to.not.exist();

        return done();
      });

    });

    it('should return account with all attributes', function (done) {

      manager.find({id : accountId}, {allFields : true}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.username).to.be.a.string();
        expect(acc.email).to.be.a.string();
        expect(acc.createdAt).to.be.a.string();

        return done();
      });

    });

    it('should return empty set', function (done) {

      manager.find({id : '9999999999999'}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(0);

        return done();
      });

    });


  });

});
