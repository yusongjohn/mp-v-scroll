import { COMPONENT_STATUS, SCROLL_CONTAINER_ID, SCROLL_TYPE } from '../utils/constant';
export default Behavior({
    methods: {
        init(initList = []) {
            let initMethodName = '';
            if (this.scrollType === SCROLL_TYPE.CHAT) {
                initMethodName = 'initHistoryList';
            }
            else {
                initMethodName = 'initNextList';
            }
            const { renderData, groupIds } = this.fuse[initMethodName](initList) || {};
            // 组件状态
            let statusData = { status: '' };
            if (!groupIds || groupIds.length === 0) {
                statusData = { status: COMPONENT_STATUS.EMPTY_LIST };
            }
            const data = Object.assign(renderData, statusData);
            this._addDefaultListener();
            return this._setDataWrapper(data, () => this._createObserver(groupIds));
        },
        updateRecords(updateRecords = []) {
            const updateData = this.fuse.updateRecords(updateRecords);
            return this._setDataWrapper(updateData);
        },
        deleteRecords(removeList = []) {
            const deleteData = this.fuse.deleteRecords(removeList);
            return this._setDataWrapper(deleteData);
        },
        insertBeforeTargetRecord(originalMsg = {}, newRecords = []) {
            const renderData = this.fuse.insertBeforeTargetRecord(originalMsg, newRecords);
            return this._setDataWrapper(renderData);
        },
        // 支持两种调用方式，triggerEvent & api 直接调用
        updateStyle(e) {
            const styleObject = e.detail || {};
            const renderData = {};
            for (const key in styleObject) {
                renderData[`styleRepo.${key}`] = styleObject[key];
            }
            return this._setDataWrapper(renderData);
        },
        appendNextList(nextList = []) {
            const { groupIds, renderData } = this.fuse.appendNextList(nextList);
            return this._setDataWrapper(renderData, () => this._createObserver(groupIds));
        },
        // 仅对会话场景开放
        insertHistoryList(nextList = []) {
            const { groupIds, renderData } = this.fuse.insertHistoryList(nextList);
            return this._setDataWrapper(renderData, () => this._createObserver(groupIds));
        },
        scrollToBottom() {
            const scrollTopValue = this.scrollType === SCROLL_TYPE.CHAT ? 0 : Number.MAX_SAFE_INTEGER;
            return this._setDataWrapper({ scrollTop: scrollTopValue });
        },
        scrollToTop() {
            const scrollTopValue = this.scrollType === SCROLL_TYPE.NORMAL ? 0 : Number.MAX_SAFE_INTEGER;
            return this._setDataWrapper({ scrollTop: scrollTopValue });
        },
        scrollToTarget(originalMsg = {}) {
            if (this.scrollType === SCROLL_TYPE.CHAT) {
                return this._scrollToTargetForChat(originalMsg);
            }
            return this._scrollToTargetForNormal(originalMsg);
        },
        _scrollToTargetForChat(originalMsg) {
            const renderPromise = this._renderTarget(originalMsg);
            const scrollTo = () => {
                const { _key: messageKey, _chatGroupId: groupId } = originalMsg;
                const { groupsRepo, indexInRepo } = this.fuse.getKeyInfo(groupId);
                const groupInRepo = groupsRepo[indexInRepo];
                const msgIndex = groupInRepo.data.findIndex((item) => item._key === messageKey);
                const itemId = `#content-row-${groupInRepo.id}-${msgIndex}`;
                const containerId = `${SCROLL_CONTAINER_ID}${this.data.componentFlag}`;
                return Promise.all([this._queryBoundingClient(itemId), this._getScrollInfo(containerId)])
                    .then((res = [[[{}]], {}]) => {
                    const [[[{ bottom: itemBottom, height: itemHeight }]], { bottom: containerBottom, scrollTop, height: containerHeight },] = res;
                    let itemScrollTop = containerBottom - itemBottom + scrollTop;
                    itemScrollTop += itemHeight - containerHeight;
                    return this._setDataWrapper({ scrollTop: itemScrollTop });
                })
                    .catch((error) => Promise.reject(error));
            };
            return renderPromise.then(scrollTo);
        },
        _scrollToTargetForNormal(originalMsg) {
            const renderPromise = this._renderTarget(originalMsg);
            const scrollTo = () => {
                const { _key: messageKey, _chatGroupId: groupId } = originalMsg;
                const { groupsRepo, indexInRepo } = this.fuse.getKeyInfo(groupId);
                const groupInRepo = groupsRepo[indexInRepo];
                const msgIndex = groupInRepo.data.findIndex((item) => item._key === messageKey);
                const targetID = `content-row-${groupInRepo.id}-${msgIndex}`;
                this._setDataWrapper({
                    viewId: targetID,
                });
            };
            return renderPromise.then(scrollTo);
        },
        _renderTarget(originalMsg = {}) {
            const { _key: messageKey, _chatGroupId: groupId } = originalMsg;
            if (messageKey === undefined || groupId === undefined) {
                return Promise.reject('invalid record');
            }
            const { renderData, groupIds } = this.fuse.getNextRenderData(groupId);
            return this._setDataWrapper(renderData, () => this._createObserver(groupIds));
        },
        reset() {
            return this.resetData();
        },
    },
});
