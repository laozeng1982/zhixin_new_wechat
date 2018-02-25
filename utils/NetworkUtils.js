/**
 * 网络请求类，这里是异步请求，那么get，post等不能直接写到对应的类里面
 */
import StorageUtils from './StorageUtils'
import Settings from '../datamodel/Settings'

const BASE_URL = "https://www.yongrui.wang/WeChatMiniProgram/";
const Setting = new Settings.Settings();
const promisify = require('./Promisify');

const login = promisify(wx.login);
const request = promisify(wx.request);
const getSetting = promisify(wx.getSetting);
const getUserInfo = promisify(wx.getUserInfo);

/**
 * 同步用户数据
 */
function syncUserInfo(self) {
    // 登录，等待服务器反应
    console.log("syncUserInfo");

    // 显示同步数据，等待
    wx.showLoading({
        title: '同步数据',
    });

    // 先读取本地内容
    let userInfoLocal = StorageUtils.loadData(Setting.Storage.WeChatUser);

    login().then(res => {
        console.log("login success, res:", res.code);
        request({
            url: 'https://www.yongrui.wang/WeChatMiniProgram/user/weChatMPOpenIdByJSCode/' + res.code,
        }).then(res => {
            console.log("get OpenId success, res.data:", res.data);
            let mpOpenId = res.data.mpOpenId;
            getSetting().then(res => {
                getUserInfo({
                    data: {
                        'withCredentials': true
                    }
                }).then(res => {
                    // 可以将 res 发送给后台解码出 unionId
                    console.log("getUserInfo success, userInfo:", res.userInfo);
                    // 复制微信信息
                    userInfoLocal.nickName = res.userInfo.nickName;
                    userInfoLocal.gender = (res.userInfo.gender === 1) ? "Male" : "Female";
                    userInfoLocal.avatarUrl = res.userInfo.avatarUrl;

                    // 取得openId后去获取unionId，并带回服务器上用户的数据
                    request({
                        url: 'https://www.yongrui.wang/WeChatMiniProgram/user/weChatMPUnionIdQuery',
                        method: 'POST',
                        data: {
                            mpOpenId: mpOpenId,
                            encryptedData: res.encryptedData,
                            iv: res.iv
                        }
                    }).then(res => {
                        // 最核心的部分，获取成功以后，保存信息
                        console.log("get data from server success, res:", res);
                        saveInfo(userInfoLocal, res, self);
                    }).catch(res => {
                        console.log("get data from server failed, res:", res);
                        wx.hideLoading();
                    });
                }).catch(res => {
                    console.log("getUserInfo failed, res:", res);
                    wx.hideLoading();
                });
            }).catch(res => {
                console.log("getSetting failed, res:", res);
                wx.hideLoading();
            });

        }).catch(res => {
            console.log("get OpenId failed, res:", res);
            wx.hideLoading();
        });

    }).catch(res => {
        console.log("login failed, res: ", res);
        wx.hideLoading();
    });

}

/**
 * 去服务器注册
 * @param userData
 * @param userInfo
 */
function createUserInfo(userData, userInfo) {
    // 显示同步数据，等待
    wx.showLoading({
        title: '同步数据',
    });

    wx.request({
        url: 'https://www.yongrui.wang/WeChatMiniProgram/user/viaWeChat',
        method: 'POST',
        data: userData,
        success: res => {
            userInfo.id = res.data.id;
            // 后台创建或更新，并同步保存到本地
            console.log("saved userInfo:", userInfo);
            console.log("Post succeeded, res.data:", res.data);
        },
        fail: res => {
            console.log("Post failed, res:", res);
        },
        complete: res => {

            wx.hideLoading();
        }
    });

    // 即时保存，不在complete里完成，以防其他页面再次读取到未更新的数据
    StorageUtils.saveUserInfo(userInfo);
}

/**
 * 更新用户数据
 */
function updateUserInfo(userData, userInfo) {
    // 登录，等待服务器反应
    console.log("syncUserInfo");

    // 显示同步数据，等待
    wx.showLoading({
        title: '同步数据',
    });

    console.log(userInfo.request_header);

    wx.request({
        url: 'https://www.yongrui.wang/WeChatMiniProgram/user/',
        method: 'PUT',
        header: userInfo.request_header,
        data: userData,
        success: res => {
            console.log("Put succeeded, res.data:", res.data);
        },
        fail: res => {
            console.log("Put failed, res:", res);
        },
        complete: res => {
            wx.hideLoading();
        }
    });

    // 即时保存，不在complete里完成，以防其他页面再次读取到未更新的数据
    StorageUtils.saveUserInfo(userInfo);
}

function saveInfo(userInfoLocal, response, self) {
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
    userInfoLocal.request_header = request_header;

    userInfoLocal.weChatInfo.unionId = response.data.weChatInfo.unionId;

    // 判断本地是否数据
    if (userInfoLocal.id === -1) {
        // 如果未注册，不返回id，去注册页面
        if (typeof response.data.id === "undefined") {
            // 先保存，然后在另外一个页面再调用localStorage
            StorageUtils.saveUserInfo(userInfoLocal);
            wx.hideLoading();

            wx.redirectTo({
                url: '/pages/normalpages/user/info/info' + '?model=register',
            });
        } else {
            // 如果返回id，表示本地删除过小程序，找回用户信息，在获取了用户id之后，更新用户信息，这步必须的。

            // 复制信息
            for (let item in response.data) {
                if (userInfoLocal.hasOwnProperty(item)) {
                    userInfoLocal[item] = response.data[item];
                }
            }

            if (typeof response.data.roleSet !== "undefined") {
                userInfoLocal.authorities = response.data.roleSet.map(transferRole);
            }
        }
    } else {
        // 有的话也要同步，万一多设备登录
        for (let item in response.data) {
            if (userInfoLocal.hasOwnProperty(item)) {
                userInfoLocal[item] = response.data[item];
            }
        }

        if (typeof response.data.roleSet !== "undefined") {
            userInfoLocal.authorities = response.data.roleSet.map(transferRole);
        }
    }

    // 保存善后
    StorageUtils.saveUserInfo(userInfoLocal);
    self.loadTab();
    wx.hideLoading();

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
    createUserInfo: createUserInfo
};