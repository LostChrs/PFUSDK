
var online = require("PfuOnline");
var config = require("PfuConfig");
cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        itemTemplate: cc.Node,
        arrowNode:cc.Node,
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
                    self.content.active = false;
                    return;
                }
              
                self.initList(this.getCanJumpList(list));
            });
        })
    },
    getCanJumpList(list){
        let jumpList = [];
        let configList = config.navigateToMiniProgramAppIdList;
        configList.forEach(wxId => {
            list.forEach(item => {
                if(item.wechatGameid == wxId){
                    jumpList.push(item);
                }
            });
        });
        return jumpList;
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
