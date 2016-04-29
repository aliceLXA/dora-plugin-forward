/*****************************************
 * AUTHOR : nanyuantingfeng
 * DATE : 4/29/16
 * TIME : 21:10
 ****************************************/
Object.defineProperty(exports, "__esModule", { value : true });

var fs = require('fs');
var request = require('request');
var path = require('path');

function Forwarder(url, log) {
  var options = {};
  options.url = url;
  options.method = this.method;
  delete this.header.host;
  options.headers = this.header;
  options.qs = this.query;
  
  switch (this.is('json', 'multipart/form-data', 'urlencoded')) {
    case 'json':
      delete options.headers['content-length'];
      options.body = this.request.body;
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
      options.form = this.request.body;
      break;
    default:
      if (!~['HEAD', 'GET', 'DELETE'].indexOf(options.method)) {
        options.body = this.request.body;
      }
  }
  
  log = log || console;
  log.info('>> ' + options.method + ' :: ' + options.url);
  
  request(options).on('error', (err) => {
    if (err.code === 'ENOTFOUND') {
      this.res.statusCode = 404;
      this.res.end();
    } else {
      log.error(err);
      //throw err;
    }
  }).pipe(this.res);
}

function nKoa(rules, log) {
  return function *(next) {
    Object.keys(rules).forEach(key=> {
      if (this.request.url.indexOf(key) > -1) {
        return Forwarder.call(this, rules[key] + this.request.url, log);
      }
    });
    yield *next
  }
}

module.exports.nKoa = nKoa;

exports.default = {
  name : 'forward2',
  'middleware' : function () {
    var pKg = require(path.resolve(this.cwd, "package.json"));
    this.log.info(pKg['dora-forward']);
    return nKoa(pKg['dora-forward'], this.log);
  }
};

module.exports = exports['default'];
