/*****************************************
 * AUTHOR : nanyuantingfeng
 * DATE : 4/29/16
 * TIME : 21:10
 ****************************************/
var url = require('url');
var httpProxy = require('http-proxy');
var path = require('path');
var fs = require('fs');
var proxy = httpProxy.createProxyServer({ ws : true });

proxy.on('error', function (e) {
  console.warn(e);
});

function proxyReq(ctx, options) {
  ctx.respond = false;
  return function (callback) {
    proxy.web(ctx.req, ctx.res, options, callback);
  }
}

function middleware() {
  var pKg = require(path.resolve(this.cwd, "package.json"));
  var config = pKg['dora-forward'];
  this.log.info(config);
  var gOptions = {};
  if (config.options) {
    gOptions = config.options;
    config.options = undefined;
    delete config.options;
  }
  var rules = config;
  if (config.rules) {
    rules = config.rules;
  }
  var ruleKeys = Object.keys(rules);
  return function *(next) {
    for (var i = 0; i < ruleKeys.length; i++) {
      var key = ruleKeys[i]
      var rule = rules[key];
      if (typeof rule === "string") {
        rule = { target : rule };
      }
      var urlObj = url.parse(this.request.url);
      if (urlObj.pathname.startsWith(key)) {
        return yield proxyReq(this, Object.assign({}, gOptions, rule));
      }
    }
    yield next;
  };
}

module.exports = {
  name : 'forward3',
  middleware : middleware,
}
