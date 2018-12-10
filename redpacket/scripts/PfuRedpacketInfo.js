const PfuRedpacket = require("PfuRedpacket");
const PfuSdk = require("PfuSdk");
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
        btnOpenNode:cc.Node,
    },

    show(type,num){
        this._type = type;
        this._num = num;

        if(type == PageType.OPEN){
            this.openPage.active = true;
            this.closePage.active = false;
            this.lbTotalMoney.string = PfuRedpacket.Instance.getMoney();
            if(num){
                this.lbGetMoney.node.active = true;
                this.desGetMoney.active = true;
                this.lbGetMoney.string = num;
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
        PfuSdk.Instance.showTips("满20元可以提现哦~");
    },
    onOpenRedpacket(){
        //开红包
        const self = this;
        const type = this._type;
        const finish = ()=>{
            PfuRedpacket.Instance.addOwnMoney(this._num);
            this.show(PageType.OPEN,this._num);
        };

        if(type == PageType.WATCH){
            PfuSdk.Instance.showVideo({
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
        this.node.destroy();
    }
});
