var online = require("PfuOnline");
var config = require("PfuConfig");
cc.Class({
    extends: cc.Component,

    properties: {
        gameListScrollView: cc.ScrollView,
        content: cc.Node,
        itemTemplate: cc.Node,
    },

    start(){
        let self = this;
        this.items = [];
        this.spacing = 10;
        this.isTouched = false;
        this.content = this.gameListScrollView.content;
        this._boxList = [];
        let len = this._boxList.length;
        this.contentSize = this.gameListScrollView.node.getContentSize();
        this.spacing = (this.contentSize.width - this.itemTemplate.width * 5) / 6;
        this.content.width = len * (this.itemTemplate.width + this.spacing) + this.spacing;
        
        online.addCb(()=>{
            online.getAdsList(res =>{
                let list = res.adverts;
                if(online.wechatparam.pfuSdkMoreGame && online.wechatparam.pfuSdkMoreGame == "0"){
                    self.content.active = false;
                }else{
                    self.initList(this.getCanJumpList(list));
                }
                
            });
        })
    },
    getCanJumpList(list){
        let jumpList = [];
        let configList = config.wxJumpAppIdList;
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
        if (boxLen > 5) {
            //在数组后面补上五个,形成循环播放的假象
            let arr = this._boxList.slice(0, 5);
            this._boxList = this._boxList.concat(arr);
        } else {
            let arr = this._boxList.slice(0, boxLen);
            this._boxList = this._boxList.concat(arr);
        }
        this.content.removeAllChildren();
        if(list.length <=0){
            this.itemTemplate.active = false;
            return;
        }

        let len = this._boxList.length;
        this.contentSize = this.gameListScrollView.node.getContentSize();
        this.spacing = (this.contentSize.width - this.itemTemplate.width * 5) / 6;
        this.content.width = len * (this.itemTemplate.width + this.spacing) + this.spacing;

        for (let i = 0; i < len; ++i) { // spawn items, we only need to do this once
            let item = cc.instantiate(this.itemTemplate);
            item.parent = this.content;
            item.setPosition(this.spacing * (i + 1) + item.width * (i + 0.5), 0);
            item.ctr = item.getComponent("PfuGameboxItem");
            item.ctr.initData(this._boxList[i]);
            this.items.push(item);
        }
        this.itemTemplate.active = false;
    },
    update(dt) {
        this._fTic = this._fTic || 0;
        // cc.log('时间: '+ this._fTic +'----总宽度:', this.content.width);
        if (!this.isTouched) {
            this._fTic++;
            this.gameListScrollView.scrollToOffset(cc.v2(this._fTic, 0), 0);
            if (Math.floor(this.content.width) <= -this.gameListScrollView.getScrollOffset().x + this.contentSize.width) {
                this._fTic = 0;
            }
        } else {

        }
    },

    //滑动事件
    scrollEvent: function (sender, event) {
        if (4 == event) {
            this.isTouched = true;
            this._fTic = -this.gameListScrollView.getScrollOffset().x;
            if (this.content.width <= -this.gameListScrollView.getScrollOffset().x + this.contentSize.width) {
                this._fTic = 0;
                this.gameListScrollView.scrollToOffset(cc.v2(0, 0), 0);
            } else if (0 < this.gameListScrollView.getScrollOffset().x) {
                this._fTic = this.content.width - this.contentSize.width;
                this.gameListScrollView.scrollToOffset(cc.v2(this._fTic, 0), 0);
            }
        }
        else
            this.isTouched = false;
    },
});
