import IndexBv from '../virtual-scroll/behavior/index';
import { SCROLL_TYPE } from '../virtual-scroll/utils/constant';
Component({
    behaviors: [IndexBv],
    lifetimes: {
        created() {
            this.scrollType = SCROLL_TYPE.NORMAL;
        },
    },
    methods: {
        onScroll2Bottom() {
            this._doWhenScroll2Bottom();
        },
    },
});
