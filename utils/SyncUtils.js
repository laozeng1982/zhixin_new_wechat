/**
 * 网络请求类，这里是异步请求，那么get，post等不能直接写到对应的类里面
 */
import StorageUtils from './StorageUtils'
import Settings from '../datamodel/Settings'
import wxApi from './wxApi'
import wxRequest from './wxRequest'

const BASE_URL = "https://www.yongrui.wang/WeChatMiniProgram/";
const Setting = new Settings.Settings();

const wxLogin = wxApi.wxLogin();
const wxGetSystemInfo = wxApi.wxGetSystemInfo();
const wxGetSetting = wxApi.wxGetSetting();
const wxGetUserInfo = wxApi.wxGetUserInfo();

function startSync(type) {
    console.log("start to " + type);

    // 显示同步数据，等待
    wx.showLoading({
        title: '同步数据',
        duration: 10000
    });
}

function finishSync(userInfo, pageUrl) {
    let app = getApp();
    StorageUtils.saveUserInfo(userInfo);

    // 根据状态重新装载Tab
    app.bottom_tabBar.reload();
    wx.hideLoading();

    if (typeof pageUrl !== "undefined") {
        wx.redirectTo({
            url: pageUrl,
        });
    }

    console.log("sync end!");
}

/**
 * 同步用户数据
 */
function syncUserInfo() {
    startSync("syncUserInfo");

    // 先读取本地内容
    let userInfoLocal = StorageUtils.loadData(Setting.Storage.WeChatUser);

    wxLogin().then(res => {
        console.log("wxLogin success, res:", res.code);
        let url = 'https://www.yongrui.wang/WeChatMiniProgram/user/weChatMPOpenIdByJSCode/' + res.code;
        wxRequest.getRequest(url)
            .then(res => {
                console.log("get OpenId success, res.data:", res.data);
                let mpOpenId = res.data.mpOpenId;
                wxGetSetting()
                    .then(res => {
                        console.log("wxGetSetting success, res:", res);
                        wxGetUserInfo({
                            data: {
                                'withCredentials': true
                            }
                        })
                            .then(res => {
                                // 可以将 res 发送给后台解码出 unionId
                                console.log("wxGetUserInfo success, userInfo:", res.userInfo);
                                // 复制微信信息
                                userInfoLocal.nickName = res.userInfo.nickName;
                                userInfoLocal.gender = (res.userInfo.gender === 1) ? "Male" : "Female";
                                userInfoLocal.avatarUrl = res.userInfo.avatarUrl;

                                // 取得openId后去获取unionId，并带回服务器上用户的数据
                                let url = 'https://www.yongrui.wang/WeChatMiniProgram/user/weChatMPUnionIdQuery';
                                let data = {
                                    mpOpenId: mpOpenId,
                                    encryptedData: res.encryptedData,
                                    iv: res.iv
                                };
                                wxRequest.postRequest(url, data)
                                    .then(res => {
                                        // 最核心的部分，获取成功以后，保存信息
                                        console.log("get data from server success, res:", res);
                                        wx.hideLoading();
                                        saveInfo(userInfoLocal, res);
                                    })
                                    .catch(res => {
                                        console.log("get data from server failed, res:", res);
                                    });
                            })
                            .catch(res => {
                                console.log("getUserInfo failed, res:", res);
                            });
                    })
                    .catch(res => {
                        console.log("wxGetSetting failed, res:", res);
                    });
            })
            .catch(res => {
                console.log("get OpenId failed, res:", res);
            });
    })
        .catch(res => {
            console.log("wxLogin failed, res:", res);
            // wx.hideLoading();
        })
        .finally(() => {
            console.log("wxLogin finally!");
            finishSync(userInfoLocal);
        });

}

/**
 * 去服务器注册
 * @param userData
 * @param userInfo
 * @param pageUrl
 */
function createUserInfo(userData, userInfo, pageUrl) {
    startSync("createUserInfo");

    let url = 'https://www.yongrui.wang/WeChatMiniProgram/user/viaWeChat';

    wxRequest.postRequest(url, userData)
        .then(res => {
            userInfo.id = res.data.id;
            // 后台创建或更新，并同步保存到本地
            console.log("saved userInfo:", userInfo);
            console.log("createUserInfo success, res.data:", res.data);
            // 即时保存，不在complete里完成，以防其他页面再次读取到未更新的数据
        })
        .catch(res => {
            console.log("createUserInfo failed, res:", res);
            // 即时保存，不在complete里完成，以防其他页面再次读取到未更新的数据
        })
        .finally(() => {
            console.log("createUserInfo finally!");
            finishSync(userInfo, pageUrl);
        });

}

/**
 * 更新用户数据
 */
function updateUserInfo(userData, userInfo, pageUrl) {
    // 登录，等待服务器反应
    startSync("updateUserInfo");

    let url = 'https://www.yongrui.wang/WeChatMiniProgram/user/';

    wxRequest.putRequestWithAuth(url, userInfo.request_header, userData)
        .then(res => {
            console.log("updateUserInfo success, res.data:", res.data);
        })
        .catch(res => {
            console.log("updateUserInfo success, res.data:", res.data);
        })
        .finally(() => {
            console.log("updateUserInfo finally!");
            finishSync(userInfo, pageUrl);
        });
}

/**
 *
 * @param courseToServer
 * @param courseToLocal
 */
