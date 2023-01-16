import React from "react";
import ReactDom from 'react-dom';
const ipcRenderer = require('electron').ipcRenderer;
import md5 from "./md5"
import { createHashHistory } from "history"
import SocketClient from "./Page/SocketClient";
const history = createHashHistory();


function comObj() {

    /**
     * 
     * @param {*} url 请求的URL地址
     * @param {*} data 请求的数据
     * @param {*} done 成功时的回调
     * @param {*} error 失败时的回调
     * @param {*} call 成功和失败都会调用
     * @param {*} requestType 请求的数据类型，默认为json
     * @returns 
     */
    this.ajax = (url, data, done = () => { }, error = () => { }, call = () => { }, requestType = 'json') => {
        var apipath = url;//domain + url;
        var xhr = new XMLHttpRequest();
        xhr.timeout = 3000;
        try {
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        var res = xhr.responseText;
                        var result = res;
                        var respon_heaer = xhr.getResponseHeader("Content-Type").toString();
                        if (respon_heaer.indexOf('application/json') !== -1 && res != '') {
                            result = JSON.parse(res);
                        } else {
                            //如果强制服务端返回JSON，可以在这里报错。
                            error("json error");
                            call();
                            return;
                        }
                        call();
                        done(result);
                        return 1;
                    } else {
                        console.log("status", xhr.status);
                        error()
                        call()
                    }
                }
            }
            xhr.addEventListener("error", function (err) {
                error(err);
                call();
            });
            xhr.open('POST', apipath, true);
            // xhr.setRequestHeader('X-Requested-Width', 'XMLHttpRequest');
            if (requestType == 'json') {
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(data));
            } else if (requestType == 'text') {
                let param = '';
                for (let x in data) {
                    param = param + x + '=' + encodeURIComponent(data[x]) + '&';
                }
                param = param.substr(0, param.length - 1);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.send(param);
            }
            return 1;
        } catch (err) {
            console.log("err", err);
            error(err);
            call();
        }
        return 0;
    };

    this.createSign = (data, signPwd = 'mima111') => {
        var keys = Object.keys(data).sort();
        var len = keys.length;

        var param = {};
        var paramStr = "";
        for (var i = 0; i < len; i++) {
            var key = keys[i];
            if (key == "sign") {
                continue;
            }
            param[key] = data[key];
            paramStr += key;
            paramStr += "=";
            paramStr += param[key];
            paramStr += "&";
        }
        paramStr += "key=" + signPwd;
        var signStr = md5(paramStr).toUpperCase();
        return signStr;
    }

    this.parseQuery = (query) => {
        var reg = /([^=&\s]+)=([^=&\s]+)/g;
        var obj = {};
        while (reg.exec(query)) {
            obj[RegExp.$1] = RegExp.$2;
        }
        return obj;
    }


    this.number_format = (num, m) => {
        return (Array(m).join(0) + num).slice(-m);
    }

    this.getdate = (datetime = null, type = "") => {
        var date = new Date();
        if (datetime != null) {
            datetime = parseInt(datetime) * 1000;
            date = new Date(datetime);
        }
        var y = this.number_format(date.getFullYear(), 4);
        var m = this.number_format(date.getMonth() + 1, 2);
        var d = this.number_format(date.getDate(), 2);
        var h = this.number_format(date.getHours(), 2);
        var mm = this.number_format(date.getMinutes(), 2);
        var s = this.number_format(date.getSeconds(), 2);

        if (type == "") {
            return y + "-" + m + "-" + d;
        }
        else if (type == "2") {
            return y + "/" + m + "/" + d;
        }
        else if (type == "3") {
            return m + "/" + d;
        }
        else if (type == "4") {
            return y + "-" + m + "-" + d + " " + h + ":" + mm + ":" + s;
        }
        else if (type == "5") {
            return m + "-" + d + " " + h + ":" + mm;
        }
    }



    this.getTime = function () {
        var msec = (new Date()).getTime();
        return parseInt(msec / 1000);
    }


    this.url = function () { }


    /**
     * 深拷贝
     * @param {*} obj 
     * @returns 
     */
    this.clone = function (obj) {
        if (obj === null) return null;
        if (obj.constructor !== 'object') return obj;
        if (obj.constructor === Date) return new Date(obj);
        if (obj.constructor === RegExp) return new RegExp(obj);
        var newObj = new obj.constructor(); //保持继承的原型
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var val = obj[key];
                newObj[key] = typeof val === 'object' ? arguments.callee(val) : val;
            }
        }
        return newObj;
    }


    this.getSeq = function () {
        var str = global.user.id + (new Date()).getTime()
        return md5(str).toUpperCase();
    }

    this.geturl = function () {
        return WebUrl.substr(WebUrl.length - 1, 1) == '/' ? WebUrl.substr(0, WebUrl.length - 1) : WebUrl;    //图片地址的域名
    }



    /**
     * 弹窗
     */
    this.modalEle = null;
    this.modalReactDomEle = null;
    /**
     * 弹窗
     * @param {object} ReactComponet     react组件
     * @param {props} closeCallback     组件的props参数
     * @param {int} width     弹窗的宽度
     * @param {int} height    弹窗的高度
     * @returns {bool}
     */
    this.modal = (ReactComponet, title = "...", props = null, width = 480, height = 570, hideClosebtn = false) => {
        if (this.modalEle == null) {
            this.modalEle = document.createElement("div");
            this.modalEle.setAttribute("id", "");
            this.modalEle.setAttribute("class", "");

            let bgdiv = document.createElement("div");
            bgdiv.style.width = "100%";
            bgdiv.style.height = '100%';
            bgdiv.style.position = 'fixed';
            bgdiv.style.zIndex = 10;
            bgdiv.style.backgroundColor = '#000';
            bgdiv.style.opacity = 0.7;
            bgdiv.style.top = '0px';
            bgdiv.style.left = '0px';
            this.modalEle.appendChild(bgdiv);

            let body = document.createElement("div");
            body.style.position = 'fixed';
            body.style.width = width + 'px';
            body.style.height = height + 'px';
            body.style.margin = 'auto';
            body.style.top = '0px';
            body.style.left = '0px';
            body.style.right = '0px';
            body.style.bottom = '0px';
            body.style.zIndex = 11;
            body.style.backgroundColor = '#fff';
            body.style.overflow = 'hidden';
            this.modalEle.appendChild(body);

            let close = document.createElement("font");
            close.setAttribute("class", "iconfont");
            close.innerHTML = "&#xe8bb;";//'\u{xe8bb}'
            close.style.opacity = .5;
            close.style.fontSize = '24px';
            close.style.position = 'absolute';
            close.style.top = '8px';
            close.style.right = '8px';
            close.style.cursor = 'pointer';
            close.style.zIndex = 4;
            close.addEventListener('click', (e) => {
                document.body.removeChild(this.modalEle);
                if (this.modalReactDomEle) ReactDom.unmountComponentAtNode(this.modalReactDomEle);
                this.modalReactDomEle = null;
                this.modalEle = null;
                // closeCallback();
            });
            if (!hideClosebtn)
                body.appendChild(close);

            let titleEle = document.createElement("div");
            titleEle.style.height = '40px';
            titleEle.style.lineHeight = '40px';
            titleEle.style.top = '0px';
            titleEle.style.left = '0px';
            titleEle.style.position = 'absolute';
            titleEle.style.width = '100%';
            titleEle.style.textAlign = 'left';
            titleEle.style.textIndent = '15px';
            titleEle.style.backgroundColor = '#eee';
            titleEle.style.color = "#333";
            titleEle.style.zIndex = 3;
            titleEle.style.fontWeight = "bold";
            titleEle.innerText = title;
            body.appendChild(titleEle);

            if (ReactComponet) {
                this.modalReactDomEle = document.createElement("div");
                this.modalReactDomEle.style.height = (height - 30) + 'px';
                this.modalReactDomEle.style.top = '30px';
                this.modalReactDomEle.style.position = 'absolute';
                this.modalReactDomEle.style.width = '100%';
                body.appendChild(this.modalReactDomEle);
                let reactEle = React.createElement(ReactComponet, props);
                ReactDom.render(reactEle, this.modalReactDomEle);
            }

            document.body.appendChild(this.modalEle);
            return true;
        } else {
            return false;
        }
    }

    this.modalClose = () => {
        if (this.modalEle) {
            document.body.removeChild(this.modalEle);
        }
        if (this.modalReactDomEle) ReactDom.unmountComponentAtNode(this.modalReactDomEle);
        this.modalReactDomEle = null;
        this.modalEle = null;
    }



    //右上角显示错误消息
    this.alert = function (msg, type = false, time = 7) {

        let el = document.getElementById('alertdiv');
        if (el) document.body.removeChild(el);

        let alertdiv = document.createElement("div");
        let bgdiv = document.createElement("div");
        bgdiv.style.width = "100%";
        bgdiv.style.height = '100%';
        bgdiv.style.position = 'fixed';
        bgdiv.style.zIndex = 90;
        bgdiv.style.backgroundColor = '#fff';
        bgdiv.style.opacity = 0;
        bgdiv.style.top = '0px';
        bgdiv.style.left = '0px';
        alertdiv.setAttribute("id", 'alertdiv')
        alertdiv.appendChild(bgdiv);
        let body = document.createElement("div");
        body.style.position = 'fixed';
        body.style.width = '420px';
        body.style.height = '80px';
        body.style.margin = 'auto';
        body.style.top = '0px';
        body.style.left = '0px';
        body.style.right = '0px';
        body.style.bottom = '0px';
        body.style.zIndex = 91;
        body.style.backgroundColor = '#fff';
        body.style.overflow = 'hidden';
        body.style.border = '1px solid #999';
        body.style.borderRadius = '10px';
        body.style.borderRadius = "5px";
        body.style.boxShadow = "5px 5px 5px #999";
        alertdiv.appendChild(body);
        let textdiv = document.createElement("div");
        textdiv.innerText = msg;
        textdiv.style.height = '70px';
        textdiv.style.textAlign = 'center';
        textdiv.style.padding = '30px';
        textdiv.style.fontSize = '14px';
        body.appendChild(textdiv);
        bgdiv.addEventListener("click", () => {
            document.body.removeChild(alertdiv);
        });
        document.body.appendChild(alertdiv);
        var t = setTimeout(() => {
            let el = document.getElementById('alertdiv');
            document.body.removeChild(el);
            clearTimeout(t);
        }, time * 1000);
    }


    /**
     * 
     * @param {*} text 显示的信息
     * @param {*} call 点击[确定]按钮的回调函数
     * @param {*} hideBtnNo 要不要隐藏[取消]按钮，默认为不隐藏
     * @param {*} clickBgClose 点击背景是否关闭窗口，默认为是
     */
    this.confirm = (text, call = () => { }, hideBtnNo = false, clickBgClose = true) => {

        let confirmdiv = document.createElement("div");

        let bgdiv = document.createElement("div");
        bgdiv.style.width = "100%";
        bgdiv.style.height = '100%';
        bgdiv.style.position = 'fixed';
        bgdiv.style.zIndex = 90;
        bgdiv.style.backgroundColor = '#fff';
        bgdiv.style.opacity = .5;
        bgdiv.style.top = '0px';
        bgdiv.style.left = '0px';
        confirmdiv.appendChild(bgdiv);

        let body = document.createElement("div");
        body.style.position = 'fixed';
        body.style.width = '420px';
        body.style.height = '220px';
        body.style.margin = 'auto';
        body.style.top = '0px';
        body.style.left = '0px';
        body.style.right = '0px';
        body.style.bottom = '0px';
        body.style.zIndex = 91;
        body.style.backgroundColor = '#fff';
        body.style.overflow = 'hidden';
        body.style.border = '1px solid #999';
        body.style.borderRadius = '10px';
        // body.style.borderRadius="5px";
        // body.style.boxShadow = "5px 5px 5px #999";
        confirmdiv.appendChild(body);

        let btnyes = document.createElement("button");
        btnyes.innerText = "Yes";
        btnyes.style.position = 'absolute';
        btnyes.style.left = '70px';
        if (hideBtnNo) btnyes.style.left = '178px';
        btnyes.style.bottom = '20px';
        btnyes.style.outline = 'none';
        btnyes.style.backgroundColor = '#fff';
        btnyes.style.color = '#0e82ed';
        btnyes.style.border = '0px solid #0e82ed';
        btnyes.style.borderRadius = "5px";
        btnyes.style.padding = "8px 25px";
        btnyes.style.cursor = "pointer";
        let btnno = document.createElement("button");
        btnno.innerText = "No";
        btnno.style.position = 'absolute';
        btnno.style.right = '70px';
        btnno.style.bottom = '20px';
        btnno.style.outline = 'none';
        btnno.style.backgroundColor = '#fff';
        btnno.style.color = '#0e82ed';
        btnno.style.border = '0px solid #0e82ed';
        btnno.style.cursor = "pointer";
        btnno.style.borderRadius = "5px";
        btnno.style.padding = "8px 25px";
        let textdiv = document.createElement("div");
        textdiv.innerText = text;
        textdiv.style.height = '70px';
        textdiv.style.textAlign = 'center';
        textdiv.style.padding = '10px';
        textdiv.style.paddingTop = "30px";
        textdiv.style.fontSize = '14px';
        body.appendChild(textdiv);
        body.appendChild(btnyes);
        if (!hideBtnNo) body.appendChild(btnno);
        btnyes.addEventListener("click", () => {
            call.apply();
            document.body.removeChild(confirmdiv);
        });
        btnno.addEventListener("click", () => {
            document.body.removeChild(confirmdiv);
        });
        if (clickBgClose) {
            bgdiv.addEventListener("click", () => {
                document.body.removeChild(confirmdiv);
            })
        }
        document.body.appendChild(confirmdiv);
        confirmdiv.focus()
    }



    this.onload = (type = 'open', text = "") => {

        if (type == 'close') {
            let el = document.getElementById('onload');
            document.body.removeChild(el);
            return;
        }

        let confirmdiv = document.createElement("div");

        let bgdiv = document.createElement("div");
        bgdiv.style.width = "100%";
        bgdiv.style.height = '100%';
        bgdiv.style.position = 'fixed';
        bgdiv.style.zIndex = 90;
        bgdiv.style.backgroundColor = '#fff';
        bgdiv.style.opacity = 0.85;
        bgdiv.style.top = '0px';
        bgdiv.style.left = '0px';
        confirmdiv.setAttribute("id", 'onload')
        confirmdiv.appendChild(bgdiv);

        let body = document.createElement("div");
        body.style.position = 'fixed';
        body.style.width = '420px';
        body.style.height = '220px';
        body.style.margin = 'auto';
        body.style.top = '0px';
        body.style.left = '0px';
        body.style.right = '0px';
        body.style.bottom = '0px';
        body.style.zIndex = 90;
        body.innerHTML = '<div class="loading"><span></span><span></span><span></span><span></span><span></span><span></span></div><div class="loading_text">' + text + '</div>'
        confirmdiv.appendChild(body);
        bgdiv.addEventListener("click", () => {
            $$.confirm("Do you want to cancel?", () => {
                try {
                    document.body.removeChild(confirmdiv);
                } catch (error) {

                }
            })
        });
        document.body.appendChild(confirmdiv);
    }

    this.checkName = function (nickname, min = 1, max = 64) {
        if (typeof nickname != "string") {
            return -5;
        }
        if (nickname == "") {
            return -4;
        }
        if (nickname.length <= min || nickname.length > max) {
            return -1;
        }
        var rule1 = new RegExp(/^[\u4e00-\u9fa5|a-z|A-Z|0-9|(|)|-|\s]+$/);
        if (rule1.test(nickname) == false) {
            return -2;  //只能输入汉字 英文和数字
        }
        if (nickname.match(/共产党|习近平|反党|反政府|色情|赌博/) != null) {
            return -3;
        }
        return 1;
    }

    this.logout = () => {
        this.onload("open", "Logging out……")
        osim.cache_del("token", global.token)
        osim.cache_del("user", global.user)
        $$.ajax(ser.http + "/logout", { token: global.token }, () => {
        }, (err) => {
        }, () => {
            SocketClient.close()
            history.replace({ pathname: '/login' })
            $$.onload("close")
        })
    }

}


const $$ = new comObj;
export default $$;