# PFUSDK V0.2.0

## 红包功能
[点击这里查看红包功能接入文档](https://github.com/LostChrs/PFUSDK/blob/master/Redpacket.md)

## 更新日志
[点击这里查看版本更新日志](https://github.com/LostChrs/PFUSDK/blob/master/ChangeLog.md)
# 快速接入
将pfusdk文件夹整个拖入cocoscreator工程中，`PfuSdk.js`中包含所有Sdk对外提供的接口，`PfuConfig.js`用来配置Sdk所需参数。将`pfusdk/prefabs/PfuSdk.prefab`直接拖入游戏根节点。注意不要挂载到Canvas下，应该挂载到根节点。

>所有项目均会自动生成常用在线参数，如pfuSdkTestMode(审核模式),pfuSdkShowOpenAds(显示开屏广告)等。审核模式开启时将自动隐藏更多游戏列表，更多游戏按钮等功能。

>注意：配置好PfuConfig参数后，请备份好此配置，防止更新SDK时覆盖了配置文件。
### Config.js中参数配置 (*必接)

| 参数 | 是否必填 | 含义 | 示例/默认值 |
| :------| :------ | :------ | :------|
|version|是|游戏参数版本号，用来控制运营后台参数|1.0.0|
|appId|是| 嘉丰永道appId|1306246|
|wxId|是|微信小游戏Id|wxc3ee0b459142bb1b|
|pfuPrivateKey|是|嘉丰永道分配给合作方的私钥|bp11lflsecbme9itbbf|
|wxVideoId|否|视频广告Id|adunit-c758250e9f75430c|
|wxBannerId|否|banner广告Id|adunit-8c19e95d3c8e9a7a|
|bannerHeight|否|banner高度，范围170~230|170|
|payAppId|否|虚拟支付Id，当接入虚拟支付的时候需要填写|1450018202|
|openInviteListListner|否|开启邀请用户的实时监听|false|
|inviteListUpdateTime|否|更新一次邀请列表频率（秒）|180|

>如果要使用更多游戏列表或更多游戏按钮，需要在发布的微信工程的game.json中添加如下配置

```
"navigateToMiniProgramAppIdList":[
    "wx3e33fef689f472b1",
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
```
### 获取在线参数(*必接)
```
 PfuSdk.Instance.setOnlineParamsCallback((obj)=>{});
```
回调中的obj为在线参数对象，用户可直接使用，如`obj.pfuSdkTestMode`。**Sdk中一些和在线参数有关的接口需要在此回调中调用。**
### 更多游戏列表
将`pfusdk/prefabs/pfuGamebox.prefab`拖入场景中适当位置。游戏启动后列表会自动初始化。如果玩家需要控制列表的显示隐藏，可以直接引用此控件，通过`node.active = true`控制。

还提供侧边栏的更多游戏列表，将`pfusdk/prefabs/pfuSidePage.prefab`拖入场景适当位置即可

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
<div id="showShareOrVideo"></div>

### 显示视频
>showVideo

| 参数 | 含义 |
| :------| :------ |
|videoPlacement| 广告位|
|justWatch| 直接看视频(跳过所有参数控制)|
|success| 成功回调|
|fail |失败回调|

>isShareCheckbox 判断当前是否要显示分享勾选框

```
 //进入界面时设置分享勾选框是否可见
 shareTrigger.node.active = PfuSdk.Instance.isShareCheckbox();
 //播放视频时可以把分享框勾选状态传递进去
 PfuSdk.Instance.showVideo({
            justWatch:!shareTrigger.isChecked,
            success:()=>{
                console.log("视频播放成功");
            },
            fail:()=>{
                console.log("视频播放失败");
            }
        })
```
<div id="showShare"></div>

### 分享
>showShare

| 参数 | 含义 |
| :------| :------ |
|shareParams |分享参数
|title |自定义分享标题
|imageUrl |自定义分享图片
|success |成功回调
|fail |失败回调
```
PfuSdk.Instance.showShare({
            success:()=>{
                self.lbShare.string = "分享成功!";
            },
            fail:()=>{
                self.lbShare.string = "分享失败!";
            }
        })
```
### Banner广告
配置`PfuConfig.js`中的`wxBannerId`，Banner广告即可自动创建和显示。配置`bannerHeight`可指定banner高度，对应cocos中的设计像素范围230-170。
主动刷新Banner，调用后不是必然会刷新，具体刷新规则由后台参数控制。
```
pfuSdk.Instance.refreshBanner();
```

如需要自己控制Banner的显示隐藏，请调用HideBanner方法
```
pfuSdk.Instance.HideBanner(true);//隐藏Banner
pfuSdk.Instance.HideBanner(false);//显示Banner
```

### 复活
引导玩家跳转到游戏盒子后复活
```
 PfuSdk.Instance.jumpGameboxForRelive(()=>{
            console.log("复活成功");
        })
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