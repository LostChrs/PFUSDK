# PFUSDK V0.0.3

# 快速接入
将pfusdk文件夹整个拖入cocoscreator工程中，`PfuSdk.js`中包含所有Sdk对外提供的接口，`PfuConfig.js`用来配置Sdk所需参数。将`PfuSdk.js`直接拖入游戏场景中，或挂载到任意空节点上。`PfuSdk`为单例脚本，并且通过`cc.game.addPersistRootNode(this.node);`设置为常驻节点，切换场景时不会销毁，因此只需要将其挂载到主场景即可。

sdk会在启动后自动调用常用接口的初始化，如登录，分享（分享的图片和标题），显示开屏二维码广告，获取在线参数等等。用户无需关心实现逻辑。**用户所有调用接口都应该在脚本的start函数后。**
>所有项目均会自动生成常用在线参数，如pfuSdkTestMode(审核模式),pfuSdkShowOpenAds(显示开屏广告)等。审核模式开启时将自动隐藏更多游戏列表，更多游戏按钮等功能。

>注意：配置好PfuConfig参数后，请备份好此配置，防止更新SDK时覆盖了配置文件。
### 参数配置 (*必接)
>以下参数均为示例，具体参数请联系嘉丰永道商务获取
```
let config = {
    version:"1.0.0",//*必填  游戏参数版本号，用来控制运营后台参数
    appId:1306246,//*必填  嘉丰永道appId
    wxId:"wxc3ee0b459142bb1b",//*必填  微信小游戏Id
    pfuPrivateKey:"bp11lflsecbme9itbbf",//*必填  嘉丰永道分配给合作方的私钥

    wxVideoId:"adunit-c758250e9f75430c",//视频广告Id
    wxBannerId:"adunit-8c19e95d3c8e9a7a",//banner广告Id
    bannerSize:2,//1为最大尺寸  2为最小尺寸
    autoBannerVisible:true,//是否由Sdk自动控制banner的显示隐藏，默认banner会一直显示。如果用户只需要在特殊界面显示banner，请设置为false，自己控制banner的显示。
    
    payAppId:"1450018202",//虚拟支付Id，当接入虚拟支付的时候需要填写

    openInviteListListner:false,//开启邀请用户的实时监听
    inviteListUpdateTime:180,//每180秒更新一次邀请列表
};
```
>如果要使用更多游戏列表或更多游戏按钮，需要在发布的微信工程的game.json中添加如下配置

```
"navigateToMiniProgramAppIdList":[
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
```
### 获取在线参数(*必接)
在脚本的`start()`函数中调用如下方法
```
 PfuSdk.Instance.setOnlineParamsCallback((obj)=>{});
```
回调中的obj为在线参数对象，用户可直接使用，如`obj.pfuSdkTestMode`。**Sdk中一些和在线参数有关的接口需要在此回调中调用。**
### 更多游戏列表
将`pfusdk/pfuGamebox.prefab`拖入场景中适当位置。游戏启动后列表会自动初始化。如果玩家需要控制列表的显示隐藏，可以直接引用此控件，通过`node.active = true`控制。

### 更多游戏按钮
游戏中可设置左右两个更多游戏按钮。在UI上创建任意Sprite控件，调整到适当大小。调用如下函数(在**在线参数回调**中调用)
```
var pfuSdk = require("PfuSdk");
pfuSdk.Instance.setMoreGame(this.leftSprite,this.rightSprite);
```
其中leftSprite和rightSprite为两个cc.Sprite的引用,用户可以只传递一个
```
properties: {
        leftSprite:cc.Sprite,
        rightSprite:cc.Sprite,
    },
```
### 分享
```
pfuSdk.Instance.showShare(()=>{console.log("分享成功")},params);
```
>分享时第二个参数为用户自定义参数，可不传。如"playerId=222&level=1"

### Banner广告
配置`PfuConfig.js`中的`wxBannerId`，Banner广告即可自动创建和显示
如需要自己控制Banner的显示隐藏，请调用HideBanner方法
```
pfuSdk.Instance.HideBanner(true);//隐藏Banner
pfuSdk.Instance.HideBanner(false);//显示Banner
```
### 看视频
>视频广告需要在`PfuConfig.js`中配置`wxVideoId`参数
```
pfuSdk.Instance.showVideo(successCb,failCb,closeCb,placementId);
```
其中3个参数分别代表成功回调，失败回调，视频未看完回调。3个参数均为可选参数。
如果不同广告点有不同的广告Id,请传递placementId

也可以提前检测是否有可播放的广告。
```
pfuSdk.Instance.loadAds(res=>{console.log("广告是否可播放:"+res)});
```

### 获取玩家邀请的新用户列表
使用sdk中的分享功能后，通过分享卡片进入游戏的新用户将被服务器记录。游戏中可以直接使用此邀请用户列表。为了记录玩家的基本信息，游戏必须在第一个界面（未进入主场景前）获取相应权限，相关代码如下：

```
let self = this;
let userInfo = cc.sys.localStorage.getItem("wxUserInfo");
if(!userInfo){
    let button = wx.createUserInfoButton({
    type: 'text',
    text: '获取用户信息',
    style: {
        left: 10,
        top: 76,
        width: 200,
        height: 40,
        lineHeight: 40,
        backgroundColor: '#ff0000',
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 16,
        borderRadius: 4
        }
    })
    button.onTap((res) => {
        console.log(res.userInfo)
        if(res.userInfo){
            cc.sys.localStorage.setItem("wxUserInfo",JSON.stringify(res.userInfo));
        }
    })
}

```
以上代码只会获取一次用户信息，成功后存储在本地，之后不会重新获取。

#### 获取邀请列表
```
let inviteList = pfuSdk.Instance.getInviteUserInfoList();
```
列表中元素对象结构
```
let userInfo = {
    uid:"xxx",//玩家uid
    name:"匿名用户",//昵称
    picUrl:"",//玩家头像地址
    getGift:false,//true:已经领取过邀请奖励，false:未领取过邀请奖励
}
```
其中picUrl为头像地址，用户可使用sdk提供的接口直接将url设置到Sprite上
```
pfuSdk.Instance.setSpriteByUrl(sprite,url);
```
某一邀请用户的邀请奖励被领取后，调用下面接口将其标记为已领取
```
pfuSdk.Instance.onInviteFriendGetGiftFinish(uid);
```