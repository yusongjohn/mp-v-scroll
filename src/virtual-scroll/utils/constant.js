export const UPDATE_MODE = {
  EXTEND: 'EXTEND',
  UPDATE: 'UPDATE',
}
export const SCROLL_TYPE = {
  NORMAL: 'NORMAL',
  CHAT: 'CHAT',
}
export const INSERT_DIRECTION = {
  TOP: 'TOP',
  BOTTOM: 'BOTTOM',
}
export function defaultModifyCB(original, extend) {
  return Object.assign({}, original, extend)
}
export function noop() { }
export const SHOWING_SCREEN_NUMS = 3
export const BOTTOM_DISTANCE = 3
export const SCROLL_CONTAINER_ID = '#scroll-container-'
export const GROUP_ID_PREFIX = '#piece-container-'
export const COMPONENT_STATUS = {
  BEFORE_INITED: 'BEFORE_INITED',
  EMPTY_LIST: 'EMPTY_LIST',
}
export const GET_HISTORY_EVENT_NAME_PREFIX = 'GET_HISTORY_'
export const SCROLL_BOTTOM_EVENT_NAME_PREFIX = 'SCROLL_BOTTOM_'
export const UPDATE_HEIGHT_EVENT_NAME_PREFIX = 'UPDATE_HEIGHT_'
