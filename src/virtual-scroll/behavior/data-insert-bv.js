import {emitEventEx} from '../utils/util'
import {GET_HISTORY_EVENT_NAME_PREFIX, SCROLL_BOTTOM_EVENT_NAME_PREFIX} from '../utils/constant'

export default Behavior({
  methods: {
    _queryBoundingClient(selector) {
      if (!selector) {
        return Promise.resolve()
      }
      return new Promise((resolve) => {
        const query = this.createSelectorQuery()
        query.selectAll(selector).boundingClientRect()
        query.exec(resolve)
      })
    },
    _getScrollInfo(idSelector) {
      return new Promise((resolve) => {
        const query = this.createSelectorQuery()
        query.select(idSelector).boundingClientRect()
        query.select(idSelector).scrollOffset()
        query.exec((res = [{}, {}]) => {
          const [{top, bottom, height}, {scrollHeight, scrollTop}] = res
          const scrollInfo = {
            scrollTop, scrollHeight, top, bottom, height
          }
          resolve(scrollInfo)
        })
      })
    },
    _doWhenScroll2Bottom() {
      const eventPrefix = SCROLL_BOTTOM_EVENT_NAME_PREFIX
      const {isLoadingNext, isLoadingNextDone} = this.data
      if (isLoadingNextDone || isLoadingNext) {
        return
      }
      if (!this.fuse.isAllNextRepoDataRendered()) {
        return
      }
      const setLoadingPromise = new Promise((resolve) => {
        this._setDataWrapper({isLoadingNext: true}, resolve)
      })
      const nextDataPromise = emitEventEx(`${eventPrefix}${this.data.componentFlag}`)
      const setLoadingNextFalse = () => this._setDataWrapper({isLoadingNext: false})
      Promise.all([nextDataPromise, setLoadingPromise])
        .then(([nextList]) => {
          setLoadingPromise.then(() => {
            // 如果没有返回新的数据，直接返回
            if (!nextList || nextList.length === 0) {
              this._setDataWrapper({isLoadingNextDone: true, isLoadingNext: false})
            } else {
              const {groupIds, renderData} = this.fuse.appendNextList(nextList)
              Object.assign(renderData, {isLoadingNext: false})
              this._setDataWrapper(renderData, () => this._createObserver(groupIds))
            }
          }).catch(setLoadingNextFalse)
        }).catch(setLoadingNextFalse)
    },
    _doWhenScroll2Top() {
      const eventPrefix = GET_HISTORY_EVENT_NAME_PREFIX
      const {isLoadingHistory, isLoadingHistoryDone} = this.data
      if (isLoadingHistoryDone || isLoadingHistory) {
        return
      }
      if (!this.fuse.isAllHistoryRepoDataRendered()) {
        return
      }
      const setLoadingPromise = new Promise((resolve) => {
        this._setDataWrapper({isLoadingHistory: true}, resolve)
      })
      const nextDataPromise = emitEventEx(`${eventPrefix}${this.data.componentFlag}`)
      const setLoadingNextFalse = () => this._setDataWrapper({isLoadingHistory: false})
      Promise.all([nextDataPromise, setLoadingPromise])
        .then(([nextList]) => {
          setLoadingPromise.then(() => {
            // 如果没有返回新的数据，直接返回
            if (!nextList || nextList.length === 0) {
              this._setDataWrapper({isLoadingHistoryDone: true, isLoadingHistory: false})
            } else {
              const {groupIds, renderData} = this.fuse.insertHistoryList(nextList)
              Object.assign(renderData, {isLoadingHistory: false})
              this._setDataWrapper(renderData, () => this._createObserver(groupIds))
            }
          }).catch(setLoadingNextFalse)
        }).catch(setLoadingNextFalse)
    },
  },
})
