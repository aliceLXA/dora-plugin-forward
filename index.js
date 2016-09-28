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

module.exports = {
  name : 'forward3',
  middleware : function () {
    var pKg = require(path.resolve(this.cwd, "package.json"));
    var conf = pKg['dora-forward'];
    var rules = conf.rules
    var options = conf.options;
    this.log.info(rules);
    var ruleKeys = Object.keys(rules);
    return function *(next) {
      for (var i = 0; i < ruleKeys.length; i++) {
        var key = ruleKeys[i]
        // 按照http协议，此处url可以包含scheme://host:port，所以要解析出pathname
        var urlObj = url.parse(this.request.url)
        if (urlObj.pathname.startsWith(key)) {
          var opts = Object.assign({ target : rules[key] }, options);
          return yield proxyReq(this, opts);
        }
      }
      yield next;
    };
  }
}
