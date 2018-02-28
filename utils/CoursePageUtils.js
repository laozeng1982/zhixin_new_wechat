/**
 * 课程页面工具类，操作数据
 */
import Models from "../datamodel/Models";
import DateTimeUtils from "./DateTimeUtils";
import StorageUtils from "./StorageUtils";
import SyncUtils from "./SyncUtils";
import Util from "./Util";


const app = getApp();
let timer = '';

class CoursePageUtils {
    constructor(forEdit) {
        this.data = makePageData(forEdit);
        this.pageView = {};

    }

    updatePage() {
        console.log("this.data:", this.data);
        this.data.loadFinished = true;
        this.pageView.setData({
            pageData: this.data
        });
        console.log("this.pageView:", this.pageView);

        console.log("this.pageView.data.pageData:", this.pageView.data.pageData);
    }

    /**
     * 第一次进入该页面时，根据本地数据初始化
     * 只在页面onLoad的时候调用
     *
     */
    initTabData() {
        console.log("Course Page onLoad call, route:", this.pageView.route);
        console.log(this.pageView.options);
        // 根据页面传来的参数来决定优先激活哪个Tab
        // 从本地读取数据，用来初始化页面显示课程
        this.data.userInfo = StorageUtils.loadUserInfo();

        switch (this.pageView.route) {
            case "create":
                // 从新建页面过来，当前没有课程
                this.data.currentCourse = new Models.Course();
                break;
            case "modify":
                let currentCourseIdx = parseInt(this.pageView.options.courseId);

                // 当前页面要用的课程
                if (currentCourseIdx >= 0 && currentCourseIdx <= this.data.userInfo.teacherCourseSet.length - 1) {
                    this.data.currentCourseIdx = currentCourseIdx;
                    this.data.currentCourse = this.data.userInfo.teacherCourseSet[currentCourseIdx];

                    if (typeof this.pageView.options.date === "undefined") {
                        this.data.currentTabIdx = 0;
                        this.data.tabData[0].selected = true;
                        this.data.tabData[1].selected = false;

                    } else {
                        this.data.currentTabIdx = 1;
                        this.data.tabData[0].selected = false;
                        this.data.tabData[1].selected = true;

                    }

                    console.log("currentCourseIdx:", currentCourseIdx);
                    console.log("currentCourse:", this.data.currentCourse);

                } else {
                    console.log("Error tab options, options:", this.pageView.options);
                }

                break;
            case "view":
                let courseId = this.pageView.options.courseId;
                console.log("courseId:", courseId);
                SyncUtils.getCourseAtLaunch(this, courseId);
                break;
            default:
                break;

        }

    }

    switchTab(currentTabIdx) {
        this.data.currentTabIdx = currentTabIdx;
        for (let idx = 0; idx < this.data.tabData.length; idx++) {
            this.data.tabData[idx].selected = (idx === currentTabIdx);
        }

        this.updatePage();
    }

