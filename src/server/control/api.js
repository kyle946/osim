const common = require("./common");
const md5 = require('md5');
const qr = require('qr-image');
const dbmysql = require("../extend/dbmysql");
const getRawBody = require('raw-body');
const { v4: uuidv4 } = require("uuid")
const sockser = require("../control/sockser")
const nodemailer = require('nodemailer')
const config = require("../config")


class apiController extends common {

    constructor() {
        super();

        this.index = this.index.bind(this);
        this.login = this.login.bind(this);
        this.update_user_info = this.update_user_info.bind(this);
        this.find_user = this.find_user.bind(this);
        this.add_contact = this.add_contact.bind(this);
        this.get_new_contact = this.get_new_contact.bind(this);
        this.get_contact = this.get_contact.bind(this);
        this.accept_new_contact = this.accept_new_contact.bind(this);
        this.chat_get_data = this.chat_get_data.bind(this);
        this.uploadimg = this.uploadimg.bind(this);
        this.get_chat_list = this.get_chat_list.bind(this);
        this.add_group = this.add_group.bind(this);
        this.get_group = this.get_group.bind(this);
        this.join_group = this.join_group.bind(this);
        this.logout = this.logout.bind(this);
        this.clearchathistory = this.clearchathistory.bind(this);
        this.delmember = this.delmember.bind(this);
        this.exitgroup = this.exitgroup.bind(this);
        this.deleteContact = this.deleteContact.bind(this);
        this.sendmail = this.sendmail.bind(this);
        this.signup = this.signup.bind(this);
        



        // this.loginWeixin = this.loginWeixin.bind(this);
        // this.loginMobile = this.loginMobile.bind(this);
        // this.qrcode = this.qrcode.bind(this);
        // this.upavatar = this.upavatar.bind(this);
        // this.sendsms = this.sendsms.bind(this);
        // this.modpwd = this.modpwd.bind(this);
        // this.userAgreement = this.userAgreement.bind(this);
        // this.getalists = this.getalists.bind(this);
        // this.buyvip = this.buyvip.bind(this);
        // this.buyvipnotifyurl = this.buyvipnotifyurl.bind(this);
        // this.buyvipstatus = this.buyvipstatus.bind(this);
        // this.postfeedback = this.postfeedback.bind(this);
        // this.getConsoleSession = this.getConsoleSession.bind(this)
        // this.cqrcode = this.cqrcode.bind(this)

    }

    async index(ctx, next) {
        ctx.body = {
            code: 1,
            msg: 'ok'
        };
        await next();
    }


