
const EventType = {
    RedpacketStateChange:"msg_redpacket_state_change",
    RedpacketBtnClick:"msg_redpacket_btn_click"
}
var _pfuEventSystem = cc.Class({
    extends: cc.Class,

    ctor(){
        console.log("------init PfuEventSystem");
        this._eventList = [];
    },
    send(eventId){

        //发送的同时删除掉不合法的事件
        let removeList = [];
        this._eventList.forEach(evt => {
            if(eventId == evt.eventId){
                if(this.checkEventValid(evt)){
                    evt.method(evt.target);
                }else{
                    removeList.push(evt);
                }
            }
        });

        removeList.forEach(evt => {
            let idx = this._eventList.indexOf(evt);
            if(idx > -1)this._eventList.splice(idx,1);
        });
    },
    register(eventId,method,target){

        let newEvent = {
            eventId:eventId,
            method:method,
            target:target
        }
        //检测是否已存在同样的事件
        let haveEvent = false;
        this._eventList.forEach(evt => {
            if(this.isSameEvent(evt,newEvent)){
                haveEvent = true;
            }
        });

        if(!haveEvent){
            this._eventList.push(newEvent);
        }
    },
    checkEventValid(event){
        return cc.isValid(event.target);
    },
    isSameEvent(event1,event2){
        if(event1.eventId == event2.eventId && event1.target == event2.target){
            return true;
        }

        return false;
    }
});


var PfuEventSystem = new _pfuEventSystem();

module.exports = {
    Event:PfuEventSystem,
    Type:EventType
};