    /**
     * 初始化页面课程数据
     */
    initPageCourse() {
        console.log("Course Page onShow call, route:", this.pageView.route);

        // 1、准备课程数据
        switch (this.pageView.route) {
            case "create":
                // 从新建页面过来，当前没有课程
                this.data.currentCourse = new Models.Course();
                break;
            case "modify":
                let currentCourseIdx = parseInt(this.pageView.options.courseId);

                // 当前页面要用的课程
                if (currentCourseIdx >= 0 && currentCourseIdx <= this.data.userInfo.teacherCourseSet.length - 1) {
                    this.data.currentCourseIdx = currentCourseIdx;
                    this.data.currentCourse = this.data.userInfo.teacherCourseSet[currentCourseIdx];

                } else {
                    console.log("Error tab options, options:", this.pageView.options);
                }

                break;
            case "view":
                console.log("this.data.currentCourse:", this.data.currentCourse);
                break;
            default:
                break;

        }

        // 先判断course是否正确，谨防课程被删除，或者courseId变更以后，拿不到正确的course
        if (typeof this.data.currentCourse.id === "undefined") {
            console.log("获取失败！");
            wx.showModal({
                title: '获取课程信息失败！',
                content: '请联系分享者'
            });
            this.data.loadFailed = true;
            this.updatePage();
            return;
        }

        if (!this.data.fromHide) {
            // 如果首次进入，则全新

            // 1、根据课程初始化页面数据，需要分别处理上课地址和重复规律
            for (let item in this.data.currentCourse) {
                for (let displayItem in this.data.courseItems)
                    if (displayItem === item && displayItem !== "location") {
                        this.data.courseItems[displayItem].value = this.data.currentCourse[item];
                    }
            }

            // 2、初始化上课地址和教室
            this.data.courseItems.location.latitude.value = this.data.currentCourse.location.latitude;
            this.data.courseItems.location.longitude.value = this.data.currentCourse.location.longitude;
            this.data.courseItems.location.address.value = this.data.currentCourse.location.address;
            this.data.courseItems.location.name.value = this.data.currentCourse.location.name;
            this.data.courseItems.location.room.value = this.data.currentCourse.location.room;

            this.data.timeList = [45, 50, 55, 60, 75, 90, 100, 120];

        } else {
            // 如果是由次级页面跳转回来，则不需要重新加载数据

        }

        // 3、无论从哪里来，都要初始化重复规则
        if (this.data.currentCourse.recurringRule !== "请选择") {
            app.tempData.recurringRule = this.data.currentCourse.recurringRule.split(",");
        }

        if (app.tempData.recurringRule.constructor === Array) {
            if (app.tempData.recurringRule.length > 0) {
                this.data.courseItems.recurringRule.value = "每周" + app.tempData.recurringRule.map(DateTimeUtils.transEnDate2ChShortDate).join("、");
            }
        }

        for (let item of this.data.weekVisual) {
            item.selected = this.data.currentCourse.recurringRule.includes(item.name);

        }

        this.updatePage();
    }

    /**
     * 选择重复规则
     * @param dayIndex
     */
    selectRecurringDay(dayIndex) {
        let selectedDateArray = [];
        let selectedDateLongValue = [];

        // 高亮选中日期，提取选择日期
        for (let item of this.data.weekVisual) {
            if (item.id === dayIndex) {
                item.selected = !item.selected;
            }

            if (item.selected) {
                selectedDateArray.push(item.name);
                selectedDateLongValue.push(item.longValue);
            }
        }

        app.tempData.recurringRule = selectedDateArray;

        if (app.tempData.recurringRule.constructor === Array) {
            if (app.tempData.recurringRule.length > 0) {
                this.data.courseItems.recurringRule.value = "每周" + app.tempData.recurringRule.map(DateTimeUtils.transEnDate2ChShortDate).join("、");
            }
        }

        this.updatePage();
    }

    /**
     * 执行下拉菜单
     * @param id
     * @param value
     */
    changePicker(id, value) {

        for (let item in this.data.courseItems) {
            if (item === id) {
                switch (item) {
                    case "duration":
                        this.data.courseItems[item].value = this.data.timeList[parseInt(value)];
                        this.data.timeListIdx = parseInt(value);
                        break;
                    case "startDate":
                        this.data.courseItems[item].value = value;
                        break;
                    case "endDate":
                        this.data.courseItems[item].value = value;
                        break;
                    default:
                        // console.log("default");
                        this.data.courseItems[item].value = value;
                        break;
                }

                break;
            }
        }

        this.updatePage();
    }

    /**
     * 执行输入
     * @param id
     * @param value
     */
    input(id, value) {

        if (id === "address_name") {
            this.data.courseItems.location.name.value = value;
        } else if (id === "room") {
            this.data.courseItems.location.room.value = value;
        } else {
            this.data.courseItems[id].value = value;
        }

        this.updatePage();
    }

    /**
     * 选择位置
     */
    chooseLocation() {
        let that = this;

        this.data.fromHide = true;

        wx.chooseLocation({
            success: function (res) {
                that.data.courseItems.location.latitude.value = res.latitude;
                that.data.courseItems.location.longitude.value = res.longitude;
                that.data.courseItems.location.address.value = res.address;
                that.data.courseItems.location.name.value = res.name;

                console.log("Get Location:", that.data.courseItems.location);
            }
        });

    }

