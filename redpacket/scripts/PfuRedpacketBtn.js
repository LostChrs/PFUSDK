const PfuRedpacket = require("PfuRedpacket");
const PfuEvent = require("PfuEventSystem").Event;
const EventType = require("PfuEventSystem").Type;
const PfuSdk = require("PfuSdk");
cc.Class({
    extends: cc.Component,

    properties: {
        lbMoney:cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        const btn = this.getComponent(cc.Button);
        btn.node.on("click",this.onRedpacketBtnClick,this);
    },

    start() {
        this._str = "hahahhahah";
        this.updateMoney();
        this.node.active =  !PfuSdk.Instance.isHideRedpacket();
    },

    onRedpacketBtnClick(){
        PfuEvent.send(EventType.RedpacketBtnClick);
    },

    evtRedpacketChange(self){
        self.updateMoney();
    },

    updateMoney(){
        this.lbMoney.string =  parseInt(PfuRedpacket.Instance.getMoney()*100);
    },

    onEnable() {
        PfuEvent.register(EventType.RedpacketStateChange,this.evtRedpacketChange,this);
        PfuEvent.register(EventType.RedpacketBtnHide,(self)=>{
            self.node.active =  !PfuSdk.Instance.isHideRedpacket();
        },this);
    }
});
