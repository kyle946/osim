const dbmysql = require("../extend/dbmysql");
const common = require("./common")
const c = new common()
const config = require("../config");
class sockser {
    constructor() {
        this.clients = new Map()
        this.connection = this.connection.bind(this)
        this.on_single_msg = this.on_single_msg.bind(this)
        this.on_group_msg = this.on_group_msg.bind(this)
        this.send_to = this.send_to.bind(this)
        this.login = this.login.bind(this)
        this.logout = this.logout.bind(this)
        this.get_socket = this.get_socket.bind(this)
    }
    async connection(socket) {
        socket.on("login", (token) => {
            this.login(socket, token)
        })
        socket.on("disconnect", (reason) => {
            this.clients.delete(socket.data.uid)
        })
        socket.on('single_msg', this.on_single_msg)
        socket.on('group_msg', this.on_group_msg)
        //去掉消息数量
        socket.on('set_msg_num', (type, sid) => {
            if (type == "msg:num:chat") {       //左侧菜单上的chats消息数
                global.rd.set(`msg:num:chat:${socket.data.uid}`, 0)
            }
            else if (type == "msg:num:newcontact") {    //左侧菜单上的chats消息数
                global.rd.set(`msg:num:newcontact:${socket.data.uid}`, 0)
            }
            else if (type == "chat:num") {  //左侧消息列表上用户的消息数量
                global.rd.hset(`chat:${socket.data.uid}:${sid}`, "num", 0)
            }
        })
    }
    async login(socket, token) {
        let uid = await global.rd.get(`token2id:${token}`)
        if (uid) {
            if (this.clients.has(uid)) {
                console.log("uid","已经登录");
                let socket=this.get_socket(uid)
                await global.rd.del(`token2id:${socket.data.token}`)
                socket.emit("force_logout")
                socket.disconnect(true)
                this.clients.delete(uid)
            }
            socket.data.uid = uid
            socket.data.token = token
            this.clients.set(uid+"", socket.id)
        } else {
            socket.disconnect(true)
        }
    }
    async on_single_msg(_to, _from, data, sid) {
        // _from      //谁发的
        // _to        //发给谁
        // sid        //会话id
        // let data = {
        //     type: 'text',            //消息类型, text和img
        //     time,                    //发送时间
        //     uuid,                    //消息id
        //     _from: global.user.id,   //谁发的
        //     content: res.imageUrl    //消息内容
        // }
        // let chat = {
        //     id: this.props.id,           //对方的id，或者是群id
        //     nickname: this.props.nickname,   //对方的昵称，或者是群名称
        //     avatar: this.props.avatar,   //对方的头像，或者是群头像
        //     info: msg,                   //最后发送的内容
        //     time,                        //发送时间
        //     num,                        //未读数量
        //     sid,                        //会话id
        // }
        //...
        //保存消息记录
        global.rd.hmset(`msg:${data.uuid}`, data)
        global.rd.lpush(`msglist:${sid}`, data.uuid)
        global.rd.expire(`msg:${data.uuid}`, config["msgExpire"]*86400)
        global.rd.expire(`msglist:${sid}`, config["msgExpire"]*86400)
        //删除过期消息
        c.DeleteExpiredMessages(sid)
        //记录自己的会话表
        let _content = data.content.substring(0,16)+"……"
        if (data.type == 'img')
            _content = '[Image]'
        let chat_from = await c.writechat_user(_from, _to, sid, _content, data.time, 0)
        //记录对方的会话表
        let chat_to = await c.writechat_user(_to, _from, sid, _content, data.time, 1)
        //发送给对方的消息
        let _sock=this.get_socket(_to+"")
        if (_sock) {
            data.avatar = chat_to.avatar
            data.nickname = chat_to.nickname
            _sock.emit("single_msg", _to, _from, data, sid)
        } else {
            global.rd.incrby(`msg:num:chat:${_to}`, 1)   //设置离线消息数量
        }
    }
    async on_group_msg(_to, _from, data, sid) {
        //保存消息记录
        global.rd.hmset(`msg:${data.uuid}`, data)
        global.rd.lpush(`msglist:${sid}`, data.uuid)
        global.rd.expire(`msg:${data.uuid}`, config["msgExpire"]*86400)
        global.rd.expire(`msglist:${sid}`, config["msgExpire"]*86400)
        //删除过期消息
        c.DeleteExpiredMessages(sid)
        //记录会话表
        let _content = data.content.substring(0,16)+"……"
        if (data.type == 'img')
            _content = '[Image]'
        let _from_user = await c.get_userinfo(_from)
        let member = await c.get_group_member(_to)
        // console.log("member", member);
        member.forEach(async (value, index) => {
            let num = 1
            if (value.id == _from){
                num = 0
            }
            let chat_from=await c.writechat_group(value.id, _to, sid, _content, data.time, num)
            if (value.id == _from)
                return 
            let _sock=this.get_socket(value.id+"")
            if (_sock) {
                data.avatar = chat_from.avatar
                data.nickname = chat_from.nickname
                data._from_avatar = _from_user.avatar
                data._from_nickname = _from_user.nickname
                _sock.emit("group_msg", _to, _from, data, sid)
            }
        })
    }
    get_socket(uid){
        if (this.clients.has(uid)) {
            let socket_id = this.clients.get(uid)
            return global.io.sockets.sockets.get(socket_id)
        }else{
            return false
        }
    }
    async send_to(event, _to, data, _from) {
        let _sock=this.get_socket(_to)
        if (_sock) {
            _sock.emit(event, data, _from)
            return true;
        } else {
            return false;
        }
    }
    async logout(uid){
        uid+=""
        let socket = this.get_socket(uid)
        if(socket){
            socket.disconnect(true)
            this.clients.delete(uid)
        }
    }
}
module.exports = new sockser()