    /**
     * 提交
     */
    submit() {
        let courseItems = this.data.courseItems;
        console.log(courseItems);


        let title = "缺少必要信息";
        let content = "";

        // 1、先检查信息，直接根据courseItems来判断信息，有为空的即弹出信息提示用户
        for (let item in courseItems) {
            console.log(item, ":", courseItems[item].value);

            if (content !== "") {
                Util.showModal(title, content);
                return;
            } else {
                if (item === "location") {
                    if (courseItems.location.name.value === "") {
                        content = "请输入" + this.data.courseItems.location.name.name.split("*")[0];

                    }
                    if (courseItems.location.room.value === "") {
                        content = "请输入" + this.data.courseItems.location.room.name.split("*")[0];
                    }
                } else if (item === "duration") {
                    if (parseInt(courseItems.duration.value) <= 0) {
                        content = "课程时长不能为零";
                    }
                } else if (item !== "description") {
                    if (courseItems[item].value === "" ||
                        courseItems[item].value === "请选择" ||
                        courseItems[item].value === "请输入") {
                        content = "请输入" + courseItems[item].name.split("*")[0];

                    }
                }
            }
        }

        // 2、根据页面进入情况整理需要保存的UserInfo
        let userInfo = StorageUtils.loadUserInfo();

        let courseToLocal = new Models.Course();
        let courseToServer = new Models.Course();

        // 3、同步数据
        if (this.pageView.route === "create") {
            courseToServer.prepare(courseItems, userInfo.id, true);
            // 复制信息
            for (let item in courseToServer) {
                if (courseToLocal.hasOwnProperty(item)) {
                    courseToLocal[item] = courseToServer[item];
                }
            }
            SyncUtils.createCourse(courseToServer, courseToLocal);

        } else if (this.pageView.route === "modify") {
            courseToServer.prepare(courseItems, userInfo.id, false);
            courseToServer.id = this.data.currentCourse.id;
            // 复制信息
            for (let item in courseToServer) {
                if (courseToLocal.hasOwnProperty(item)) {
                    courseToLocal[item] = courseToServer[item];
                }
            }
            SyncUtils.updateCourse(courseToServer, courseToLocal);
        }

        console.log("courseToServer:", courseToServer);
        console.log("courseToLocal:", courseToLocal);
    }

    /**
     * 删除课程
     */
    deleteCourse() {
        console.log(this.pageView.options);
        let userInfo = StorageUtils.loadUserInfo();
        let courseIdx = parseInt(this.pageView.options.courseId);
        userInfo.teacherCourseSet.splice(parseInt(courseIdx), 1);

        StorageUtils.saveUserInfo(userInfo);
        wx.navigateBack({});
    }

    /**
     * 加入课程
     * @param courseId
     */
    joinCourse(courseId) {
        // 先同步数据，然后根据不同的路径，最后都跳转到app.afterCreateUser
        console.log("Joining Course, courseId:", courseId);

        let userInfo = StorageUtils.loadUserInfo();

        if (userInfo.id === -1) {
            SyncUtils.syncUserInfo();
        } else {
            wx.navigateTo({
                url: '../../user/student/admin/admin',
            });
        }
    }
}


