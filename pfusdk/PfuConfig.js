
let config = {
    version:"1.0.0",//*必填  游戏参数版本号，用来控制运营后台参数
    appId:10000,//*必填  嘉丰永道appId
    wxId:"",//*必填  微信小游戏Id
    pfuPrivateKey:"",//*必填  嘉丰永道分配给合作方的私钥

    wxVideoId:"",//视频广告Id
    wxBannerId:"",//banner广告Id
    bannerSize:2,//1为最大尺寸  2为最小尺寸
    
    payAppId:"",//虚拟支付Id，当接入虚拟支付的时候需要填写

    openInviteListListner:false,//开启邀请用户的实时监听
    inviteListUpdateTime:180,//每180秒更新一次邀请列表
};


module.exports = config;