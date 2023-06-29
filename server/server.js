const http = require('http');
const express = require('express');
const { json } = require('express');
const winston = require('./config/winston');
//const vbkbd = require('./config/vbkbd3.json');
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
const StickerMessage = require('viber-bot').Message.Sticker;

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
const wabase = require("./wa-base");
//const wa=new wabase.BaseWatson( applog );


app.use(morgan('combined', { stream: winston.stream }));

const IBMCloudEnv = require('ibm-cloud-env');
IBMCloudEnv.init('/server/config/mappings.json');

bot_token=IBMCloudEnv.getString('bot_token');
bot_uri=IBMCloudEnv.getString('bot_uri');
bot_name=IBMCloudEnv.getString('bot_name');
bot_expose_domain=IBMCloudEnv.getString('bot_expose_domain');
bot_expose_uri_path=IBMCloudEnv.getString('bot_expose_uri_path');


bot_operator_id=IBMCloudEnv.getString('bot_operator_id');




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

app.use(express.static(path.join(__dirname, '../public')));

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
/*
app.get('/btn',  function(req, res) {
  var filePath = path.join(__dirname, '../public/button.jpg');
  res.header('Content-Type', 'image/jpg');
  res.sendFile(  filePath , function(err){
    if (err){
      applog.info(`Error rendering index.html: ${err.message}`);
      return res.status(500).end();
    } else {
      return res.status(200).end(); 
    }

  });

});
*/
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


    /**
     * Знайти сервіс в масиві зреєсрованих сервісів
     * @param {*} service_list 
     * @param {*} service_id 
     * @returns 
     */
    function findservice( service_list, keyname ,service_id ){
      return new Promise(function (resolve) {
          return resolve( service_list.findIndex( (item ) => { 
                                                                  //console.log(  '1 ' + service_id);
                                                                  //console.log(  JSON.stringify(item));    
                                                                  //item.service_name === service_id 
                                                                  //xuserProfile.vuserProfile
                                                                  if (item.hasOwnProperty("vuserProfile")){
                                                                      if (item.vuserProfile[keyname].localeCompare(service_id ) === 0){
                                                                          return true;
                                                                      }
                                                                  }
                          }) )
      });
  } //findservice

  bot.on(BotEvents.TEST_MESSAGE_RECEIVED, (message, response) => {
    let xuserProfile={};
    return new Promise(function (resolve, reject) {
          findservice(bot_users, "id", response.userProfile.id)
          .then( rindex =>{
              if (rindex >= 0){
                  xuserProfile=bot_users[rindex];
                  applog.info( `Користувач уже існує ${xuserProfile.vuserProfile.id} - ${xuserProfile.vuserProfile.name} `, label);
                  applog.info( `Сесія Watson Assistant: ${xuserProfile.wa.session}`);
                  //return {ok: true, index: rindex} ;
                  return { ok: false, wasession: xuserProfile.wa.session} ;
              } else {
                  applog.info( `Додаю в масив--------------->UserProfile: ` + JSON.stringify(response.userProfile.name) ,label);
                  xuserProfile={
                    vuserProfile: response.userProfile,
                    wa: new wabase.BaseWatson( applog, TextMessage, UrlMessage, PictureMessage, KeyboardMessage, StickerMessage)
                  }
        
                  bot_users.push(xuserProfile);
                  bot_users_idx=bot_users.lastIndexOf( xuserProfile );
                  //webuiurl=`${bot_expose_domain}/chat.html?id=${response.userProfile.id}`
                  //response.send(  [ new TextMessage(` Для спілкування з собою перейдіть за URL, що вказано:`),
                  //                  new UrlMessage( webuiurl )] ); 
        
                  //return {ok: false, index: bot_users_idx} ;
                  return xuserProfile.wa.createSession();
              }
              
          })
          .then (result=>{
            applog.info(`Для користувача ${xuserProfile.vuserProfile.name}  Сесія зв'язку з Watson Assistant ${JSON.stringify(result)}`);

              //  перше повідомлення
              return resolve( 
                        response.send(  [ new TextMessage(` Ваш watson session: ${result.wasession}`)/*, new KeyboardMessage( vbkbd )*/] )
                    ); 
 
          })
          .catch( err => {
            applog.error( `make session: [ ${err.message} ] === ` + JSON.stringify(err) ,label);
            return reject(err)
          });
    });
  });
