// 发布订阅
export default class EventBus {
    on(event, fn, context) {
        // 判断fn是否是函数
        if (typeof fn !== 'function') {
            return;
        }
        // 将event的fn存放在store中
        this._stores = this._stores || {};
        (this._stores[event] = this._stores[event] || []).push({ cb: fn, ctx: context });
    }
    // 发布
    emitEventEx(event, ...rest) {
        this._stores = this._stores || {};
        let store = this._stores[event];
        let args;
        // 遍历执行事件
        if (store) {
            store = store.slice(0);
            args = rest; // 获取传入的参数，https://segmentfault.com/q/1010000005643934
            return store.map(item => item.cb.apply(item.ctx, args));
        }
        return [];
    }
    // 注销
    off(event, fn) {
        this._stores = this._stores || {};
        // 删除所有
        if (!arguments.length) {
            this._stores = [];
            return;
        }
        const store = this._stores[event];
        if (!store) {
            return;
        }
        // 删除指定event
        if (arguments.length === 1) {
            delete this._stores[event];
            return;
        }
        // 删除指定fn
        for (let i = 0, len = store.length; i < len; i++) {
            if (fn === store[i].cb) {
                store.splice(i, 1); // splice slice
            }
        }
    }
}
