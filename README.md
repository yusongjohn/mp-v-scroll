【小程序长列表组件】

# 与官方recycle-view的简单对比
- 支持列表项非等高场景
- 可以设置骨架效果
- 针对聊天会话场景做了优化

# 接入demo
https://github.com/yusongjohn/mp-v-scroll-example

# 源码中demo运行
1. yarn
2. yarn dev 或者 yarn watch => 生成 miniprogram_dev
4. 开发者工具导入该目录

# 长列表组件提供的api & 属性

## 属性

| 属性 | 说明 | 类型 | 默认值 |
| -----| ---- | ---- | ---- |
| idealMode | 是否是理想模式即dom高度是否是同步确定的 | Boolean |true
| groupSkeletonImg | 列表项占位效果图（垂直方向平铺模拟） | String |
| groupNums | 屏幕的列表项数，若干列表项高度之和不应该小于容器高度 | Number |
| common | 父容器传递给列表项的公用数据 | Object |
| componentFlag | 组件唯一标识 | String |

## api
通过组件实例直接调用

| api | 说明 | 参数 |
| -----| ---- | ---- |
| init | 用于初始化列表 | list: Array - 初始化数据
| updateRecords | 用于更新列表项 | records: Array - 更新一个或多个列表项
| insertHistoryList | 在列表头部插入数据 | list: Array - 头部数据
| appendNextList | 在列表尾部追加数据 | list: Array - 尾部数据
| insertBeforeTargetRecord | 在指定列表项前面插入一定量的列表项数据 | list: Array - 待插入的对象数组数据，target: Object - 指定列表项
| deleteRecords | 用于将指定列表项数据从列表中移除 | list: Array - 待删除的列表数据
| scrollToTop | 将列表滚动到顶部 | 无
| scrollToTarget | 列表滚动指定列表项位置 | target: Object - 指定的列表项
| scrollToBottom | 将列表滚动到底部 | 无

## 事件
| api | 说明 | 参数
| -----| ---- | ---- | 
| updateStyle | 用于更新分组样式，针对需要修复z-index的场景 | e: Event - 事件对象detail是样式对象，可以选键有：history-wrapper、next-wrapper, ${_chatGroupId} ${key}

## 提供的抽象节点
- list-item
- load-more

## slots
只有normal-scroll 才有
- before
- after

# chat-scroll & normal-scroll 区别
- 后者没有 insertHistoryList 能力
- 前者滚动到顶部的事件名称：`GET_HISTORY_${componentFlag}` 后者： `SCROLL_BOTTOM_${componentFlag}`

# 注意事项(最佳事件)
- 利用 getApp().globalEvent 发布订阅 （会自动检测是否挂载，没有则使用组件默认实现），需要注意的是emitEventEx需要接受回调返回的结果
- 最佳实践应该是（针对图片场景）：根据每个图片的特征固定好<image>的高度：比如在医患会话场景中，用户上传图片的时候就记录好图片的高宽比以及原始高度等信息，在显示的时候用css显示设置<image>高度。
- 如果长列表组件有重新挂载的场景，目前由于reset方法只会清理数据，队友渲染层的wxs文件中的信息未做清理，因此如果有重新挂载场景则可以先卸载再挂载组件

# 微信小程序第三方组件的开发和发布以及使用
- https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/trdparty.html
- https://github.com/wechat-miniprogram/miniprogram-custom-component
- https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html#_2-%E6%9E%84%E5%BB%BA-npm
