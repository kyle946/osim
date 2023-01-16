const crypto = require("crypto");
var fs = require("fs");
const dbmysql = require("../extend/dbmysql");
const { v4: uuidv4 } = require('uuid');
const config = require("../config");


class common {

    constructor() { }

    /**
     * 创建token
     * @param {*} userdata 
     */
    async createToken(uid, token = "") {
        if (!uid) {
            return false;
        }
        if (token == "") {
            let token_string = uid + uuidv4();
            token = crypto.createHash('md5').update(token_string).digest('hex').toUpperCase();
        }
        // let oldtoken = await rd.get(`id2token:${uid}`);
        // if (oldtoken)
        // rd.del(`token2id:${oldtoken}`);
        rd.setex(`token2id:${token}`, 7200, uid);
        // rd.setex(`id2token:${uid}`, 7200, token);
        return token;
    }

    /**
     * 取客户端IP
     * @param {*} req 
     */
    getip(req) {
        return req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
            req.headers['x-real-ip']
    }

    /**
     * 根据token取用户ID
     * @param {*} token 
     */
    async getuserid(post) {
        let userid = await rd.get(`token2id:${post.token}`);
        if (userid) {
            rd.expire(`token2id:${post.token}`, 7200);
        }
        return userid;
    }

    async get_userinfo(uid, fromdb = false) {
        let res1 = await global.rd.exists(`userinfo:${uid}`)
        let user
        if (res1 && !fromdb) {
            let json_string = await global.rd.get(`userinfo:${uid}`)
            user = JSON.parse(json_string)
        } else {
            let db = new dbmysql()
            let sql = "select *  from `users` where `id`=?";
            let _from = await db.findone(sql, [uid]);
            _from.avatar = this.getDefaultImageUrl(_from.avatar)
            _from.info = _from.info || "..."
            _from.passwd = undefined
            db.close()
            await global.rd.setex(`userinfo:${uid}`, 86400, JSON.stringify(_from))
            user = _from
        }
        //消息数量
        // let _num = await this.get_msg_num(uid)
        // user.num_chat = _num.num_chat
        // user.num_new_contact = _num.num_new_contact
        // user.num_group = _num.num_group
        return user
    }

    async get_groupinfo(gid, fromdb = false) {
        let res1 = await global.rd.exists(`groupinfo:${gid}`)
        let groupinfo
        if (res1 && !fromdb) {
            let json_string = await global.rd.get(`groupinfo:${gid}`)
            groupinfo = JSON.parse(json_string)
        } else {
            let db = new dbmysql()
            let sql = "select * from `group` where `id`=?";
            let _from = await db.findone(sql, [gid]);
            _from.avatar = this.getDefaultImageUrl(_from.avatar)
            _from.info = _from.info || "..."
            db.close()
            await global.rd.setex(`groupinfo:${gid}`, 86400, JSON.stringify(_from))
            groupinfo = _from
        }
        return groupinfo
    }

    async get_msg_num(uid) {
        let num_chat = await global.rd.get(`msg:num:chat:${uid}`) || 0
        let num_new_contact = await global.rd.get(`msg:num:newcontact:${uid}`) || 0
        let num_group = await global.rd.get(`msg:num:group:${uid}`) || 0
        return { num_chat, num_new_contact, num_group }
    }

    //更新用户的chat会话表数据
    async writechat_user(uid, _to, sid, info, time, num = 1) {
        let user = await this.get_userinfo(_to)
        let chat = {
            id: _to,
            nickname: user.nickname,
            avatar: user.avatar,
            info,
            time,
            num: 0,
            sid,
            type: 'single_msg'
        }
        let key1 = `chat:${uid}:${sid}`
        let fiels_ex = await global.rd.exists(key1)
        if (!fiels_ex) {  //没有记录过才添加列表
            global.rd.lpush(`chatlist:${uid}`, sid)
        }
        chat.num = await global.rd.hget(key1, "num") && 0
        chat.num += num
        global.rd.hmset(key1, chat)
        //聊天会话列表过期时间为3天
        global.rd.expire(key1,86400*config["chat_conversation_list"])
        global.rd.expire(`chatlist:${uid}`,86400*config["chat_conversation_list"])
        return chat
    }

