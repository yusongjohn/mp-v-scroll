const items = []
for (let i = 0; i < 30; i++) {
  items.push({id: 'item_id_' + i, content: i + '_content'})
}

let count = 0
let removeCount = 0
const componentFlag = 'any_not_repeated_str'
Page({
  data: {
    componentFlag,
  },
  onLoad() {
    const getHistoryEventName = `GET_HISTORY_${componentFlag}` // 事件名称 生成规则
    const event = getApp().globalEvent
    event.on(getHistoryEventName, this.getMoreData)
  },
  getMoreData() {
    return new Promise(resolve => {
      setTimeout(() => {
        const items = []
        for (let i = 30; i < 60; i++) {
          items.push({id: 'item_id_' + i, content: i + '_content'})
        }
        resolve(items)
      }, 3 * 1000)
    })
  },
  onShow() {
    const scroll = this.selectComponent('#scroll-view')
    scroll.init(items)
  },
  setHeight() {
    const height = items[0].height || 0
    const scroll = this.selectComponent('#scroll-view')
    items[0].height = height + 100
    scroll.updateRecords([items[0]])
  },
  removeElement() {
    const scroll = this.selectComponent('#scroll-view')
    scroll.deleteRecords([items[removeCount++]])
  },
  addElement() {
    const scroll = this.selectComponent('#scroll-view')
    const beforeList = [{
      id: 'item_id_' + --count,
      content: count + '_content',
      url: 'https://baike-med-dev-1256891581.file.myqcloud.com/wz_cmp/21501202/2fe1e4b0-b2ff-11eb-b747-87c53b3f4535.png!300x'
    },
    {id: 'item_id_' + --count, content: count + '_content'}]
    scroll.appendNextList(beforeList)
  }
})
