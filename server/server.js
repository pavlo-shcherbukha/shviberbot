const http = require('http');
const express = require('express');
const winston = require('./config/winston');
var morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
var logger = winston ;

const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;

const { LogContext,  AppLogger } = require('./config/logcontext');
var logctx= new LogContext();
var applog= new AppLogger();
applog.LogContext=logctx;
var label='server'
applog.info( 'Server is starting',label);
applog.info( 'Server test message',label);

const localConfig = require('./config/local.json');


const app = express();
app.set('x-powered-by', false);
const server = http.createServer(app);


app.use(morgan('combined', { stream: winston.stream }));

const IBMCloudEnv = require('ibm-cloud-env');
IBMCloudEnv.init('/server/config/mappings.json');

bot_token=IBMCloudEnv.getString('bot_token');
bot_uri=IBMCloudEnv.getString('bot_uri');
bot_name=IBMCloudEnv.getString('bot_name');
bot_expose_domain=IBMCloudEnv.getString('bot_expose_domain');
bot_expose_uri_path=IBMCloudEnv.getString('bot_expose_uri_path');




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Add your code here
const port =  process.env.SHAPPDB_SERVICE_PORT  || localConfig.port;

cookieParser    = require('cookie-parser'),
session         = require('express-session'),
bodyParser      = require('body-parser');

query           = require('querystring');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use((req, res, next) => {
  applog.express_log_request( req, res, next);
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, ad-name, x-powered-by, date, authorization, callid, SystemID, DtRequest,app_username,x-Content-Type");
  res.header('Access-Control-Allow-Methods', 'DELETE,GET,PATCH,POST,PUT'); 
  applog.express_log_response( req, res, next); 
  next();
});



/*=====================================================================*/


const apperror = require('./error/appError');
const applib = require('./applib/apputils');
const { exit } = require('process');

const bot = new ViberBot({
  logger: applog,
  authToken: bot_token,
  name: bot_name,
  avatar: "http://viber.com/avatar.jpg"
});

bot.on(BotEvents.SUBSCRIBED, response => {
  response.send(new TextMessage(`Hi ${response.userProfile.name}, my name is ${bot.name}!`));
});


bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
  response.send(new TextMessage(`I have received the following message: ${message}`));
});

// Bind the bot middleware to the app instance
app.use(bot_expose_uri_path, bot.middleware());


app.post('/api/sendmsg',  function(req, res) {
  label='http-post:api-sendmsg' 
  try {
    
    var botmsg=request = req.body.msg ;
    applog.info( `Reqbody: ` + JSON.stringify(req.body)  ,label);
    bot.send
    let cas={ok: true}
    applog.info( `Saved. Return result ` + JSON.stringify(cas)  ,label);
    return res.status(200).json( cas );
           
  }
  catch (err)  {
      applog.error( `Regestration error! ${err.message} `   ,label);
      errresp=applib.HttpErrorResponse(err)
      applog.error( `Result with error! ${errresp.Error.statusCode} ` + JSON.stringify( errresp )   ,label);
      return res.status(errresp.Error.statusCode ).json(errresp);
  };


});


app.get('/',  function(req, res) {
  var filePath = path.join(__dirname, '../public/index.html');
  res.header('Content-Type', 'text/html');
  res.sendFile(  filePath , function(err){
     console.log("ERRRRROOOORRRR: " + err.message);
  });

});

app.get('/health',  function(req, res) {
  let cas={ok: true};
  return res.status(200).json( cas );

});


app.post('/api/setwh',  function(req, res) {
  label='http-get:api-setwh' 
  let bot_webhook = req.body.whook 
  applog.info( `bot_webhook:  ${bot_webhook}` ,label);

  try {
    
    //bot.setWebhook(bot_expose_domain + bot_expose_uri_path)
    bot.setWebhook(bot_webhook)
    .then(result=>{
      applog.info( `Saved. Return result ` + JSON.stringify( result )  ,label);
      return res.status(200).json( {ok: true, result: result} );
    })
    .catch(error => {
      //applog.error( `Error: The webhook ${bot_expose_domain + bot_expose_uri_path} cannot be set. ${error.message}`  ,label);
      applog.error( `Error: The webhook ${bot_webhook} cannot be set. ${error.message}`  ,label);
      errresp=applib.HttpErrorResponse(error)
      applog.error( `Result with error! ${errresp.Error.statusCode} ` + JSON.stringify( errresp ), label);
      return res.status(errresp.Error.statusCode ).json(errresp);
    });
  }
  catch (err)  {
      applog.error( `Regestration error! ${err.message} `   ,label);
      errresp=applib.HttpErrorResponse(err)
      applog.error( `Result with error! ${errresp.Error.statusCode} ` + JSON.stringify( errresp )   ,label);
      return res.status(errresp.Error.statusCode ).json(errresp);
  };


});

iwh='https://sh-viberbot-be.12wrmp9aqvrk.eu-gb.codeengine.appdomain.cloud/api/webhook';

/*=====================================================================*/

/** Right call listen 
 *  in include possibilisty to run application from mocha
*/
if(!module.parent){ 

  server.listen(port, function(){

    console.log("=================================================================================")  ;  
    console.log("SET WEB HOOK^^^^^ " +iwh);
    bot.setWebhook(iwh)
    .then(result=>{
       console.log("!!!!!!----YYYYYYYYYYYYYY---");
    })
    .catch(error => {
        console.log("!!!!!!----EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE---");
        console.log("error:" + error.message);
        console.log("=====================================================================");

    });

    
    

  });
}


module.exports = server;