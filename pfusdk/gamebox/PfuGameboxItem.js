var online = require("PfuOnline");
var PfuSdk = require("PfuSdk");
var config = require("PfuConfig");
cc.Class({
    extends: cc.Component,

    properties: {
        iconSp:cc.Sprite
    },

    initData(data){
        this._data = data;
        let self = this;
        //iconlink wechatgameid boxId
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            let url = data.link;
            let image = wx.createImage();
            image.src = url;
            image.onload = res =>{
                self._texture = new cc.Texture2D();
                self._texture.initWithElement(image);
                self._texture.handleLoadedTexture();
                let sp = new cc.SpriteFrame(self._texture);
                self.iconSp.spriteFrame = sp;
                self.resetSize(self.iconSp.node,sp,120);
            };
        }
    },

    resetSize(node,sp,h){
        if(node){
            //根据高度适应
            let rect = sp.getRect();
            let r = rect.height/rect.width;
            let w = h / r;
            node.height = h;
            node.width = w;
        }
    },
    checkDirectJump(wxId){
        let list = config.wxJumpAppIdList;
        for(let i=0;i<list.length;i++){
            if(list[i] == wxId){
                return true;
            }
        }

        return false;
    },
    onBtnClick(){
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            let info = this._data;
            let gaid = PfuSdk.Instance.getGAID(info.link);
            online.pfuGAClick(6,gaid,PfuSdk.loginToken);

            let path = info.path ? info.path : "";
            wx.navigateToMiniProgram({
                appId: info.wechatGameid,
                path: path
            })


        }
    }
});
