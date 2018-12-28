### v0.2.3
* 优化SDK时长统计

### v0.2.2
* 分享失败后会弹出确认对话框

### v0.2.1
* banner复活增加了后台开关，关闭的时候会调用视频
* 修改了红包的弹出规则

### v0.1.4
* 增加了点击banner复活的功能showBannerRelive
* 为了避免困惑，将`showShareOrVideo`接口移除，改为`showVideo`。并且增加了新的参数`justWatch`,用来指定是否跳过参数控制直接播放视频
### v0.1.3
* 增加了红包在线参数，审核模式和关闭红包时，红包按钮隐藏
* 修改banner刷新相关规则,增加了主动刷新banner的接口`refreshBanner`
### v0.1.2
* 增加了红包功能，请查看[这里](https://github.com/LostChrs/PFUSDK/blob/master/Redpacket.md)
### v0.1.1
* 修改了更多游戏按钮跳转规则
### v0.1.0
* 修改了`showShare`和`showShareOrVideo`的参数传递方式，请查看[这里](https://github.com/LostChrs/PFUSDK/blob/master/README.md#showShare)
* 移除了单独显示视频的方法`showVideo`,请使用`showShareOrVideo`替换
### v0.0.10
* 增加了获取公众号图片地址的方法`getOfficialAccount`
* 增加了固定banner高度的参数`bannerHeight`，范围为cocos设计分辨率230-170
* 删除了banner大小参数`bannerSize` 
* 修改了更多游戏按钮的跳转规则
### v0.0.9
* 增加了banner刷新时间后台参数
* 修改了视频前弹分享的规则

### v0.0.8
* 优化了更多游戏列表的风格
* 修改了底层的一些统计规则

### v0.0.7
* 增加了自动判断显示分享还是显示视频的接口`isShowShareBtn()`,和`showShareOrVideo(cb,videoPlacement,shareParmas)`

### v0.0.6
* 分享接口增加了自定义标题和图片的参数 `showShare(cb,parmas,title,imageUrl)`
* 增加了分享来源统计
* 增加了侧边栏更多游戏列表

### v0.0.5
* 添加跳转游戏盒子复活功能 `jumpGameboxForRelive()`
### v0.0.4
* 非审核模式下，视频播放失败时会调用分享
* 增加了分享时的数据统计
* 添加了一个在线参数`pfuSdkShareTime`用来控制分享成功的间隔时间
* 增加了判断刘海屏的函数`isIphoneX()`,和普通全面屏的函数`isFullScreen()`

### v0.0.3
* 修复了大量切换场景时导致的bug