    //更新用户的chat会话表数据
    async writechat_group(uid, gid, sid, info, time, num = 1) {
        let groupinfo = await this.get_groupinfo(gid)
        let chat = {
            id: gid,
            nickname: groupinfo.nickname,
            avatar: groupinfo.avatar,
            info,
            time,
            num: 0,
            sid,
            type: 'group_msg'
        }
        let key1 = `chat:${uid}:${sid}`
        let fiels_ex = await global.rd.exists(key1)
        if (!fiels_ex) {  //没有记录过才添加列表
            global.rd.lpush(`chatlist:${uid}`, sid)
        }
        chat.num = await global.rd.hget(key1, "num") && 0
        chat.num += num
        global.rd.hmset(key1, chat)
        //聊天会话列表过期时间为3天
        global.rd.expire(key1,86400*config["chat_conversation_list"])
        global.rd.expire(`chatlist:${uid}`,86400*config["chat_conversation_list"])
        return chat
    }

    //获取群成员数据
    async get_group_member(gid, fromdb = false) {
        let _exists = await global.rd.exists(`group:member:${gid}`)
        let member = []
        if (_exists && !fromdb) {
            let _cache2 = await global.rd.lrange(`group:member:${gid}`)
            member = _cache2.map((value, index) => {
                return JSON.parse(value)
            })
            return member
        } else {
            await global.rd.del(`group:member:${gid}`)
            let db = new dbmysql()
            let _cache1 = await db.query(`select u.id,u.nickname,u.avatar from group_member m inner join users u on m.uid=u.id where gid=?`, [gid])
            let JsonStringArray = []
            _cache1.forEach((value, index) => {
                value.avatar = this.getDefaultImageUrl(value.avatar)
                member.push(value)
                JsonStringArray.push(JSON.stringify(value))
            })
            await global.rd.rpush(`group:member:${gid}`, JsonStringArray)
            global.rd.expire(`group:member:${gid}`, 86400)
            return member
        }
    }

    //删除超过的消息,默认限制存储100条消息
    async DeleteExpiredMessages(sid){
        let key2 = `del:msg:lasttime:${sid}`
        let res1 = await global.rd.get(key2)
        if(res1){
            return
        }
        let listkey=`msglist:${sid}`
        let msglist = await global.rd.lrange(listkey, config["numberOfHistoryChats"], -1)
        if(msglist.length>0){
            let msglistdel=[]
            msglist.map(value=>{
                msglistdel.push(value)
            })
            await global.rd.del(msglistdel)
            await global.rd.ltrim(listkey, 0, config["numberOfHistoryChats"]-1)
            //保存最后删除过期消息的时间,保证两个小时内只删除一次
            let time=Math.round((new Date()).getTime()/1000)
            await global.rd.setex(key2,7200,time)
        }
    }


    checkname(nickname, len) {
        if (nickname.length <= 1 || nickname.length > len) {
            return -1;
        }
        var rule1 = new RegExp(/^[\u4e00-\u9fa5|a-z|A-Z|0-9]+$/);
        if (rule1.test(nickname) == false) {
            return -2;  //只能输入汉字 英文和数字
        }
        if (nickname.match(/共产党|习近平|反党|反政府|色情|赌博/) != null) {
            return -3;
        }

        return 1;
    }

    /**
     * 检测用户注册的昵称是否合法
     */
    checkName(nickname) {
        if (typeof nickname != "string") {
            return -5;
        }
        if (nickname == "") {
            return -4;
        }
        if (nickname.length <= 1 || nickname.length > 64) {
            return -1;
        }
        var rule1 = new RegExp(/^[\u4e00-\u9fa5|a-z|A-Z|0-9]+$/);
        if (rule1.test(nickname) == false) {
            return -2;  //只能输入汉字 英文和数字
        }
        if (nickname.match(/共产党|习近平|反党|反政府|色情|赌博/) != null) {
            return -3;
        }

        return 1;
    }


