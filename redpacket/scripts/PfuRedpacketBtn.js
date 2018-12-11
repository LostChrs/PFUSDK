var PfuRedpacket = require("PfuRedpacket");
var PfuEvent = require("PfuEventSystem").Event;
var EventType = require("PfuEventSystem").Type;
cc.Class({
    extends: cc.Component,

    properties: {
        lbMoney:cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        this._str = "hahahhahah";
        this.updateMoney();
    },

    onRedpacketBtnClick(){

        PfuEvent.send(EventType.RedpacketBtnClick);
    },

    evtRedpacketChange(self){
        self.updateMoney();
    },

    updateMoney(){
        this.lbMoney.string = "¥"+PfuRedpacket.Instance.getMoney();
    },

    onEnable() {
        PfuEvent.register(EventType.RedpacketStateChange,this.evtRedpacketChange,this);
        PfuEvent.register(EventType.RedpacketBtnHide,(self)=>{
            this.node.active = false;
        },this);
    }
});
