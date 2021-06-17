import { SCROLL_TYPE } from './constant';
let count = 0;
export function uuid() {
    return count++;
}
export const SCROLLMODE = {
    CHAT: 'CHAT',
    NORMAL: 'NORMAL',
};
export function generateGroups(list = [], numsByGroup = 10, startIndex = 0, direction = 1) {
    const groups = [];
    while (list.length) {
        const groupId = direction === -1 ? --startIndex : ++startIndex;
        const data = direction === 1 ? list.splice(0, numsByGroup) : list.splice(-numsByGroup);
        data.forEach(setItemGroupId(groupId));
        groups.push({ id: groupId, data, changeVersion: 0 });
    }
    return groups;
}
// startIndex 从 1 开始递减
export function generateNewMsgGroup(list = [], numsByGroup = 10, startIndex = 1) {
    const groups = [];
    while (list.length) {
        const groupId = --startIndex;
        const data = list.splice(0, numsByGroup);
        data.forEach(setItemGroupId(groupId));
        groups.push({ id: groupId, data, changeVersion: 0 });
    }
    return groups;
}
export function processData(content, scrollType) {
    if (!content) {
        return [];
    }
    if (scrollType === SCROLL_TYPE.CHAT) {
        content.reverse();
    }
    content = content.map((tempContent) => {
        // 渲染到界面中的每个条目的key，加速渲染，也能防止抖动
        // eslint-disable-next-line no-multi-assign
        const _key = (tempContent._key = uuid());
        return { _key, content: tempContent };
    });
    return content;
}
export function getTopElement(array) {
    if (array.length) {
        return array[0];
    }
    return undefined;
}
export function getEndElement(array) {
    if (array.length) {
        return array[array.length - 1];
    }
    return undefined;
}
// 目的: 渲染使用的数据和原始数据不应该是同一个对象
export function cloneGroup(group, extend) {
    if (!group)
        return;
    const { data } = group;
    const copyData = data.slice(0); // 数组复制
    return Object.assign({}, group, Object.assign({ data: copyData }, extend));
}
export const getGroupIds = group => group.id;
export function throttle(func, wait) {
    let timeout;
    return function (...args) {
        const that = this;
        if (!timeout) {
            timeout = setTimeout(() => {
                timeout = null;
                func.apply(that, args);
            }, wait);
        }
    };
}
export function debounce(fn, delay = 1000) {
    let timer;
    // 返回一个函数，这个函数会在一个时间区间结束后的 delay 毫秒时执行 func 函数
    return function (...args) {
        // 保存函数调用时的上下文和参数，传递给func
        const context = this;
        // 函数被调用，清除定时器
        clearTimeout(timer);
        // 当返回的函数被最后一次调用后（也就是用户停止了某个连续的操作），
        // 再过 delay 毫秒就执行 func
        timer = setTimeout(() => {
            fn.apply(context, args);
        }, delay);
    };
}
// 官方建议不超过 setData的数据在JSON.stringify后不超过 256KB
export function sizeof(object) {
    return (JSON.stringify(object).length / 1024).toFixed(4);
}
// 触发事件
export function emitEventEx(eventName) {
    const response = emitEventExWithoutPromise(eventName);
    return Promise.resolve(response);
}
function emitEventExWithoutPromise(eventName, data) {
    const { globalEvent } = getApp() || {};
    if (globalEvent.emitEventEx) {
        const responses = globalEvent.emitEventEx(eventName, data); // 支持返回promise
        return responses[0];
    }
}
export function addEventListener(eventName, handler) {
    const { globalEvent } = getApp() || { globalEvent: {} };
    if (globalEvent && globalEvent.addListener) {
        globalEvent.addListener(eventName, handler);
    }
}
export function removeEventListener(eventName, handler) {
    const { globalEvent } = getApp() || { globalEvent: {} };
    if (globalEvent && globalEvent.removeListener) {
        globalEvent.removeListener(eventName, handler);
    }
}
export function noop() { }
export function getIndexWithGroupId(groupId, historyGroups = [], nextGroups = []) {
    const histRepoLength = historyGroups.length;
    const minInHis = histRepoLength ? getTopElement(historyGroups).id : Number.MAX_SAFE_INTEGER;
    const maxInHis = histRepoLength ? getEndElement(historyGroups).id : Number.MIN_SAFE_INTEGER;
    const nextRepoLength = nextGroups.length;
    const minInNext = nextRepoLength ? getEndElement(nextGroups).id : Number.MAX_SAFE_INTEGER;
    const maxInNext = nextRepoLength ? getTopElement(nextGroups).id : Number.MIN_SAFE_INTEGER;
    const maxGroupId = Math.max(maxInHis, maxInNext);
    const minGroupId = Math.min(minInHis, minInNext);
    // 防止两个repo都是空数组的情况
    if (histRepoLength + nextRepoLength === 0) {
        return -1;
    }
    if (groupId < minGroupId || groupId > maxGroupId) {
        return -1;
    }
    // 历史消息数组的的groupId从 1 递增
    // 新消息数据的groupId 从 0 递减
    // 因此有下面结论
    if (groupId > 0) {
        return groupId - 1;
    }
    return -groupId;
}
export function setItemGroupId(groupId) {
    return (item) => {
        item._chatGroupId = item.content._chatGroupId = groupId;
    };
}
