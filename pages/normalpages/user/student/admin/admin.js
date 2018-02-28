// pages/normalpages/user/child_admin/child_admin.js
import StorageUtils from '../../../../../utils/StorageUtils'

const app = getApp();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        selectedChildren: []
    },

    onAddChild: function () {
        wx.navigateTo({
            url: '../info/info' + '?route=register' + '&role=student',
        });
    },

    onSelectChild: function (e) {
        // console.log(e.detail.value);
        let selectedChildren = [];
        for (let item of e.detail.value) {
            selectedChildren.push(parseInt(item));
        }
        this.setData({
            selectedChildren: selectedChildren,
            selectedChild: selectedChildren.length > 0
        });

        console.log(this.data.selectedChildren);
    },

    onViewChild: function (e) {
        console.log(e);
        let childIdx = parseInt(e.currentTarget.id);
        wx.navigateTo({
            url: '../info/info' + '?route=modify' + '&idx=' + childIdx,
        });
    },

    onJoin: function () {
        let selectedChildren = this.data.selectedChildren;
        let userInfo = this.data.userInfo;
        for (let child of selectedChildren) {
            userInfo.studentCourseSet.push({
                child: child,
                course: app.joinCourse.course
            });
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {


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
        // 装载子女信息
        let userInfo = StorageUtils.loadUserInfo();

        this.setData({
            userInfo: userInfo
        })
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

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