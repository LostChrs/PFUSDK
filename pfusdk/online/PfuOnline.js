

var msg = require("./PfuMsg");
var config = require("../PfuConfig");
const appId = config.appId;
const wxId = config.wxId;
const version = config.version;

const urlGetOpenId = "https://wxsessionkey.jfydgame.com/user/121";
const urlPfuLogin = "https://login.jfydgame.com/user/1003";
const urlCommonShare = "https://info.jfydgame.com/user/1332";
const urlInviteList= "https://info.jfydgame.com/user/1334";
const urlGetUserInfoList= "https://info.jfydgame.com/user/1333";
const urlUploadUserInfo= "https://info.jfydgame.com/user/1801";//上传用户信息
const urlGAClick = "https://info.jfydgame.com/user/2201";
const urlGAVideo = "https://info.jfydgame.com/user/2202";
const urlGetAdsList = "https://wxhz.jfydgame.com/jfyd_advert_wechat/wxbox";
//pfuSdkBoxRelive  跳转盒子复活
var pfuOnline = {
    bOpenAds:false,
    uid:"",
    topPath:"",
    shareTime:2000,
    shareTitle1:"分享到群才行哦",
    shareTitle2:"请分享到不同的群哦~",
    onlineCbList:[],
    canSend:true,//限制消息重复发送
    initData(callback){
        var self = this;
        this.getWeChatOnlineParameters(function(data){
            console.log(data);
            if(data.code == msg.CODE.OK){
                //init
                self.topPath = data.toppath;
                self.ingameadvert = data.value["1"];//微信互推广告-开屏广告
                self.officialaccount = data.value["2"];//微信互推广告-公众号
                self.moregame = data.value["3"].adverts;//更多游戏 bannerLink
                self.updateBannerLink();
                self.wechatparam = data.value["4"].value;//微信在线参数
                if(self.wechatparam.pfuSdkShareTime){
                    self.shareTime = self.wechatparam.pfuSdkShareTime;
                }
                if(self.wechatparam.pfuSdkShare1){
                    self.shareTitle1 = self.wechatparam.pfuSdkShare1;
                }
                if(self.wechatparam.pfuSdkShare2){
                    self.shareTitle1 = self.wechatparam.pfuSdkShare2;
                }
                

                self.wechatid = data.value["5"].value;//微信游戏参数(获取广告位ID)
                self.wechatshare = data.value["6"].value;//微信分享管理
                if(callback)callback();

                self.onlineCbList.forEach(cb => {
                    cb();
                });
            }
        });

        this._shareIdx = cc.sys.localStorage.getItem("shareIdx");
        if(!this._shareIdx){
            this._shareIdx = 0;
            cc.sys.localStorage.setItem("shareIdx",0);
        }
    },
    isTestMode(){
      if(!this.wechatparam)return true;
      return  this.wechatparam.pfuSdkTestMode && this.wechatparam.pfuSdkTestMode == "1";
    },

    addCb(cb){
        if(this.onlineCbList.indexOf(cb) < 0){
            this.onlineCbList.push(cb);
        }

        if(this.wechatparam){
            if(cb)cb();
        }
    },
    getAdsList(cb){
        let self = this;
        this._adsListCb = cb;
        let obj = {
            uid:"",
            wxid:config.wxId,
            from:""
        };
        msg.send(obj,urlGetAdsList,cb);
    },

    getOfficialAccount(){
        return this.getImagePath(this.officialaccount.adverts[0].link);
    },

    updateBannerLink(){
        this.bannerList = [];
        this.moregame.forEach(item => {
            if(item.bannerLink && item.bannerLink != ""){
                this.bannerList.push(item);
            }
        });
    },
    getImagePath(path){
        return this.topPath + path;
    },
    canShareLife(){
        return this.bShareLife && (this.ShareNum < this.MaxShareNum);
    },
   
    getWeChatOnlineParameters(callback) {
        console.log("getWeChatOnlineParameters...");
        if(this.uid == ""){
            this.uid = cc.sys.localStorage.getItem("uid");
            if(!this.uid){
                this.uid = this.getUid();
                cc.sys.localStorage.setItem("uid",this.uid);
            }
        }
        let url = 'https://wxad.jfydgame.com/jfyd_advert_wechat/';
        let content = {
            uid: this.uid,
            appId: appId,
            version: version,
            wechatgameid:wxId,
            functions:"0"//全部请求
        };
        msg.send(content,url,callback);
    },
    //开屏广告
    showOpenAds() {
        if(this.wechatparam.pfuSdkShowOpenAds &&this.wechatparam.pfuSdkShowOpenAds == "0")return;
        let list = this.ingameadvert.adverts;
        if(list.length <= 0)return;
        let idx = parseInt(Math.random()*list.length);
        let url = this.getImagePath(list[idx].link);
       // console.log("OpenAdsIdx:"+url);
        if (url){
            wx.previewImage({
                current:url,
                urls: [
                    url,
                ],
                success: function (args) {
                    console.log("识别成功", args);
                },
                fail: function (args) {
                    console.log("识别失败", args);
                }
            });
        }       
    },
    showMoreGame(gameIdx){
        let list = [];
        this.moregame.forEach(game => {
            let url = this.getImagePath(game.link); 
            list.push(url);
        });
        wx.previewImage({
            current:list[gameIdx],
            urls: list,
            success: function (args) {
                console.log("识别成功", args);
            },
            fail: function (args) {
                console.log("识别失败", args);
            }
        });
    },
    getShareInfo(){
        if(this.wechatshare.length <=0)return null;
        let info = this.wechatshare[this._shareIdx];
        this._shareIdx++;
        if(this._shareIdx >= this.wechatshare.length){
            this._shareIdx = 0;
        }
        cc.sys.localStorage.setItem("shareIdx",this._shareIdx);
        return info;
    },
    
    checkNeedOpen(){
        let launchOptions = wx.getLaunchOptionsSync();
        let appid = null;
        if (launchOptions.referrerInfo){
            appid = launchOptions.referrerInfo.appId;
        }
        console.log("refId:"+appId);
        var needShow = true;
        let idList = ["wxe675b6aad9612c74","wxa9da0461bfaa8629","wxd6f44b18b8fed9f2","wx5608cdb7dc533937","wx1c6779e7455970f3","wx3818a9742bc06d62","wxd0157feb71d5cadf"];
        for(let i=0;i<idList.length;i++){
            if(idList[i] == appid){
                needShow = false;
            }
        }
        return needShow;
    },

    pfuLogin(code,playTime,cb){
        if(!this.canSend)return;
        this.sendDelay();
        let launchOptions = wx.getLaunchOptionsSync();
        let data = {
            Channel:"weixin",
            ext3:code,
            selfid:wxId,
            onlineTime:playTime
        };
        let appid = null;
        if (launchOptions.referrerInfo){
            appid = launchOptions.referrerInfo.appId;
            data.srcid = appid;
        }
        let sceneId = launchOptions.scene;
        if(sceneId == 1007 ||sceneId ==1008 ||sceneId ==1044 ||sceneId ==1096){
            data.srcid = "share";
            
        }
        if(sceneId ==1005 ||sceneId ==1006||sceneId == 1027||sceneId == 1042||sceneId == 1053){
            data.srcid = "search";
        }

        // 参数的query字段中可以获取到gdt_vid、weixinadinfo、channel等参数值
        let query = launchOptions.query;
        let gdt_vid = query.gdt_vid;
        let weixinadinfo = query.weixinadinfo;
        // 获取⼴告id
        let aid = 0;
        if (weixinadinfo) {
            let weixinadinfoArr = weixinadinfo.split(".");
            aid = weixinadinfoArr[0];
            data.srcid = "weixinad_"+aid;
        }
        let shareImage = query.shareImage;
        if (shareImage && shareImage != "") {
            data.srcid = "share_"+shareImage;
        }

        let fromUid = query.fromUid;
        if (fromUid && fromUid != "") {
            data.rinviteUid = fromUid;
        }
        msg.sendCommonShare(data,urlPfuLogin,null,cb);
    },

    pfuCommonShare(shareUid,loginToken,cb){
        
        if(loginToken == ""){
            this.errorNoLogin();
            return;
        }
        let data = {
            shareUid:Number(shareUid),
            rinviteGameid:parseInt(appId),
            rinvitePos:1,
            isNew:true,//新邀请玩家统计
        };
        
        msg.sendCommonShare(data,urlCommonShare,loginToken,cb);
    },

    pfuGetInviteList(loginToken,cb){
        if(loginToken == ""){
            this.errorNoLogin();
            return;
        }
        let data = {};
        msg.sendCommonShare(data,urlInviteList,loginToken,cb);
    },

    pfuGetUserInfoList(uids,loginToken,cb){
        if(loginToken == ""){
            this.errorNoLogin();
            return;
        }
        let data = {
            uids:uids,
        };
        msg.sendCommonShare(data,urlGetUserInfoList,loginToken,cb);
    },

    pfuCheckIOSOrder(orderId,loginToken,cb){
        if(loginToken == ""){
            this.errorNoLogin();
            return;
        }
        let url = "https://weixinpay.jfydgame.com/"+config.appId+"/pay/checkPaySucc.jsp";
        let data = {
            orderId:orderId,
            appid:config.wxId
        };

        msg.sendCommonShare(data,url,loginToken,cb);
    },

    pfuGetUserOrderList(loginId,loginToken,cb){
        if(loginToken == ""){
            this.errorNoLogin();
            return;
        }
        let url = "https://weixinpay.jfydgame.com/"+config.appId+"/pay/getPayList.jsp";
        let data = {
            openId:loginId,
            channelId:"weixin"
        };

        msg.sendCommonShare(data,url,loginToken,cb);
    },


    pfuUploadUserInfo(nickName,userImage,loginToken,cb){
        if(loginToken == ""){
            this.errorNoLogin();
            return;
        }
        let data = {
            name:nickName,
            sex:-1,
            level:-1,
            energy:-1,
            coin:-1,
            ingot:-1,
            mapId:-1,
            pic:-1,
            picUrl:userImage,
        };
        msg.sendCommonShare(data,urlUploadUserInfo,loginToken,cb);
    },

    pfuGAClick(type,picId,loginToken){
        if(!this.canSend)return;
        if(loginToken == ""){
            this.errorNoLogin();
            return;
        }
        this.sendDelay();
        let data ={
            type:type,
            picId:picId
        };
        msg.sendCommonShare(data,urlGAClick,loginToken);
    },

    pfuGAVideo(type,loginToken){
        if(!this.canSend)return;
        if(loginToken == ""){
            this.errorNoLogin();
            return;
        }
        this.sendDelay();
        let data ={
            type:type
        };
        msg.sendCommonShare(data,urlGAVideo,loginToken);
    },

    sendDelay(){
        this.canSend = false;
        setTimeout(()=>{
            this.canSend = true;
        },1500);
    },

    getUid(){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
    },
    errorNoLogin(){
        this.log("没有登录");
    },
    log(str){
        console.log("[PFU SDK ONLINE] "+str);
    }
}


module.exports = pfuOnline;