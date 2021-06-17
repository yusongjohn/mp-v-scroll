import { cloneGroup, generateGroups, generateNewMsgGroup, getEndElement, getGroupIds, getIndexWithGroupId, processData, setItemGroupId, } from '../utils/util';
import { SCROLL_TYPE, SHOWING_SCREEN_NUMS } from '../utils/constant';
export default class Fuse {
    constructor(componentInstance) {
        this.componentInstance = componentInstance;
        // 存储原始数据
        this.historyGroupsRepo = []; // groupId >= 1
        this.nextGroupsRepo = []; // groupId <= 0
    }
    isAllNextRepoDataRendered() {
        return this.isAllRepoRenderedByScrollType(SCROLL_TYPE.NORMAL);
    }
    isAllHistoryRepoDataRendered() {
        return this.isAllRepoRenderedByScrollType(SCROLL_TYPE.CHAT);
    }
    isAllRepoRenderedByScrollType(scrollType) {
        const keyInfo = this.getKeyInfoByScrollType(scrollType);
        const { endGroupInRendered, endGroupInRepo } = keyInfo;
        if (endGroupInRendered !== undefined &&
            endGroupInRepo !== undefined &&
            endGroupInRendered.id !== endGroupInRepo.id) {
            return false;
        }
        return true;
    }
    getClearingData() {
        const { listenedGroupIds, data: { currentGroupId, renderedHistoryGroups, renderedNextGroups }, } = this.componentInstance;
        const renderData = {};
        const { groupIds: currentRenderedGroupIds } = this.getNextRenderData(currentGroupId) || {};
        if (!currentRenderedGroupIds || currentRenderedGroupIds.length === 0) {
            return [];
        }
        const clearingGroupIds = listenedGroupIds.filter((groupId) => !currentRenderedGroupIds.includes(groupId));
        const validClearingGroupIds = [];
        clearingGroupIds.forEach((groupId) => {
            // 底部的分组数据不清空
            const renderKeyName = groupId > 0 ? 'renderedHistoryGroups' : 'renderedNextGroups';
            const renderedGroups = groupId > 0 ? renderedHistoryGroups : renderedNextGroups;
            const indexInRender = this.getIndexWithGroupIdInRendered(groupId);
            if (renderedGroups[indexInRender].data.length !== 0) {
                validClearingGroupIds.push(groupId);
                renderData[`${renderKeyName}[${indexInRender}].data`] = [];
            }
        });
        return [renderData, validClearingGroupIds];
    }
    getIndexWithGroupIdInRepo(groupId) {
        const { historyGroupsRepo, nextGroupsRepo } = this;
        return getIndexWithGroupId(groupId, historyGroupsRepo, nextGroupsRepo);
    }
    getIndexWithGroupIdInRendered(groupId) {
        const { renderedHistoryGroups, renderedNextGroups } = this.componentInstance.data;
        return getIndexWithGroupId(groupId, renderedHistoryGroups, renderedNextGroups);
    }
    initHistoryList(initList) {
        if (!initList || !initList.length) {
            return { renderData: {}, groupIds: [] };
        }
        const { data: { groupNums, renderedGroupIds }, scrollType, } = this.componentInstance;
        initList = processData(initList, scrollType);
        this.historyGroupsRepo = generateGroups(initList, groupNums);
        const renderGroups = this.historyGroupsRepo.slice(0, SHOWING_SCREEN_NUMS).map(cloneGroup);
        const renderData = { renderedHistoryGroups: renderGroups };
        const groupIds = renderGroups.map(getGroupIds);
        Object.assign(renderData, { renderedGroupIds: renderedGroupIds.concat(groupIds) });
        return { renderData, groupIds };
    }
    initNextList(nextList) {
        if (!nextList || !nextList.length) {
            return { renderData: {}, groupIds: [] };
        }
        const { data: { groupNums, renderedGroupIds }, } = this.componentInstance;
        nextList = processData(nextList, SCROLL_TYPE.NORMAL);
        this.nextGroupsRepo = generateNewMsgGroup(nextList, groupNums);
        const renderGroups = this.nextGroupsRepo.slice(0, SHOWING_SCREEN_NUMS).map(cloneGroup);
        const renderData = { renderedNextGroups: renderGroups };
        const groupIds = renderGroups.map(getGroupIds);
        Object.assign(renderData, { renderedGroupIds: renderedGroupIds.concat(groupIds) });
        return { renderData, groupIds };
    }
    insertHistoryList(list) {
        const { renderedHistoryGroups } = this.componentInstance.data;
        // 如果当前界面没有任何渲染的历史数据，初始化历史列表
        if (renderedHistoryGroups.length === 0) {
            return this.initHistoryList(list);
        }
        return this.insertListByScrollType(list, SCROLL_TYPE.CHAT);
    }
    appendNextList(list) {
        const { renderedNextGroups } = this.componentInstance.data;
        if (renderedNextGroups.length === 0) {
            return this.initNextList(list);
        }
        return this.insertListByScrollType(list, SCROLL_TYPE.NORMAL);
    }
    insertListByScrollType(list, scrollType) {
        if (!list || list.length === 0) {
            return {
                renderData: {},
                groupIds: [],
            };
        }
        const renderData = {};
        const { data: { groupNums, renderedGroupIds }, } = this.componentInstance;
        list = processData(list, scrollType);
        const keyInfo = this.getKeyInfoByScrollType(scrollType);
        const { groupsRepo, renderedGroup, renderKey, endGroupInRepo, endGroupInRendered } = keyInfo;
        const { data: endGroupDataInRepo, id: endGroupIdInRepo, changeVersion } = endGroupInRepo;
        const { data: endGroupDataInRendered, id: endGroupIdInRendered } = endGroupInRendered;
        const endGroupInRenderedDataLength = endGroupDataInRendered.length;
        // ----------------------- 补充上一个group -----------------------
        const suppCount = groupNums - endGroupDataInRepo.length;
        // 可能会出现负值的情况，即 groupDataInRender.length 大于 groupNums
        if (suppCount > 0) {
            const nextVersion = changeVersion + 1;
            const supplementData = list.splice(0, suppCount);
            // 设置消息所在组: 第三处/共三处
            supplementData.forEach(setItemGroupId(endGroupIdInRepo));
            // 同步到 groupDataInDataRepo
            endGroupDataInRepo.push(...supplementData);
            endGroupDataInRepo.changeVersion = nextVersion;
            // 如果仓库中的最后一个分组的数据已经渲染到界面上
            // 此时来的新数据需要同步到界面上
            const renderedGroupKey = `${renderKey}[${renderedGroup.length - 1}]`;
            if (endGroupIdInRepo === endGroupIdInRendered && endGroupInRenderedDataLength) {
                supplementData.forEach((dataItem, index) => {
                    const key = `${renderedGroupKey}.data[${endGroupInRenderedDataLength + index}]`;
                    renderData[key] = dataItem;
                    renderData[`renderedGroupKey.${renderedGroupKey}`] = nextVersion;
                });
            }
            // 复活曾今废弃的分组
            if (endGroupInRepo.dispose) {
                renderData[`${renderedGroupKey}.dispose`] = false;
                delete endGroupInRepo.dispose;
            }
        }
        // ----------------------- 剩余历史消息进行分组 -----------------------
        let msgGroups = [];
        let nextGroups = [];
        if (scrollType === SCROLL_TYPE.CHAT) {
            msgGroups = generateGroups(list, groupNums, endGroupIdInRepo);
        }
        else if (scrollType === SCROLL_TYPE.NORMAL) {
            msgGroups = generateNewMsgGroup(list, groupNums, endGroupIdInRepo);
        }
        if (msgGroups.length) {
            // 同步到仓库
            groupsRepo.push(...msgGroups);
            // 同步到界面
            if (endGroupIdInRepo === endGroupIdInRendered && endGroupInRenderedDataLength) {
                nextGroups = msgGroups.slice(0, SHOWING_SCREEN_NUMS).map(cloneGroup);
                nextGroups.forEach((groupItem, index) => {
                    const key = `${renderKey}[${renderedGroup.length + index}]`;
                    renderData[key] = groupItem;
                });
            }
        }
        const groupIds = nextGroups.map(getGroupIds);
        Object.assign(renderData, { renderedGroupIds: renderedGroupIds.concat(groupIds) });
        return {
            renderData,
            groupIds,
        };
    }
    getKeyInfoByScrollType(scrollType) {
        const { renderedNextGroups, renderedHistoryGroups } = this.componentInstance.data;
        if (scrollType === SCROLL_TYPE.CHAT) {
            return {
                renderKey: 'renderedHistoryGroups',
                groupsRepo: this.historyGroupsRepo,
                renderedGroup: renderedHistoryGroups,
                endGroupInRepo: getEndElement(this.historyGroupsRepo),
                endGroupInRendered: getEndElement(renderedHistoryGroups),
            };
        }
        // (scrollType === SCROLL_TYPE.NORMAL)
        return {
            renderKey: 'renderedNextGroups',
            groupsRepo: this.nextGroupsRepo,
            renderedGroup: renderedNextGroups,
            endGroupInRepo: getEndElement(this.nextGroupsRepo),
            endGroupInRendered: getEndElement(renderedNextGroups),
        };
    }
    insertBeforeTargetRecord(originRecord, newRecords = []) {
        const renderData = {};
        const { _chatGroupId } = originRecord;
        if (_chatGroupId === undefined) {
            return;
        }
        let { scrollType } = this.componentInstance;
        if (scrollType === SCROLL_TYPE.CHAT && _chatGroupId <= 0) {
            scrollType = SCROLL_TYPE.NORMAL;
        }
        newRecords = processData(newRecords, scrollType);
        const updateRepoGroup = ({ groupInRepo, msgIndexInRepo }) => {
            const { changeVersion, id: groupId, data: groupData } = groupInRepo;
            groupInRepo.changeVersion = changeVersion + 1;
            newRecords.forEach(setItemGroupId(groupId));
            if (groupId > 0) {
                // 历史区域
                groupData.splice(msgIndexInRepo + 1, 0, ...newRecords);
            }
            else {
                groupData.splice(msgIndexInRepo, 0, ...newRecords);
            }
        };
        const updateRenderedGroup = ({ renderedKey, groupInRepo }) => {
            const { data: groupData, changeVersion } = groupInRepo;
            renderData[`${renderedKey}.changeVersion`] = changeVersion;
            renderData[`${renderedKey}.data`] = [...groupData];
        };
        this.updateGroupByOriginalMsg(originRecord, updateRepoGroup, updateRenderedGroup);
        return renderData;
    }
    deleteRecords(removeList = []) {
        const deleteData = {};
        const updateRepoGroup = ({ groupInRepo, msgIndexInRepo }) => {
            const { changeVersion, data: groupData } = groupInRepo;
            groupInRepo.changeVersion = changeVersion + 1;
            groupData.splice(msgIndexInRepo, 1);
            if (groupInRepo.data.length === 0) {
                groupInRepo.dispose = true;
            }
        };
        const updateRenderedGroup = ({ renderedKey, groupInRepo }) => {
            // 直接同步仓库中的数据
            const { data: nextData, changeVersion } = groupInRepo;
            deleteData[`${renderedKey}.changeVersion`] = changeVersion;
            deleteData[`${renderedKey}.data`] = [...nextData];
            if (nextData.length === 0) {
                deleteData[`${renderedKey}.dispose`] = true;
            }
        };
        removeList.forEach((originalMsg) => {
            this.updateGroupByOriginalMsg(originalMsg, updateRepoGroup, updateRenderedGroup);
        });
        return deleteData;
    }
    // changeVersion 需要变更，其余场景通过group.data.length 区分变化
    // [{oldVersion,newVersion}]
    updateRecords(updateRecords = []) {
        const updateData = {};
        updateRecords.forEach((recordItem) => {
            // 支持两种形式：[oldV, newV], [newV]
            // 默认对象形式
            let oldVersion = recordItem;
            let newVersion = oldVersion;
            // 数组形式
            if (recordItem.length === 2) {
                [oldVersion, newVersion] = recordItem;
                const { _chatGroupId, _key } = oldVersion;
                Object.assign(newVersion, { _chatGroupId, _key });
            }
            const updateRepoGroup = ({ groupInRepo, msgIndexInRepo }) => {
                const { changeVersion } = groupInRepo;
                groupInRepo.data[msgIndexInRepo].content = newVersion;
                groupInRepo.changeVersion = changeVersion + 1;
            };
            const updateRenderedGroup = ({ renderedKey, groupInRepo, msgIndexInRender }) => {
                updateData[`${renderedKey}.data[${msgIndexInRender}].content`] = newVersion;
                updateData[`${renderedKey}.changeVersion`] = groupInRepo.changeVersion;
            };
            this.updateGroupByOriginalMsg(oldVersion, updateRepoGroup, updateRenderedGroup);
        });
        return updateData;
    }
    getKeyInfo(groupId) {
        const renderKeyName = groupId > 0 ? 'renderedHistoryGroups' : 'renderedNextGroups';
        const { data: { renderedNextGroups, renderedHistoryGroups }, } = this.componentInstance;
        const groupsRepo = groupId > 0 ? this.historyGroupsRepo : this.nextGroupsRepo;
        const indexInRepo = this.getIndexWithGroupIdInRepo(groupId);
        const renderedGroups = groupId > 0 ? renderedHistoryGroups : renderedNextGroups;
        const indexInRender = this.getIndexWithGroupIdInRendered(groupId);
        return { renderKeyName, groupsRepo, indexInRepo, renderedGroups, indexInRender };
    }
    // 作用：封装同类操作
    updateGroupByOriginalMsg(originalMsg, updateRepoGroup, updateRenderedGroup) {
        const { _key: messageKey, _chatGroupId: groupId } = originalMsg;
        if (messageKey === undefined || groupId === undefined) {
            return;
        }
        const { renderKeyName, groupsRepo, indexInRepo, renderedGroups, indexInRender, } = this.getKeyInfo(groupId);
        if (indexInRepo < 0) {
            return;
        }
        const filter = (item) => item._key === messageKey;
        const groupInRepo = groupsRepo[indexInRepo];
        const msgIndexInRepo = groupInRepo.data.findIndex(filter);
        if (msgIndexInRepo < 0) {
            return;
        }
        // 第一步：同步到仓库
        updateRepoGroup({ groupInRepo, msgIndexInRepo });
        if (indexInRender < 0) {
            return;
        }
        // 第二步：同步到界面
        const groupInRender = renderedGroups[indexInRender];
        const { data: groupDataInRender } = groupInRender;
        if (groupDataInRender.length === 0) {
            return;
        }
        const msgIndexInRender = msgIndexInRepo; // 二者是相等的
        const renderedKey = `${renderKeyName}[${indexInRender}]`;
        updateRenderedGroup({ renderedKey, groupInRepo, msgIndexInRender });
    }
    getNextRenderData(currentGroupId) {
        // 由于每个分组的的项可能少于或对于groupNums
        // 根据项数而非分组数来下一次渲染的数据
        const { groupNums, renderedNextGroups, renderedHistoryGroups } = this.componentInstance.data;
        const { renderKeyName, groupsRepo, indexInRepo, renderedGroups, indexInRender, } = this.getKeyInfo(currentGroupId);
        if (indexInRepo < 0) {
            return;
        }
        const { data: currentRepoGroupData } = groupsRepo[indexInRepo];
        const halfRenderSize = Math.ceil((SHOWING_SCREEN_NUMS * groupNums) / 2);
        const accumulateNums = halfRenderSize - Math.floor(currentRepoGroupData.length / 2);
        const nextRenderedGroupsId = [currentGroupId];
        const renderData = {};
        // currentGroup 是否有数据呢
        if (renderedGroups[indexInRender].data.length === 0) {
            const key = `${renderKeyName}[${indexInRender}].data`;
            renderData[key] = [...currentRepoGroupData];
        }
        let sumNums = 0; // 方向-1
        let indexTmp = indexInRender; // indexInRender\indexInRepo 指向同一个分组
        // 1. currentGroup在新消息区域，++ 去往 新消息方向
        // 2. currentGroup在历史消息区域，++ 去往 历史消息方向
        for (let index = indexInRepo + 1; index < groupsRepo.length; index++) {
            const groupInRepo = groupsRepo[index];
            const { data: repoGroupData, id: repoGroupId } = groupInRepo;
            nextRenderedGroupsId.push(repoGroupId);
            sumNums += repoGroupData.length;
            // eslint-disable-next-line no-plusplus
            indexTmp++;
            const renderedGroupKey = `${renderKeyName}[${indexTmp}]`;
            // 仓库中的分组尚未加载到界面的情况
            if (!renderedGroups[indexTmp]) {
                renderData[renderedGroupKey] = cloneGroup(groupInRepo);
                // 界面中分组的数据之前有被清理过
            }
            else if (renderedGroups[indexTmp].data.length === 0) {
                renderData[`${renderedGroupKey}.data`] = [...repoGroupData];
            }
            // 判断是否累计到足够的项
            if (sumNums >= accumulateNums) {
                break;
            }
        }
        let enoughFlag = false;
        indexTmp = indexInRender;
        sumNums = 0; // 方向-1
        // 1. currentGroup在新消息区域，-- 去往 历史消息方向
        // 2. currentGroup在历史消息区域，++ 去往 新消息方向
        for (let index = indexInRepo - 1; index >= 0; index--) {
            const groupInRepo = groupsRepo[index];
            const { data: repoGroupData, id: repoGroupId } = groupInRepo;
            nextRenderedGroupsId.push(repoGroupId);
            sumNums += repoGroupData.length;
            // eslint-disable-next-line no-plusplus
            indexTmp--;
            if (indexTmp < 0) {
                break;
            }
            if (!renderedGroups[indexTmp]) {
                renderData[`${renderKeyName}[${indexTmp}]`] = cloneGroup(groupInRepo);
            }
            else if (renderedGroups[indexTmp].data.length === 0) {
                renderData[`${renderKeyName}[${indexTmp}].data`] = [...repoGroupData];
            }
            if (sumNums >= accumulateNums) {
                // 满足要求了
                enoughFlag = true;
                break;
            }
        }
        // 反方向查找
        // 新消息和历史消息交界处的处理
        const antiRenderKeyName = currentGroupId > 0 ? 'renderedNextGroups' : 'renderedHistoryGroups';
        const antiGroupsRepo = currentGroupId > 0 ? this.nextGroupsRepo : this.historyGroupsRepo;
        const antiRenderedGroups = currentGroupId > 0 ? renderedNextGroups : renderedHistoryGroups;
        if (!enoughFlag) {
            for (let index = 0; index < antiGroupsRepo.length; index++) {
                const groupInRepo = antiGroupsRepo[index];
                const { data: repoGroupData, id: repoGroupId } = groupInRepo;
                nextRenderedGroupsId.push(repoGroupId);
                sumNums += repoGroupData.length;
                if (!antiRenderedGroups[index]) {
                    renderData[`${antiRenderKeyName}[${index}]`] = cloneGroup(groupInRepo);
                }
                else if (antiRenderedGroups[index].data.length === 0) {
                    renderData[`${antiRenderKeyName}[${index}].data`] = [...repoGroupData];
                }
                if (sumNums >= accumulateNums) {
                    // 满足要求了
                    break;
                }
            }
        }
        Object.assign(renderData, { renderedGroupIds: nextRenderedGroupsId });
        return { renderData, groupIds: nextRenderedGroupsId };
    }
}

//# sourceMappingURL=fuse.js.map
