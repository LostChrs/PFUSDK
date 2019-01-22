const PfuRedpacket = require("PfuRedpacket");
const PfuSdk = require("PfuSdk");
const PfuEvent = require("PfuEventSystem").Event;
const EventType = require("PfuEventSystem").Type;
const PageType = {
    OPEN:"Open",//显示余额
    WATCH:"Watch",//看视频开启
    SHARE:"Share",//分享开启
};
cc.Class({
    extends: cc.Component,

    properties: {
        openPage:cc.Node,
        closePage:cc.Node,
        lbTotalMoney:cc.Label,//余额
        lbGetMoney:cc.Label,//本次获得红包
        desGetMoney:cc.Node,//已存入余额
        lbCloseDes:cc.Label,
        btnClose:cc.Button,
        btnWithdraw:cc.Button,
        lbDes:cc.Label,
    },

    onLoad(){
        this.btnClose.node.on("click",this.onClose,this);
        this.btnWithdraw.node.on("click",this.onWithdraw,this);
    },

    onEnable() {
        PfuEvent.register(EventType.RedpacketStateChange,this.evtRedpacketChange,this);
    },

    evtRedpacketChange(self){
        self.updateMoney();
    },
    updateMoney(){
        this.lbTotalMoney.string = parseInt(PfuRedpacket.Instance.getMoney()*100) + "福卡";
    },

    show(type,num,des){
        this._type = type;
        this._num = num;
        if(des){
            this.lbDes.string = des;
        }

        if(type == PageType.OPEN){
            this.openPage.active = true;
            this.closePage.active = false;
            this.updateMoney();
            if(num){
                this.lbGetMoney.node.active = true;
                this.desGetMoney.active = true;
                this.lbGetMoney.string = parseInt(num*100) + "福卡";
            }else{
                this.lbGetMoney.node.active = false;
                this.desGetMoney.active = false;
            }
            
        }else{
            this.openPage.active = false;
            this.closePage.active = true;

            if(type == PageType.WATCH){
                this.lbCloseDes.string = "看视频领取";
            }else if(type == PageType.SHARE){
                this.lbCloseDes.string = "分享领取";
            }
        }
    },

    onWithdraw(){
        PfuRedpacket.Instance.showLuckyShop();
    },
    onOpenRedpacket(){
        //开红包
        const self = this;
        const type = this._type;
        const finish = ()=>{
            PfuRedpacket.Instance.addOwnMoney(this._num,true);
            this.show(PageType.OPEN,this._num);
        };

        if(type == PageType.WATCH){
            PfuSdk.Instance.showVideo({
                justWatch:true,
                success:()=>{
                    finish();
                }
            })
        }else if(type == PageType.SHARE){
            PfuSdk.Instance.showShare({
                success:()=>{
                    finish();
                }
            });
        }
    },
    onClose(){
        const state = this._type == PageType.OPEN?0:1;
        PfuRedpacket.Instance.onInfoPageClose(state);
        this.node.destroy();
    }
});
