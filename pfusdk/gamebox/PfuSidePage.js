
var online = require("PfuOnline");
var config = require("PfuConfig");
const PfuEvent = require("PfuEventSystem").Event;
cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        itemTemplate: cc.Node,
        arrowNode:cc.Node,
    },
    onEnable() {
        PfuEvent.register("PfuEvent_CloseSidePage",this.evtClosePage,this);
    },

    evtClosePage(){
        this._isShow = true;
        this.toggleShow();
    },

    start(){
        let self = this;
        this._offX = this.node.width;
        this._isShow = false;
        this.node.x = -cc.winSize.width/2 - this._offX;
        this.arrowNode.scaleX = -1;
        this.content.active = false;
        this._boxList = [];   
        online.addCb(()=>{
            online.getAdsList(res =>{
                let list = res.adverts;
                if(!list || list.length <= 0){
                    self.node.active = false;
                    PfuSdk.Instance.HideBanner(false);
                    return;
                }
              
                self.initList(this.getCanJumpList(list));
            });
        })
    },
    getCanJumpList(list){
        let jumpList = [];
        list.forEach(item => {
            let condition1 = this.checkDirectJump(item.wechatGameid);
            let condition2 = (item.qrcodelink&&item.qrcodelink != "");
            let condition3 = this.checkDirectJump(item.jumpId);
            if(condition1 || condition2 || condition3){
                if(item.wechatGameid != config.wxId){
                    jumpList.push(item);
                }
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
        this.node.stopAllActions();
        let t = 0.1;
        if(this._isShow){
            this.arrowNode.scaleX = 1;
            this.content.active = true;
            this.node.runAction(cc.moveTo(t,cc.v2(-cc.winSize.width/2,this.node.y)));
        }else{
            this.arrowNode.scaleX = -1;
            this.node.runAction(cc.sequence(cc.moveTo(t,cc.v2(-cc.winSize.width/2-this._offX,this.node.y)),cc.callFunc(()=>{
                self.content.active = false;
            })));
        }
    }
});
