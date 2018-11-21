
let config = {
    version:"1.0.0",//*必填  游戏参数版本号，用来控制运营后台参数
    appId:1306146,//*必填  嘉丰永道appId
    wxId:"wxc3de0b459142bb1b",//*必填  微信小游戏Id
    pfuPrivateKey:"bp11lflsecbme9itsb4f",//*必填  嘉丰永道分配给合作方的私钥

    wxVideoId:"adunit-c758250e9f75430c",//视频广告Id
    wxBannerId:"",//banner广告Id
    bannerSize:2,//1为最大尺寸  2为最小尺寸
    autoBannerVisible:true,//是否由Sdk自动控制banner的显示隐藏，默认banner会一直显示。如果用户只需要在特殊界面显示banner，请设置为false，自己控制banner的显示。
    
    payAppId:"1450018202",//虚拟支付Id，当接入虚拟支付的时候需要填写

    openInviteListListner:false,//开启邀请用户的实时监听
    inviteListUpdateTime:180,//每180秒更新一次邀请列表

    //微信可跳转appId列表
    wxJumpAppIdList:[
        "wxe675b6aad9612c74",
        "wx5608cdb7dc533937",
        "wxa9da0461bfaa8629",
        "wxd6f44b18b8fed9f2",
        "wxb24776419b94d332",
        "wxb82f826b0d650def",
        "wx2d47467291703ec7",
        "wx7505f4985abb17ce",
        "wx716b36314be3fe89",
        "wx8b25b991dcc6edf6"
      ]
};

module.exports = config;