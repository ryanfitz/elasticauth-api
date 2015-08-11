'use strict';

// Load modules

var Code             = require('code'),
    Lab              = require('lab'),
    _                = require('lodash'),
    uuid             = require('uuid'),
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

    it('should create new account with provided id', function (done) {
      var accountId = uuid.v4();

      var data = {
        id : accountId,
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      manager.create(data, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc).to.exist();
        expect(acc.id).to.equal(accountId);

        return done();
      });
    });

    it('should return error when creating account with an existing id', function (done) {
      var accountId = uuid.v4();

      var data = {
        id : accountId,
        email : helper.randomEmail(),
        username : helper.randomUsername()
      };

      manager.create(data, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc).to.exist();

        var accData = {
          id : accountId,
          email : helper.randomEmail(),
          username : helper.randomUsername()
        };

        manager.create(accData, function (err, acc) {
          expect(err).to.exist();
          expect(err.message).to.equal('Account with id ' + accountId + ' already exists');
          expect(acc).to.not.exist();

          return done();
        });

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

    it('should create new account with metadata', function (done) {
      var data = {
        email : helper.randomEmail(),
        username : helper.randomUsername(),
        metadata : {
          profilePicture : { small : 'https://www.google.com/images/srpr/logo11w.png' }
        }
      };

      manager.create(data, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc).to.exist();
        expect(acc.metadata.profilePicture).to.exist();

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
    var account;

    before(function (done) {
      var metadata = { profilePicture : {
        small : 'http://test.com/small.jpg',
        large : 'http://test.com/large.jpg'
      }};

      var d = {
        email : helper.randomEmail(),
        username : helper.randomUsername(),
        facebookId : helper.randomFacebookId(),
        metadata : metadata
      };

      manager.create(d, function (err, acc) {
        expect(err).to.not.exist();
        account = acc;

        return done();
      });
    });


    it('should return single account with id', function (done) {

      manager.find({id : account.id}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.username).to.be.a.string();
        expect(acc.email).to.not.exist();
        expect(acc.metadata).to.a.object();

        return done();
      });
    });

    it('should return two accounts with ids', function (done) {

      manager.find({ids : [account.id]}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.username).to.be.a.string();
        expect(acc.email).to.not.exist();

        return done();
      });
    });

    it('should return empty set when not accounts match ids', function (done) {

      manager.find({ids : ['123', '555']}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.be.empty();

        return done();
      });
    });

    it('should return account with all attributes', function (done) {

      manager.find({id : account.id}, {allFields : true}, function (err, accounts) {
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

    it('should return single account with email address', function (done) {

      manager.find({email : account.email}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.username).to.be.a.string();
        expect(acc.email).to.not.exist();

        return done();
      });
    });

    it('should return account matching email address with all fields', function (done) {

      manager.find({email : account.email}, {allFields : true}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.username).to.be.a.string();
        expect(acc.email).to.equal(account.email);

        return done();
      });
    });

    it('should return single account with username', function (done) {

      manager.find({username : account.username}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.username).to.equal(account.username);
        expect(acc.email).to.not.exist();

        return done();
      });
    });

    it('should return account with different case email', function (done) {

      manager.find({email : account.email.toUpperCase()}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.equal(account.id);
        expect(acc.username).to.equal(account.username);

        return done();
      });
    });

    it('should return account with different case username', function (done) {

      manager.find({username : account.username.toUpperCase()}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.equal(account.id);
        expect(acc.username).to.equal(account.username);

        return done();
      });
    });


    it('should return empty array when finding by unknown param', function (done) {

      manager.find({nickname : account.username}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.be.empty();

        return done();
      });
    });

    it('should return single account with facebook id', function (done) {

      manager.find({facebookId : account.facebookId}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.username).to.be.a.string();
        expect(acc.email).to.not.exist();

        return done();
      });
    });

    it('should return account matching email address with specific fields', function (done) {

      manager.find({email : account.email}, {allFields : true, fieldsToGet : 'email'}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.email).to.equal(account.email);
        expect(acc.username).to.not.exist();

        return done();
      });
    });

    it('should return account matching username with only allowed specific fields', function (done) {

      manager.find({username : account.username}, {allFields : false, fieldsToGet : 'email, username'}, function (err, accounts) {
        expect(err).to.not.exist();
        expect(accounts).to.have.length(1);

        var acc = _.first(accounts);
        expect(acc.id).to.be.a.string();
        expect(acc.username).to.equal(account.username);
        expect(acc.email).to.not.exist();
        expect(acc.name).to.not.exist();

        return done();
      });
    });

  });

  describe('#update', function () {
    var account,
        secondAccount;

    before(function (done) {
      var metadata = { profilePicture : {
        small : 'http://test.com/small.jpg',
        large : 'http://test.com/large.jpg'
      }};

      var d = {
        name : 'Tim Tester',
        email : helper.randomEmail(),
        username : helper.randomUsername(),
        facebookId : helper.randomFacebookId(),
        metadata : metadata
      };

      manager.create(d, function (err, acc) {
        if(err) {
          return done(err);
        }

        expect(err).to.not.exist();
        account = acc;

        var d2 = {
          name : 'Second Account',
          email : helper.randomEmail(),
          username : helper.randomUsername(),
          facebookId : helper.randomFacebookId(),
          metadata : metadata
        };

        manager.create(d2, function (err, acc) {
          if(err) {
            return done(err);
          }

          secondAccount = acc;
          return done();

        });
      });
    });

    it('should update name', function (done) {

      manager.update({id : account.id, name : 'Tim Updater'}, function (err, account) {
        expect(err).to.not.exist();
        expect(account).to.exist();

        expect(account.name).to.equal('Tim Updater');
        expect(account.id).to.be.a.string();
        expect(account.username).to.be.a.string();
        expect(account.email).to.be.a.string();
        expect(account.metadata).to.a.object();

        return done();
      });
    });

    it('should update email address', function (done) {

      var newEmail = helper.randomEmail();

      manager.update({id : account.id, email : newEmail}, function (err, account) {
        expect(err).to.not.exist();
        expect(account).to.exist();

        expect(account.email).to.equal(newEmail);
        expect(account.id).to.be.a.string();
        expect(account.username).to.be.a.string();
        expect(account.metadata).to.a.object();

        return done();
      });
    });

    it('should update email address back to original', function (done) {

      var newEmail = helper.randomEmail();
      var originalEmail = account.email;

      manager.update({id : account.id, email : newEmail}, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc.email).to.equal(newEmail);


        manager.update({id : account.id, email : originalEmail}, function (err, acc) {
          expect(err).to.not.exist();
          expect(acc.email).to.equal(originalEmail);

          return done();
        });

      });
    });

    it('should return error when email is taken', function (done) {

      manager.update({id : account.id, email : secondAccount.email}, function (err, acc) {
        expect(err).to.exist();
        expect(acc).to.not.exist();

        return done();
      });
    });

    it('should keep email address the same on multiple updates to the same account', function (done) {

      var newEmail = helper.randomEmail();

      manager.update({id : account.id, email : newEmail}, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc.email).to.equal(newEmail);


        manager.update({id : account.id, email : newEmail}, function (err, acc) {
          expect(err).to.not.exist();
          expect(acc.email).to.equal(newEmail);

          return done();
        });

      });
    });


    it('should update email and username', function (done) {

      var newEmail = helper.randomEmail();
      var newUsername = helper.randomUsername();

      manager.update({id : account.id, email : newEmail, username : newUsername}, function (err, acc) {
        expect(err).to.not.exist();

        expect(acc.email).to.equal(newEmail);
        expect(acc.username).to.equal(newUsername);

        return done();
      });

    });

    it('should update email and username after initial failure', function (done) {

      var newEmail = secondAccount.email;
      var newUsername = helper.randomUsername();

      manager.update({id : account.id, email : newEmail, username : newUsername}, function (err, acc) {
        expect(err).to.exist();
        expect(acc).to.not.exist();

        newEmail = helper.randomEmail();
        manager.update({id : account.id, email : newEmail, username : newUsername}, function (err, acc) {
          expect(err).to.not.exist();

          expect(acc.email).to.equal(newEmail);
          expect(acc.username).to.equal(newUsername);
          return done();
        });
      });

    });


    it('should return not found error when account does not already exist', function (done) {

      manager.update({id : '1234881828hdhdh', name : 'Tim Updater'}, function (err, account) {
        expect(err).to.exist();
        expect(err.message).to.exist();
        expect(err.output.statusCode).to.equal(404);
        expect(account).to.not.exist();

        return done();
      });
    });

    it('should update nested metadata', function (done) {
      var meta = { website : 'http://www.google.com', bio : 'words words', foobar : ''};

      manager.update({id : account.id, metadata : meta }, function (err, account) {
        expect(err).to.not.exist();
        expect(account).to.exist();

        expect(account.id).to.equal(account.id);
        expect(account.name).to.equal(account.name);
        expect(account.username).to.equal(account.username);
        expect(account.email).to.equal(account.email);
        expect(account.metadata).to.deep.equal({
          profilePicture : {
            small : 'http://test.com/small.jpg',
            large : 'http://test.com/large.jpg'
          },
          website : 'http://www.google.com',
          bio : 'words words',
          foobar : null
        });

        return done();
      });
    });

  });

  describe('#linkAccountWithProvider', function () {
    var account;

    before(function (done) {
      var metadata = { profilePicture : {
        small : 'http://test.com/small.jpg',
        large : 'http://test.com/large.jpg'
      }};

      var d = {
        name : 'Tim Tester',
        email : helper.randomEmail(),
        username : helper.randomUsername(),
        //facebookId : helper.randomFacebookId(),
        metadata : metadata
      };

      manager.create(d, function (err, acc) {
        expect(err).to.not.exist();
        account = acc;

        return done();
      });
    });

    it('should link account with facebook', function (done) {

      var facebookId = helper.randomFacebookId();

      manager.linkAccountWithProvider(account.id, 'facebook', facebookId, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc.facebookId).to.equal(facebookId);

        return done();
      });
    });

    it('should be able to link twice', function (done) {

      var facebookId = helper.randomFacebookId();

      manager.linkAccountWithProvider(account.id, 'facebook', facebookId, function (err, acc) {
        expect(err).to.not.exist();
        expect(acc.facebookId).to.equal(facebookId);

        manager.linkAccountWithProvider(account.id, 'facebook', facebookId, function (err, acc) {
          expect(err).to.not.exist();
          expect(acc.facebookId).to.equal(facebookId);

          return done();
        });
      });
    });

    it('should be able to link account after initial failure', function (done) {

      var facebookId = helper.randomFacebookId();

      manager.linkAccountWithProvider('notrealaccountid', 'facebook', facebookId, function (err, acc) {
        expect(err).to.exist();
        expect(acc).to.not.exist();

        manager.linkAccountWithProvider(account.id, 'facebook', facebookId, function (err, acc) {
          expect(err).to.not.exist();
          expect(acc.facebookId).to.equal(facebookId);

          return done();
        });
      });
    });
  });

});
