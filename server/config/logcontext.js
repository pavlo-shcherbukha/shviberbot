const winston = require('./winston');
var logger = winston ;
const MaskData = require('maskdata');

const maskJSONOptions = {
    maskWith : "*",
    fields : ['password'] 
  };

class LogContext {
    constructor() {
      this.hostname=process.env.HOSTNAME || 'localhost';
      this.service='pvx-iit-srvc-registry-be';
      this.username = null;
      this.state=null;

    }

    get Hostname(){
        return this.hostname;
    }
    set Hostname( hostname ){
        this.hostname=hostname;
    }

    get Service(){
        return this.service;
    }
    set Service( service ){
        this.service=service;
    }

    get Username(){
        return this.username;
    }
    set Username( username ){
        this.username=username;
    }
    get State(){
        return this.state;
    }
    set State( state ){
        this.state=state;
    }

}


class AppLogger {
        constructor() {
            this.logctx = new LogContext();

        }

        get LogContext(){
            return this.logctx;
        }
        set LogContext(logctx){
            this.logctx = logctx;
        }

        get Username(){
            return this.logctx.username;
        }
        set Username( username ){
            this.logctx.username = username ;
        }
        get State(){
            return this.logctx.state ;
        }
        set State(state){
            this.logctx.state = state ;
        }


        log(  amsg,  alabel, alevel) {

            if (typeof alabel === "undefined" || alabel === null || alabel === '') {
                alabel = 'server';
            }
            if (typeof alevel === "undefined" || alevel === null || alevel === '') {
                alevel = 'info';
            }
            if (typeof amsg === "undefined" || amsg === null || amsg === '') {
            amsg = '-';
            }
        
            logger.child(  {context: this.logctx} ).log({ level: alevel, 
                                                          label: alabel, 
                                                          message: amsg, 
                                                          username:this.logctx.username,
                                                          state: this.logctx.state, 
                                                          hostname: this.logctx.hostname,
                                                          servicename: this.servicename
                                                         });

        }

        error(amsg,  alabel){

            this.log(amsg,  alabel, 'error');
        }

        warn(amsg,  alabel){

            this.log(amsg,  alabel, 'warn');
        }

        info(amsg,  alabel){

            this.log(amsg,  alabel, 'info');
        }

        verbose(amsg,  alabel){

            this.log(amsg,  alabel, 'verbose');
        }

        debug(amsg,  alabel){

            this.log(amsg,  alabel, 'debug');
        }

        silly(amsg,  alabel){

            this.log(amsg,  alabel, 'silly');
        }

