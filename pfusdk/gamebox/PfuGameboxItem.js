var online = require("PfuOnline");
var PfuSdk = require("PfuSdk");
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
            let url = online.getImagePath(data.iconlink); 
            let image = wx.createImage();
            image.src = url;
            image.onload = res =>{
                self._texture = new cc.Texture2D();
                self._texture.initWithElement(image);
                self._texture.handleLoadedTexture();
                let sp = new cc.SpriteFrame(self._texture);
                self.iconSp.spriteFrame = sp;
            };
        }
    },
    onBtnClick(){
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            let info = this._data;
            let gaid = PfuSdk.Instance.getGAID(info.iconlink);
            online.pfuGAClick(6,gaid,PfuSdk.loginToken);
            if (wx.navigateToMiniProgram) {
                wx.navigateToMiniProgram({
                    appId: "wxe675b6aad9612c74",
                    path: "pages/fromGame/singer?pfukey=" + info.wechatGameid,
                    success(res) {
                        console.log(res);
                    },
                    fail(res) {
                        console.log(res);
                    }
                })
            } else {
                wx.previewImage({
                    current: info.link,
                    urls: [info.link],
                    success: function (args) {
                        console.log("识别成功", args);
                    },
                    fail: function (args) {
                        console.log("识别失败", args);
                    }
                });
            }

        }
    }
});
