export class yibaoConsts{
    static readonly dataType = {
        0: '文本',
        1: '数值',
        2: '日期',
        3: '选择'
    }

    static readonly ch = {
        /** 每周第一天，0代表周日 */
        firstDayOfWeek: 0,
        /** 每周天数正常样式 */
        dayNames: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        /** 每周天数短样式（位置较小时显示） */
        dayNamesShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        /** 每周天数最小样式 */
        dayNamesMin: ["日", "一", "二", "三", "四", "五", "六"],
        /** 每月月份正常样式 */
        monthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        /** 每月月份短样式 */
        monthNamesShort: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
    };

    static readonly channel = {
        Heilongjiang: '黑龙江医保',
        Jingdezhen: '景德镇医保',
        Shenzhen: '深圳医保'
    };

    static readonly processState = {
        0: '初始',
        1: '处理中',
        2: '处理锁定中',
        3: '失败',
        4: '完成',
    };

    static readonly processType = {
        0: '收费',
        1: '退费'
    };
}