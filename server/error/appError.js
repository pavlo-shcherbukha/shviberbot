
class CouchDbError extends Error {
  constructor(err) {
    super(err.message);
    this.name = "CouchDbError";
    this.code=err.error 
    this.target = err.stack;
    this.statusCode=err.statusCode;
    this.description=err.description;

  }
}


class ServerError extends Error {
  constructor(message) {
    super(message);
    this.name = "ServerError";
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class ApplicationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ApplicationError";
  }
}

class AxiosError extends Error {
  constructor(err) {
    let err_message = err.message;
    let stack = err.stack;

    if (   typeof  err.response !== "undefined" ) {

            if (err.response.data.hasOwnProperty('message')) {
              err_message = err_message + ' [' + err.response.data.message + ']';
            } else {
                err_message = '[' + err.message + '] (' + err.stack + ')';
            }     
    } else {
      err_message = '[' + err.message + '] (' + err.stack + ')';
    }
    super(err_message);

    this.name = "AxiosError";
    this.code = null;
    this.data = null;
    this.status = null;
    this.http_details = {};

    if (   typeof  err.response !== "undefined"   ) {
      if (err.response.data.hasOwnProperty('code')) {

        if (typeof  err.response.data.code !== "undefined" || err.response.data.code !== null){
            this.code = err.response.data.code;
        } else {
          this.code = 500;
        }    
      }
      if (err.response.hasOwnProperty('status')) {

        if (typeof  err.response.status !== "undefined" ||  err.response.status !== null ){
            this.status = err.response.status;
        } else {
          this.status = 500; 
        }


      }
      if (err.response.data.hasOwnProperty('data')) {
        this.data = err.response.data.data;
      }

      if (err.hasOwnProperty("config")) {
        this.http_details.reqURL = err.response.config.url;
        this.http_details.headers = err.response.config.headers;
      }

    } else {
      this.code = 500;
      this.status = 500; 

    }

  }
}



module.exports.CouchDbError = CouchDbError;
module.exports.ServerError = ServerError;
module.exports.ValidationError = ValidationError;
module.exports.ApplicationError = ApplicationError;
module.exports.AxiosError = AxiosError;