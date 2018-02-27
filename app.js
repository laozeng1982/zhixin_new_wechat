// app.js
// 小程序入口

import SyncUtils from './utils/SyncUtils'
import StroageUtils from './utils/StorageUtils'
import TabBar from '/pages/common/BottomTabBar.js'

const Sync = new SyncUtils.SyncUtils();

App({
    onLaunch: function (options) {
        console.log("App.onLoad");

        console.log("App.onLoad, options:", options);

        let userInfo = StroageUtils.loadUserInfo();

        if (typeof userInfo.request_header !== "undefined") {
            this.tempData.request_header = userInfo.request_header;
        }

        // 判断入口
        if (options.scene === 1044) {
            // 如果从分享进来，先看课程，愿意加入，再去判断是否注册
            wx.getShareInfo({
                shareTicket: options.shareTicket,
                success: function (res) {
                    console.log("from share, res:", res);
                    let encryptedData = res.encryptedData;
                    let iv = res.iv;
                }
            });
        } else {
            // 登录，同步用户数据
            Sync.syncUserInfo(this);
        
        }

    },

    onShow: function () {
        console.log("App.onShow");
       
    },

    loadTab: function () {
        this.bottom_tabBar = new TabBar.BottomTabBar();

    },

    bottom_tabBar: new TabBar.BottomTabBar(),

    currentAuth: "",

    // 定义全局变量
    tempData: {
        unionId: "",
        currentCourseSubTab: "all_course",
        recurringRule: [],
        request_header: {},
        location: {}
    },

    globalData: {
        // 定义一些全局变量，在页面跳转的时候判断，方便其他的JS通过app调用

    }
})