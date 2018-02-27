// pages/normalpages/create_course/create_course.js
// 创建课程页

import Models from '../../../../datamodel/Models'
import StorageUtils from '../../../../utils/StorageUtils'
import DateTimeUtils from '../../../../utils/DateTimeUtils'
import SyncUtils from '../../../../utils/SyncUtils'
import Util from '../../../../utils/Util'
import CoursePageUtils from '../../../../utils/CoursePageUtils'

const app = getApp();
const pageUtils = new CoursePageUtils.CoursePageUtils();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        pageData: {}
    },

    onSelectRecurringDay: function (e) {
        let dayIndex = parseInt(e.currentTarget.id);
        pageUtils.selectRecurringDay(dayIndex);

    },

    onSetRecurringRules: function (e) {
        let showRecurringRule = !this.data.showRecurringRule;

        this.setData({
            showRecurringRule: showRecurringRule
        });
        // wx.navigateTo({
        //     url: '../set_recurring/set_recurring',
        // });
    },

    /**
     * 响应Picker选择
     * @param e
     */
    onChangePicker: function (e) {
        console.log(e.currentTarget.id, e.detail.value);
        let id = e.currentTarget.id;
        let value = e.detail.value;

        pageUtils.changePicker(id, value);

    },

    onInput: function (e) {
        // console.log(e.currentTarget.id, e.detail.value);
        let id = e.currentTarget.id;
        let value = e.detail.value;

        pageUtils.input(id, value);

    },

    /**
     * 响应选择位置
     */
    onChooseLocation: function () {
        pageUtils.chooseLocation();

    },

    /**
     * 提交表单
     */
    onFormSubmit: function (e) {
        pageUtils.submit();

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.options = options;
        this.route = "create";
        pageUtils.self = this;

        pageUtils.initTabData();

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        // 初始化页面
        pageUtils.initPageCourse();

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        console.log("onHide");
        let pageData = this.data.pageData;
        pageData.fromHide = true;
        this.setData({
            pageData: pageData
        });
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})