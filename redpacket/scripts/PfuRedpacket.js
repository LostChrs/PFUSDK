const PfuSdk = require("PfuSdk");
const PfuEvent = require("PfuEventSystem").Event;
const EventType = require("PfuEventSystem").Type;
const moneyList = [1.15,1.05,0.5,0.2,0.35,0.2,0.41];
var PfuRedpacket = cc.Class({
    extends: cc.Component,
    statics:{
        Instance:null,
    },
    properties: {
        pbRedpacketInfo:cc.Prefab,
        pbLuckyShop:cc.Prefab,
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

        //记录获得的红包次数
        this._gotRedNum = this.getItem("pfuGotRedNum",0);
        cc.game.on(cc.game.EVENT_SHOW, function () {
            self.onAppShow();
        });


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

       // this.test();
    },
    //指定商店中两个可购买道具的图标 SpriteFrame
    setShopIcon(icon1,icon2){
        this.shopIcon1 = icon1;
        this.shopIcon2 = icon2;
    },
    //显示红包  type  des pageOpen pageClose
    showRedpacket(obj = {}){
        const type = obj.type || "Watch";
        const des = obj.des || null;
        const pageOpen = obj.pageOpen || null;
        this._pageCloseCb = obj.pageClose || null;
        if(this._canShowRedpacket()){
            let day = this.getCurDay();
            let count = this.getDailyCount();
            let max = 0.2;
            let min = 0.01;
            if(day < 6 && count == 0){
                //首次最大
                max = 1.4 - 0.1*day;
                min = max - 0.3;
            }else if(day < 6 && count < 5){
                max = 0.5 - count*0.06;
                min = max - 0.1;
            }else{
                max = 0.03;
                min = 0.01;
            }
            // this.log(min+","+max);
            // this.log("count:"+count+",day:"+day);
            let money = +this.getRandom(min,max);
            if(count > 15){
                money = 0.01;
            }
            if(pageOpen)pageOpen();
            this.showRedpacketInfo(type,money,des);
        }
    },

    test(){
        let m = 0;
        for(let day = 1;day <30;day++){
            for(let count = 0;count<5;count++){
                let max = 0.2;
                let min = 0.01;
                if(day < 6 && count == 0){
                    //首次最大
                    max = 1.4 - 0.1*day;
                    min = max - 0.3;
                }else if(day < 6 && count < 5){
                    max = 0.5 - count*0.06;
                    min = max - 0.1;
                }else{
                    max = 0.03;
                    min = 0.01;
                }
                m += +this.getRandom(min,max);
            }
        }
        console.log("测试:"+m);
    },

    getRandom(begin,end){
        return (Math.random()*(end-begin) + begin).toFixed(2);
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
    //每天减1毛   
    //计算可以领取的上限
    getMaxNum(){
        

        return 19.5;
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
        self.showRedpacketInfo("Open");
    },
    //ui
    showRedpacketInfo(type,num,des){
        let ui = this.createUI(this.pbRedpacketInfo);
        if(ui){
            ui.getComponent("PfuRedpacketInfo").show(type,num,des);
        }
    },
    showLuckyShop(){

        const num = this._ownMoney;
        let ui = this.createUI(this.pbLuckyShop);
        if(ui){
            ui.getComponent("PfuLuckyShop").show(num);
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
            let count = this.getDailyCount();
            this.setItem("pfuRedpacketDailyCount",count+1);
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

    getCurDay(){
        return parseInt(this.getItem("pfuRedpacketDay",1));
    },
    getDailyCount(){
        return parseInt(this.getItem("pfuRedpacketDailyCount",0));
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
