/*****************************************
 * AUTHOR : nanyuantingfeng
 * DATE : 4/29/16
 * TIME : 21:10
 ****************************************/
var koaBetterBody = require('koa-better-body');
var request = require('request');
var path = require('path');
var fs = require('fs');

function nForwarder(url, log) {
  var options = {};
  options.url = url;
  options.method = this.method;
  delete this.header.host;
  options.headers = this.header;
  options.qs = this.query;

  switch (this.is('json', 'multipart/form-data', 'urlencoded')) {
    case 'json':
      delete options.headers['content-length'];
      options.body = this.body;
      options.json = true;
      break;
    case 'multipart/form-data':
      var body = this.request.body;
      var files = body.files || {};
      var fields = body.fields || {};
      if (!options.formData) {
        delete options.headers['content-length'];
        options.formData = {};
        Object.keys(files).forEach(function (filename) {
          options.formData[filename] = {
            value : fs.createReadStream(files[filename].path),
            options : {
              filename : files[filename].name,
              contentType : files[filename].type
            }
          };
        });
        Object.keys(fields).forEach(function (item) {
          options.formData[item] = fields[item];
        });
      }
      break;
    case 'urlencoded':
      options.form = this.body;
      break;
    default:
      options.body = this.body;
      break;
  }

  /*********Magic Don`t Touch**********
   * this.respond = false;
   * ************************************/
  this.respond = false;

  log = log || console;
  log.info(options.method + '::' + options.url);

  request(options).pipe(this.res);
}

module.exports = {
  name : 'forward2',
  'middleware.before' : function () {
    this.app.use(koaBetterBody());
  },
  'middleware' : function () {
    var pKg = require(path.resolve(this.cwd, "package.json"));
    var rules = pKg['dora-forward'];
    var log = this.log;
    this.log.info(rules);
    return function *(next) {
      yield *next;
      Object.keys(rules).forEach(key=> {
        if (this.request.url.indexOf(key) > -1) {
          return nForwarder.call(this, rules[key] + this.request.url, log);
        }
      });
    }
  }
}
