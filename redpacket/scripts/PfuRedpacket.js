const PfuSdk = require("PfuSdk");
const PfuEvent = require("PfuEventSystem").Event;
const EventType = require("PfuEventSystem").Type;
const moneyList = [1.15,1.3,0.8,0.2,0.35,0.2,0.51];
var PfuRedpacket = cc.Class({
    extends: cc.Component,
    statics:{
        Instance:null,
    },
    properties: {
        isRoot:false,
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
        this._ownMoney = parseFloat(this.getItem("pfuRedpacketMoney",0)) ;

        //单独记录主动弹出红包金额，未领取双倍的奖励会返回奖金池
        this._randomMoney = parseFloat(this.getItem("pfuRandomMoney",0));
        //记录获得的红包次数
        this._gotRedNum = this.getItem("pfuGotRedNum",0);
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

        PfuEvent.register(EventType.RedpacketBtnClick,this.evtRedpacketBtnClick,this);
    },
    onAppShow(){

    },

    onEnable() {
        
    },


    start () {
        PfuSdk.Instance.setRedpacketCallback(()=>{
            //根据在线参数隐藏功能
            PfuEvent.send(EventType.RedpacketBtnHide);
        });
    },
    //显示红包  type  des pageOpen pageClose
    showRedpacket(obj = {}){
        const type = obj.type || "Watch";
        const des = obj.des || "";
        const pageOpen = obj.pageOpen || null;
        this._pageCloseCb = obj.pageClose || null;
        if(this._canShowRedpacket()){
            let num = this._gotRedNum;
            let money = 0;
            if(num < 20){
                money = Math.random()*0.4;
                if(money<0.1)money = 0.12;
            }else{
                money = Math.random()*0.2;
                if(money<0.03)money = 0.03;
            }
            //随机金额
            this._gotRedNum++;
            this.setItem("pfuGotRedNum",this._gotRedNum);
            money = money.toFixed(2);
            if(pageOpen)pageOpen();
            this.showRedpacketInfo(type,money);
        }
    },
    //是否可以显示红包
    IsRedpacket(){
        return this._canShowRedpacket();
    },
    onInfoPageClose(state){
        if(this._pageCloseCb){

            this._pageCloseCb(state);
            this._pageCloseCb = null;
        }
    },
    //检查当前是否可以显示红包
    _canShowRedpacket(){
        if(PfuSdk.Instance.isHideRedpacket()){
            return false;
        }
        return this._ownMoney < this.getMaxNum();
    },
    //当前领到了第几天
    getDay(){
        return this.getItem("pfuRedpacketDay",1);
    },

    //计算可以领取的上限
    getMaxNum(){
        const day = this.getDay();//已经领取的天数
        let remain = 0;//保留的钱
        for(let i=day-1;i<7;i++){
           remain += (moneyList[i]*2);
        }

        return 19.5 - remain;
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
        self.log("七天已经领取:"+isGive+",当前领取天数："+self.getDay());
        if(isGive || self.getDay() > 7){
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
        let root = this.node.parent;
        if(root){
            let ui = cc.instantiate(pb);
            ui.parent = root;
            ui.zIndex = 2000;
            return ui;
        }else{
            this.log("错误：未到找根节点");
            return null;
        }
    },
    //event

    addOwnMoney(num,isRandom){
        this._ownMoney += parseFloat(num);
        this.setItem("pfuRedpacketMoney",this._ownMoney);

        if(isRandom){
            this._randomMoney += parseFloat(num);
            this.setItem("pfuRandomMoney",this._randomMoney);
        }

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
