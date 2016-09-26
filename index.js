/*****************************************
 * AUTHOR : nanyuantingfeng
 * DATE : 4/29/16
 * TIME : 21:10
 ****************************************/
var url = require('url');
var httpProxy = require('http-proxy');
var path = require('path');
var fs = require('fs');
var proxy = httpProxy.createProxyServer({
  ws : true
});

proxy.on('error', function (e) {
  console.warn(e);
});

function proxyReq(ctx, target) {
  ctx.respond = false;
  return function (callback) {
    proxy.web(ctx.req, ctx.res, { target : target }, callback);
  }
}

module.exports = {
  name : 'forward3',
  'middleware' : function () {
    var pKg = require(path.resolve(this.cwd, "package.json"));
    var rules = pKg['dora-forward'];
    this.log.info(rules);
    var ruleKeys = Object.keys(rules);
    return function *(next) {
      for (var i = 0; i < ruleKeys.length; i++) {
        var key = ruleKeys[i]
        // 按照http协议，此处url可以包含scheme://host:port，所以要解析出pathname
        var urlObj = url.parse(this.request.url)
        if (urlObj.pathname.startsWith(key)) {
          return yield proxyReq(this, rules[key]);
        }
      }
      yield next;
    };
  }
}
