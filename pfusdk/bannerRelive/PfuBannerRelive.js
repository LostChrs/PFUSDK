
const PfuSdk = require("PfuSdk");
cc.Class({
    extends: cc.Component,

    properties: {
        bannerBg:cc.Node,
        btnSkip:cc.Node,
    },

    onLoad(){
        //在此界面切换到后台就算成功
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            wx.onShow(res => {
                this.onAppShow(res);
            });

            wx.onHide(res => {
                this.onAppHide();
            });
        }

        this.btnSkip.runAction(cc.fadeOut(0));
    },

    onAppShow(){
        console.log("onAppShow");
        this.onClickBanner();
    },
    onAppHide(){

    },

    show(obj = {}){
        this._isOut = false;
        this._successCb = obj.success;
        this._failCb = obj.fail;

        this.scheduleOnce(()=>{
            this.btnSkip.runAction(cc.fadeIn(1));
        },2);
    },
    onSkip(){
        if(this._failCb)this._failCb();
        this.onClose();
    },
    onClickBanner(){
        console.log("onClickBanner");
        this.scheduleOnce(()=>{
            if(this._successCb)this._successCb();
            this.onClose();
        },1.5);
       
    },
    onClose(){
        //还原banner状态
        PfuSdk.Instance.resetBannerPos();
        this.node.destroy();
    }
});