///======    

bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
  let xuserProfile={};
  return new Promise(function (resolve, reject) {
          findservice(bot_users, "id", response.userProfile.id)
          .then( rindex =>{
              if (rindex >= 0){
                

                  xuserProfile=bot_users[rindex];
                  applog.info( `Користувач уже існує ${xuserProfile.vuserProfile.id} - ${xuserProfile.vuserProfile.name} `, label);
                  applog.info( `Сесія Watson Assistant: ${xuserProfile.wa.session}`);

                  return { ok: false, wasession: xuserProfile.wa.session} ;
              } else {
                  applog.info( `Додаю в масив--------------->UserProfile: ` + JSON.stringify(response.userProfile.name) ,label);
                  xuserProfile={
                    vuserProfile: response.userProfile,
                    wa: new wabase.BaseWatson( applog )
                  }

                  bot_users.push(xuserProfile);
                  bot_users_idx=bot_users.lastIndexOf( xuserProfile );

                  return xuserProfile.wa.createSession();
              }
              
          })
          .then (result=>{
            applog.info(`Для користувача ${xuserProfile.vuserProfile.name}  Сесія зв'язку з Watson Assistant ${JSON.stringify(result)}`);
            if (result.ok){
              //  перше повідомлення
              //response.send(   new TextMessage(` Ваш watson session: ${result.wasession}`) ); 
            // kbd=new KeyboardMessage( vbkbd );
              //response.send(  kbd);
              return xuserProfile.wa.sendWAMessage(result.wasession, "")
            } else {
              // продовжую спілкування
              return xuserProfile.wa.sendWAMessage(result.wasession, message.text)
            }
            
          })
          .then( result=>{
              let vmessages=[];
              if ( result.result.hasOwnProperty("user_id") ){
                  // send assistant response to viber
                  applog.info(`WAAAAA!!!!   Відповідь Watson Assistant для ${xuserProfile.vuserProfile.name} watson session ${xuserProfile.wa.session} ::::  ${JSON.stringify(result.result)}`);
                 
                  for (var i = 0, l = result.result.output.generic.length; i < l; i++) {
                    var wamsg = result.result.output.generic[i];

                    if (  wamsg.response_type.localeCompare( "text")===0){
                          let msgs = []
                          msgs = xuserProfile.wa.TOVIBERMSG_TextToTextMessage( wamsg.text );
                          for (var mi=0, ml=msgs.length; mi<ml; mi++){
                              vmessages.push( msgs[mi] );
                          }
                      
                      //let msgs=wamsg.text; 
                      //let msgtext= new TextMessage(`WA: ${msgs}`)
                      //vmessages.push( msgtext );

                    } else if( wamsg.response_type.localeCompare( "option")===0 ) {  
                        let kbdmsg = xuserProfile.wa.TOVIBERMSG_OptionToKeyboardMessage( wamsg );
                        //let msg=new KeyboardMessage( kbdmsg)
                        //return  response.send(    msg  );
                        vmessages.push( kbdmsg );
                        //console.log("dddddd" + JSON.stringify(r1) ); 
                    } else if (   wamsg.response_type.localeCompare(  "connect_to_agent") === 0){
                      
                          findservice(bot_users, "id", response.userProfile.id)
                          .then( rindex =>{
                              if (rindex >= 0){
                                delete bot_users[rindex];
                                xuserProfile={};
                                applog.info(`Видаляю ${response.userProfile.id} - ${response.userProfile.name}`);
                              }
                          });    
                        
                            
                    } else if ( wamsg.response_type.localeCompare(  "pause") === 0){
                      //40132
                      vmessages.push(  new StickerMessage(sticker_id=40132) );
                    } else if ( wamsg.response_type.localeCompare(  "date") === 0){

                        vmessages.push( new TextMessage(`в форматі MM/dd/YYYY`) )
                    } else if ( wamsg.response_type.localeCompare(  "suggestion") === 0){
                      vmessages.push( new TextMessage(`1-INT: Неочікуваний тип повідомлення suggestion: ${JSON.stringify(wamsg)}`) )
         
                    } else {

                      vmessages.push(    new TextMessage(`2-INT: Неочікуваний тип повідомлення : ${wamsg.response_type}`)); 
                      applog.verbose(`####INT: Неочікуваний тип повідомлення : ${JSON.stringify(wamsg)}`)
                    }
                  }
              } else {
                vmessages.push( new TextMessage(`INT: WA шото не работает `))
                
              } 
              //return {ok: true};
              return response.send( vmessages ); 
          })
          .then (result =>{
              return resolve(result);
          })
          .catch( err=>{
              applog.error( `make session: [ ${err.message} ] === ` + JSON.stringify(err) ,label);
              return reject(err);
          });
    });      
});

