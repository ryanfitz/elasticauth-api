'use strict';

var _   = require('lodash'),
    url = require('url'),
    omitEmpty = require('omit-empty');

var internals = {};

internals.accountsResponse = function (api, linksTemplate, accounts, options, currentPath) {
  options = options || {};

  var query = _.merge({}, currentPath.query);
  var selfURL = _.merge({}, api, {pathname: currentPath.pathname, query: query });

  var resp = {
    links : { self : url.format(selfURL) }
  };

  var data;
  if(!_.isArray(accounts)) {
    data = [accounts];
  } else {
    data = accounts;
  }

  var result = _.map(data, function (account) {
    var selfURL = _.merge({}, api, {pathname: '/accounts/' + account.id });

    var resp = {
      id : account.id,
      href: url.format(selfURL),
      email : account.email,
      name : account.name,
      username : account.username,
      roles : account.roles,
      createdAt: account.createdAt ? new Date(account.createdAt).toISOString() : null,
      updatedAt: account.updatedAt ? new Date(account.updatedAt).toISOString() : null,
      metadata : account.metadata
    };

    resp.links = {
      self : url.format(selfURL)
    };

    if(linksTemplate) {
      var moreLinks = JSON.parse(linksTemplate({account : account}));
      resp.links = _.merge({}, resp.links, moreLinks);
    }

    return omitEmpty(resp);
  });

  resp.accounts = result;

  if(options.after) {
    var after = options.after;

    var nextQuery = _.merge({}, query, {after: after});
    var nextURL = _.merge({}, api, {pathname: currentPath.pathname, query: nextQuery });

    resp.links = resp.links || {};
    resp.links.next = url.format(nextURL);
  }

  if(options.linked && options.linked.tokens) {
    var tokenResponse = internals.tokensResponse(api, linksTemplate, options.linked.tokens, null, currentPath);

    resp.linked = {
      tokens : tokenResponse.tokens
    };
  }

  return resp;
};

internals.tokensResponse = function (api, linksTemplate, tokens, options, currentPath) {
  options = options || {};

  var query = _.merge({}, currentPath.query);
  var selfURL = _.merge({}, api, {pathname: currentPath.pathname, query: query });

  var resp = {
    links : { self : url.format(selfURL) }
  };

  var data;

  if(!_.isArray(tokens)) {
    data = [tokens];
  } else {
    data = tokens;
  }

  var tokensURL = url.format(_.merge({}, api, {pathname: '/tokens' }));

  var result = _.map(data, function (token) {
    var accountURL = _.merge({}, api, {pathname: '/accounts/' + token.accountID });

    var resp = {
      href : tokensURL,
      access : token.accessToken,
      expires: token.expires,
      type: token.type,
      refresh : token.refreshToken,
      cognitoId : token.cognitoId,
      cognitoToken : token.cognitoToken,
      links : {
        self : tokensURL,
        account : {
          id : token.accountID,
          href : url.format(accountURL),
          type : 'account'
        }
      }
    };

    return omitEmpty(resp);
  });

  resp.tokens = result;

  if(options.linked && options.linked.accounts) {
    var accResponse = internals.accountsResponse(api, linksTemplate, options.linked.accounts, null, currentPath);

    resp.linked = {
      accounts : accResponse.accounts
    };
  }

  return resp;
};

module.exports = function (baseURL, options) {
  var apiURL = url.parse(baseURL);

  options = options || {};

  var compiledAccountLinks = null;

  if(options.accountLinks) {
    compiledAccountLinks = _.template(JSON.stringify(options.accountLinks));
  }

  return {
    accountsResponse : _.partial(internals.accountsResponse, apiURL, compiledAccountLinks),
    tokensResponse : _.partial(internals.tokensResponse, apiURL, compiledAccountLinks)
  };

};
