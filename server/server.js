const http = require('http');
const express = require('express');
const { json } = require('express');
const winston = require('./config/winston');
var morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
var logger = winston ;

const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;
const UrlMessage  = require('viber-bot').Message.Url;
const PictureMessage = require('viber-bot').Message.Picture;
const RichMediaMessage = require('viber-bot').Message.RichMedia;
const KeyboardMessage = require('viber-bot').Message.Keyboard;

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
//const server = http.createServer(app);


app.use(morgan('combined', { stream: winston.stream }));

const IBMCloudEnv = require('ibm-cloud-env');
IBMCloudEnv.init('/server/config/mappings.json');

bot_token=IBMCloudEnv.getString('bot_token');
bot_uri=IBMCloudEnv.getString('bot_uri');
bot_name=IBMCloudEnv.getString('bot_name');
bot_expose_domain=IBMCloudEnv.getString('bot_expose_domain');
bot_expose_uri_path=IBMCloudEnv.getString('bot_expose_uri_path');




// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'pug');

// Add your code here
const port =  process.env.SERVICE_PORT  || localConfig.port;

cookieParser    = require('cookie-parser'),
session         = require('express-session'),
//bodyParser      = require('body-parser');
query           = require('querystring');

app.use(cookieParser());
//app.use(bodyParser.urlencoded({extended: false}));
//app.use(bodyParser.json());


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



app.get('/',  function(req, res) {
  var filePath = path.join(__dirname, '../public/index.html');
  res.header('Content-Type', 'text/html');
  res.sendFile(  filePath , function(err){
    if (err){
      applog.info(`Error rendering index.html: ${err.message}`);
      return res.status(500).end();
    } else {
      return res.status(200).end(); 
    }

  });

});


app.get('/health',  function(req, res) {
  let cas={ok: true};
  return res.status(200).json( cas );

});

 
let bot_users=[];

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
  bot_users.push(response.userProfile);
  applog.info( `--------------->UserProfile: ` + JSON.stringify(response.userProfile) ,label);
  response.send(new TextMessage(`I have received the following message: ${message.text}`));
});

// The user will get those messages on first registration
bot.onSubscribe(response => {
  say(response, `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`);
});

bot.onTextMessage(/./, (message, response) => {
    response.send(new TextMessage(  'I am Bot. I send you response!!!  Your message is[' + message.text + ']' ))
    return;
});


bot.onConversationStarted((userProfile, isSubscribed, context) => {
    applog.info( `--------------->UserProfile: ` + JSON.stringify(userProfile) ,label);
    applog.info( `--------------->isSubscribed: ` + JSON.stringify(isSubscribed) ,label);
    bot.sendMessage(userProfile,message)
});


// Bind the bot middleware to the app instance
app.use(bot_expose_uri_path, bot.middleware());

//iwh='https://f0b0-46-118-231-225.ngrok-free.app/api/webhook';
iwh=`${bot_expose_domain}${bot_expose_uri_path}`

const server = http.createServer(app);

app.post('/api/wtest', json(), function(req, res, next) {
  label='http-get:api-twtest' 
  let bot_webhookb = req.body 
  applog.info( `bot_webhook: ` + JSON.stringify(req.body) ,label);
  return res.status(200 ).json({ok: true});

});

/**
{
    "userProfile": {
        "id": "3Dou2U1CxfOwDczVnnjpbg==",
        "name": "Pavlo Shcherbukha",
        "avatar": null,
        "country": "UA",
        "language": "uk-UA",
        "apiVersion": 10
    },
    "messages": {
        "TextMessage": {
            "text": "Це моє комплексне повідомлення!"
        },
        "UrlMessage": {
            "url": "https://pavlo-shcherbukha.github.io/"
        },
        "PictureMessage": {
            "url": "https://pavlo-shcherbukha.github.io/assets/img/mems/it-and-coffe.jpg",
            "text": "picture text "
        },
        "KeyboardMessage": {
            "Type": "keyboard",
            "Revision": 1,
            "Buttons": [
                {
                    "Columns": 3,
                    "Rows": 2,
                    "BgColor": "#e6f5ff",
                    "BgMedia": "http://www.jqueryscript.net/images/Simplest-Responsive-jQuery-Image-Lightbox-Plugin-simple-lightbox.jpg",
                    "BgMediaType": "picture",
                    "BgLoop": true,
                    "ActionType": "reply",
                    "ActionBody": "Yes"
                }
            ]
        }
    }
}
 * 
 */
app.post('/api/sendmsg', json(), function(req, res, next) {
  label='http-get:api-sendmsg' 
  //let bot = req.body 
  applog.info( `input request: ${JSON.stringify(req.body)} `   ,label);
  bot.getBotProfile()
  .then(response => {
      let botname=response.name;
      let username=req.body.userProfile.name
      let text=`From ${botname} TO ${username}: відправляю повідомлення--->>>>`
      let msglist=[];
      
      msglist.push( new TextMessage( text )) ;
      if ( req.body.messages.hasOwnProperty( "TextMessage" )){
        msglist.push( new TextMessage( req.body.messages.TextMessage.text )) ;
      }
      if (req.body.messages.hasOwnProperty( "UrlMessage" )){
        msglist.push( new UrlMessage(req.body.messages.UrlMessage.url)) ;
      }
      if (req.body.messages.hasOwnProperty("PictureMessage")){  
        msglist.push( new PictureMessage(  req.body.messages.PictureMessage.url, req.body.messages.PictureMessage.text));
      }  

      if (req.body.messages.hasOwnProperty( "KeyboardMessage")){ 
        msglist.push( new KeyboardMessage( req.body.messages.KeyboardMessage ))
      }

      if (req.body.messages.hasOwnProperty(RichMediaMessage) ){ 
        msglist.push( new RichMediaMessage ( req.body.messages.RichMediaMessage  ))
      }



      bot.sendMessage( req.body.userProfile,  msglist );    
      applog.info( `Message sent `   ,label);
      return res.status(200 ).json({ok: true});
   });

  
});

app.get('/api/users', function(req, res, next) {
  
  return res.status(200 ).json({ users_profiles:  bot_users});

});


if(!module.parent){ 

  
  server.listen(port, function(){
      applog.info("=================================================================================");
      applog.info(`Встановлюю web hook: ${iwh} `)
      applog.info("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      bot.setWebhook(iwh)
      .then(result=>{
        applog.info(`YES-YES-YES-YES-YES-YES-ВСТАНОВЛЕНО УСПІШНО: ${ JSON.stringify( result )}`);
      })
      .catch(error => {
          applog.error(`Error setup viber webhook  ${JSON.stringify(error)}` );
          if ( !typeof error.message === "undefined"){
              applog.error("Error message:" + error.message);
          }
          
          applog.error("=====================================================================");

      });
    });
}
module.exports = server;