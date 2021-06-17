import {SCROLL_CONTAINER_ID, GROUP_ID_PREFIX} from '../utils/constant'

export default Behavior({
  methods: {
    /* -------------------------- 虚拟滚动相关逻辑 --------------------------*/
    // 监听分组容器dom的IntersectionObserver
    _createObserver(groupIds = []) {
      if (!groupIds || groupIds.length === 0) {
        return
      }
      groupIds.sort((a, b) => a - b) // 关键，listenedGroupIds需要是有序的
      groupIds.forEach(groupId => {
        if (!this.listenedGroupIds.includes(groupId)) {
          const domId = `${GROUP_ID_PREFIX}${groupId}`
          const containerId = `${SCROLL_CONTAINER_ID}${this.data.componentFlag}`
          const observer = wx.createIntersectionObserver(this).relativeTo(containerId)
          observer.observe(domId, this._observerCallback.bind(this))
          if (groupId > 0) {
            this.listenedGroupIds.push(groupId)
          } else {
            this.listenedGroupIds.unshift(groupId)
          }
          this.listenedObservers.push(observer)
        }
      })
    },
    _observerCallback(result) {
      const {id = ''} = result
      const {currentGroupId: preGroupId} = this.data
      const currentGroupId = parseInt(id.substring(GROUP_ID_PREFIX.length - 1), 10)
      if (Number.isNaN(currentGroupId) ||
                result.intersectionRatio === 0 ||
                preGroupId === currentGroupId) {
        return
      }
      this._setDataWrapper({currentGroupId})
      if (result.intersectionRatio > 0) {
        this._renderDataToUI(currentGroupId)
        this._throttleRemoveOutOfScreenData()
      }
    },
    _setDataWrapper(data, cb) {
      const wrapperCb = (resolve) => {
        if (typeof cb === 'function') {
          cb()
        }
        resolve()
      }
      return new Promise((resolve) => {
        if (!data) {
          wrapperCb(resolve)
        } else {
          this.setData(data, () => wrapperCb(resolve))
        }
      })
    },
    _removeOutOfScreenData() {
      const [renderData, clearingGroupIds] = this.fuse.getClearingData()
      this._setDataWrapper({clearingGroupIds}, () => {
        this._setDataWrapper(renderData)
      })
    },
    _renderDataToUI(currentGroupId) {
      this.latestRenderGroupId = currentGroupId
      if (this.setRendering) {
        return
      }
      this.setRendering = true
      const {renderData, groupIds} = this.fuse.getNextRenderData(currentGroupId)
      if (groupIds.length === 0) {
        return
      }
      this._setDataWrapper(renderData, () => {
        this._createObserver(groupIds)
        this.setRendering = false
        if (this.latestRenderGroupId === currentGroupId) {
          return
        }
        this._renderDataToUI(this.latestRenderGroupId)
      })
    },
  },
})