    async login(ctx) {

        try {

            // var post = this.verifySign(ctx);
            var post = this.param(ctx);
            if (post == 0) return 0;

            //step
            if (post.hasOwnProperty("username") == false)
                throw { code: 405, msg: "Parameter error (account)" };

            let rule = new RegExp(/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/);
            if (rule.test(post.username) == false)
                throw { code: 406, msg: "Parameter error (account)" };

            if (post.hasOwnProperty("passwd") == false)
                throw { code: 405, msg: "Parameter error (password)" };

            let rulepwd = new RegExp(/^.{6,16}$/);
            if (rulepwd.test(post.passwd) == false)
                throw { code: 406, msg: 'The login password format is incorrect!' };

            ctx.db = new dbmysql();
            //查找账号是否存在 
            let sql = "select *  from `users` where `username`=?";
            let userdata = await ctx.db.findone(sql, [post.username]);

            //如果没有找到账号
            if (!userdata) {
                throw { code: 503, msg: 'Can not find the account, login failed!' };
            } else {
                if (md5(post.passwd) != userdata.passwd) {
                    throw { code: 413, msg: 'Password error!' };
                }
                let token = await this.createToken(userdata.id);
                userdata.avatar = this.getDefaultImageUrl(userdata.avatar)
                userdata.info = userdata.info || "..."
                userdata.passwd = undefined
                //消息数量
                let _num = await this.get_msg_num(userdata.id)
                userdata.num_chat = _num.num_chat
                userdata.num_new_contact = _num.num_new_contact
                userdata.num_group = _num.num_group
                return this.response(ctx, { code: 200, user: userdata, token });
            }

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    async update_user_info(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0)
                throw ctx.body;

            //根据token取user_id
            if (post.hasOwnProperty("token") == false)
                throw { code: 405, msg: 'Invalid token.' };

            var uid = await this.getuserid(post);
            if (uid == null) throw { code: 402, msg: 'Token expired.' };

            let timestamp = parseInt((new Date()).getTime() / 1000)
            var savedata = {
                nickname: post.nickname,
                info: post.info,
                state: 1,
                last_update_time: timestamp
            };
            //如果上传了头像
            if (post.avatar != null) {
                let img = this.upImageBase64(post.avatar, uid, 'avatar');
                if (img.code != 200) {
                    throw img;
                }
                savedata.avatar = img.imagePath
            }
            //更新用户数据
            var where = "`id`=" + uid;
            ctx.db = new dbmysql();
            var ret1 = await ctx.db.save(savedata, "users", 'update', where);
            if (ret1.code == 200) {
                let sql = "select *  from `users` where `id`=?";
                let userdata = await ctx.db.findone(sql, [uid]);
                userdata.avatar = this.getDefaultImageUrl(userdata.avatar)
                userdata.info = userdata.info || "..."
                userdata.passwd = undefined
                return this.response(ctx, { code: 200, msg: 'success', data: userdata });
            } else {
                throw { code: 501, msg: 'Save failure.' };
            }
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    async find_user(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0)
                throw ctx.body;

            //根据token取user_id
            if (post.hasOwnProperty("token") == false)
                throw { code: 405, msg: 'Invalid token.' };

            var uid = await this.getuserid(post);
            if (uid == null) throw { code: 402, msg: 'Token expired.' };

            if (post.hasOwnProperty("username") == false)
                throw { code: 405, msg: "Parameter error (email)" };

            let rule = new RegExp(/^.{2,64}$/);
            if (rule.test(post.username) == false) {
                throw { code: 406, msg: "Parameter error (email)" };
            }

            ctx.db = new dbmysql();
            //查找账号是否存在 
            let sql = "select id,avatar,info,username,state,nickname  from `users` where `username`=?";
            let userdata = await ctx.db.findone(sql, [post.username]);
            //如果没有找到账号
            if (!userdata) {
                throw { code: 503, msg: 'Can not find the account!' };
            }
            if (userdata.state == -1) {
                throw "Account anomaly."
            }
            userdata.avatar = this.getDefaultImageUrl(userdata.avatar)
            userdata.info = userdata.info || "..."
            return this.response(ctx, { code: 200, msg: 'success', data: userdata });
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }



    async add_contact(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0){
                throw ctx.body
            }
            //根据token取user_id
            if (post.hasOwnProperty("token") == false){
                throw { code: 405, msg: 'Invalid token.' }
            }
            var uid = await this.getuserid(post)
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' }
            }
            if (post.hasOwnProperty("id") == false) {
                throw { code: 405, msg: "Parameter error (id)" };
            }
            let content = {
                remarks: post.remarks
            }
            var savedata = {
                type: "add_contact",
                content: JSON.stringify(content),
                _from: uid,
                uid: post.id,
                state: 1,
            }
            ctx.db = new dbmysql();
            let sql = "select * from `message` where `uid`=? and type='add_contact'";
            let res1 = await ctx.db.findone(sql, [post.id]);
            if (res1) {
                var where = "`id`=" + res1.id;
                await ctx.db.save(savedata, "message", 'update', where);
            } else {
                await ctx.db.save(savedata, "message", 'insert');
            }
            //更新对方消息数量
            await global.rd.incrby(`msg:num:newcontact:${post.id}`, 1)
            //发送socket通知
            if(sockser.clients.has(post.id+"")){
                let userinfo = await this.get_userinfo(uid)
                sockser.send_to("add_contact", post.id+"", userinfo)
            }
            return this.response(ctx, { code: 200, msg: 'success' });
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }



    async get_new_contact(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0)
                throw ctx.body;

            //根据token取user_id
            if (post.hasOwnProperty("token") == false)
                throw { code: 405, msg: 'Invalid token.' };

            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }

            ctx.db = new dbmysql();
            let sql = "select m._from,m.content,DATE_FORMAT(m.time, \"%m/%d %H:%i\") as time,u.id,u.avatar,u.info,u.username,u.nickname from message m inner join users u on m._from=u.id where m.uid=? and m.state=1 and m.type='add_contact' order by m.id desc";
            let _cache = await ctx.db.query(sql, [uid]);
            let data = [];
            if (_cache) {
                data = _cache.map((value, index) => {
                    let content = JSON.parse(value.content)
                    value.avatar = this.getDefaultImageUrl(value.avatar)
                    value.info = content.remarks || "..."
                    value.num = 0
                    return value
                })
            }
            return this.response(ctx, { code: 200, msg: 'success', data });

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }



    async get_contact(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0)
                throw ctx.body;

            //根据token取user_id
            if (post.hasOwnProperty("token") == false)
                throw { code: 405, msg: 'Invalid token.' };

            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }

            ctx.db = new dbmysql();
            let sql = "select m._from,m.time,m.sid,DATE_FORMAT(m.time, \"%m/%d %H:%i\") as time,u.id,u.avatar,u.info,u.username,u.nickname from contact m inner join users u on m._to=u.id where m._from=? and m.state=1 order by m.id desc";
            let _cache = await ctx.db.query(sql, [uid]);
            let data = [];
            if (_cache) {
                data = _cache.map((value, index) => {
                    value.avatar = this.getDefaultImageUrl(value.avatar)
                    value.info = value.info || "..."
                    value.num = 0
                    return value
                })
            }
            return this.response(ctx, { code: 200, msg: 'success', data });

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }


    //接受对方的好友添加申请
    async accept_new_contact(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0)
                throw ctx.body;

            if (post.hasOwnProperty("token") == false)
                throw { code: 405, msg: 'Invalid token.' };

            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }

            if (post.hasOwnProperty("id") == false) {
                throw { code: 405, msg: "Parameter error (id)" };
            }
            ctx.db = new dbmysql();
            let ret2 = await ctx.db.findone(`select id,sid from contact where _from=? and _to=?`,[uid,post.id])
            if(ret2){
                await ctx.db.query("update contact set state=1 where sid=?",[ret2.sid])
            }else{
                let sid = uuidv4()        //双方创建唯一的会话ID
                await ctx.db.query("insert into contact (_from, _to, state, sid) values (?, ?, ?, ?)", [uid, post.id, 1, sid]);
                await ctx.db.query("insert into contact (_from, _to, state, sid) values (?, ?, ?, ?)", [post.id, uid, 1, sid]);
            }
            //通知对方
            if (sockser.clients.has(post.id)) {
                let client = sockser.clients[post.id]
                let sql = "select id,avatar,info,username,state,nickname  from `users` where `id`=?";
                let _from = await ctx.db.findone(sql, [uid]);
                _from.avatar = this.getDefaultImageUrl(_from.avatar)
                _from.info = _from.info || "..."
                client.emit("accept_new_contact", _from)
            }
            //清空未读消息数量
            global.rd.set(`msg:num:newcontact:${uid}`, 0)
            //
            return this.response(ctx, { code: 200, msg: 'success' });
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    //获取chat列表
    async _chatlist(uid) {
        try {
            let field1 = global.rd.pre + `chat:${uid}:*`
            let field_arr = ['id', 'avatar', 'nickname', 'info', 'time', 'num', 'sid', 'type']
            let arr = [
                "by",
                `${field1}->${field_arr[4]}`,
                "get",
                `${field1}->${field_arr[0]}`,
                "get",
                `${field1}->${field_arr[1]}`,
                "get",
                `${field1}->${field_arr[2]}`,
                "get",
                `${field1}->${field_arr[3]}`,
                "get",
                `${field1}->${field_arr[4]}`,
                "get",
                `${field1}->${field_arr[5]}`,
                "get",
                `${field1}->${field_arr[6]}`,
                "get",
                `${field1}->${field_arr[7]}`,
                "limit", 0, 1000, "desc"]
            let res = await global.rd.sort(`chatlist:${uid}`, arr)
            // console.log("res", res);
            let data = []
            if (res.length > 0) {
                for (let h = 0; h < res.length / field_arr.length; h++) {
                    let el = {}
                    for (let i = 0; i < field_arr.length; i++) {
                        let index = h * field_arr.length + i
                        el[field_arr[i]] = res[index]
                    }
                    data.push(el)
                }
            }
            return data
        } catch (error) {
            return null
        }
    }
    //获取chat列表
    async get_chat_list(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            let data = await this._chatlist(uid)
            return this.response(ctx, { code: 200, data });
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    //获取聊天记录
    async _msglog(sid) {
        try {
            let field1 = global.rd.pre + "msg:*"
            let field_arr = ['uuid', 'type', '_from', 'content', 'time']
            let arr = [
                "by",
                "nosort",
                "get",
                `${field1}->${field_arr[0]}`,
                "get",
                `${field1}->${field_arr[1]}`,
                "get",
                `${field1}->${field_arr[2]}`,
                "get",
                `${field1}->${field_arr[3]}`,
                "get",
                `${field1}->${field_arr[4]}`,
                "limit", 0, 100, "desc"]
            let res = await global.rd.sort(`msglist:${sid}`, arr)
            let data = []
            if (res.length > 0) {
                for (let h = 0; h < res.length / field_arr.length; h++) {
                    let el = {}
                    for (let i = 0; i < field_arr.length; i++) {
                        let index = h * field_arr.length + i
                        el[field_arr[i]] = res[index]
                    }
                    data.push(el)
                }
            }
            return data
        } catch (error) {
            return null
        }
    }
    //打开聊天对话，获取聊天记录和用户数据
    async chat_get_data(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            if (post.hasOwnProperty("id") == false) {
                throw { code: 405, msg: "Parameter error (id)" };
            }
            if (post.hasOwnProperty("type") == false) {
                throw { code: 405, msg: "Parameter error (type)" };
            }
            let sid = ""      //会话id
            let userdata = null       //用户信息
            //1 正常状态， -1 你不是对方的好友，-2你已经退出群聊，-3对方状态异常，-4群状态异常，-5状态异常
            let SessionPermissions = 1
            let msg = []  //消息历史记录
            let member = []   //群成员列表
            // let key1 = `SessionPermissions:${post.type}:${post.id}` 
            try {
                // if (global.rd.exists(key1)) {    //从缓存查询有没有聊天权限
                //     SessionPermissions=await global.rd.get(key1)
                //     if(SessionPermissions!=1){
                //         throw SessionPermissions
                //     }
                // }
                ctx.db = new dbmysql()
                if (post.type == 'single_msg') {    //取sid，取用户信息
                    userdata = await this.get_userinfo(post.id)
                    if(userdata.state!=1){
                        throw -3
                    }
                    let row = await ctx.db.findone(`select sid from contact where _from=? and _to=?`, [uid, post.id])
                    if (row) {
                        sid = row.sid
                        if(parseInt(row.state)==-1){
                            throw -1
                        }
                    } else {
                        throw -1
                    }
                } else if (post.type == 'group_msg') {    //取sid，取群信息
                    userdata = await this.get_groupinfo(post.id)
                    if(userdata.state!=1){
                        throw -4
                    }
                    sid = userdata.sid
                    let sql = `select id from group_member where gid=? and uid=?`
                    let row = await ctx.db.findone(sql, [post.id, uid])
                    if (!row) {
                        throw -2
                    }
                    member = await this.get_group_member(post.id)
                }
                msg = await this._msglog(sid)    //消息历史记录
            } catch (err) {
                if (typeof err == "number") {
                    SessionPermissions = err
                } else {
                    console.log(err);
                    SessionPermissions = -5
                }
            }
            
            // await global.rd.setex(key1, 7200, SessionPermissions)   //保存聊天权限
            return this.response(ctx, { code: 200, user: userdata, msg, sid, member, SessionPermissions });
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    //发送聊天图片时上传图片
    async uploadimg(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            if (post.hasOwnProperty("imgbase64") == false) {
                throw { code: 405, msg: "Parameter error (imgbase64)" };
            }
            let img = this.upImageBase64(post.imgbase64, uid);
            if (img.code != 200) {
                throw img;
            }
            //{ code: 200, imagePath, imageUrl }
            //写入数据库
            //...
            return this.response(ctx, img);
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }


    //创建一个群聊
    async add_group(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            //根据token取user_id
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            let sid = uuidv4()        //创建唯一的会话ID
            var savedata = {
                nickname: post.nickname,
                info: post.info,
                uid,
                sid
            };
            //如果上传了头像
            if (post.avatar != null) {
                let img = this.upImageBase64(post.avatar, uid, 'group_avatar');
                if (img.code != 200) {
                    throw img;
                }
                savedata.avatar = img.imagePath
            }
            ctx.db = new dbmysql();
            var ret1 = await ctx.db.save(savedata, "group", 'insert');
            if (ret1.code == 200) {
                let group_member_data = {
                    gid: ret1.insertId,
                    uid: uid
                }
                await ctx.db.save(group_member_data, "group_member", 'insert');
                return this.response(ctx, { code: 200, msg: 'success' });
            } else {
                throw { code: 501, msg: 'Save failure.' };
            }
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }


    //获取用户加入的群
    async get_group(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            //根据token取user_id
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            ctx.db = new dbmysql();
            let arr1 = await ctx.db.query("select * from group_member where uid=?", [uid])
            if (!arr1) {
                throw "empty"
            }
            let group_ids = ""
            arr1.forEach((el, index) => {
                if (index == 0) {
                    group_ids = el.gid
                } else {
                    group_ids += `,${el.gid}`
                }
            })
            let data = [];
            if (group_ids) {
                let sql = `select u.id,u.avatar,u.info,u.nickname from \`group\` u where u.id in (${group_ids}) and u.state=1 order by u.id desc`;
                let _cache = await ctx.db.query(sql, []);
                if (_cache) {
                    data = _cache.map((value, index) => {
                        value.avatar = this.getDefaultImageUrl(value.avatar)
                        value.info = value.info || "..."
                        value.num = 0
                        return value
                    })
                }
            }
            return this.response(ctx, { code: 200, msg: 'success', data });
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    async join_group(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            if (post.hasOwnProperty("data") == false) {
                throw { code: 405, msg: 'Invalid parameter(data).' };
            }
            if (post.hasOwnProperty("member") == false) {
                throw { code: 405, msg: 'Invalid parameter(member).' };
            }
            ctx.db = new dbmysql()
            let _cache1 = await ctx.db.query("select uid from group_member where gid=?", [post.data.id])
            let group_member = _cache1.map(value => {
                return value.uid
            })
            let val = ""
            let time=parseInt((new Date()).getTime()/1000)
            post.member.forEach((value, index) => {
                if (group_member.includes(value)) {
                    return
                }
                if (index == 0) {
                    val += `(${post.data.id}, ${value})`
                } else {
                    val += `,(${post.data.id}, ${value})`
                }
                //加入chat列表
                this.writechat_group(value, post.data.id, post.data.sid, "Join Group.", time, 1)
            })
            if (val) {
                let sql = `insert into group_member (gid,uid) values ${val}`
                let ret1 = await ctx.db.query(sql, [])
            }
            //更新群成员数据
            let member = await this.get_group_member(post.data.id, true)
            //通知群内所有用户
            let _from = await this.get_userinfo(uid)
            member.forEach(value => {
                if (value.id == uid) {
                    return
                }
                if(sockser.clients.has(value.id+"")){
                    sockser.send_to("join_group", value.id+"", post.data, _from)
                }
            })
            return this.response(ctx, { code: 200, msg: 'success', member });
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }


    async logout(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            await global.rd.del(`token2id:${post.token}`)
            sockser.logout(uid)
            return this.response(ctx, { code: 200 })
        } catch (error) {
            return this.response(ctx, error, false)
        }
    }


    async clearchathistory(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            if (post.hasOwnProperty("sid") == false) {
                throw { code: 405, msg: 'Invalid parameter(sid).' };
            }
            if (post.hasOwnProperty("gid") == false) {
                throw { code: 405, msg: 'Invalid parameter(gid).' };
            }
            ctx.db = new dbmysql()
            let groupinfo = await ctx.db.findone(`select id,uid,sid from \`group\` where id=?`, [post.gid])
            if (groupinfo.uid != uid) {
                throw "your are not an administrator."
            }
            let _cache1 = await global.rd.lrange(`msglist:${post.sid}`)
            if (_cache1) {
                let delkeys = []
                delkeys = _cache1.map(value => {
                    return `msg:${value}`
                })
                await global.rd.del(delkeys)
                await global.rd.del(`msglist:${post.sid}`)
            }
            return this.response(ctx, { code: 200 })
        } catch (error) {
            return this.response(ctx, error, false)
        }
    }


    async delmember(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            if (post.hasOwnProperty("gid") == false) {
                throw { code: 405, msg: 'Invalid parameter(gid).' };
            }
            if (post.hasOwnProperty("uid") == false) {
                throw { code: 405, msg: 'Invalid parameter(uid).' };
            }
            if (parseInt(post.gid) <= 0 || parseInt(post.uid) <= 0) {
                throw { code: 405, msg: 'Invalid parameter.' };
            }
            ctx.db = new dbmysql()
            let groupinfo = await ctx.db.findone(`select * from \`group\` where id=?`, [post.gid])
            if (groupinfo.uid != uid) {
                throw "your are not an administrator."
            }
            await ctx.db.query(`delete from group_member where gid=? and uid=?`, [post.gid, post.uid])
            //移除用户的会话
            await global.rd.lrem(`chatlist:${post.uid}`, groupinfo.sid)
            await global.rd.del(`chat:${post.uid}:${groupinfo.sid}`)
            //更新成员
            let member = await this.get_group_member(post.gid, true)
            //通知群内所有用户
            let _from = await this.get_userinfo(uid)
            member.forEach(value => {
                if(value.id==uid){
                    return 
                }
                if(sockser.clients.has(value.id+"")){
                    sockser.send_to("delmember", value.id+"", groupinfo, _from)
                }
            })
            //通知用户本人
            if(sockser.clients.has(post.uid+"")){
                let _from = await this.get_userinfo(uid)
                sockser.send_to("delmember", post.uid+"", groupinfo, _from)
            }
            return this.response(ctx, { code: 200, data: member })
        } catch (error) {
            return this.response(ctx, error, false)
        }
    }


    async exitgroup(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            if (post.hasOwnProperty("gid") == false) {
                throw { code: 405, msg: 'Invalid parameter(gid).' };
            }
            ctx.db = new dbmysql()
            let groupinfo = await ctx.db.findone(`select * from \`group\` where id=?`, [post.gid])
            if (groupinfo.uid == uid) {
                throw "You are an administrator and cannot leave the group."
            }
            await ctx.db.query(`delete from group_member where gid=? and uid=?`, [post.gid, uid])
            //移除用户的会话
            await global.rd.lrem(`chatlist:${uid}`, groupinfo.sid)
            await global.rd.del(`chat:${uid}:${groupinfo.sid}`)
            //更新成员
            let member = await this.get_group_member(post.gid, true)
            //通知群内所有用户
            let _from = await this.get_userinfo(uid)
            member.forEach(value => {
                if(sockser.clients.has(value.id+"")){
                    sockser.send_to("exitgroup", value.id+"", groupinfo, _from)
                }
            })
            return this.response(ctx, { code: 200 })
        } catch (error) {
            return this.response(ctx, error, false)
        }
    }


    async deleteContact(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("token") == false) {
                throw { code: 405, msg: 'Invalid token.' };
            }
            var uid = await this.getuserid(post);
            if (uid == null) {
                throw { code: 402, msg: 'Token expired.' };
            }
            if (post.hasOwnProperty("uid") == false) {
                throw { code: 405, msg: 'Invalid parameter(uid).' };
            }
            if (post.hasOwnProperty("sid") == false) {
                throw { code: 405, msg: 'Invalid parameter(sid).' };
            }
            ctx.db = new dbmysql()
            ctx.db.query(`update contact set state=-1 where _from=? and _to=?`,[uid,post.uid])
            //移除用户的会话
            await global.rd.lrem(`chatlist:${uid}`, post.sid)
            await global.rd.del(`chat:${uid}:${post.sid}`)
            //
            return this.response(ctx, { code: 200 })
        } catch (error) {
            return this.response(ctx, error, false)
        }
    }


    async signup(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            var post = this.param(ctx)
            if (post == 0){
                return 0
            }
            if (post.hasOwnProperty("username") == false){
                throw { code: 405, msg: 'Invalid parameter(email).' }
            }
            if (post.hasOwnProperty("passwd") == false){
                throw { code: 405, msg: 'Invalid parameter(passwd).' }
            }
            if (post.hasOwnProperty("nickname") == false){
                throw { code: 405, msg: 'Invalid parameter(nickname).' }
            }
            if (post.hasOwnProperty("verifycode") == false){
                throw { code: 405, msg: 'Invalid parameter(verifycode).' }
            }
            //=========
            let rule = new RegExp(/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/)
            if (rule.test(post.username) == false){
                throw { code: 406, msg: "Parameter error (email)" }
            }
            let rulepwd = new RegExp(/^.{6,16}$/)
            if (rulepwd.test(post.passwd) == false){
                throw { code: 406, msg: 'The login password format is incorrect!' }
            }
            if(this.checkName(post.nickname)!=1){
                throw { code: 406, msg: "Parameter error (nickname)" }
            }
            let vrule=new RegExp(/^[0-9|a-z|A-Z]{6,8}$/)
            if(vrule.test(post.verifycode)==false){
                throw { code: 406, msg: "Parameter error (verifycode)" }
            }
            let _verify_code=await global.rd.get(`signup:sendverifycode:${post.username}`)
            if(_verify_code!=post.verifycode){
                throw { code: 406, msg: "Verification code error." }
            }
            ctx.db = new dbmysql()
            //查找账号是否存在 
            let sql = "select id,username,state  from `users` where `username`=?"
            let userdata = await ctx.db.findone(sql, [post.username])
            if(userdata){
                throw { code: 406, msg: "This account has been registered." }
            }
            let savedata={
                username: post.username,
                passwd: md5(post.passwd),
                nickname: post.nickname
            }
            let ret1 = await ctx.db.save(savedata, "users", "insert")
            if(ret1.code==200){
                return this.response(ctx, { code: 200 })
            }else{
                throw "Failed to create account."
            }
        } catch (error) {
            return this.response(ctx, error, false)
        }
    }


    async sendmail(ctx) {
        try {
            var post = this.param(ctx);
            if (post == 0) {
                throw ctx.body;
            }
            if (post.hasOwnProperty("email") == false) {
                throw { code: 405, msg: 'Invalid parameter(email).' };
            }
            let rule = new RegExp(/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/);
            if (rule.test(post.email) == false){
                throw { code: 406, msg: "Parameter error (email)" };
            }
            let ip=this.getip(ctx.req)
            //检测邮箱账号的发送频率
            let _num1 = await global.rd.get(`signup:sendverifycode:num:${post.email}`)
            if(parseInt(_num1)>=10){
                throw { code: 406, msg: "Too many times to send mail. Please try again in two hours." };
            }
            //检测公网IP的发送频率
            let _num2 = await global.rd.get(`signup:sendverifycode:num:${ip}`)
            if(parseInt(_num2)>=10){
                throw { code: 406, msg: "Too many times to send mail. Please try again in two hours." };
            }
            //查找账号是否存在 
            ctx.db = new dbmysql()
            let sql = "select id,username,state  from `users` where `username`=?"
            let userdata = await ctx.db.findone(sql, [post.email])
            if(userdata){
                throw { code: 406, msg: "This account has been registered." }
            }
            var transporter = nodemailer.createTransport({
                "host": config["smtp_host"],
                "port": 25,
                //"secureConnection": true, // use SSL, the port is 465
                "auth": {
                    "user": config["smtp_user"],
                    "pass": config["smtp_pass"]
                }
            })
            let verify_code=Math.round(Math.random()*1000000)
            var mailOptions = {
                from: config["smtp_user"], // sender address mailfrom must be same with the user
                to: post.email, // list of receivers
                subject: 'Create OSIM account.', // Subject line
                replyTo: config["smtp_user"], //custom reply address
                html:`<b>Create OSIM account.</b><p>Verification Code: ${verify_code}</p><p>Valid within 10 minutes</p>`, // html body
            }
            let res1= await new Promise((r,j)=>{
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        r(false)
                    }
                    r(true)
                })
            })
            if(!res1){
                throw "Mail sending failed"
            }
            //验证码写入redis
            global.rd.setex(`signup:sendverifycode:${post.email}`, 600, verify_code)
            //写入邮箱发送次数
            global.rd.incrby(`signup:sendverifycode:num:${post.email}`, 1)
            global.rd.expire(`signup:sendverifycode:num:${post.email}`, 7200)
            //写入公网IP发送次数
            global.rd.incrby(`signup:sendverifycode:num:${ip}`, 1)
            global.rd.expire(`signup:sendverifycode:num:${ip}`, 7200)
            //发送成功,应该要通知剩余次数
            return this.response(ctx, { code: 200 })
        } catch (error) {
            return this.response(ctx, error, false)
        }
    }



    // /**
    //  * 生成二维码
    //  */
    // async qrcode(ctx) {
    //     try {
    //         var q = ctx.query.q;
    //         //输出图片
    //         var img = qr.image(q, { size: 10, margin: 1 });
    //         ctx.type = 'image/png';
    //         ctx.body = img;
    //     } catch (error) {
    //         var img = qr.image("二维码内容", { size: 10, margin: 1 });
    //         ctx.type = 'image/png';
    //         ctx.body = img;
    //     }
    // }

}


module.exports = new apiController();

