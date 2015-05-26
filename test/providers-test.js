'use strict';

// Load modules

var Code     = require('code'),
Lab      = require('lab'),
Hapi     = require('hapi'),
helper   = require('./test-helper'),
facebook = require('../lib/providers/facebook');

// Declare internals

//var internals = {};

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
//var before = lab.before;
var expect = Code.expect;

describe('Providers', function () {
  describe('#facebook', function () {
    var appSecret = 'ajsdf818399';

    it('should return profile info', function (done) {
      var server = new Hapi.Server();
      server.connection({ port: 63928 });

      server.route({
        method: '*',
        path: '/v2.3/me',
        config: {
          handler: function (request, reply) {
            /*jshint camelcase: false */
            var result = {
              id: '1602804303310105',
              email: 'test@test.com',
              first_name: 'Test',
              gender: 'male',
              last_name: 'Foo',
              link: 'https://www.facebook.com/app_scoped_user_id/1602804303310105/',
              locale: 'en_US',
              name: 'Test Foo',
              timezone: -4,
              updated_time: '2015-05-19T12:41:02+0000',
              verified: true
            };

            reply(result);
          }
        }
      });

      var settings = {
        appSecret : appSecret,
        logger : helper.testLogger(),
        profileUrl : server.info.uri + '/v2.3/me'
      };

      var fb = facebook(settings);

      var accesstoken = helper.randomFacebookAccessToken();

      server.start(function () {
        fb.fetchProfile(accesstoken, function (err, profile) {
          expect(err).to.not.exist();
          expect(profile).to.exist();

          return done();
        });
      });

    });

    it('should return not configured error', function (done) {
      var settings = {
        logger : helper.testLogger(),
      };

      var fb = facebook(settings);

      var accesstoken = 'CAAH';

      fb.fetchProfile(accesstoken, function (err, profile) {
        expect(err).to.exist();
        expect(profile).to.not.exist();

        return done();
      });

    });
  });
});
