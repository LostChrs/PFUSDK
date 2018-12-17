//msg
var base64 = require("./PfuBase64").base64;
var md5 = require("./PfuMd5").hexMD5;
var config = require("../PfuConfig");
var msg = {
    CODE:{
      OK: "101",//消息成功
      SIGN_FAIL: "201",//验签失败
      WRONG_PARMS: "202",//参数异常
      LIKE_FAIL: "203",//点赞失败
      TAP_EVENT_FAIL: "204",//记录点击事件失败
      UID_FAIL: "205",//获取uid失败
    },
    md5Key: "60cff75d0d1e4d548d9f4bca35916b21",
    send: function (data, url, callback,isGet,attachInfo) {

      attachInfo = attachInfo || "";
      //发送消息 
      var self = this;
      var json = JSON.stringify(data);
      console.log("[PFUSDK] Request Data:"+json);
      var base = base64;
      var baseStr = base.encode(json);
      var md5Str = md5(baseStr + self.md5Key);
      var result = "content=" + baseStr + "&sign=" + md5Str;
      var reqUrl = url + '?' + attachInfo + result;
      console.log("[PFUSDK] Request:"+reqUrl);
      let xhr = new window.XMLHttpRequest();//
      if(isGet){
        xhr.open("GET",reqUrl);
      }else{
        xhr.open("POST",reqUrl);
      }
      
      xhr.onreadystatechange = function () {
        //console.log("xhrstatus:"+xhr.status);
          if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
              let response = xhr.responseText;
              var resObject = self.getResult(response);
              if (callback) callback(resObject);
          } else {
              //callback(-1);
          }
      };
        xhr.send();
      return result;
    },
    sendCommonShare: function (data, url,loginToken, callback) {

      //发送消息 
      var self = this;
      var json = JSON.stringify(data);
      console.log("[PFUSDK] Request Data:"+json);
      var base = base64;
      var baseStr = base.encode(json);
      var md5Str = md5(baseStr + self.md5Key);
    
      var result = "";
      if(loginToken){
        var token = md5(loginToken + config.privateKey);
        result =  "sign=" + md5Str +"&content=" + baseStr +"&p="+token;
      }else{
        result =  "sign=" + md5Str +"&content=" + baseStr;
      }
      
      var reqUrl = url + '?sVersion=1024&pType=2&'+result;
      console.log("[PFUSDK] Request:"+reqUrl);
      let xhr = new window.XMLHttpRequest();//
      xhr.open("GET",reqUrl);
      
      xhr.onreadystatechange = function () {
          if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
              let response = xhr.responseText;
              var resObject = self.getResult(response);
              if (callback) callback(resObject);
          } else {
              //callback(-1);
          }
      };
      xhr.send();
      return result;
    },
    getResult: function (data) {
      var json = base64.decode(data);
      console.log("[PFUSDK] Msg:"+json);
      return JSON.parse(json);
    }
}

module.exports = msg