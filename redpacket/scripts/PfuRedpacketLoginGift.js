var PfuSdk = require("PfuSdk");
var PfuRedpacket = require("PfuRedpacket");

cc.Class({
    extends: cc.Component,

    properties: {
        listNode:cc.Node,
        spClose:cc.SpriteFrame,
        spOpen:cc.SpriteFrame,
        btnShare:cc.Node,
        btnOk:cc.Node,
    },

    show(moneyList){
        
        this._curDay = PfuRedpacket.Instance.getDay();
        this._baseMoney = moneyList[this._curDay];
        //
        this._itemList = [];
        for(let i=1;i<=6;i++){
            let item = this.listNode.getChildByName("item"+i);
            item.sp = item.getComponent(cc.Sprite);
            item.lbDay = item.getChildByName("lbDay").getComponent(cc.Label);
            if(i<this._curDay){
                item.lbDay.string = "¥"+moneyList[i-1];
                item.sp.spriteFrame = this.spOpen;
            }else{
                item.lbDay.string = "第"+i+"天";
                item.sp.spriteFrame = this.spClose;
            }
        }

        this.btnShare.runAction(this.getShareAction());
        this.btnOk.opacity = 0;
        this.btnOk.runAction(cc.fadeIn(2));
    },

    getShareAction(){
        let t = 1;
        let s1 = cc.scaleTo(t,1.1);
        let s2 = cc.scaleTo(t,1);
        return cc.sequence(s1,s2).repeatForever();
    },

    onShare(){
        PfuSdk.Instance.showShare({
            success:()=>{
                this.onGetReward(2);
            }
        })
    },

    onOk(){
        this.onGetReward(1);
    },

    onGetReward(num){
        PfuRedpacket.Instance.onGetReward(num);
        this.onClose();
    },
    onClose(){
        this.node.destroy();
    }
});
