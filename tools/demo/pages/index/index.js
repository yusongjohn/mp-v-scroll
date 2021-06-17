const items = []
for (let i = 0; i < 100; i++) {
  items.push({ id: 'item_id_' + i, content: i + '_content' })
}

let count = 0
let removeCount = 0
Page({
  onShow () {
    const scroll = this.selectComponent('#scroll-view')
    scroll.init(items)
  },
  setHeight () {
    const height = items[0].height || 0
    const scroll = this.selectComponent('#scroll-view')
    items[0].height = height + 100
    scroll.updateRecords([items[0]])
  },
  removeElement () {
    const scroll = this.selectComponent('#scroll-view')
    scroll.deleteRecords([items[removeCount++]])
  },
  addElement () {
    const scroll = this.selectComponent('#scroll-view')
    const beforeList = [{
      id: 'item_id_' + --count,
      content: count + '_content',
      url: 'https://baike-med-dev-1256891581.file.myqcloud.com/wz_cmp/21501202/2fe1e4b0-b2ff-11eb-b747-87c53b3f4535.png!300x'
    },
      { id: 'item_id_' + --count, content: count + '_content' }]
    scroll.appendNextList(beforeList)
  }
})
