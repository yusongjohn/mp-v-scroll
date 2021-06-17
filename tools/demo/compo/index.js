const eventOpts = {bubbles: true, composed: true}
module.exports = Component({
  // 更新z-inde 示例代码
  updateStyle() {
    const styleStr = 'your style;forrexample;z-index:2'
    const {_key, _chatGroupId} = this.data.itemContent
    const param = {[_key]: styleStr, [_chatGroupId]: styleStr + ';overflow:visible'}
    if (_chatGroupId > 0) {
      param['history-wrapper'] = styleStr
    } else {
      param['next-wrapper'] = styleStr
    }
    this.triggerEvent('updatestyle', param, eventOpts)
  },
  properties: {
    itemContent: {
      type: Object
    },
    recordIndex: {
      type: Number
    },
    common: {
      type: Object
    }
  }
})