    /**
     * 检测真实姓名
     * @param {*} realname 
     */
    checkrealname(realname) {
        if (realname.length <= 1 || realname.length > 64) {
            return -1;
        }
        var rule1 = new RegExp(/^[\u4e00-\u9fa5]+$/);
        if (rule1.test(realname) == false) {
            return -2;  //只能输入汉字
        }
        if (realname.match(/共产党|习近平|反党|反政府|色情|赌博/) != null) {
            return -3;
        }
    }

    /**
     * 身份证验证
     * @param {*} code 
     */
    IdentityCodeValid(code) {
        var city = { 11: "北京", 12: "天津", 13: "河北", 14: "山西", 15: "内蒙古", 21: "辽宁", 22: "吉林", 23: "黑龙江 ", 31: "上海", 32: "江苏", 33: "浙江", 34: "安徽", 35: "福建", 36: "江西", 37: "山东", 41: "河南", 42: "湖北 ", 43: "湖南", 44: "广东", 45: "广西", 46: "海南", 50: "重庆", 51: "四川", 52: "贵州", 53: "云南", 54: "西藏 ", 61: "陕西", 62: "甘肃", 63: "青海", 64: "宁夏", 65: "新疆", 71: "台湾", 81: "香港", 82: "澳门", 91: "国外 " };
        var tip = "";
        var pass = 1;

        if (!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)) {
            tip = "身份证号格式错误";
            pass = -1;
        }