function createCourse(courseToServer, courseToLocal) {
    startSync("createCourse");

    let userInfo = StorageUtils.loadUserInfo();

    let url = 'https://www.yongrui.wang/WeChatMiniProgram/course';
    wxRequest.postRequestWithAuth(url, userInfo.request_header, courseToServer)
        .then(res => {
            // 后台创建或更新，并同步保存到本地
            console.log("createCourse success, res.data:", res.data);
            // 根据返回id，更新本地信息
            courseToLocal.id = res.data.id;
            courseToLocal.location.id = res.data.location.id;

            userInfo.teacherCourseSet.push(courseToLocal);
            StorageUtils.saveUserInfo(userInfo);

            console.log("saved userInfo:", userInfo);
        })
        .catch(res => {
            // 失败也要保存
            userInfo.teacherCourseSet.push(courseToLocal);
            console.log("createCourse failed, res:", res);
        })
        .finally(() => {
            console.log("createCourse finally!");
            finishSync(userInfo);
            wx.navigateBack({});
        });
}

/**
 *
 * @param courseToServer
 * @param courseToLocal
 */
function updateCourse(courseToServer, courseToLocal) {
    startSync("updateCourse");

    let userInfo = StorageUtils.loadUserInfo();
    let url = 'https://www.yongrui.wang/WeChatMiniProgram/course';
    wxRequest.putRequestWithAuth(url, userInfo.request_header, courseToServer)
        .then(res => {
            // 后台创建或更新，并同步保存到本地
            console.log("updateCourse success, res.data:", res.data);
            // 根据返回id，更新本地信息
            courseToLocal.id = res.data.id;
            courseToLocal.location.id = res.data.location.id;
            for (let idx = 0; idx < userInfo.teacherCourseSet.length; idx++) {
                if (userInfo.teacherCourseSet[idx].id === res.data.id) {
                    // 先删除旧的
                    userInfo.teacherCourseSet.splice(idx, 1);
                    break;
                }
            }
            userInfo.teacherCourseSet.push(courseToLocal);
            StorageUtils.saveUserInfo(userInfo);

            console.log("saved userInfo:", userInfo);
        })
        .catch(res => {
            // 失败也要保存
            userInfo.teacherCourseSet.push(courseToLocal);
            console.log("updateCourse failed, res:", res);
        })
        .finally(() => {
            console.log("updateCourse finally!");
            finishSync(userInfo);
            wx.navigateBack({});
        });
}

function getCourse(self) {
    startSync("getCourse");

    let url = "https://www.yongrui.wang/WeChatMiniProgram/course/" + parseInt(self.options.courseId);
    let course = {};

    wxRequest.getRequest(url)
        .then(res => {
            console.log("getCourse success, res:", res);
            course = res.data;
            self.data.currentCourse = res.data;
            self.updatePage();
        }).catch(res => {
        console.log("getCourse failed, res:", res);
    })
        .finally(() => {
            console.log("getCourse finally!");
        });

}

/**
 *
 * @param userInfo
 * @param response
 */
function saveInfo(userInfo, response) {
    // 形成其他request要的header
    let userAuth = response.data.weChatInfo.unionId + ":password";
    let arrayBuffer = new ArrayBuffer(userAuth.length * 2);
    let bufferView = new Uint16Array(arrayBuffer);
    for (let i = 0, strLen = userAuth.length; i < strLen; i++) {
        bufferView[i] = userAuth.charCodeAt(i);
    }

    let basicAuth = "Basic " + wx.arrayBufferToBase64(bufferView);

    let request_header = {
        Authorization: basicAuth
    };

    console.log(request_header);

    // 将来注册和查询用
    userInfo.request_header = request_header;

    userInfo.weChatInfo.unionId = response.data.weChatInfo.unionId;

    // 判断本地是否数据
    if (userInfo.id === -1) {
        // 如果未注册，不返回id，去注册页面
        if (typeof response.data.id === "undefined") {
            // 先保存，然后在另外一个页面再调用localStorage
            // StorageUtils.saveUserInfo(userInfo);

            wx.redirectTo({
                url: '/pages/normalpages/user/info/info' + '?model=register',
            });
        } else {
            // 如果返回id，表示本地删除过小程序，找回用户信息，在获取了用户id之后，更新用户信息，这步必须的。
            // 复制信息
            for (let item in response.data) {
                if (userInfo.hasOwnProperty(item)) {
                    userInfo[item] = response.data[item];
                }
            }

            if (typeof response.data.roleSet !== "undefined") {
                userInfo.authorities = response.data.roleSet.map(transferRole);
            }
        }
    } else {
        // 有的话也要同步，万一多设备登录
        for (let item in response.data) {
            if (userInfo.hasOwnProperty(item)) {
                userInfo[item] = response.data[item];
            }
        }

        if (typeof response.data.roleSet !== "undefined") {
            userInfo.authorities = response.data.roleSet.map(transferRole);
        }
    }

    // 保存善后
    StorageUtils.saveUserInfo(userInfo);

}

function transferRole(role) {
    switch (role.id) {
        case 2:
            return "teacher";
        case 3:
            return "student";
        case 4:
            return "parent";
        default:
            break;
    }
}

module.exports = {
    syncUserInfo: syncUserInfo,
    updateUserInfo: updateUserInfo,
    createUserInfo: createUserInfo,
    createCourse: createCourse,
    updateCourse: updateCourse,
    getCourse: getCourse
};