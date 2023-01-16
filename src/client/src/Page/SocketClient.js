import io from 'socket.io-client';
export default new class SocketClient {
    constructor() {
        this.socket = null
        this.connect = this.connect.bind(this)
    }
    async connect() {
        this.socket = io(ser.ws, {path: "/osim/socket.io/"});
        this.socket.on('connect', () => {
            this.on_connected(true);
        });
        this.socket.on('disconnect', () => {
            this.on_connected(false);
        });
        // this.socket.on('message', this.on_message);
        this.socket.on('add_contact', this.add_contact);
        this.socket.on('single_msg', this.on_single_msg)
        this.socket.on('group_msg', this.on_group_msg)
        this.socket.on('join_group', this.join_group)
        this.socket.on('force_logout', this.force_logout)
        this.socket.on('delmember', this.delmember)
        this.socket.on('exitgroup', this.exitgroup)
        
    }
    async close(){
        this.socket.close()
    }
    // on_message(data) { }
    exitgroup(groupinfo, _from){        //退出群聊
        reactPage.Event1.emit("exitgroup", groupinfo)
    }
    delmember(groupinfo, _from){        //被移出群聊
        reactPage.Event1.emit("delmember", groupinfo)
        osim.notify("Exit Group", `Invited by ${_from.nickname} to remove the group`)
    }
    force_logout(){
        reactPage.Event1.emit("force_logout")
    }
    join_group(data, _from){   //被邀请加入了群聊
        reactPage.Event1.emit("setnum", 1, 1)
        reactPage.Event1.emit("list1_getdata")
        osim.notify("Join Group", `Invited by ${_from.nickname} to join the group`) //弹窗提示
    }
    on_connected(conn) {
        if (conn) {
            console.log("连接成功");
            this.socket.emit("login", global.token)
            reactPage.Event1.emit("connected", true)
        } else {
            reactPage.Event1.emit("connected", false)   //socket断开
        }
    }
    add_contact(_from) {
        reactPage.Event1.emit("setnum", 3, 1)
        osim.notify("New contact", `${_from.nickname} requests to add you as a contact`) //弹窗提示
    }
    on_single_msg(_to, _from, data, sid) {
        // osim.log({_to, _from, data, sid}, "uid: "+global.user.id+" single_msg")
        // var data = {
        //     type: 'img', //消息类型, text和img
        //     time,        //发送时间
        //     uuid,        //消息id
        //     _from,       //谁发的
        //     nickname,      //发送者的昵称
        //     avatar,      //发送者的头像地址
        //     content: res.imageUrl    //消息内容
        // }
        // osim.log(data, "uid: "+global.user.id+" single_msg data")
        reactPage.Event1.emit("recv", data, sid)  //聊天消息接收
        let chat=data
        if(data.type=="img"){
            chat.info="[image]"
        }else{
            chat.info=data.content
        }
        chat.type='single_msg'
        chat.id=chat._from
        chat.content=undefined
        chat._from=undefined
        chat.uuid=undefined
        // var chat = {
        //     type: 'single_msg',
        //     time,        //发送时间
        //     id,       //谁发的
        //     nickname,      //发送者的昵称
        //     avatar,      //发送者的头像地址
        //     info: '[image]',      //发送者的头像地址
        // }
        // osim.log(chat, "uid: "+global.user.id+" single_msg chat")
        reactPage.Event1.emit("update_chat_list", chat, sid)  //更新chat列表
        reactPage.Event1.emit("setnum", 1, 1)   //消息数量
        //弹窗提示
        osim.notify(`${chat.nickname}:`, `${chat.info}`)
    }
    on_group_msg(_to, _from, data, sid) {
        // osim.log({_to, _from, data, sid}, "uid: "+global.user.id+" group_msg")
        reactPage.Event1.emit("recv", data, sid)  //聊天消息接收
        let chat=data
        if(data.type=="img"){
            chat.info="[image]"
        }else{
            chat.info=data.content
        }
        chat.type='group_msg'
        chat.id=chat._from
        chat.content=undefined
        chat._from=undefined
        chat.uuid=undefined
        // osim.log(chat, "uid: "+global.user.id+" group_msg chat")
        reactPage.Event1.emit("update_chat_list", data, sid)  //更新chat列表
        reactPage.Event1.emit("setnum", 1, 1)   //消息数量
        //弹窗提示
        osim.notify(`${chat.nickname}:`, `${chat._from_nickname}: ${chat.info}`)
    }
    send_to(...args) {
        this.socket.emit(...args)
    }
}