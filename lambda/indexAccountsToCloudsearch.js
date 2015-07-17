'use strict';

var AWS = require('aws-sdk');

var internals = {};

internals.createCloudSearchDocumentFromRecord = function(record) {
  var data = {id : record.dynamodb.Keys.id.S};

  if (record.eventName === 'REMOVE') {
    data.type = 'delete';
  } else {
    var image = record.dynamodb.NewImage;

    data.type = 'add';
    data.fields = {
      name : image.name.S,
      username : image.username.S,
      email : image.email.S
    };
  }

  return data;
};

exports.handler = function(event, context) {
  var cloudSearchDocDomain = 'doc-dev-cinch-accounts-ltmqj5gt5mjb5hg5eyqaf2v5hu.us-east-1.cloudsearch.amazonaws.com';
  var cloudsearchdomain = new AWS.CloudSearchDomain({endpoint: cloudSearchDocDomain });

  var documents = event.Records.map(internals.createCloudSearchDocumentFromRecord);

  var params = {contentType: 'application/json', documents : JSON.stringify(documents) };
  console.log('uploading documents to cloudsearch domain', params);

  cloudsearchdomain.uploadDocuments(params, function(err) {
    if(err) {
      console.log('Error uploading documents to cloudsearch', err, err.stack);
      context.fail(err);
    } else {
      context.succeed('Successfully processed ' + event.Records.length + ' records.');
    }
  });
};