// The user will get those messages on first registration
bot.onSubscribe(response => {
  say(response, `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`);
});

/*
bot.onTextMessage(/./, (message, response) => {
    response.send(new TextMessage(  'I am Bot. I send you response!!!  Your message is[' + message.text + ']' ))
    return;
});
*/

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
const io = require('socket.io')(server)

/*
app.post('/api/wtest', json(), function(req, res, next) {
  label='http-get:api-twtest' 
  let bot_webhookb = req.body 
  applog.info( `bot_webhook: ` + JSON.stringify(req.body) ,label);
  return res.status(200 ).json({ok: true});

});
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

app.get('/api/userp', function(req, res, next) {
    userid=req.query.id 
    /*
    findservice(bot_users, "id", userid)
    .then( rindex =>{
        if (rindex >= 0){
          return res.status(200 ).json( bot_users[rindex].vuserProfile);
        } else { 
          return res.status(200 ).json({});
        }

    }); 
    */
    let userProfile={
      "id": bot_operator_id,
      "avatar": null,
      "country": "UA",
      "language": "uk-UA",
      "apiVersion": 10
    };
    bot.getUserDetails(userProfile)
    .then( result =>{
      return res.status(200 ).json(result);
    })
    .catch(err=> {
      let errres={ ok: false, errtext: err.message};
      res.status(422 ).json(errres);
    });   
    

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

let users = 0

io.on('connection', (S) => {
  let user = false

  S.on('new message', (message, userProfile) => {
    //if (!typeof userProfile === "undefined") {
        bot.sendMessage( userProfile,  new TextMessage( `Користувач ${S.username} відправив пвідомлення: ${message}` ) ); 
    //}    
    S.broadcast.emit('new message', {
      username: S.username,
      message
    })
  })

  S.on('add user', (username,  userProfile) => {
    if (user) return

    S.username = username
    ++users
    user = true
    if (!typeof userProfile === "undefined") {
        bot.sendMessage( userProfile,  new TextMessage( `Користувач ${username} підключився до чату через WebUI` ) ); 
    }    
    
    S.emit('login', {
      users
    })

    S.broadcast.emit('user joined', {
      username: S.username,
      users
    })
  })

  S.on('typing', () => {
    S.broadcast.emit('typing', {
      username: S.username
    })
  })

  S.on('stop typing', () => {
    S.broadcast.emit('stop typing', {
      username: S.username
    })
  })

  S.on('disconnect', () => {
    if (user) {
      --users

      S.broadcast.emit('user left', {
        username: S.username,
        users
      })
    }
  })
})



module.exports = server;