        else if (!city[code.substr(0, 2)]) {
            tip = "地址编码错误";
            pass = -2;
        }
        else {
            //18位身份证需要验证最后一位校验位
            if (code.length == 18) {
                code = code.split('');
                //∑(ai×Wi)(mod 11)
                //加权因子
                var factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
                //校验位
                var parity = [1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2];
                var sum = 0;
                var ai = 0;
                var wi = 0;
                for (var i = 0; i < 17; i++) {
                    ai = code[i];
                    wi = factor[i];
                    sum += ai * wi;
                }
                var last = parity[sum % 11];
                if (parity[sum % 11] != code[17]) {
                    tip = "校验位错误";
                    pass = -3;
                }
            }
        }
        return pass;
    };

    /**
     * 上传图片
     * @param {*} file  ctx.request.files.file
     */
    upimage(file, uid, newFileName = null) {

        try {

            /**
            size: 78283,
            path: '/tmp/upload_728d6213ee27985f438d755f5f523849',
            name: 'head.jpg',
            type: 'image/jpeg',
            */

            if (typeof file != 'object') return { code: 400 };
            if (file.hasOwnProperty('size') == false) return { code: 400 };

            var sizeLimit = 1048576; //1024*1024个字节
            if (file.size > sizeLimit) {
                return { code: 603, msg: '文件超过规定大小' };
            }
            var suffix = null;
            if (file.type == 'image/jpeg') {
                suffix = '.jpg';
            } else if (file.type == 'image/png') {
                suffix = '.png';
            } else {
                return { code: 604, msg: '请上传jpg或png格式的图片' };
            }

            var date = new Date();
            if (newFileName == null) {
                newFileName = uid + '_' + date.getTime() + suffix;
            } else {
                newFileName = uid + '_' + newFileName + suffix;
            }

            var dateYear = this.number_format(date.getFullYear(), 4);
            var dateMonth = this.number_format(date.getMonth() + 1, 2);
            var dateStr = dateYear + "" + dateMonth;
            var filePath = __dirname + "/../public/upload/" + dateStr;
            var fileResource = filePath + `/${newFileName}`;
            //如果目录不存在 ，则创建
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: false, mode: "0777" });
            }
            let upstream = fs.createWriteStream(fileResource);
            var reader = fs.createReadStream(file.path);
            reader.pipe(upstream);

            //图像在文件夹的路径，保存数据库用 (202009/dsfasdf.png)
            let imagePath = dateStr + '/' + newFileName;
            //URL地址
            let imageUrl = global.ser_domain + '/upload/' + imagePath;

            return { code: 200, imagePath, imageUrl }

        } catch (error) {
            console.log(error);
            return { code: 501, msg: '图片上传失败' };
        }
    }

    /**
     * Base64 上传图片
     * @param {*} file 
     * @param {*} uid 
     * @param {*} newFileName 
     * @returns 
     */
    upImageBase64(file, uid, newFileName = null) {

        try {
            var resultBase64 = file.replace(/^data:image\/\w+;base64,/, "");
            var imgcache = new Buffer(resultBase64, "base64")
            var sizeLimit = 1048576; //1024*1024个字节
            if (imgcache.size > sizeLimit) {
                throw "文件超过规定大小";
            }
            var suffix = ".png";
            var date = new Date();
            if (newFileName == null) {
                newFileName = uid + '_' + date.getTime() + suffix;
            } else {
                newFileName = uid + '_' + newFileName + suffix;
            }
            var dateYear = this.number_format(date.getFullYear(), 4);
            var dateMonth = this.number_format(date.getMonth() + 1, 2);
            var dateDay = this.number_format(date.getDate(), 2)
            var dateStr = dateYear + "" + dateMonth + "" + dateDay
            var filePath = __dirname + "/../public/upload/" + dateStr;
            if(newFileName=='group_avatar'||newFileName=='avatar'){
                filePath = __dirname + "/../public/upload/avatar/" + dateStr
            }
            var fileResource = filePath + `/${newFileName}`;
            //如果目录不存在 ，则创建
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: false, mode: "0777" });
            }
            fs.writeFileSync(fileResource, imgcache)
            //图像在文件夹的路径，保存数据库用 (202009/dsfasdf.png)
            let imagePath = dateStr + '/' + newFileName;
            //URL地址
            let imageUrl = global.ser_domain + '/upload/' + imagePath;
            return { code: 200, imagePath, imageUrl }
        } catch (err) {
            console.log(err);
            return { code: 400, msg: err };
        }
    }



    getDefaultImageUrl(image = null) {
        if (!image) {
            return null;
        }
        return config["StaticResUrl"] + '/upload/' + image;
        if (image.indexOf('http://') >= 0 || image.indexOf('https://') >= 0) {
            return image;
        } else {
            return global.ser_domain + '/upload/' + image;
        }
    }


    /**
     * 获取post参数
     */
    param(ctx) {
        var post;
        if (ctx.request.body == "") {
            ctx.body = { code: 400, msg: '参数错误(post为空).' };
            return 0;
        }
        if (typeof ctx.request.body == "string") {
            post = JSON.parse(ctx.request.body);
        } else {
            post = ctx.request.body;
        }
        // console.log(post);
        return post;
    }


    /**
     * 写接口访问日志
     * @param {*} url 
     * @param {*} post 
     * @param {*} response 
     */
    async writeapilog(url, post, response) {
        var date = this.getdate();
        var apilog = { url, post, response, date };
        var json = JSON.stringify(apilog);
        //
        var rkey = global.config.redis_pre + 'apilog';
        redisClient.lpush(rkey, json);
        redisClient.expire(rkey, 600);
    }

    /**
     * 结束函数,返回响应数据
     * @param {*} ctx 
     * @param {*} body 
     * @param {*} type  true为返回正确的数据，false为错误处理
     */
    response(ctx, body, type = true) {

        //是否要释放数据库
        if (ctx.hasOwnProperty("db")) {
            ctx.db.close();
        }

        //记录日志
        // this.writeapilog(ctx.url, ctx.request.body, ctx.body);

        if (type) {
            ctx.body = body;
        }
        else {
            console.log("error", body);
            var code = 500;
            var msg = 'error';
            if (typeof body == 'string') {
                code = 500;
                msg = body;
            } else if (typeof body == 'object') {
                code = body.code;
                msg = body.msg;
            }
            ctx.body = { code, msg };
        }
        return 0;
    }


    /**
     * koa2接口验签
     */
    verifySign(ctx) {
        var post;
        if (ctx.request.body == "") {
            ctx.body = { code: 400, msg: '参数错误(post为空).' };
            return 0;
        }
        if (typeof ctx.request.body == "string") {
            post = JSON.parse(ctx.request.body);
        } else {
            post = ctx.request.body;
        }

        //时间戳
        if (post.hasOwnProperty("timestamp") == false) {
            ctx.body = { code: 405, msg: '参数错误(缺少时间戳).' };
            return 0;
        }
        if (post.timestamp == '') {
            ctx.body = { code: 405, msg: '参数错误(缺少时间戳)' };
            return 0;
        }
        var _time = (new Date()).getTime();
        if ((post.timestamp + 120) * 1000 < _time) {
            ctx.body = { code: 408, msg: '访问超时..' };
            return 0;
        }

        //验证签名
        if (post.hasOwnProperty("sign") == false) {
            ctx.body = { code: 405, msg: '没有传入签名参数.' };
            return 0;
        }
        if (post.sign == '') {
            ctx.body = { code: 400, msg: '签名参数为空' };
            return 0;
        }
        var sign = this.interfaceSign(post, global.config.signpwd);
        if (sign.signStr != post.sign) {
            ctx.body = { code: 401, msg: '签名验证失败.', sign: post.sign, data: sign };
            return 0;
        }
        return post;
    }


    /**
     * 接口签名
     * @param data Array 接口的post参数
     * @param signPwd String 验证签名的密钥字符串
     */
    interfaceSign(data, signPwd) {
        var keys = Object.keys(data).sort();
        var len = keys.length;

        var param = {};
        var paramStr = "";
        for (var i = 0; i < len; i++) {
            var key = keys[i];
            if (key == "sign" || data[key] == null || data[key] == undefined || typeof data[key] == "object") {
                continue;
            }
            param[key] = data[key];
            paramStr += key;
            paramStr += "=";
            paramStr += param[key];
            paramStr += "&";
        }
        paramStr += "key=" + signPwd;
        // var signStr = crypto.createHash('sha1').update(paramStr).digest('hex').toUpperCase();
        var signStr = crypto.createHash('md5').update(paramStr).digest('hex').toUpperCase();
        return { signStr, paramStr };
    }


    /**
     * 前补0
     * @param {*} num 
     * @param {*} m 
     */
    number_format(num, m) {
        return (Array(m).join(0) + num).slice(-m);
    }

    returnFloat(value) {
        var value = Math.round(parseFloat(value) * 100) / 100;
        var xsd = value.toString().split(".");
        if (xsd.length == 1) {
            value = value.toString() + ".00";
            return value;
        }
        if (xsd.length > 1) {
            if (xsd[1].length < 2) {
                value = value.toString() + "0";
            }
            return value;
        }
    }

    getdate(datetime = null) {
        var date = new Date();
        if (datetime != null) {
            date = new Date(datetime);
        }
        var y = this.number_format(date.getFullYear(), 4);
        var m = this.number_format(date.getMonth() + 1, 2);
        var d = this.number_format(date.getDate(), 2);
        var h = this.number_format(date.getHours(), 2);
        var mm = this.number_format(date.getMinutes(), 2);
        var s = this.number_format(date.getSeconds(), 2);
        var datestr = y + "-" + m + "-" + d + " " + h + ":" + mm + ":" + s;
        return datestr;
    }

    getdatestr2(datetime = null) {
        var date = new Date();
        if (datetime != null) {
            date = new Date(datetime);
        }
        var y = this.number_format(date.getFullYear(), 4);
        var m = this.number_format(date.getMonth() + 1, 2);
        var d = this.number_format(date.getDate(), 2);
        var h = this.number_format(date.getHours(), 2);
        var mm = this.number_format(date.getMinutes(), 2);
        var s = this.number_format(date.getSeconds(), 2);
        var datestr = y + "-" + m + "-" + d;
        return datestr;
    }


    getdatestr(datetime = null) {
        var date = new Date();
        if (datetime != null) {
            date = new Date(datetime);
        }
        var y = this.number_format(date.getFullYear(), 4);
        var m = this.number_format(date.getMonth() + 1, 2);
        var d = this.number_format(date.getDate(), 2);
        var h = this.number_format(date.getHours(), 2);
        var mm = this.number_format(date.getMinutes(), 2);
        var s = this.number_format(date.getSeconds(), 2);
        var datestr = y + "" + m + "" + d;
        return datestr;
    }


}

module.exports = common;