        axios_log_request( req ) {
            var obj = {};
            var maskedObj = {};
            req.headers.state =  this.logctx.State;
            req.headers.username =  this.logctx.Username;
            var lhttp_req = {  
                originalUrl: req.baseURL,
                baseUrl: req.baseURL,
                path: req.url,
                parms: req.params,
                query: req.query,
                method: req.method,
                headers: req.headers,
                Time: new Date()
            };

            if ( typeof req.data === "undefined"  || req.data===null){
                //
            } else {
                var l_contenttype = req.headers['Content-Type']|| req.headers["content-type"];
                if ( l_contenttype.includes('application/json') ){
                    obj = {};
                    Object.assign( obj, req.data );
                    maskedObj = MaskData.maskJSONFields(obj, maskJSONOptions);
                    lhttp_req.body = JSON.stringify(maskedObj);
                } else if ( l_contenttype.includes('text/html') ){
                    lhttp_req.body = req.data;

                }   

            }
            logger.child( { context: this.logctx, http_req: lhttp_req }).http({
                hostname: this.logctx.hostname,
                servicename: this.aservicename,
                username: this.logctx.username,
                state: this.logctx.state, 
                label: 'axios_req',
                message: 'Логирую http request axios',
                req_method: req.method,
                req_useragent: req.headers["user-agent"],
                req_origin: req.headers.origin ,
                req_host: req.headers.host,
                req_original_url: req.originalUrl,
                req_header_state: req.headers.state,
	            req_header_username: req.headers.username,
	            req_header_sidbi: req.headers.SIDBI,
	            req_header_CIFID: req.headers.CIFID}

                );
            return req;
        }
        axios_log_response( res ) {
            var obj = {};
            var maskedObj = {};
            var lhttp_res = {
                        method: res.method,
                        headers: res.headers,
                        status:  res.status,
                        statusText: res.statusText,
                        body: res.data,
                        Time: new Date(),
                        reqconfig: res.config
            };

            if ( typeof res.data === "undefined"  || res.data===null){
                //
            } else {
                //var l_contenttype =  'application/json'; 
                var l_contenttype = res.headers["Content-Type"] || res.headers["content-type"];  //Content-Type
                if ( l_contenttype.includes('application/json') ||  l_contenttype.includes('application/json; charset=utf-8')){
                    
                    obj = {};
                    Object.assign( obj, res.data );
                    maskedObj = MaskData.maskJSONFields(obj, maskJSONOptions);
                    lhttp_res.body = JSON.stringify(JSON.stringify(maskedObj));

                } else if ( l_contenttype.includes('text/html') ){
                    lhttp_res.body = res.data;

                }   
            }


            logger.child( { 
                context: this.logctx, 
                http_res: lhttp_res}).http({
                                            hostname: this.logctx.hostname,
                                            servicename: this.aservicename,
                                            username: this.logctx.username,
                                            state: this.logctx.state, 
                                            label: 'axios_res',
                                            message: 'Логирую http response axios',
                                            res_method: res.method,
                                            res_status:  res.status,
                                            res_statusText: res.statusText}
                
                );
            return res ;

        }
        express_log_request( req, res, next ){
            res.once('finish', function logIt() {
                    var lhttp_req = {  
                        originalUrl: req.originalUrl,
                        baseUrl: req.baseUrl,
                        path: req.path,
                        parms: req.params,
                        query: req.query,
                        cookies: req.cookies,
                        hostname: req.headers.host,
                        ip: req.ip,
                        method: req.method,
                        headers: req.headers,
                        Time: new Date()
                    }

                    //var empyobj = {}; 
                    if ( typeof req.body === "undefined"  || req.body===null || Object.keys( req.body ).length===0){
                        //.keys(obj).length === 0;
                        //
                    } else {
                        //var l_contenttype =  'application/json'; 
                        var l_contenttype = req.headers["Content-Type"] || req.headers["content-type"];  //Content-Type
                        if (typeof l_contenttype === "undefined") {
                            //

                        } else if ( l_contenttype.includes('application/json') || l_contenttype.includes('application/json; charset=utf-8')){
                            
                            var obj = {};
                            Object.assign( obj, req.body );
                            var maskedObj = MaskData.maskJSONFields(obj, maskJSONOptions);
                            lhttp_req.body = JSON.stringify(JSON.stringify(maskedObj));
        
                        } else if ( l_contenttype.includes('text/html') ){
                            lhttp_req.body = req.body;
        
                        }   
                    }





                    logger.child( { context: this.logctx, 
                                    http_req: lhttp_req
                    }).http(
                    {
                        //ahostname: this.logctx.hostname,
                       // aservicename: this.logctx.servicename,
                        //astate: this.logctx.state, 
                        //ausername: this.logctx.username,
                        label: 'express_req',
                        message: 'Логирую express http body request',
                        req_method: req.method,
                        req_useragent: req.headers['user-agent'] ,
                        req_origin: req.headers.origin ,
                        req_host: req.headers.host,
                        req_original_url: req.originalUrl,
                        req_header_state: req.headers.state,
                        req_header_username: req.headers.username,
                        req_header_sidbi: req.headers.SIDBI,
                        req_header_CIFID: req.headers.CIFID}
                    
                    
                    
                    
                    
                    );
            });
            //next();
        }

        express_log_response( req, res, next ){

            var write = res.write;
            var end = res.end;
            var chunks = [];
          
            res.write = function newWrite(chunk) {
              chunks.push(chunk);
          
              write.apply(res, arguments);
            };
          
            res.end = function newEnd(chunk) {
              if (chunk) { chunks.push(chunk); }
          
              end.apply(res, arguments);
            };
          




            res.once('finish', function logIt() {
                var res_body;
                var lhttp_res = {
                    method: res.method,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: res.getHeaders(),
                    Time: new Date()
                };
                

                if ( typeof res_body === "undefined"  || res_body===null /*||  Object.keys( res_body ).length===0*/ ){
                    //
                } else {
                    //var l_contenttype =  'application/json'; 
                    var l_contenttype =  lhttp_res.headers["Content-Type"] ||  lhttp_res.headers["content-type"];  //Content-Type
                    if(typeof l_contenttype === "undefined" ){
                        //
                    } else  if ( l_contenttype.includes('application/json') || l_contenttype.includes('application/json; charset=utf-8') ){
                        res_body = Buffer.concat(chunks).toString('utf8');
                        var obj = {};
                        Object.assign( obj, JSON.parse(res_body)  );
                        var maskedObj = MaskData.maskJSONFields(obj, maskJSONOptions);
                        lhttp_res.body = JSON.stringify(JSON.stringify(maskedObj));
    
                    } else if ( l_contenttype.includes('text/html') ){
                        res_body = Buffer.concat(chunks).toString('utf8');
                        lhttp_res.body = res_body ;
    
                    }   
                }

   
                logger.child( { 
                            context: this.logctx, 
                            http_res: lhttp_res
                }).http(
                                        {
                                            //ahostname: this.logctx.hostname,
                                            //aservicename: this.logctx.servicename,
                                            //astate: this.logctx.state, 
                                            //ausername: this.logctx.username,
                                            label: 'express_res',
                                            message: 'Логирую express http body response',
                                            res_method: res.method,
                                            res_status:  res.statusCode,
                                            res_statusText: res.statusMessage}
                
                );
            });
            ///next();

        }


}


module.exports = { LogContext, AppLogger }