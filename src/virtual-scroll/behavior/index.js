import ApiBv from './api-bv'
import DataBv from './data-bv'
import GroupScrollBv from './group-scroll-bv'
import NormalSceneBv from './data-insert-bv'
import EventBus from '../utils/event'

getApp().globalEvent = getApp().globalEvent || new EventBus()

export default Behavior({
  behaviors: [ApiBv, DataBv, GroupScrollBv, NormalSceneBv],
})
