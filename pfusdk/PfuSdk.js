//PfuSdk 
const VERSION = "0.3.0";
const online = require("PfuOnline");
const config = require("PfuConfig");

const GAType = cc.Enum({
    MoreGame: 5,
    GameList: 6,
    VideoFinished: 7,
    ShareNum: 8
});

let jumpBoxId = "";

const marginTopOffY = 20;

const PfuSdk = cc.Class({
    extends: cc.Component,
    statics: {
        Instance: null,
        sessionKey: "",
        loginToken: "",
        loginId: "",
        uid: "",
        pfuUserInfo: null,
        bannerAd: null,
        bannerRelive:null,
        videoAdSuccessCb: null,
        reliveCb: null,
        mScreenRatio: 0,
    },
    properties: {
        executionOrder: -1000,
        pbBannerRelive: cc.Prefab,
        pbLandingPage: cc.Prefab,
    },
    onLoad() {
        if (PfuSdk.Instance == null) {
            PfuSdk.Instance = this;
            cc.game.addPersistRootNode(this.node);
        } else {
            if (PfuSdk.Instance != this) {
                this.node.destroy();
                return;
            }
        }
        let self = this;
        this._inviteNum = 0;
        PfuSdk.mScreenRatio = cc.winSize.height / cc.winSize.width;
        this.log("Version:" + VERSION);
        this._bannerHideState = false;
        this._startShare = false;
        this._shareNum = 0;
        this._preShareCountMax = 5;//视频前分享成功次数
        this._successShareCount = 0;//已经分享成功次数
        this._pfuShareSucNum = 1;
        this._pfuCurSucNum = 0;

        this._pfuBoxReliveNum = 3;
        this._pfuCurReliveNum = this.getItem("pfuCurReliveNum", 0);
        this._haveJumpBox = this.getItem("pfuHaveJumpBox",false);

        this._maxBannerRefreshCount = 5;
        this._dailyPlayTimeLimit = 3;

        this._shareTitle1 = "分享到群才行哦";
        this._shareTitle2 = "请分享到不同的群哦~";
        this._shareTitle3 = "有群友点击即可获得奖励，是否分享更多群？";
        this._bannerType = 1;
        this._pfuSdkRealShare = 1;
        this._inviteFriendInfoList = this.getItem("inviteFriendInfoList");
        if (!this._inviteFriendInfoList) {
            this._inviteFriendInfoList = [];
            this.setItem("inviteFriendInfoList", []);
        }

        this.requestOnlineParams();
        this._loginCount = 0;//尝试登录次数
        this.login();
        this.initShare();
        this.createReliveBanner();

        //用户时长
        this._userPlayTime = parseInt(this.getItem("pfuSdkUserPlayTime", 1));//sec
        this._loginTs = this.getNowTimestamp();
        this.schedule(() => {
            this.recordPlayTime();
        }, 120);

        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            this.log("用户时长：" + this._userPlayTime);
            wx.onShow(res => {
                this.onAppShow(res);
            });

            wx.onHide(res => {
                this.onAppHide();
            });

        }

        this.onAppShow();
        this._shareFlag = false;//看完视频重置
    },
    //刘海屏
    isIphoneX() {
        return PfuSdk.mScreenRatio >= 19 / 9;
    },
    //普通全面屏
    isFullScreen() {
        return 1.789 < PfuSdk.mScreenRatio && PfuSdk.mScreenRatio < 19 / 9;
    },
    //是否显示分享按钮
    isShowShareBtn() {
        //永远显示视频
        return false;
    },
    resetDailyTask() {
        this.log("重置每日信息===============");
        this._shareNum = 0;
        this.setItem("pfuSdkShareNum", 0);

        this._successShareCount = 0;
        this.setItem("pfuSdkSuccessShareCount", 0);

        this.setItem("pfuRedpacketGive", false);//每日简单的重置状态
        //红包领取天数
        let redDay = this.getItem("pfuRedpacketDay", 0);
        this.setItem("pfuRedpacketDay", redDay + 1);
        //每日领取次数
        this.setItem("pfuRedpacketDailyCount", 0);

        this.setItem("bannerReliveCount", 0);

        this._haveJumpBox = false;
        this.setItem("pfuHaveJumpBox", false);

        this._bannerRefreshCount = 0;//每日banner刷新次数
        this.setItem("pfuBannerRefreshCount", 0);
        this.resetDailyPlayTime();
    },
    //今日游玩时间
    getDailyPlayTime() {
        const playTime = Math.abs(this.getDiffFromNow(this._dailyTs));
        return playTime;
    },
    //重置在线时长
    resetDailyPlayTime(){
        this._dailyTs = this.getNowTimestamp();
        this.setItem("pfuDailyTs", this._dailyTs);
    },
    onAppHide(launchOptions) {
        //记录一次游玩的时间
    },

    getPlayTime() {
        return this._userPlayTime;
    },

    recordPlayTime() {
        const playTime = Math.abs(this.getDiffFromNow(this._playTimeTs));
        //this.log("记录游玩时间--->" + playTime + ",当前游玩总时长:" + this._userPlayTime);
        this._userPlayTime += playTime;
        this.setItem("pfuSdkUserPlayTime", this._userPlayTime);

        this._playTimeTs = this.getNowTimestamp();
    },
    onAppShow(launchOptions) {
        let self = this;
        if (!launchOptions) {
            if (cc.sys.platform == cc.sys.WECHAT_GAME) {
                launchOptions = wx.getLaunchOptionsSync();
            }
        }
        if (launchOptions) {
            this.log("场景值:" + launchOptions.scene);
            if (launchOptions.scene == 1037 || launchOptions.scene == 1038) {
                if (launchOptions.referrerInfo && launchOptions.referrerInfo.appId == jumpBoxId) {
                    //复活
                    if (PfuSdk.reliveCb) {
                        PfuSdk.reliveCb();
                        PfuSdk.reliveCb = null;
                    }
                }
            }
        }

        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            if (typeof wx.getUpdateManager === 'function') {
                const updateManager = wx.getUpdateManager()

                updateManager.onCheckForUpdate(function (res) {
                    // 请求完新版本信息的回调
                    console.log(res.hasUpdate)
                })

                updateManager.onUpdateReady(function () {
                    // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                    updateManager.applyUpdate()
                })

                updateManager.onUpdateFailed(function () {
                    // 新的版本下载失败
                })
            }
        }

        this._playTimeTs = this.getNowTimestamp();
        this.log("当前游玩总时长:" + this._userPlayTime);

        let loginTime = Math.abs(this.getDiffFromNow(this._loginTs));
        if (loginTime > 3600) {
            this.relogin();
        }
        //检测新日期
        const recordDate = this.getItem("recordDate");
        if (recordDate) {
            let date = new Date();
            let d = date.getUTCDate();
            if (d != recordDate) {
                console.log("----检查每日登陆:" + d + "->" + recordDate);
                this.setItem("recordDate", d);
                this.resetDailyTask();
            } else {
                this._shareNum = this.getItem("pfuSdkShareNum", 0);
                this._successShareCount = this.getItem("pfuSdkSuccessShareCount", 0);
                this._bannerRefreshCount = this.getItem("pfuBannerRefreshCount", 0);
                this._bannerReliveCount = this.getItem("bannerReliveCount", 0);

                //每日登陆时间戳
                this._dailyTs = parseInt(this.getItem("pfuDailyTs", this._playTimeTs));
            }
        } else {
            let date = new Date();
            let d = date.getUTCDate();
            this.setItem("recordDate", d);

            this.resetDailyTask();
        }

        const shareConfirm = () => {
            this._pfuCurSucNum++;
            this.showModel("提示", this._shareTitle3, "确定", "取消", () => {
                this.showShare({
                    success: this._shareCb,
                    fail: this._shareFailCb
                })
            }, () => {
                if (this._shareCb) {
                    this._shareCb();
                    this._hadShareFinish = false;
                }
            });
        };

        // if (this._hadShareFinish && this._startShare) {
        //     this._startShare = false;
        //     if(this._pfuCurSucNum >= this._pfuShareSucNum){
        //         if (this._shareCb) {
        //             this._shareCb();
        //             this._hadShareFinish = false;
        //         }
        //     }else{
        //         shareConfirm();
        //     }
        //     return;
        // }

        const finishShare = () => {
            this._hadShareFinish = true;
            // if(this._pfuCurSucNum < this._pfuShareSucNum){
            //     shareConfirm();
            // }
            this._shareCb && this._shareCb();
            this._shareFlag = true;
            this._successShareCount++;
            this._shareNum++;
            this.setItem("pfuSdkShareNum", this._shareNum);
            this.setItem("pfuSdkSuccessShareCount", this._successShareCount);
        };

        if (this._startShare) {
            this._startShare = false;
            let ts = this.getDiffFromNow(this.getItem("shareTs"));
            let needTime = (online.shareTime / 1000);
            if (needTime >= 5) needTime = 5;
            if (!this.isTestMode()) {
                if (Math.abs(ts) > needTime) {
                    if (this._shareCb) {
                        finishShare();
                    }
                } else {
                    if (this._shareCb) {
                        let shareContent = "";
                        if (Math.abs(ts) < this._preShareCountMax) {
                            shareContent = this._shareTitle1;
                        } else {
                            shareContent = this._shareTitle2;
                        }
                        this.showModel("提示", shareContent, "继续", "放弃", () => {
                            this.showShare({
                                success: this._shareCb,
                                fail: this._shareFailCb
                            })
                        }, () => {
                            if (this._shareFailCb) {
                                this._shareFailCb();
                            }
                        });
                    }
                }
            }

        }
    },

    bannerReliveSuccess() {
        this._bannerReliveCount++;
        this.setItem("bannerReliveCount", this._bannerReliveCount);
    },
    getOfficialAccount() {
        return online.getOfficialAccount();
    },
    isTestMode() {
        return online.isTestMode();
    },

    //时间戳方法
    getNowTimestamp() {
        //毫秒000
        const time = Date.parse(new Date());
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
    },
    start() {

    },
    //登录
    login() {
        //微信登录
        if (cc.sys.platform != cc.sys.WECHAT_GAME) return;
        if (this._isLogin) return;

        if (this._loginCount > 3) {
            this.log("已到达最大尝试登录次数！请检查参数配置是否正确！");
            return;
        }
        this._loginCount++;
        let self = this;
        wx.login({
            success: res => {
                online.pfuLogin(res.code, this._userPlayTime, data => {
                    if (data.state == 3) {
                        this.log("SDK登录成功");
                        this._loginTs = this.getNowTimestamp();
                        PfuSdk.sessionKey = data.sk;
                        PfuSdk.loginToken = data.loginToken;
                        PfuSdk.loginId = data.loginId;
                        PfuSdk.uid = data.uid;
                        PfuSdk.pfuUserInfo = data;
                        self._isLogin = true;
                        let info = self.getUserInfo();
                        if (info) {
                            if (!PfuSdk.pfuUserInfo.name) {
                                online.pfuUploadUserInfo(info.nickName, info.avatarUrl, PfuSdk.loginToken);
                            }
                        }
                        self.checkOrderList();
                        //判断是否是邀请进来的新用户
                        self.checkNewInviteUser();
                        //获取分享列表
                        self.getInviteList();

                        if (config.openInviteListListner) {
                            self.schedule(this.getInviteList, config.inviteListUpdateTime, cc.macro.REPEAT_FOREVER);
                        }
                    } else {
                        this.log("SDK登录错误：" + data.state);
                        this.unschedule(this.login);
                        this.scheduleOnce(this.login, 2);
                    }

                });
            }
        })

    },

    relogin() {
        //重新登录
        if (cc.sys.platform != cc.sys.WECHAT_GAME) return;
        let self = this;
        wx.login({
            success: res => {
                online.pfuLogin(res.code, this._userPlayTime);
                this._loginTs = this.getNowTimestamp();
            }
        });
    },

    getUserInfo() {
        this._wxUserInfo = this.getItem("wxUserInfo");
        return this._wxUserInfo;
    },


    //开屏二维码
    showOpenAds() {
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            online.showOpenAds();
        }
    },
    //Banner复活剩余次数
    getBannerReliveNum() {
        let maxNum = this._bannerRelive ? this._bannerRelive : 0;
        let curNum = this._bannerReliveCount;
        let playTime = this._userPlayTime;
        let limitPlayTime = this._controlPlayTime ? this._controlPlayTime : 200;

        let dailyPlayTime = this.getDailyPlayTime();
        this.log(`最大复活次数${maxNum},当前已复活次数${curNum},玩家游玩时间${playTime},限制时间${limitPlayTime * 60},每日限制时间${this._dailyPlayTimeLimit},今日已玩时间${dailyPlayTime}`);
        if (curNum >= maxNum) {
            return 0;
        }

        if (playTime > limitPlayTime * 60 && dailyPlayTime > this._dailyPlayTimeLimit * 60) {
            return maxNum - curNum;
        }

        return 0;
    },

    /*
    * Banner复活
    * success 成功回调
    * fail 失败回调
    */
    showBannerRelive(obj) {
        const num = this.getBannerReliveNum();
        if (num <= 0) {
            this.log("没有Banner复活次数");
            this.showVideo(obj);
            return;
        }

        let ui = this.createUI(this.pbBannerRelive);
        if (ui) {
            ui.getComponent("PfuBannerRelive").show(obj);
            if (PfuSdk.bannerRelive) {
                PfuSdk.bannerRelive.show();
            }

        }
    },

    createReliveBanner(){
        if (cc.sys.platform != cc.sys.WECHAT_GAME) return;
        if (config.bannerReliveId == "") return;
        const bannerBgY = 60 * this._wxRatio;
        let bannerAd = wx.createBannerAd({
            adUnitId: config.bannerReliveId,
            style: {
                left: 0,
                top: 0,
                width: this._wxWidth
            }
        });
        bannerAd.onResize(size => {
            bannerAd.style.top = this._wxHeight / 2 + bannerBgY;
            bannerAd.style.left = 0;
        });


        bannerAd.onError(err => {
            this.log("复活Banner创建失败:"+JSON.stringify(err));
        });

        PfuSdk.bannerRelive = bannerAd;
        PfuSdk.bannerRelive.hide();
    },

    showLandingPage(info) {
        let ui = this.createUI(this.pbLandingPage);
        ui.getComponent("PfuLandingPage").show(info);
    },

    resetBannerPos() {
        PfuSdk.bannerRelive&&PfuSdk.bannerRelive.hide();
    },
    //从左上角为原点的cocos坐标值 y
    getBannerTop() {
        const offY = this._bannerType == 1?0:marginTopOffY;
        if (this.isIphoneX()) {
            return cc.winSize.height - config.bannerHeight - config.bannerOffYForIpx - config.ipxBanner;
        } else {
            return cc.winSize.height - config.bannerHeight;
        }
    },
    setPosWithBanner(node){
        let widget = node.getComponent(cc.Widget);
        if(!widget){
            widget = node.addComponent(cc.Widget);
        }
        widget.isAlignBottom = true;
        const y = cc.winSize.height - this.getBannerTop();
        console.log("y==========="+y);
        widget.bottom = y;
    },
    createUI(pb) {
        let root = this.node.parent;
        if (root) {
            let ui = cc.instantiate(pb);
            ui.parent = root;
            ui.zIndex = 2000;
            return ui;
        } else {
            this.log("错误：未到找根节点");
            return null;
        }
    },

    /*
    * 红包
    */
    isHideRedpacket() {
        if (!online.wechatparam) return false;
        if (this.isTestMode()) return true;

        if (online.wechatparam.pfuSdkRed && online.wechatparam.pfuSdkRed == "1") {
            return false;
        }
        return true;
    },
    setRedpacketCallback(cb) {
        this._redpacketCallback = cb;
        if (online.wechatparam) {
            if (this._redpacketCallback) this._redpacketCallback();
        }
    },

    isHideCustomer(){
        if (!online.wechatparam) return false;
        if (this.isTestMode()) return true;

        if (online.wechatparam.pfuSdkCustomer && online.wechatparam.pfuSdkCustomer == "1") {
            return false;
        }
        return true;
    },

    //在线参数回调
    setOnlineParamsCallback(cb) {
        this._onlineParamsCallback = cb;
        if (online.wechatparam) {
            if (this._onlineParamsCallback) this._onlineParamsCallback(online.wechatparam);
        }
    },
    //获取微信在线参数
    getOnlineParams() {
        if (online.wechatparam) return online.wechatparam;
        this.log("缺少在线参数");
        return null;
    },

    requestOnlineParams() {
        let self = this;
        online.initData(() => {
            self.showOpenAds();
            this.log("requestOnlineParams:" + JSON.stringify(online.wechatparam));
            self._preShareCountMax = parseInt(online.wechatparam.pfuSdkShareCount);
            self._shareTitle1 = online.wechatparam.pfuSdkShare1;
            self._shareTitle2 = online.wechatparam.pfuSdkShare2;
            self._shareTitle3 = online.wechatparam.pfuSdkShare3;
            self._pfuShareSucNum = parseInt(online.wechatparam.pfuSdkShareSucNum);
            self._pfuSdkRealShare = 0;//parseInt(online.wechatparam.pfuSdkRealShare);
            self._pfuBoxReliveNum = parseInt(online.wechatparam.pfuSdkBoxReliveNum);
            self._maxBannerRefreshCount = parseInt(online.wechatparam.pfuSdkBannerCount);
            self._minBannerRefreshTime = parseInt(online.wechatparam.pfuSdkBannerMin);//sec
            self._controlPlayTime = parseInt(online.wechatparam.pfuSdkPlayTime);//min 控制某些功能开关
            self._dailyPlayTimeLimit = parseInt(online.wechatparam.pfuSdkDailyTime);

            self._bannerType = parseInt(online.wechatparam.pfuSdkBannerMargin);
            self._bannerRelive = parseInt(online.wechatparam.pfuSdkBannerRelive);
            self._refreshBannerTime = parseInt(online.wechatparam.pfuSdkRefresh);
            self.createBanner();
            self.scheduleOnce(self.createBanner, self._refreshBannerTime);
            if (self._onlineParamsCallback) self._onlineParamsCallback(online.wechatparam);
            if (self._redpacketCallback) self._redpacketCallback();

            cc.systemEvent.emit("PfuOnline");
        });
    },



    //跳转盒子复活
    jumpGameboxForRelive(cb) {
        if(this.isTestMode()){
            if (cb) cb();
            return;
        }
        if(this._haveJumpBox || this._pfuCurReliveNum >= this._pfuBoxReliveNum){
            this.showBannerRelive({
                success:cb
            });
            return;
        }
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            PfuSdk.reliveCb = cb;
            let jumpId = "wx3e33fef689f472b1";
            if (online.wechatparam.pfuSdkBoxRelive) {
                if (cc.sys.os === cc.sys.OS_ANDROID) {
                    jumpId = online.wechatparam.pfuSdkBoxRelive;
                } else {
                    jumpId = online.wechatparam.pfuSdkBoxReliveIOS;
                }
            }

            if (this.checkDirectJump(jumpId)) {
                jumpBoxId = jumpId;
                wx.navigateToMiniProgram({
                    appId: jumpId,
                    path: "pages/index/index?pfukey=" + config.wxId + "&pfuRelive=true",
                    extraData: { pfukey: config.wxId, pfuRelive: true },
                    success(res) {
                        this._pfuCurReliveNum++;
                        this.setItem("pfuCurReliveNum",this._pfuCurReliveNum);
                        this._haveJumpBox = true;
                        this.setItem("pfuHaveJumpBox",true);
                    },
                    fail(res) {
                        PfuSdk.reliveCb = null;
                    }
                })
            } else {
                this.showBannerRelive({
                    success:cb
                });
            }
        } else {
            if (cb) cb();
        }
    },

    //分享
    initShare() {
        let self = this;
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            wx.getSystemInfo({
                success: function (res) {
                    console.log(JSON.stringify(res));
                    self._wxWidth = res.windowWidth;
                    let r = res.windowWidth / cc.winSize.width;
                    self._wxRatio = r;
                    self._wxHeight = res.windowHeight;
                    self._wxHeightRation = res.windowHeight / cc.winSize.height;
                    if (config.bannerId != "") {

                    }
                }
            });

            wx.showShareMenu({
                withShareTicket: true
            });

            wx.onShareAppMessage(function () {
                // 用户点击了“转发”按钮
                if (!online.isTestMode()) {
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

    /*
    shareParams 分享参数
    title 分享标题
    imageUrl 分享图片
    success 成功回调
    fail 失败回调
    */
    showShare(obj = {}) {
        let cb = obj.success || null;
        let failCb = obj.fail || null;
        let parmas = obj.shareParams || null;
        let title = obj.title || null;
        let imageUrl = obj.imageUrl || null;

        this._shareCb = cb;
        this._shareFailCb = failCb;
        let self = this;
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            this._startShare = true;
            this._pfuCurSucNum = 0;
            this.setItem("shareTs", this.getNowTimestamp());

            let queryData = "fromUid=" + PfuSdk.uid;
            if (parmas) {
                queryData += "&" + parmas;
            }
            if (!online.isTestMode()) {
                let shareInfo = online.getShareInfo();
                let gaid = this.getGAID(shareInfo.shareLink);
                online.pfuGAClick(GAType.ShareNum, gaid, PfuSdk.loginToken);

                queryData += "&shareImage=" + gaid;
                let shareTitle = title ? title : shareInfo.desc;
                let shareImage = imageUrl ? imageUrl : online.getImagePath(shareInfo.shareLink);
                wx.shareAppMessage({
                    title: shareTitle,
                    imageUrl: shareImage,
                    query: queryData,
                    withShareTicket: true,
                });
            } else {
                let shareTitle = title ? title : "快来和我一起玩吧~";
                wx.shareAppMessage({
                    title: shareTitle,
                    query: queryData,
                    withShareTicket: true,
                });
            }

        } else {
            if (cb) cb();
        }
    },

    loadAds(cb, placementId) {
        if (cc.sys.platform != cc.sys.WECHAT_GAME) {
            if (cb) cb(true);
            return;
        }

        let videoAd = wx.createRewardedVideoAd({
            adUnitId: placementId
        });
        videoAd.load()
            .then(() => {
                if (cb) cb(true);
            }).catch(err => {
                if (cb) cb(false);
            });
    },
    /*
    * 进入界面时主动刷新banner,能否刷新成功由函数内部判断
    */
    refreshBanner(failCb,force) {
        if (PfuSdk.bannerAd == null) return;
        this._bannerRefreshCount = this.getItem("pfuBannerRefreshCount");
        if (!force && this._bannerRefreshCount >= this._maxBannerRefreshCount) return;

        let sec = this.getDiffFromNow(this._bannerLastTs);

        if (force || Math.abs(sec) >= this._minBannerRefreshTime) {

            this.createBanner(failCb);
        }
    },

    createBanner(failCb) {
        if (cc.sys.platform != cc.sys.WECHAT_GAME) return;
        if (config.bannerId == "") return;

        let self = this;
        if (PfuSdk.bannerAd != null) {

            //banner隐藏时不增加刷新次数
            if (!this._bannerHideState) {
                PfuSdk.bannerAd.destroy();
                this._bannerRefreshCount += 1;
                this.setItem("pfuBannerRefreshCount", this._bannerRefreshCount);
            } else {
                return;
            }
        }
        this._bannerLastTs = this.getNowTimestamp();

        let targetHeight = config.bannerHeight;
        let designSizeH = this._wxRatio * targetHeight;

        let offY = 0;
        if (this.isIphoneX()) {
            offY = config.bannerOffYForIpx ? config.bannerOffYForIpx : 1;
        }

        if(this._bannerType != 1){
            offY -= marginTopOffY;
        }
        offY = offY * this._wxRatio;
        const bannerWidth = this._bannerType == 1? this._wxWidth:this._wxWidth-20;
        this.log("重新创建了Banner");
        let bannerAd = wx.createBannerAd({
            adUnitId: config.bannerId,
            style: {
                left: 0,
                top: 0,
                width: bannerWidth
            }
        });
        this._haveBanner = true;
        bannerAd.onResize(size => {
            bannerAd.style.top = self._wxHeight - designSizeH - offY;
            bannerAd.style.left = self._wxWidth / 2 - size.width / 2;
        });

        bannerAd.onError(err => {
            this.log("Banner onError:" + JSON.stringify(err));
            this._haveBanner = false;
            if (failCb) failCb();
        })

        PfuSdk.bannerAd = bannerAd;

        this._resetBannerState();
        this.tryRefreshBanner();
    },

    tryRefreshBanner() {
        if (this._refreshBannerTime) {
            this.unschedule(this.createBanner);
            if (this._bannerRefreshCount < this._maxBannerRefreshCount) {
                this.scheduleOnce(this.createBanner, this._refreshBannerTime);
            }
        }
    },
    /*
    * 是否显示界面的 分享勾选框
    */
    isShareCheckbox() {
        if (this.isTestMode()) return false;
        const state = this.getShareState();
        if (state == 1 || state == 2) {
            return true;
        } else {
            return false;
        }
    },

    /*
        justWatch 直接看视频(跳过所有参数控制)
        videoPlacement 广告位ID
        success  成功回调
        fail 失败回调
    */
    showVideo(obj = {}) {
        let self = this;
        let cb = obj.success || null;
        let failCb = obj.fail || null;
        let placementId = obj.videoPlacement || config.videoId;
        let justWatch = obj.justWatch || false;

        if (cc.sys.platform != cc.sys.WECHAT_GAME) {
            if (cb) cb();
        } else {
            if (this.isTestMode()) {
                if (cb) cb();
                return;
            }
            if (!placementId || placementId == "") {
                this.showTips("视频暂未开放");
                return;
            }
            let videoAd = wx.createRewardedVideoAd({
                adUnitId: placementId
            });

            PfuSdk.videoAdSuccessCb = cb;
            videoAd.onClose(res => {
                self._resetBannerState();
                if (res && res.isEnded) {
                    // 正常播放结束，可以下发游戏奖励
                    online.pfuGAVideo(GAType.VideoFinished, PfuSdk.loginToken);
                    if (PfuSdk.videoAdSuccessCb) {
                        PfuSdk.videoAdSuccessCb();
                        PfuSdk.videoAdSuccessCb = null;
                    }
                    self._shareFlag = false;
                }
                else {
                    // 播放中途退出，不下发游戏奖励
                    if (failCb) failCb();
                }

            });

            videoAd.onError(err => {
                self.log("ShowVideo onError:" + JSON.stringify(err));

                self._resetBannerState();
                //非审核模式下播放视频失败，会走分享
                if (!online.isTestMode()) {
                    self.showShare({
                        success: cb,
                        fail: failCb
                    });
                } else {
                    if (failCb) failCb();
                }
            });
            const playVideo = () => {
                videoAd.show().then(() => {
                    //隐藏banner
                    if (PfuSdk.bannerAd) {
                        PfuSdk.bannerAd.hide();
                    }
                });
            };

            const state = this.getShareState();
            videoAd.load().then(() => {
                if (!justWatch && !this.isTestMode() && self._shareFlag == false && state != 0) {
                    if (state == 1) {
                        self.showShare({
                            success: () => {
                                playVideo();
                            },
                            fail: failCb
                        })
                    } else if (state == 2) {
                        self.showShare({ success: () => { } });
                        playVideo();
                    }

                } else {
                    playVideo();
                }

            });
        }
    },
    getShareState() {
        if (!online.wechatparam) return 0;
        return online.wechatparam.pfuSdkVideoShare ? parseInt(online.wechatparam.pfuSdkVideoShare) : 0
    },
    _resetBannerState() {
        this.HideBanner(this._bannerHideState);
    },

    HideBanner(hide) {
        //这里记录banner状态
        this._bannerHideState = hide;
        //this.log("HideBanner-->" + hide);
        if (PfuSdk.bannerAd) {
            if (hide) {
                PfuSdk.bannerAd.hide();
            } else {
                PfuSdk.bannerAd.show();
            }
        }
    },


    //支付
    payIos(pName, pPrice) {
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            const orderId = new Date().getTime();
            this._payOrder = orderId;
            //透传字段
            const attach = {
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
    payAndroid(pName, pPrice) {
        this.log("安卓支付");
    },

    /*
    * 更多游戏START
    */

    //更多游戏图标自动更新，请在获取在线参数后调用,传入需要更新的sprite
    setMoreGame(spLeft, spRight) {
        if ((online.wechatparam.pfuSdkMoreGame && online.wechatparam.pfuSdkMoreGame == "0") || this.isTestMode())  {
            this.log("隐藏更多游戏按钮");
            if (spLeft) spLeft.node.active = false;
            if (spRight) spRight.node.active = false;
            return;
        }


        this._moreGameSpriteLeft = spLeft;
        this._moreGameSpriteRight = spRight;
        this.unschedule(this.updateMoreGameBtn);

        //get list
        this._moreGameListLeft = [];
        this._moreGameListRight = [];

        const selfId = config.wxId;

        online.moregame.forEach(item => {
            //首先过滤自己的id
            if (item.wxid != selfId && item.boxId != selfId) {
                let condition1 = false;
                if (cc.sys.os == cc.sys.OS_IOS) {
                    condition1 = this.checkDirectJump(item.wxid);
                } else {
                    condition1 = this.checkDirectJump(item.boxId);
                }
                let condition2 = false;// (item.link && item.link != "");
                if (condition1 || condition2) {
                    if (item.position === "0") {
                        this._moreGameListLeft.push(item);
                    } else {
                        this._moreGameListRight.push(item);
                    }
                }
            }

        });


        if (spLeft) {
            this.addButtonClick(spLeft.node, this.onMoreGameClick.bind(this));
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

        if (spRight) {
            this.addButtonClick(spRight.node, this.onMoreGameClick.bind(this));
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
    onMoreGameClick(event, node) {
        this.log("onMoreGameClick:" + JSON.stringify(node.gameInfo));
        let info = node.gameInfo;
        let gaid = this.getGAID(info.iconlink);
        online.pfuGAClick(GAType.MoreGame, gaid, PfuSdk.loginToken);
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            let path = info.path ? info.path : "";
            let jumpId = info.wxid;
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jumpId = info.boxId;
            }
            if (jumpId && jumpId != "" && this.checkDirectJump(jumpId)) {
                wx.navigateToMiniProgram({
                    appId: jumpId,
                    path: path
                })
            }
            else {
                if (info.link && info.link != "") {
                    wx.previewImage({
                        urls: [online.getImagePath(info.link)]
                    });
                }
            }
        }

    },

    checkDirectJump(wxId) {
        if (!wxId || wxId == "") return false;
        let list = config.navigateToMiniProgramAppIdList;
        for (let i = 0; i < list.length; i++) {
            if (wxId == config.wxId) return false;

            if (list[i] == wxId) {
                return true;
            }
        }

        return false;
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
        if (this._moreGameSpriteLeft && !cc.isValid(this._moreGameSpriteLeft.node)) {
            this._moreGameSpriteLeft = null;
        }

        if (this._moreGameSpriteRight && !cc.isValid(this._moreGameSpriteRight.node)) {
            this._moreGameSpriteRight = null;
        }

        if (this._moreGameSpriteLeft == null && this._moreGameSpriteRight == null) {
            this.unschedule(this.updateMoreGameBtn);
            return;
        }
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

    setSpriteByUrl(sprite, url) {
        let self = this;
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            let image = wx.createImage();
            image.src = url;
            image.onload = res => {
                self._texture = new cc.Texture2D();
                self._texture.initWithElement(image);
                self._texture.handleLoadedTexture();
                let sp = new cc.SpriteFrame(self._texture);
                sprite.spriteFrame = sp;
            };
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

    addButtonClick(btnNode, callback) {
        btnNode.on(cc.Node.EventType.TOUCH_START, function (event) {
            if (callback) callback(event, btnNode);
        }, this);
    },

    /*
    * 更多游戏END
    */

    /*
    * 邀请START
    */
    checkNewInviteUser() {
        if (!this._isLogin) {
            this.log("checkNewInviteUser-->请先登录");
            return;
        }

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

    getNewInviteNum() {
        return this._inviteNum;
    },

    useInvite() {
        if (this._inviteNum <= 0) return;
        this._inviteNum--;
        for (let i = 0; i < this._inviteFriendInfoList.length; i++) {
            if (this._inviteFriendInfoList[i].used == false) {
                this._inviteFriendInfoList[i].used = true;
                break;
            }
        }

        this.setItem("inviteFriendInfoList", this._inviteFriendInfoList);
        if (this._inviteChangeCallback) this._inviteChangeCallback();
    },

    listenInviteChange(cb) {
        this._inviteChangeCallback = cb;
    },
    //世界排行榜
    sendWorldRankInfo(data, cb) {
        online.sendWorldRankInfo(data, PfuSdk.loginToken, cb);
    },
    getWorldRankList(data, cb) {
        online.getWorldRankList(data, PfuSdk.loginToken, cb);
    },
    /*
    * 邀请END
    */
    setItem(key, value) {
        cc.sys.localStorage.setItem(key, JSON.stringify(value));
    },
    getItem(key, defaultValue) {
        let rt = cc.sys.localStorage.getItem(key);
        if (rt) {
            return JSON.parse(rt);
        } else {
            if (defaultValue) {
                this.setItem(key, defaultValue);
                return defaultValue;
            } else {
                return null;
            }
        }
    },
    //截取md5值
    getGAID(picUrl) {
        // let temp = picUrl.split("/");
        // let temp1 = temp[temp.length-1].split(".");
        // return temp1[0];

        return picUrl;
    },
    log(str) {
        console.log("[PFUSDK] " + str);
    },
    showTips(str) {
        if (cc.sys.platform == cc.sys.WECHAT_GAME) {
            wx.showToast({
                title: str,
                icon: 'none',
                duration: 2000
            })
        }

    },
    showModel(title, content, confirmText, cancelText, confirm, cancel) {
        if (cc.sys.platform == cc.sys.WECHAT_GAME) {
            wx.showModal({
                title: title,
                content: content,
                cancelText: cancelText,
                confirmText: confirmText,
                success(res) {
                    if (res.confirm) {
                        if (confirm) confirm();
                    } else if (res.cancel) {
                        if (cancel) cancel();
                    }
                }
            })
        }

    }
});
