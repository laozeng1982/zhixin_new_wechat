/**
 * 工具类包，提供以下功能：
 * 1、日期之间的转换，日期和字符串的转换
 *
 */
const _ = require('./underscore.modified');
const BASE_URL = 'https://www.newpictown.com/';

/**
 * 格式化输出数字，固定位数
 * @param n，位数
 */
function formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
}

function formatLocation(longitude, latitude) {
    if (typeof longitude === 'string' && typeof latitude === 'string') {
        longitude = parseFloat(longitude);
        latitude = parseFloat(latitude)
    }

    longitude = longitude.toFixed(2);
    latitude = latitude.toFixed(2);

    return {
        longitude: longitude.toString().split('.'),
        latitude: latitude.toString().split('.')
    }
}

/**
 * 深度克隆
 * @param obj
 * @returns {*}
 */
function deepClone(obj) {

    let clone = obj.constructor === Array ? [] : {};

    // 递归
    for (let item in obj) {
        if (obj.hasOwnProperty(item)) {
            clone[item] = typeof obj[item] === "object" ? deepClone(obj[item]) : obj[item];
        }
    }

    return clone;
}

function isEqual(a, b) {
    return _.isEqual(a, b);
}

function showModal(title, content) {
    wx.showModal({
        title: title,
        content: content,
    });
}

/**
 *
 * @param obj
 */
function removeNoValueItems(obj) {
    let copy = deepClone(obj);
    for (let item in copy) {
        // console.log(this[item]);
        if (copy[item] === "") {
            delete copy[item];
        } else if (copy[item].constructor === Array && copy[item].length === 0) {
            delete copy[item];
        }
    }

    return copy;
}

module.exports = {
    formatLocation: formatLocation,
    formatNumber: formatNumber,
    deepClone: deepClone,
    isEqual: isEqual,
    showModal: showModal,
    removeNoValueItems: removeNoValueItems

};
