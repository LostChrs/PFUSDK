//PfuSdk 
const VERSION = "1.0.0";
var online = require("./online/PfuOnline");
var config = require("./PfuConfig");

var GAType = cc.Enum({
    MoreGame:5,
    GameList:6,
    VideoFinished:7
});

var PfuSdk = cc.Class({
    extends: cc.Component,
    statics: {
        Instance: null,
        sessionKey: "",
        loginToken: "",
        loginId: "",
        uid: "",
        pfuUserInfo: null,
    },
    properties: {

    },
    onLoad() {
        if (PfuSdk.Instance == null) {
            PfuSdk.Instance = this;
            cc.game.addPersistRootNode(this.node);
        } else {
            if (PfuSdk.Instance != this) {
                this.node.destroy();
            }
        }
        let self = this;
        self._isIphoneX = (cc.winSize.height / cc.winSize.width) >= 2;
        this.log("Version:"+VERSION);
        cc.game.on(cc.game.EVENT_SHOW, function () {
            self.onAppShow();
        });
        cc.game.on(cc.game.EVENT_HIDE, function () {
            self.onAppHide();
        });
        this._startShare = false;
        this._inviteFriendInfoList = this.getItem("inviteFriendInfoList");
        if (!this._inviteFriendInfoList) {
            this._inviteFriendInfoList = [];
            this.setItem("inviteFriendInfoList", []);
        }

        this.requestOnlineParams();
        this.login();
        this.initAds();
        this.initShare();
    },
    onAppShow() {
        let self = this;
        let launchOptions = wx.getLaunchOptionsSync();
        this.log("场景值:" + launchOptions.scene);
        //验证支付
        this.checkOrderList();
        if (launchOptions.scene == 1037 || launchOptions.scene == 1038) {
            if (launchOptions.referrerInfo.extraData) {
                //this.log("支付结果:" + launchOptions.referrerInfo.extraData.result);

            } else {
                if (!launchOptions.referrerInfo.extraData.result) {
                    
                }
            }
        }

        if(this._startShare){
            this._startShare = false;
            let ts = this.getDiffFromNow(this.getItem("shareTs"));
            if(Math.abs(ts) > 2){
                if(this._shareCb)this._shareCb();
            }
        }
    },
    onAppHide(){
        
    },
    //时间戳方法
    getNowTimestamp() {
        //毫秒000
        var time = Date.parse(new Date());
        return time;
    },
    //当前时间经过一定sec后的时间戳
    getTimestampAfterSec(sec) {
        let now = this.getNowTimestamp();
        now += sec * 1000;
        return now;
    },
    //一个时间戳和当前的差值(sec)  timestamp - now
    getDiffFromNow(timeStamp) {
        let now = this.getNowTimestamp();
        let diff = timeStamp - now;
        return diff / 1000;
    },
    checkOrderList() {
        return;
        //支付列表
        online.pfuGetUserOrderList(PfuSdk.loginId, PfuSdk.loginToken, (data) => {
            this.log("支付列表:" + JSON.stringify(data));
        });
    },
    start() {
        
    },
    //登录
    login() {
        //微信登录
        if (cc.sys.platform != cc.sys.WECHAT_GAME) return;
        let self = this;
        wx.login({
            success: res => {
                online.pfuLogin(res.code, data => {
                    if (data.state == 3) {
                        PfuSdk.sessionKey = data.sk;
                        PfuSdk.loginToken = data.loginToken;
                        PfuSdk.loginId = data.loginId;
                        PfuSdk.uid = data.uid;
                        PfuSdk.pfuUserInfo = data;
                        self._isLogin = true;
                        self.getUserInfo();
                        self.checkOrderList();
                        //判断是否是邀请进来的新用户
                        self.checkNewInviteUser();
                        //获取分享列表
                        self.getInviteList();
                    }

                });
            }
        })
        if (config.openInviteListListner) {
            self.schedule(this.getInviteList, config.inviteListUpdateTime, cc.macro.REPEAT_FOREVER);
        }
    },

    getUserInfo() {
        this._wxUserInfo = cc.sys.localStorage.setItem("wxUserInfo");
        if (this._wxUserInfo) {
            if (!PfuSdk.pfuUserInfo.name) {
                online.pfuUploadUserInfo(this._wxUserInfo.nickName, this._wxUserInfo.avatarUrl, PfuSdk.loginToken);
            }
        }
    },
    //开屏二维码
    showOpenAds() {
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            online.showOpenAds();
        }
    },

    //在线参数回调
    setOnlineParamsCallback(cb) {
        this._onlineParamsCallback = cb;
        if (this._onlineParams) {
            if (this._onlineParamsCallback) this._onlineParamsCallback(this._onlineParams);
        }
    },
    //获取微信在线参数
    getOnlineParams() {
        if (this._onlineParams) return this._onlineParams;
        return null;
    },
    requestOnlineParams() {
        let self = this;
        online.initData(() => {
            self._onlineParams = online.wechatparam;
            self.showOpenAds();
            if (self._onlineParamsCallback) self._onlineParamsCallback(self._onlineParams);
        });
    },

    //支付
    payIos(pName, pPrice) {
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            var orderId = new Date().getTime();
            this._payOrder = orderId;
            //透传字段
            var attach = {
                uid: PfuSdk.uid,
                openid: PfuSdk.loginId,
                appid: config.wxId,
                productName: pName
            };
            wx.navigateToMiniProgram({
                appId: "wxb82f826b0d650def",
                path: "pages/pay/index?gameId=" + config.appId + "&productName=" + pName + "&productPrice=" + pPrice + "&orderId=" + orderId + "&attach=" + JSON.stringify(attach),
                success(res) {

                },
                fail(res) {

                }
            })
        }

    },
    payAndroid(pName,pPrice){
        this.log("安卓支付");
    },

    //分享
    initShare() {
        let self = this;
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            wx.getSystemInfo({
                success: function (res) {
                    self._wxWidth = res.windowWidth;
                    let r = res.windowWidth / cc.winSize.width;
                    self._wxRatio = r;
                    self._wxHeight = r * cc.winSize.height;
                    if (config.wxBannerId != "") {
                        self.createBanner();
                    }
                }
            });

            wx.showShareMenu({
                withShareTicket: true
            });

            wx.onShareAppMessage(function () {
                // 用户点击了“转发”按钮
                if (online.wechatparam.pfuSdkTestMode && online.wechatparam.pfuSdkTestMode == "0") {
                    let shareInfo = online.getShareInfo();
                    return {
                        title: shareInfo.desc,
                        query: "fromUid=" + PfuSdk.uid,
                        imageUrl: online.getImagePath(shareInfo.shareLink)
                    }
                } else {
                    return {
                        title: "快来和我一起玩吧~",
                        query: "fromUid=" + PfuSdk.uid,
                    }
                }
            })
        }
    },

    showShare(cb) {
        this._shareCb = cb;

        let self = this;
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            this._startShare = true;
            this.setItem("shareTs",this.getNowTimestamp());
            if (online.wechatparam.pfuSdkTestMode && online.wechatparam.pfuSdkTestMode == "0") {
                let shareInfo = online.getShareInfo();
                wx.shareAppMessage({
                    title: shareInfo.desc,
                    imageUrl: online.getImagePath(shareInfo.shareLink),
                    query: "fromUid=" + PfuSdk.uid,
                    withShareTicket: true,
                });
            } else {
                wx.shareAppMessage({
                    title: "快来和我一起玩吧~",
                    query: "fromUid=" + PfuSdk.uid,
                    withShareTicket: true,
                });
            }

        } else {
            if (cb) cb();
        }
    },
    //更多游戏图标自动更新，请在获取在线参数后调用,传入需要更新的sprite
    setMoreGame(spLeft, spRight) {

        if (online.wechatparam.pfuSdkMoreGame && online.wechatparam.pfuSdkMoreGame == "0") {
            if(spLeft) spLeft.node.active = false;
            if(spRight) spRight.node.active = false;
            return;
        }

       
        this._moreGameSpriteLeft = spLeft;
        this._moreGameSpriteRight = spRight;
        this.unschedule(this.updateMoreGameBtn);

        //get list
        this._moreGameListLeft = [];
        this._moreGameListRight = [];

        online.moregame.forEach(item => {
            if (item.position === "0") {
                this._moreGameListLeft.push(item);
            } else {
                this._moreGameListRight.push(item);
            }
        });

        if(spLeft){
            this.addButtonClick(spLeft.node,this.onMoreGameClick);
             //left
            if (this._moreGameListLeft.length > 0) {
                this._moreGameSpriteLeft.node.active = true;
                this._moreGameSpriteLeft.node.stopAllActions();
                this._moreGameSpriteLeft.node.runAction(this.getMoreGameAction());
                this._moreGameIdxLeft = 0;
            } else {
                this._moreGameSpriteLeft.node.active = false;
            }
        }

        if(spRight){
            this.addButtonClick(spRight.node,this.onMoreGameClick);
                //right
            if (this._moreGameListRight.length > 0) {
                this._moreGameSpriteRight.node.active = true;
                this._moreGameSpriteRight.node.stopAllActions();
                this._moreGameSpriteRight.node.runAction(this.getMoreGameAction());
                this._moreGameIdxRight = 0;
            } else {
                this._moreGameSpriteRight.node.active = false;
            }
        }
        this.updateMoreGameBtn();
        this.schedule(this.updateMoreGameBtn, 10, cc.macro.REPEAT_FOREVER, 0);
    },
    onMoreGameClick(btn){
        //this.log("onMoreGameClick:"+JSON.stringify(btn.node.gameInfo));
        let info = btn.node.gameInfo;
        let gaid = this.getGAID(info.iconlink);
        online.pfuGAClick(GAType.MoreGame,gaid,PfuSdk.loginToken);

        if (wx.navigateToMiniProgram) {
            wx.navigateToMiniProgram({
                appId: "wxe675b6aad9612c74",
                path: "pages/fromGame/singer?pfukey=" + info.wechatGameid,
                success(res) {
                    
                },
                fail(res) {
                    
                }
            })
        } else {
            wx.previewImage({
                current: info.link,
                urls: [info.link],
                success: function (args) {
                    
                },
                fail: function (args) {
                    
                }
            });
        }
    },
    getMoreGameAction() {
        let t = 0.4;
        let rot1 = cc.rotateTo(t, 25);
        let rot2 = cc.rotateTo(t, -25);
        let rot3 = cc.rotateTo(t, 0);
        let seq = cc.sequence(rot1, rot2, rot3).repeatForever();
        return seq;
    },
    updateMoreGameBtn() {
        let self = this;
        //left
        if (this._moreGameSpriteLeft && this._moreGameListLeft.length > 0) {
            this._moreGameIdxLeft++;
            if (this._moreGameIdxLeft >= this._moreGameListLeft.length) {
                this._moreGameIdxLeft = 0;
            }
            let info = this._moreGameListLeft[this._moreGameIdxLeft];
            self._moreGameSpriteLeft.node.gameInfo = info;
            if (info.iconlink != "" && info.iconlink != null) {
                let url = online.getImagePath(info.iconlink);
                
                this.getSpriteFrameByUrl(url, function (sp) {
                    self._moreGameSpriteLeft.spriteFrame = sp;
                });
            }
        }

        //right
        if (this._moreGameSpriteRight && this._moreGameListRight.length > 0) {
            this._moreGameIdxRight++;
            if (this._moreGameIdxRight >= this._moreGameListRight.length) {
                this._moreGameIdxRight = 0;
            }
            let info = this._moreGameListRight[this._moreGameIdxRight];
            self._moreGameSpriteRight.node.gameInfo = info;
            if (info.iconlink != "" && info.iconlink != null) {
                let url = online.getImagePath(info.iconlink);
                this.getSpriteFrameByUrl(url, function (sp) {
                    self._moreGameSpriteRight.spriteFrame = sp;
                });
            }
        }
    },

    getSpriteFrameByUrl(url, cb) {
        let self = this;
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            let image = wx.createImage();
            image.src = url;
            image.onload = res => {
                self._texture = new cc.Texture2D();
                self._texture.initWithElement(image);
                self._texture.handleLoadedTexture();
                let sp = new cc.SpriteFrame(self._texture);
                if (cb) cb(sp);
            };
        }
    },

    //获取邀请玩家列表
    checkNewInviteUser() {
        if (!this._isLogin) return;

        let isNewUser = this.getItem("HaveAccount");
        if (!isNewUser) {
            this.setItem("HaveAccount", true);

            //检测是否通过分享进入
            let launchOptions = wx.getLaunchOptionsSync();
            let shareTicket = launchOptions.shareTicket;
            let fromUid = launchOptions.query.fromUid;
            // this.log("检测是否从分享进入:"+JSON.stringify(shareTicket)+",quary:"+JSON.stringify(fromUid));
             //用户从分享卡片进入
            if (fromUid && fromUid != "") {
                online.pfuCommonShare(fromUid, PfuSdk.loginToken, (data) => {
                    this.log("邀请好友成功:" + JSON.stringify(data));
                });
            }
        }
    },

    getInviteList() {
        if (!this._isLogin || PfuSdk.loginToken == "") return;
        let self = this;
        online.pfuGetInviteList(PfuSdk.loginToken, data => {
            if (data.state == 3) {
                this.log("获取列表成功:" + JSON.stringify(data.uids));
                if (data.uids) {
                    self._inviteList = data.uids.split(",");
                    self.updateInviteData();
                }
            }
        });
    },
    getHaveInviteNum() {
        return this._inviteList.length;
    },
    haveInviteGift() {
        for (let i = 0; i < this._inviteFriendInfoList.length; i++) {
            if (this._inviteFriendInfoList[i].getGift == false) {
                return true;
            }
        }
        return false;
    },
    updateInviteData() {
        let self = this;
        this._inviteNum = 0;//this._inviteList.length;

        //存储玩家是否领取了奖励
        let idList = "";
        let bChange = false;
        for (let i = 0; i < this._inviteList.length; i++) {
            let userInfo = this.getInviteUserInfo(this._inviteList[i]);
            if (userInfo == null) {
                bChange = true;
                let obj = {
                    uid: this._inviteList[i],
                    getGift: false,
                    used: false,
                }
                this._inviteFriendInfoList.push(obj);
                this._inviteNum++;

                if (idList != "") {
                    idList += ",";
                }

                idList += obj.uid;
            } else {
                if (userInfo.used == false) {
                    this._inviteNum++;
                }
            }

        }

        if (bChange) {
            this.setItem("inviteFriendInfoList", this._inviteFriendInfoList);
            //有邀请成功的用户，提示
        }


        if (idList != "") {
            online.pfuGetUserInfoList(idList, PfuSdk.loginToken, data => {
                if (data.state == 3) {
                    this.log("获取用户信息成功:" + JSON.stringify(data.infos));
                    let list = data.infos;
                    let bChange = true;
                    for (let i = 0; i < list.length; i++) {
                        let userInfo = self.getInviteUserInfo(list[i].uid);
                        if (list[i].name && list[i].pickUrl) {//有信息

                            userInfo.name = list[i].name;
                            userInfo.picUrl = list[i].pickUrl;
                        } else {
                            //随机假信息
                            userInfo.name = "匿名用户";
                            userInfo.picUrl = null;
                        }
                    }
                    if (bChange) {
                        this.setItem("inviteFriendInfoList", self._inviteFriendInfoList);
                    }
                }
            });
        }

        if (this._inviteChangeCallback) this._inviteChangeCallback();
    },
    onInviteFriendGetGiftFinish(pId) {
        let userInfo = this.getInviteUserInfo(pId);
        if (userInfo) {
            userInfo.getGift = true;
            this.setItem("inviteFriendInfoList", this._inviteFriendInfoList);
        }
    },
    //得到邀请玩家的属性
    getInviteUserInfo(pId) {
        for (let i = 0; i < this._inviteFriendInfoList.length; i++) {
            if (this._inviteFriendInfoList[i].uid == pId) {
                return this._inviteFriendInfoList[i];
            }
        }
        return null;
    },

    getInviteUserInfoList() {
        return this._inviteFriendInfoList;
    },
    //广告
    initAds() {
        if (cc.sys.platform != cc.sys.WECHAT_GAME) return;
        let self = this;
        //视频广告
        if (config.wxVideoId != "") {
            self._isPlayingVideo = false;
            let videoAd = wx.createRewardedVideoAd({
                adUnitId: config.wxVideoId
            });
            videoAd.onClose(res => {
                if (self._bannerAd) {
                    self._bannerAd.show();
                }
                if (res && res.isEnded && self._isPlayingVideo) {
                    // 正常播放结束，可以下发游戏奖励
                    online.pfuGAVideo(GAType.VideoFinished,PfuSdk.loginToken);
                    if (self._videoCallback) self._videoCallback();
                }
                else {
                    // 播放中途退出，不下发游戏奖励
                    if (self._videoCloseCallback) self._videoCloseCallback();
                }
                self._isPlayingVideo = false;
            });

            videoAd.onError(err => {
                self.checkBanner();
            })
            this._videoAds = videoAd;
        }

       
    },

    loadAds(cb) {
        if (cc.sys.platform != cc.sys.WECHAT_GAME) {
            if (cb) cb(true);
            return;
        }
        this._videoAds.load()
            .then(() => {
              
                if (cb) cb(true);
            }).catch(err => {
                
                if (cb) cb(false);
            });
    },

    createBanner() {
        let self = this;
        if (self._bannerAd != null) {
            self._bannerAd.destroy();
        }
        let needWidth = config.bannerSize == 1?750:200;
        let offY = self._isIphoneX ? 20:0;
        let bannerAd = wx.createBannerAd({
            adUnitId: config.wxBannerId,
            style: {
                left: 0,
                top: 0,
                width: self._wxRatio * needWidth,
            }
        });
        bannerAd.onResize(res => {
            bannerAd.style.top = self._wxHeight - res.height - offY;
            bannerAd.style.left = self._wxWidth / 2 - res.width / 2;
        });

        bannerAd.onError(err => {
            
        })

        self._bannerAd = bannerAd;
        if (self._isPlayingVideo == false) {
            bannerAd.show().catch(err => {
               
                self.scheduleOnce(self.createBanner, 5);
            })
        }
    },

    showVideo(cb, failCb, closeCb) {
        if (cc.sys.platform != cc.sys.WECHAT_GAME) {
            if (cb) cb();
        } else {
            if (online.wechatparam.pfuSdkVideoShare && online.wechatparam.pfuSdkVideoShare == "1") {
                this.showShare();
            }
            this._videoCloseCallback = closeCb;
            this._videoCallback = cb;
            let self = this;
            let rewardedVideoAd = this._videoAds;
            rewardedVideoAd.show()
                .catch(err => {
                    self.HideBanner(false);
                    if(failCb)failCb();
                }).then(() => {
                    self._isPlayingVideo = true;
                    //隐藏banner
                    if (self._bannerAd) {
                        self._bannerAd.hide();
                    }
                });
        }
    },
    checkBanner() {
        this.HideBanner(false);
    },
    HideBanner(hide) {
        this._isPlayingVideo = hide;
        if (this._bannerAd) {
            if (hide) {
                this._bannerAd.hide();
            } else {
                this._bannerAd.show();
            }
        }
    },
    setSpriteByUrl(sprite,url){
        let self = this;
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            let image = wx.createImage();
            image.src = url;
            image.onload = res =>{
                self._texture = new cc.Texture2D();
                self._texture.initWithElement(image);
                self._texture.handleLoadedTexture();
                let sp = new cc.SpriteFrame(self._texture);
                sprite.spriteFrame = sp;
            };
        }

    },
    setItem(key, value) {
        cc.sys.localStorage.setItem(key, JSON.stringify(value));
    },
    getItem(key) {
        let rt = cc.sys.localStorage.getItem(key);
        if (rt) {
            return JSON.parse(rt);
        } else {
            return null;
        }
    },
    addButtonClick(btnNode,callback){
        if(!btnNode.getComponent(cc.Button)){
            btnNode.addComponent(cc.Button);
        }

        btnNode.on('click', callback, this);
    },
    //截取md5值
    getGAID(picUrl){
        let temp = picUrl.split("/");
        let temp1 = temp[temp.length-1].split(".");
        return temp1[0];
    },
    log(str){
        console.log("[PFUSDK] "+str);
    }
});
