/***********************************************************
 * AUTHOR : nanyuantingfeng DATE : 4/29/16 TIME : 21:10
 **********************************************************/
const httpProxy = require('http-proxy');
const path = require('path');
const url = require('url');
const proxy = httpProxy.createProxyServer({ ws : true });

proxy.on('error', e => {
  console.warn(e);
});

function middleware() {
  let pKg = require(path.resolve(this.cwd, "package.json"));
  let config = pKg['dora-forward'] || pKg['forward'] || pKg['proxy'];

  if (!config) {
    return function *(next) {
      yield next
    }
  }

  this.log.info(config);

  let gOptions = {};

  if (config.options) {
    gOptions = config.options;
    config.options = undefined;
    delete config.options;
  }

  let rules = config;

  if (config.rules) {
    rules = config.rules;
  }

  let ruleKeys = Object.keys(rules);

  return function *(next) {

    for (let i = 0; i < ruleKeys.length; i++) {
      let key = ruleKeys[i]
      let rule = rules[key];

      if (typeof rule === "string") {
        rule = { target : rule };
      }

      let urlObj = url.parse(this.req.url);

      if (urlObj.pathname.startsWith(key)) {
        return yield (callback) => {
          this.respond = false;
          proxy.web(
            this.req,
            this.res,
            Object.assign({ changeOrigin : true }, gOptions, rule, callback)
          )
        }
      }
    }
    yield next;
  };
}

module.exports = {
  name : 'forward3',
  middleware : middleware,
}
