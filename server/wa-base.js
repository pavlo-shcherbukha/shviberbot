
const IBMCloudEnv = require('ibm-cloud-env');
const apperror = require('./error/appError');
const applib = require('./applib/apputils');

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
    constructor(logger) {

      
      this.applog= logger;      
      this.assistant = new AssistantV2(  {
                                            version: i_wa_apiversion,
                                            authenticator: new IamAuthenticator({apikey: i_wa_apikey}),
                                            serviceUrl: i_wa_url
                                          }
                                      );
      this.session=null;  
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
    


    TOVIBERMSG_TextToTextMessage(wa_text){
        let reg= /\[[^\[\]]*?\]\(.*?\)|^\[*?\]\(.*?\)/gm;
        //let reg=new RegExp("\[[^\[\]]*?\]\(.*?\)|^\[*?\]\(.*?\)", "gm");
        let url_arr=[];
        let re_text="";

        let re_str=wa_text
        let re_result=re_str.match(reg);
        if (re_result===null){
          // return only textmessage
          re_text=re_str;
        } else {
          for (var i = 0, l = re_result.length; i < l; i++) {
            // go 
            let re_mdurl=re_result[i];
            let re_urlvobj=this.parse_md_url(re_mdurl)
            url_arr.push(re_urlvobj);
            re_str=re_str.replace(  reg, " " )
            re_text=re_str;

          }
          

        }
        let res={text: re_text, urlarr: url_arr};
        return res;
    }      

    
    TOVIBERMSG_OptionToKeyboardMessage(wa_option){
      const V_SAMPLE_KEYBOARD = {
        "Type": "keyboard",
        "Revision": 1,
        "Buttons": []
      };
      const V_BUTTON = {
        "Columns": 3,
        "Rows": 2,
        "BgColor": "#e6f5ff",
        "BgMedia": "http://www.jqueryscript.net/images/Simplest-Responsive-jQuery-Image-Lightbox-Plugin-simple-lightbox.jpg",
        "BgMediaType": "picture",
        "BgLoop": true,
        "ActionType": "reply",
        "ActionBody": "Yes"
      };

      for (var i = 0, l = wa_option.options.length; i < l; i++) {

        let lopt=wa_option.options[i];
        let v_btn1={
          "Columns": 3,
          "Rows": 2,
          "BgColor": "#E1E1E1",
          //"BgMedia": "https://img.freepik.com/free-vector/whatsapp-icon-design_23-2147900929.jpg?w=740&t=st=1687700044~exp=1687700644~hmac=4a8224f0c44ad56e5250a4592cd511f7ee224e7d6717b5c31e00d2558a22c625",
          "BgMedia": "https://a268-46-118-231-225.ngrok-free.app/btn",
          "BgMediaType": "picture",
          "BgLoop": true ,         
          "ActionType": "reply",
          "ActionBody": lopt.value.input.text,
          "Text": lopt.label
        };
        let v_btn = {
          "Columns": 4,
          "Rows": 3,
          "Text": lopt.label,
          "TextSize": "regular",
          "TextHAlign": "left",
          "TextVAlign": "top",
          "ActionType": "reply",
          "ActionBody": lopt.value.input.text,
          "BgColor": "#f6f7f9"
        }

        V_SAMPLE_KEYBOARD.Buttons.push(v_btn);

      }
      return V_SAMPLE_KEYBOARD

    }
   

} // end class def


module.exports = {
  BaseWatson
  
};
    










