
let config = {
    version:"1.0.0",//*必填  游戏参数版本号，用来控制运营后台参数

    bannerHeight:300,//230-170   
    bannerOffYForIpx:60,//在ipx上banner的偏移量，因为不同引擎版本有所区别，所以提供了修改的接口。
    payAppId:"1450018202",//虚拟支付Id，当接入虚拟支付的时候需要填写
    openInviteListListner:false,//开启邀请用户的实时监听
    bannerReliveId:"",
    ipxBanner:0,//默认0    当banner位置偏高时设置为1(cocos版本bug)

    /*
    * 以下参数为后台自动生成
    */
    appId:1306146,//*必填  嘉丰永道appId
    wxId:"wxc3de0b459142bb1b",//*必填  微信小游戏Id
    privateKey:"bp11lflsecbme9itsb4f",//*必填  嘉丰永道分配给合作方的私钥
    videoId:"adunit-c758250e9f75430c",//视频广告Id
    bannerId:"adunit-8c19e95d3c8e9a7a",//banner广告Id
    navigateToMiniProgramAppIdList:[
        "wxe675b6aad9612c74",
        "wx2d47467291703ec7",
        "wx716b36314be3fe89",
        "wx8b25b991dcc6edf6",
        "wx99e08aff982f8dde",
        "wx3b33f72ee2ec7bc1",
        "wx989199f7dc0e3a50",
        "wxbbbef0244fa4d4e4",
        "wx87fe1890ea1384a5",
        "wxa0eee1fe564aa730"
    ]
};

module.exports = config;

