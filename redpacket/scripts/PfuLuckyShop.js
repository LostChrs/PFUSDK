const PfuEvent = require("PfuEventSystem").Event;
const EventType = require("PfuEventSystem").Type;
const PfuRedpacket = require("PfuRedpacket");
const PfuSdk = require("PfuSdk");
cc.Class({
    extends: cc.Component,

    properties: {
        btnClose:cc.Button,
        lbNum:cc.Label,
        pbItem:cc.Node,
        content:cc.Node,
        pageContent:cc.Node,
        spList:[cc.SpriteFrame],
    },

    onLoad () {
        this.btnClose.node.on("click",this.onClose,this);
        if(PfuSdk.Instance.isIphoneX()){
            const widget = this.pageContent.getComponent(cc.Widget);
            widget.top = 50;
        }
    },

    onEnable() {
        PfuEvent.register(EventType.RedpacketStateChange,this.evtRedpacketChange,this);
        //cc.systemEvent.on("PfuEvent_BuyItem",this.onBuyItem,this);
    },

    onDisable(){
        //cc.systemEvent.off("PfuEvent_BuyItem");
    },

    evtRedpacketChange(self){
        self.updateMoney();
    },
    updateMoney(){
        this._curNum = parseInt(PfuRedpacket.Instance.getMoney()*100);
        this.lbNum.string = this._curNum+"福卡";
    },

    show (num) {
        this.updateMoney();
        this._costList = [200,200,2000,4000,6000,10000,15000,20000,40000,80000];
        this.spList[0] = PfuRedpacket.Instance.shopIcon1;
        this.spList[1] = PfuRedpacket.Instance.shopIcon2;
 
        for(let i=0;i<10;i++){
            if(this.spList[i]){
                const item = cc.instantiate(this.pbItem);
                item.parent = this.content;
                const spNode = item.getChildByName("icon");
                spNode.getComponent(cc.Sprite).spriteFrame = this.spList[i];
                this.resetSize(spNode,this.spList[i],154,154);
                item.getChildByName("lbNum").getComponent(cc.Label).string = this._costList[i];
                const btn = item.getChildByName("btnOk").getComponent(cc.Button);
                btn.node.on("click",()=>{
                    this.onBtnClick(i);
                });
            }
        }

        this.pbItem.active = false;
    },

    onBuyItem(idx){
        console.log("购买成功:"+idx);
    },

    onBtnClick(idx){
        
        if(idx > 1){
            this.showTips("福卡数量不足，玩游戏可以获得哦！");
        }else{
            const cost = this._costList[idx];
            if(this._curNum >= cost){
                this.showTips("兑换道具成功");
                PfuRedpacket.Instance.addOwnMoney(-cost/100);
                //cc.systemEvent.emit("PfuEvent_BuyItem",idx);
                PfuEvent.send("PfuEvent_BuyItem",idx);
            }else{
                this.showTips("福卡数量不足，玩游戏可以获得哦！");
            }
        }
    },

    resetSize(node,sp,th,tw){
        if(node){
            //根据高度适应
            let rect = sp.getRect();
            let r = rect.height/rect.width;
            let w = th / r;
            node.height = th;
            node.width = w;

            if(w > tw){
                let h = r*tw;
                node.height = h;
                node.width = tw;
            }
        }
    },

    showTips(str) {
        if (cc.sys.platform == cc.sys.WECHAT_GAME) {
            wx.showToast({
                title: str,
                icon: 'none',
                duration: 2000
            })
        }else{
            console.log("提示:"+str);
        }
    },

    onClose(){
        this.node.destroy();
    }
});
