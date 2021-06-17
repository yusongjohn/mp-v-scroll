import Fuse from './fuse'
import {
  getEndElement, throttle, addEventListener, removeEventListener
} from '../utils/util'
import {COMPONENT_STATUS, UPDATE_HEIGHT_EVENT_NAME_PREFIX} from '../utils/constant'
import {globalComponentFlags} from './shareData'

const INITIAL_CURRENT_GROUP = 1
let countFlag = 0
export default Behavior({
  options: {
    virtualHost: true,
  },
  properties: {
    // 元素高度(内容)同步确定(图片不属于) && 不存在更改已出现元素的内容 && 以及不存在在中间位置删除或者新增元素
    // 关于图片部分可以通过保存原始图片尺寸，同步确定dom高，避免图片加载导致高度的变化
    idealMode: {
      type: Boolean,
      value: true,
    },
    groupSkeletonImg: {
      // 提供一个 containerSkeletonImg
      type: String,
      value: '',
    },
    groupNums: {
      type: Number,
      value: 10,
    },
    common: {
      type: Object,
      value: {},
    },
    componentFlag: {
      // 组件标识，需要唯一
      type: String,
      value: (countFlag++).toString(),
    },
  },
  data: {
    updateHeightFlag: false,
    renderedGroupIds: [],
    clearingGroupIds: [],
    isLoadingHistory: false,
    isLoadingHistoryDone: false,
    viewId: '',
    isLoadingNext: false,
    isLoadingNextDone: false,
    currentGroupId: INITIAL_CURRENT_GROUP,
    styleRepo: {},
    scrollTop: 0,
    renderedNextGroups: [],
    renderedHistoryGroups: [],
    renderedHistorySum: 0,
    status: COMPONENT_STATUS.BEFORE_INITED,
  },
  observers: {
    'renderedHistoryGroups.**': function () {
      let renderedHistorySum = 0
      const {renderedHistoryGroups, groupNums} = this.data
      if (renderedHistoryGroups.length) {
        const {data: endGroupData} = getEndElement(renderedHistoryGroups)
        renderedHistorySum = (renderedHistoryGroups.length - 1) * groupNums + endGroupData.length
      }
      this._setDataWrapper({renderedHistorySum})
    },
    'renderedHistoryGroups.**,renderedNextGroups.**': function (renderedHistoryGroups, renderedNextGroups) {
      if ((renderedHistoryGroups.length || renderedNextGroups.length) && this.data.stats !== '') {
        this._setDataWrapper({status: ''})
      }
    },
  },
  lifetimes: {
    created() {
      this.fuse = new Fuse(this)
      this.listenedGroupIds = [] // 从小到大有序排，小（新消息方向）-> 大 （历史消息方向）
      this.listenedObservers = []
      this.setRendering = false
      this.latestRenderGroupId = Number.MAX_SAFE_INTEGER
      this._throttleRemoveOutOfScreenData = throttle(this._removeOutOfScreenData.bind(this), 3000)
      this._updateHeightFlagCb = () => {
        const {updateHeightFlag} = this.data
        this._setDataWrapper({updateHeightFlag: !updateHeightFlag})
      }
    },
    attached() {
      this._addDefaultListener()
    },
    detached() {
      this.resetData()
      this._removeDefautListener()
    },
  },
  methods: {
    _removeDefautListener() {
      const {componentFlag} = this.data
      const index = globalComponentFlags.indexOf(componentFlag)
      if (index >= 0) {
        globalComponentFlags.splice(index, 1)
      }
      const eventName = `${UPDATE_HEIGHT_EVENT_NAME_PREFIX}${componentFlag}`
      removeEventListener(eventName, this._updateHeightFlagCb)
    },
    _addDefaultListener() {
      const {componentFlag} = this.data
      const eventName = `${UPDATE_HEIGHT_EVENT_NAME_PREFIX}${componentFlag}`
      if (!componentFlag) {
        console.log('empty componentFlag')
      }
      if (globalComponentFlags.indexOf(componentFlag) >= 0) {
        console.log('repeated componentFlag')
      }
      globalComponentFlags.push(componentFlag)
      addEventListener(eventName, this._updateHeightFlagCb)
    },
    resetData() {
      this.setRendering = false
      this.listenedGroupIds = []
      this.latestRenderGroupId = Number.MAX_SAFE_INTEGER
      this.listenedObservers.forEach(observer => observer.disconnect())
      this.listenedObservers = []
      return this._setDataWrapper({
        updateHeightFlag: false,
        renderedGroupIds: [],
        clearingGroupIds: [],
        styleRepo: {},
        scrollTop: 0,
        currentGroupId: INITIAL_CURRENT_GROUP,
        isLoadingHistory: false,
        isLoadingHistoryDone: false,
      })
    },
  },
})
