import IndexBv from '../virtual-scroll/behavior/index';
import { SCROLL_TYPE } from '../virtual-scroll/utils/constant';
Component({
    behaviors: [IndexBv],
    lifetimes: {
        created() {
            this.scrollType = SCROLL_TYPE.CHAT;
        },
    },
    methods: {
        onScroll2Top() {
            // 拉取历史消息
            this._doWhenScroll2Top();
        },
    },
});
