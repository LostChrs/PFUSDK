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