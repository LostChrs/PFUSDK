
const config = require("PfuConfig");
const PfuSdk = require("PfuSdk");
cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    onLoad(){
        const btn = this.getComponent(cc.Button);
        btn.node.on("click",this.onKefuClick,this);
    },

    start(){

    },

    updateBtnState(){
        this.node.active =  !PfuSdk.Instance.isHideCustomer();
    },

    onEnable() {
        cc.systemEvent.on("PfuOnline",this.updateBtnState,this);
    },
    onDisable(){
        cc.systemEvent.off("PfuOnline",this.updateBtnState,this);
    },

    onKefuClick(){
        if(cc.sys.platform === cc.sys.WECHAT_GAME){
            if(!wx.navigateToMiniProgram)return;
            wx.navigateToMiniProgram({
                appId: "wx3e33fef689f472b1",
                path: "pages/report/report?gameName=" + config.gameName,
                //envVersion:"trial",
                success(res) {
  
                },
                fail(res) {

                }
            })
        }
    }

});
