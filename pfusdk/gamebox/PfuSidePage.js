
var online = require("PfuOnline");
var config = require("PfuConfig");
cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        itemTemplate: cc.Node,
        pageNode:cc.Node,
        spLeft:cc.SpriteFrame,
        spRight:cc.SpriteFrame,
        arrowSprite:cc.Sprite,
    },

    start(){
        let self = this;
        this._offX = this.pageNode.width;
        this._isShow = false;
        this.pageNode.x = -this._offX;
        this.content.active = false;
        this.arrowSprite.spriteFrame = this.spRight;
        this._boxList = [];   
        online.addCb(()=>{
            online.getAdsList(res =>{
                if(!cc.isValid(this.node))return;
                
                let list = res.adverts;
                if(!list || list.length <= 0){
                    self.node.active = false;
                    PfuSdk.Instance.HideBanner(false);
                    return;
                }
              
                self.initList(this.getCanJumpList(list));
            });
        });

        this.btn = this.getComponent(cc.Button);
        this.btn.enabled = false;
        this.btn.node.on("click",()=>{
            this._isShow = true;
            this.toggleShow();
        },this);
    },
 
    getCanJumpList(list){
        let jumpList = [];
        list.forEach(item => {
            let condition1 = this.checkDirectJump(item.wechatGameid);
            let condition2 = (item.qrcodelink&&item.qrcodelink != "");
            let condition3 = this.checkDirectJump(item.jumpId);
            if(condition1 || condition2 || condition3){
                jumpList.push(item);
            }
        });
        return jumpList;
    },
    checkDirectJump(wxId){
        let list = config.navigateToMiniProgramAppIdList;
        for(let i=0;i<list.length;i++){
            if(list[i] == wxId){
                return true;
            }
        }
        return false;
    },
    initList(list){

        this._boxList = list || [];
        let boxLen = this._boxList.length;
        this.content.removeAllChildren();
        if(list.length <=0){
            this.itemTemplate.active = false;
            return;
        }

        let len = this._boxList.length;

        for (let i = 0; i < len; ++i) { // spawn items, we only need to do this once
            let item = cc.instantiate(this.itemTemplate);
            item.parent = this.content;
            item.ctr = item.getComponent("PfuGameboxItem");
            item.ctr.initData(this._boxList[i]);
        }
        this.itemTemplate.active = false;
    },

    onShowBtnClick(){
        this.toggleShow();
    },

    toggleShow(){
        let self = this;
        this._isShow = !this._isShow;
        if(this._isShow == false && this.content.active == false){
            return;
        }
        this.pageNode.stopAllActions();
        let t = 0.1;
        if(this._isShow){
            this.btn.enabled = true;
            this.content.active = true;
            this.arrowSprite.spriteFrame = this.spLeft;
            this.pageNode.runAction(cc.moveTo(t,cc.v2(0,this.pageNode.y)));
        }else{
            this.btn.enabled = false;
            this.arrowSprite.spriteFrame = this.spRight;
            this.pageNode.runAction(cc.sequence(cc.moveTo(t,cc.v2(-this._offX,this.pageNode.y)),cc.callFunc(()=>{
                self.content.active = false;
            })));
        }
    }
});