function makePageData(forEdit) {
    let data = {
        // 数据加载开关
        loadFinished: false,
        loadFailed: false,

        currentCourse: {},
        currentCourseIdx: 0,
        tabData: [
            {
                type: "course",
                name: "基本信息",
                data: [],
                selected: true
            },
            {
                type: "lesson",
                name: "今日课程",
                data: [],
                selected: false
            }
        ],
        currentTabIdx: 0,

        // 以下用于重复规则设置
        showRecurringRule: false,
        weekVisual: [
            {id: 0, value: '日', longValue: "周日", name: "Sun", selected: false},
            {id: 1, value: '一', longValue: "周一", name: "Mon", selected: false},
            {id: 2, value: '二', longValue: "周二", name: "Tue", selected: false},
            {id: 3, value: '三', longValue: "周三", name: "Wed", selected: false},
            {id: 4, value: '四', longValue: "周四", name: "Thu", selected: false},
            {id: 5, value: '五', longValue: "周五", name: "Fri", selected: false},
            {id: 6, value: '六', longValue: "周六", name: "Sat", selected: false}
        ],

        selectedDateArray: [],
        selectedDateLongValue: [],

        // 以下用于控件临时显示
        timeList: [],
        timeListIdx: 0,

        fromHide: false
    }

    if (forEdit) {
        data.courseItems = {
            name: {
                // 0
                id: "name",
                name: "课程名字*",
                display: true,
                tip: "请输入",
                hasValue: false,
                value: "",

            },
            location: {
                // 1
                latitude: {
                    id: "latitude",
                    name: "纬度",
                    display: true,
                    tip: "请输入或选择",
                    hasValue: false,
                    value: "",
                },
                longitude: {
                    id: "longitude",
                    name: "经度",
                    display: true,
                    tip: "请输入或选择",
                    hasValue: false,
                    value: "",
                },
                address: {
                    id: "address",
                    name: "详细地址*",
                    display: true,
                    tip: "请输入或选择",
                    hasValue: false,
                    value: "",
                },
                name: {
                    id: "address_name",
                    name: "上课地址*",
                    display: true,
                    tip: "请输入或选择",
                    hasValue: false,
                    value: "",
                },
                room: {
                    id: "room",
                    name: "教室地址*",
                    display: true,
                    tip: "请输入",
                    hasValue: false,
                    value: "",
                },
            },
            startDate: {
                // 3
                id: "startDate",
                name: "开始日期*",
                display: true,
                start: "",
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            endDate: {
                // 4
                id: "endDate",
                name: "结束日期*",
                start: "",
                display: true,
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            recurringRule: {
                // 5
                id: "recurringRule",
                name: "日期安排*",
                display: true,
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            startTime: {
                // 6
                id: "startTime",
                name: "开始时间*",
                start: "",
                display: true,
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            duration: {
                // 7
                id: "duration",
                name: "课程时长*",
                display: true,
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            maxCapacity: {
                // 8
                id: "maxCapacity",
                name: "人数上限*",
                display: true,
                tip: "请输入总人数",
                hasValue: false,
                value: "",
            },
            studentSet: {
                // 9
                id: "maxCapacity",
                name: "所有学生",
                display: true,
                tip: "",
                value: 10,
            },
            description: {
                // 10
                id: "description",
                name: "课程描述",
                display: true,
                tip: "请简要介绍一下课程",
                value: "",
            },
        };
    } else {
        data.courseItems = {
            name: {
                // 0
                id: "name",
                name: "课程名字：",
                display: true,
                tip: "请输入",
                hasValue: false,
                value: "",
            },
            location: {
                // 1
                latitude: {
                    id: "latitude",
                    name: "纬度",
                    display: true,
                    tip: "请输入或选择",
                    hasValue: false,
                    value: "",
                },
                longitude: {
                    id: "longitude",
                    name: "经度",
                    display: true,
                    tip: "请输入或选择",
                    hasValue: false,
                    value: "",
                },
                address: {
                    id: "address",
                    name: "详细地址：",
                    display: true,
                    tip: "请输入或选择",
                    hasValue: false,
                    value: "",
                },
                name: {
                    id: "address_name",
                    name: "上课地址：",
                    display: true,
                    tip: "请输入或选择",
                    hasValue: false,
                    value: "",
                },
                room: {
                    id: "room",
                    name: "教室地址：",
                    display: true,
                    tip: "请输入",
                    hasValue: false,
                    value: "",
                },
            },
            startDate: {
                // 3
                id: "startDate",
                name: "开始日期：",
                display: true,
                start: "",
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            endDate: {
                // 4
                id: "endDate",
                name: "结束日期：",
                start: "",
                display: true,
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            recurringRule: {
                // 5
                id: "recurringRule",
                name: "日期安排：",
                display: true,
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            startTime: {
                // 6
                id: "startTime",
                name: "开始时间：",
                start: "",
                display: true,
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            duration: {
                // 7
                id: "duration",
                name: "课程时长：",
                display: true,
                tip: "请选择",
                hasValue: false,
                value: "请选择",
            },
            studentSet: {
                // 8
                id: "maxCapacity",
                name: "所有学生：",
                display: true,
                tip: "",
                value: 10,
            },
            description: {
                // 9
                id: "description",
                name: "课程描述",
                display: true,
                tip: "请简要介绍一下课程",
                value: "",
            },
        };
    }

    return data;
}

module.exports = {
    CoursePageUtils: CoursePageUtils,
}