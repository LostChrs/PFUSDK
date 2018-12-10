var PfuEvent = require("PfuEventSystem").Event;
var EventType = require("PfuEventSystem").Type;
const moneyList = [0.64,0.75,0.79,0.84,0.89,0.91,1.04];
var PfuRedpacket = cc.Class({
    extends: cc.Component,
    statics:{
        Instance:null,
    },
    properties: {
        pbRedpacketLoginGift:cc.Prefab,
        pbRedpacketInfo:cc.Prefab,
        executionOrder: -900
    },

    onLoad(){
        let self = this;
        if (PfuRedpacket.Instance == null) {
            PfuRedpacket.Instance = this;
            cc.game.addPersistRootNode(this.node);
        } else {
            if (PfuRedpacket.Instance != this) {
                this.node.destroy();
                return;
            }
        }
        this.setItem("pfuRedpacketGive",false);
        this._ownMoney = parseFloat(this.getItem("pfuRedpacketMoney",0)) ;
        cc.game.on(cc.game.EVENT_SHOW, function () {
            self.onAppShow();
        });
        //存储奖励倍数
        this._loginGiftInfo = this.getItem("pfuRedpacketGiftInfo");
        if(!this._loginGiftInfo){
            this._loginGiftInfo = [];
            for(let i=0;i<7;i++){
                this._loginGiftInfo.push(1);
            }

            this.setItem("pfuRedpacketGiftInfo",this._loginGiftInfo);
        }

        for(let i=0;i<7;i++){
            moneyList[i] *= this._loginGiftInfo[i];
        }
    },
    onAppShow(){

    },

    onEnable() {
        PfuEvent.register(EventType.RedpacketBtnClick,this.evtRedpacketBtnClick,this);
    },


    start () {
       
    },
    //显示红包  type  des
    showRedpacket(obj){
        const type = obj.type || "Watch";
        const des = obj.des || "";
        if(this._canShowRedpacket()){
            //随机金额
            const limitNum = 19.5 - this._ownMoney;
            const max = Math.min(1,limitNum) - 0.5;
            let money = Math.random()*max + 0.5;
            money = money.toFixed(2);

            this.showRedpacketInfo(type,money);
        }
    },
    //检查当前是否可以显示红包
    _canShowRedpacket(){
        return this._ownMoney <= 19;
    },
    //当前领到了第几天
    getDay(){
        return this.getItem("pfuRedpacketDay",1);
    },

    onGetReward(num){
        this.setItem("pfuRedpacketGive",true);
       


        const day = this.getDay();
        const money = moneyList[day-1] * num;
        this.addOwnMoney(money);

        this.showRedpacketInfo("Open",money);

         //增加天数  记录倍率

        this.setItem("pfuRedpacketDay",day+1);
        this._loginGiftInfo[day-1] = num;
        this.setItem("pfuRedpacketGiftInfo",this._loginGiftInfo);
    },

    evtRedpacketBtnClick(self){
        let isGive = self.getItem("pfuRedpacketGive",false);
        if(isGive || !self._canShowRedpacket() || self.getDay() > 7){
            //显示红包当前余额
            self.showRedpacketInfo("Open");
        }else{
            //显示登录礼包
            self.showRedpacketLoginGift();
        }
    },
    //ui
    showRedpacketLoginGift(){
        let ui = this.createUI(this.pbRedpacketLoginGift);
        if(ui){
            ui.getComponent("PfuRedpacketLoginGift").show(moneyList);
        }
    },
    showRedpacketInfo(type,num){
        let ui = this.createUI(this.pbRedpacketInfo);
        if(ui){
            ui.getComponent("PfuRedpacketInfo").show(type,num);
        }
    },
    createUI(pb){
        let root = cc.find("Canvas");
        if(root){
            let ui = cc.instantiate(pb);
            ui.parent = root;
            ui.zOrder = 2000;
            return ui;
        }else{
            this.log("错误：未到找Canvas");
            return null;
        }
    },
    //event

    addOwnMoney(num){
        this._ownMoney += parseFloat(num);
        this.setItem("pfuRedpacketMoney",this._ownMoney);
        this.msgStateChange();
    },
    //获取当前余额数
    getMoney(){
        if(this._ownMoney > 0){
            return this._ownMoney.toFixed(2);
        }else{
            return 0;
        }
    },
    msgStateChange(){
        PfuEvent.send(EventType.RedpacketStateChange);
    },

    //common
    setItem(key, value) {
        cc.sys.localStorage.setItem(key, JSON.stringify(value));
    },
    getItem(key,defaultValue) {
        let rt = cc.sys.localStorage.getItem(key);
        if (rt) {
            return JSON.parse(rt);
        } else {
            if(defaultValue != null){
                this.setItem(key,defaultValue);
                return defaultValue;
            }else{
                return null;
            }
        }
    },
    log(str){
        console.log("[PFU REDPACKET] "+str);
    },
    showTips(str){
        if(cc.sys.platform == cc.sys.WECHAT_GAME){
            wx.showToast({
                title: str,
                icon: 'none',
                duration: 2000
              })
        }
        
    }
});
