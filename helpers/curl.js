const { Curl, CurlProxy } = require('node-libcurl');
const Net = require('net');
const querystring = require('querystring');

module.exports = function () {

  this['default'] = {
    torControlHost: 'localhost',
    torControlPort: 9051,
    autoParse: true, // content-type detect -> json
    verbose: false,
    useProxy: false,
    proxy: 'localhost:9050',
    proxyType: CurlProxy.Socks5Hostname
  };

  this.libcurl = Curl;
  this.curl = new Curl();

  this.setOtherOpt = (callback) => {
    callback(this)
    return this
  }

  this.serializeCookie = (cookies) => {
    let temp = [];
    for (const cook in cookies) {
      temp.push(`${cook}=${cookies[cook]}`)
    }
    return temp.join("; ")
  }

  this.newTorIdentity = () => {
    let client = new Net.Socket();
    client.connect(this['default'].torControlPort, this['default'].torControlHost, () => {
      client.write('authenticate\nsignal newnym\nquit');
    });
  };

  this._setUrl = (url) => {
    this.curl.setOpt(Curl.option.URL, url);
    return this;
  };

  this.setMultipartBody = (fieldsArray) => {
    this.curl.setOpt(Curl.option.HTTPPOST, fieldsArray);
    return this;
  };

  this.setOpt = (opt, val) => {
    this.curl.setOpt(opt, val);
    return this;
  };

  this.getCurl = () => {
    return this.curl;
  };

  this.setCurl = (curl_replace) => {
    this.curl = curl_replace;
    return this;
  };

  this.setBody = (fieldsObj) => {

    if (typeof fieldsObj !== 'string') {
      fieldsObj = querystring.stringify(fieldsObj)
    }
    this.curl.setOpt(Curl.option.POSTFIELDS, fieldsObj);

    return this;
  };

  this.setProxy = (host, proxyType) => {
    this.curl.setOpt(Curl.option.PROXY, host);
    // SOCKS5 default
    if (typeof proxyType === 'undefined') {
      this.curl.setOpt(Curl.option.PROXYTYPE, CurlProxy.Socks5Hostname);
    } else {
      this.curl.setOpt(Curl.option.PROXYTYPE, proxyType);
    }

    return this;
  };

  this.setFollowLocation = (followlocation) => {
    this.curl.setOpt(Curl.option.FOLLOWLOCATION, followlocation);
    return this;
  };

  this.setHeaders = (headers) => {
    this.curl.setOpt(Curl.option.HTTPHEADER, headers);
    return this;
  };

  this.get = (url) => {
    this._setUrl(url);
    this.curl.setOpt(Curl.option.CUSTOMREQUEST, 'GET');
    return this._submit();
  };

  this.post = (url) => {
    this._setUrl(url);
    this.curl.setOpt(Curl.option.CUSTOMREQUEST, 'POST');
    return this._submit();
  };

  this.patch = (url) => {
    this._setUrl(url);
    this.curl.setOpt(Curl.option.CUSTOMREQUEST, 'PATCH');
    return this._submit();
  };

  this['delete'] = (url) => {
    this._setUrl(url);
    this.curl.setOpt(Curl.option.CUSTOMREQUEST, 'DELETE');
    return this._submit();
  };

  this.head = (url) => {
    this._setUrl(url);
    this.curl.setOpt(Curl.option.CUSTOMREQUEST, 'HEAD');
    return this._submit();
  };

  let normalizeHeaders = (headers) => {
    // normalize headers
    let nHeaders = {};
    if (Array.isArray(headers)) {
      let mergedHeaders = {};
      for (let i in headers) {
        mergedHeaders = Object.assign(mergedHeaders, headers[i]);
      }
      for (let k in mergedHeaders) {
        nHeaders[k.toString().toLocaleLowerCase()] = mergedHeaders[k];
      }
    }
    return nHeaders;
  };

  this._reset = () => {
    this.curl = new Curl();
  };

  this._submit = () => {
    this.curl.setOpt(Curl.option.VERBOSE, this['default'].verbose);
    if (this['default'].useProxy) {
      this.setProxy(this['default'].proxy, this['default'].proxyType);
    }
    return new Promise((resolve, reject) => {
      try {
        this.curl.on('end', (statusCode, body, headers, curlInstance) => {
          headers = normalizeHeaders(headers);

          if (this.default.autoParse) {
            if (typeof headers['content-type'] !== 'undefined' && headers['content-type'].toLocaleLowerCase() === 'application/json') {
              try {
                let jsonObj = JSON.parse(body);
                body = jsonObj;
              } catch (e) { }
            }
          }
          resolve({ statusCode, body, headers, curlInstance, curl: this.curl });
        });

        this.curl.on('error', (err, errorCode, curlInstance) => {
          this.curl.close();
          reject(err);
        });
        this.curl.perform();
      } catch (e) {
        reject(e);
      }
    });
  };

  return this;
};