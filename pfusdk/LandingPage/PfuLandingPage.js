

cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad() {
        
    },

    show(info) {
        this._bgSprite = this.getComponent(cc.Sprite);
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            let self = this;

            let url = info.jumplink;
            let image = wx.createImage();
            image.src = url;
            image.onload = res => {
                self._texture = new cc.Texture2D();
                self._texture.initWithElement(image);
                self._texture.handleLoadedTexture();
                let sp = new cc.SpriteFrame(self._texture);
                self._bgSprite.spriteFrame = sp;
            };
        }
    },
    onRelive() {
        if (cc.sys.platform === cc.sys.WECHAT_GAME) {
            wx.navigateBackMiniProgram({
                extraData: {
                    relive: true
                }
            })
        }
    },
    onBack() {
        this.node.destroy();
    }
});
