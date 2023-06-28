
const IBMCloudEnv = require('ibm-cloud-env');
const apperror = require('./error/appError');
const applib = require('./applib/apputils');


const TextMessage = require('viber-bot').Message.Text;
const UrlMessage  = require('viber-bot').Message.Url;
const PictureMessage = require('viber-bot').Message.Picture;
const RichMediaMessage = require('viber-bot').Message.RichMedia;
const KeyboardMessage = require('viber-bot').Message.Keyboard;
const StickerMessage = require('viber-bot').Message.Sticker;

const vbtextButton = require("./config/vbtextbutton.json")
const vbbuttonsList = require("./config/vbbuttonsList.json");

IBMCloudEnv.init('/server/config/mappings.json');
i_wa_apikey= IBMCloudEnv.getString('wa_apikey') ;
i_wa_url= IBMCloudEnv.getString('wa_url') ;
i_wa_apiversion= IBMCloudEnv.getString('wa_version') ;
i_wa_assistantid=IBMCloudEnv.getString('wa_assistantid') ;

// Конфігурація логера
const { LogContext,  AppLogger } = require('./config/logcontext');

const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');


class BaseWatson {
    constructor(logger, aTextMessage, aUrlMessage, aPictureMessage, aKeyboardMessage, aStickerMessage) {

      
      this.applog= logger;      
      this.assistant = new AssistantV2(  {
                                            version: i_wa_apiversion,
                                            authenticator: new IamAuthenticator({apikey: i_wa_apikey}),
                                            serviceUrl: i_wa_url
                                          }
                                      );
      this.session=null;  
      this.TextMessage = aTextMessage; 
      this.UrlMessage = aUrlMessage; 
      this.PictureMessage = aPictureMessage; 
      this.KeyboardMessage = aKeyboardMessage; 
      this.StickerMessage = aStickerMessage;

    }

    createSession(){
      var that=this;
      return new Promise(function (resolve, reject) {
        that.assistant.createSession({
          assistantId: i_wa_assistantid
        })
        .then(res => {
            that.applog.info( "!!!====Watson Session=====^" + JSON.stringify(res, null, 2));
            that.session = res.result.session_id
            return resolve( { ok: true, wasession: res.result.session_id});
        })
        .catch(err => {
          that.applog.error(err.message);
          return reject(err);

        });
      });

    }

    sendWAMessage( wasession, wamsg){

        var that=this;
        return new Promise(function (resolve, reject) {
          that.assistant.message({
                                      assistantId: i_wa_assistantid,
                                      sessionId: wasession,
                                      input: {
                                        'message_type': 'text',
                                        'text': wamsg
                                        }
                                })
          .then (wares=>{
              return resolve(wares);
          })  
          .catch ( err =>{                            
            return reject(err);
          });
        });    
    }

    parse_md_url(a_mdurl){
      //  \[(.*?)\]\((.*?)\)
      let p_reg_url = /\(([^()]*)\)/g;
                      
      let p_reg_name = /\[(.*?)\]/g;
      let p_url_obj={};
      let p_url="";
      let p_name="";
    
      let p_url_result=a_mdurl.match(p_reg_url)
      let p_name_result=a_mdurl.match(p_reg_name)
      let p_link_rgs=/(\[(.*?)\])(\(([^()]*)\))/gm
      let p_link_result=p_link_rgs.exec(a_mdurl);
    
      if (p_link_result !== null){
        p_url=p_link_result[4];
        p_name=p_link_result[ 2];
      }  
      p_url_obj.url=p_url;
      p_url_obj.name=p_name;
      return p_url_obj
    }
    


    TOVIBERMSG_TextToTextMessage(wa_text, ){
        let reg= /\[[^\[\]]*?\]\(.*?\)|^\[*?\]\(.*?\)/gm;
        //let reg=new RegExp("\[[^\[\]]*?\]\(.*?\)|^\[*?\]\(.*?\)", "gm");
        let vb_msgs=[]
        let url_arr=[];
        let re_text="";
        let v_kbd_list = Object.assign({}, vbbuttonsList);
        if (v_kbd_list.Buttons.length !== 0) {
          v_kbd_list.Buttons=[];
        }

  

        let re_str=wa_text
        let re_result=re_str.match(reg);
        if (re_result===null){
          // return only textmessage
          re_text=re_str;
          vb_msgs.push( new TextMessage( re_str ));

        } else {
          for (var i = 0, l = re_result.length; i < l; i++) {
            // go 
            let re_mdurl=re_result[i];
            let re_urlvobj=this.parse_md_url(re_mdurl)

            //url_arr.push(re_urlvobj);
           
            re_str=re_str.replace(  reg, " " )
            vb_msgs.push( new TextMessage( re_str ));

            let v_btn={};
            v_btn=Object.assign({},  vbtextButton);
            v_btn.ActionType='open-url';
            v_btn.Text=`<font color="#f6f6f8">${re_urlvobj.name}</font>`;
            v_btn.ActionBody=re_urlvobj.url;
            v_btn.BgColor="#2323e7";
            v_kbd_list.Buttons.push(v_btn);            

          }
          vb_msgs.push( new KeyboardMessage(v_kbd_list));

        }
       
        return vb_msgs;
    }      

    
    TOVIBERMSG_OptionToKeyboardMessage(wa_option){
      let v_kbd_list = Object.assign({}, vbbuttonsList);
      if (v_kbd_list.Buttons.length !== 0) {
        v_kbd_list.Buttons=[];
      }

      for (var i = 0, l = wa_option.options.length; i < l; i++) {
        let lopt=wa_option.options[i];
        let v_btn={};
        v_btn=Object.assign({},  vbtextButton);
        v_btn.Text=lopt.label;
        v_btn.ActionBody=lopt.value.input.text
        v_kbd_list.Buttons.push(v_btn);

      }
      let xKeyboardMessage=new KeyboardMessage(v_kbd_list);
      return xKeyboardMessage;

    }
   

} // end class def


module.exports = {
  BaseWatson
  
};
    










