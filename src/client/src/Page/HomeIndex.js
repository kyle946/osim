import React, { useReducer } from "react";
import ReactDom from 'react-dom';
import AvatarEditor from 'react-avatar-editor'
const nativeImage = require('electron').nativeImage
import SocketClient from "./SocketClient";
import $$ from "../comm"
import "./HomeIndex.less"
import logo1 from "../assets/logo1.png"
import Empty1 from "./Empty1"
import SimpleImg from "./SimpleImg"


class Menu1 extends React.Component {
    constructor(props) {
        super(props)
        reactPage["Menu1"] = this
        this.setnum = this.setnum.bind(this)
        this.state = {
            i: "chat",
            d: [
                {
                    key: "notice",
                    name: "NOTICE",
                    num: 0,
                    icon: '\u{e655}'
                },
                {
                    key: "chat",
                    name: "CHATS",
                    num: 0,
                    icon: '\u{e643}'
                },
                {
                    key: "contact",
                    name: "CONTACTS",
                    num: 0,
                    icon: '\u{e66a}'
                },
                {
                    key: "newcontact",
                    name: "NEW CONTACTS",
                    num: 0,
                    icon: '\u{e645}'
                },
                {
                    key: "groups",
                    name: "GROUPS",
                    num: 0,
                    icon: '\u{e71c}'
                }
            ]
        }
    }
    static defaultProps = {
        click: () => { }
    }
    componentDidMount(){
        reactPage.Event1.on("setnum", this.setnum)
    }
    componentWillUnmount() {
        reactPage.Event1.removeListener("setnum", this.setnum)
        reactPage["Menu1"] = undefined;
    }
    client(v, i) {
        this.setState({ i: v.key })
        this.props.click(v, i)
    }
    setnum(index, num) {
        osim.log(index)
        osim.log(num)
        let d = this.state.d;
        if (num == 0) {
            d[index].num = 0
        } else {
            d[index].num = parseInt(d[index].num) + num
        }
        this.setState({ d });
    }
    render() {
        let list1 = this.state.d.map((value, index) => {
            return <a key={index} className={this.state.i == value.key ? "active" : null} onClick={() => { this.client(value, index) }}><font className="iconfont">{value.icon}</font><span>{value.name}</span>{value.num > 0 && <font className="num">{value.num}</font>}</a>
        })
        return (
            <div className="Menu1">
                <div className="title">CHAT</div>
                {list1}
                <div className="line1"></div>
                <a onClick={() => { this.client({ key: 'addcontact' }, -1) }}><font className="iconfont">&#xe645;</font><span>ADD CONTACT</span></a>
                <a onClick={() => { this.client({ key: 'addgroup' }, -1) }}><font className="iconfont">&#xe71c;</font><span>ADD GROUP</span></a>
            </div>
        )
    }
}

class List1Item extends React.Component {
    constructor(props) {
        super(props)
    }
    static defaultProps = {
        value: {
            id: 0,
            avatar: logo1,
            nickname: "",
            info: "",
            time: "",
            num: 999,
        },
        active: false,
        click: () => { }
    }
    render() {
        return (
            <a className="List1Item" onClick={this.props.click}>
                {this.props.active && <div className="bg"></div>}
                <div className="left">
                    <img src={this.props.value.avatar} />
                </div>
                <div className="right">
                    <div className="nickname">{this.props.value.nickname}</div>
                    <div className="info">{this.props.value.info}</div>
                    <div className="time">{this.props.value.time}</div>
                    {this.props.value.num > 0 && <div className="num">{this.props.value.num > 99 ? '99' : this.props.value.num}</div>}
                </div>
            </a>
        )
    }
}

class List1 extends React.Component {
    constructor(props) {
        super(props)
        reactPage["List1"] = this;
        this.map1 = new Map()
        this.reflist = []
        this.type = "chat"
        this.refsearch=React.createRef()
        this.data = []
        this.update_chat_list = this.update_chat_list.bind(this)
        this.getdata = this.getdata.bind(this)
        this.getdata = this.getdata.bind(this)
        this.searchkeydown = this.searchkeydown.bind(this)
    }
    state = {
        currentUserId: 0,
        title: "..."
    }
    static defaultProps = {
        click: () => { }
    }
    componentDidMount() {
        reactPage.Event1.on("update_chat_list", this.update_chat_list)  //仅type为chat时
        reactPage.Event1.on("list1_getdata", this.getdata)
        reactPage.Event1.on("delmember", this.getdata)
        reactPage.Event1.on("exitgroup", this.getdata)
    }
    componentWillUnmount() {
        reactPage.Event1.removeListener("update_chat_list", this.update_chat_list)  //仅type为chat时
        reactPage.Event1.removeListener("list1_getdata", this.getdata)
        reactPage.Event1.removeListener("delmember", this.getdata)
        reactPage.Event1.removeListener("exitgroup", this.getdata)
        this.map1 = undefined
        this.reflist = undefined
        reactPage["List1"] = undefined
    }
    set_unread(sid) {
        let index = this.map1.get(sid)
        this.data[index].num=0
        //通知服务器，设置为已经读取
        SocketClient.send_to("set_msg_num", "chat:num", sid)
        //....
        this.forceUpdate()
    }
    update_chat_list(chat, sid) {   //仅type为chat时
        if (this.state.type == 'chat') {
            let index = this.map1.get(sid)
            if (index === false || index === undefined) {
                this.reflist.unshift(React.createRef())
                chat.time = $$.getdate(chat.time, 5)
                this.data.unshift(chat)
                this.map1.clear()
                this.data.forEach((val, key) => {
                    this.map1.set(val.sid, index)//通过sid映射index
                })
            } else {
                chat.time = $$.getdate(chat.time, 5)
                this.data[index]=chat
            }
            this.forceUpdate()
        }
    }
    getdata() {
        this.data=[]
        let url = ser.http + "/get/" + this.type;
        $$.ajax(url, { token: global.token }, (res) => {
            if (res.code == 200) {
                if (this.type == 'chat') {
                    this.map1.clear()
                    this.reflist = []
                    this.data = res.data.map((el, index) => {
                        this.reflist[index] = React.createRef() //通过index映射ref
                        this.map1.set(el.sid, index)//通过sid映射index
                        el.time = $$.getdate(el.time, 5)
                        return el
                    })
                } else {
                    this.data = res.data
                }
                this.forceUpdate()
            } else if (res.code == 402) {
                $$.logout()
            }
        })
    }
    list1_click(v, i) {
        this.setState({ currentUserId: v.id })
        this.props.click(v, i);
    }
    setTitle(type, title) {
        this.type = type
        this.setState({ title })
    }
    searchkeydown(e){

    }
    render() {
        let list1 = <Empty1 />
        if (this.data.length > 0) {
            list1 = this.data.map((value, index) => {
                return <List1Item ref={this.reflist[index]} click={(() => { this.list1_click(value, index) })} active={this.state.currentUserId == value.id ? true : false} value={value} />
            })
        }
        return (
            <div className="List1">
                <div className="search">
                    <font className="iconfont">&#xe65c;</font>
                    <input ref={this.refsearch} onKeyDown={this.searchkeydown} placeholder="Search" />
                </div>
                <div className="topmenu">
                    <div className="text">{this.state.title}</div>
                    <a><font className="iconfont">&#xe829;</font></a>
                </div>
                <div className="list">{list1}</div>
            </div>
        )
    }
}

class Chat1Text extends React.Component {
    constructor(props) {
        super(props)
    }
    static defaultProps = {
        type: "text",
        position: "left",
        content: "Who are you?",
        avatar: logo1,
        time: "12:13"
    }
    render() {
        let el = null;
        if (this.props.position == "left") {
            el = <div className="left">
                <div className="avatar"><img src={this.props.avatar} /></div>
                <div className="content">{this.props.content}</div>
                <div className="time">{this.props.time}</div>
            </div>
        }
        else if (this.props.position == "right") {
            el = <div className="right">
                <div className="time">{this.props.time}</div>
                <div className="content">{this.props.content}</div>
                <div className="avatar"><img src={this.props.avatar} /></div>
            </div>
        }
        return (<div className="Chat1Text">{el}</div>);
    }
}

class Chat1Img extends React.Component {
    constructor(props) {
        super(props)
    }
    static defaultProps = {
        type: "text",
        position: "left",
        content: "Who are you?",
        avatar: logo1,
        time: "12:13"
    }
    render() {
        let el = null;
        if (this.props.position == "left") {
            el = <div className="left">
                <div className="avatar"><img src={this.props.avatar} /></div>
                <div className="content"><img src={this.props.content} /></div>
                <div className="time">{this.props.time}</div>
            </div>
        }
        else if (this.props.position == "right") {
            el = <div className="right">
                <div className="time">{this.props.time}</div>
                <div className="content"><img src={this.props.content} /></div>
                <div className="avatar"><img src={this.props.avatar} /></div>
            </div>
        }
        return (<div className="Chat1Img">{el}</div>);
    }
}
class Chat1Tips extends React.Component {
    constructor(props) {
        super(props)
    }
    render() {
        return (
            <div className="Chat1Tips">
                <div className="line"></div>
                <div className="text">{this.props.content}</div>
            </div>
        )
    }
}

class Chat1 extends React.Component {
    constructor(props) {
        super(props)
        reactPage["Chat1"] = this
        this.chatmessage = React.createRef()
        this.textarea_placeholder = React.createRef()
        this.btnblue = React.createRef()
        this.msglist = React.createRef()
        this.sendlasttime = 0
        //
        this.onPaste = this.onPaste.bind(this)
        this.onKeyDown = this.onKeyDown.bind(this)
        this.onKeyUp = this.onKeyUp.bind(this)
        this.recv = this.recv.bind(this)
        this.sendmsg = this.sendmsg.bind(this)
        this.sendfile = this.sendfile.bind(this)
        this.screenshot = this.screenshot.bind(this)
        this.getdata = this.getdata.bind(this)
        this.delmember = this.delmember.bind(this)
    }
    state = {
        msglist: [
            // {
            //     type: "text",
            //     position: "left",
            //     content: "Who are you?",
            //     avatar: logo1,
            //     time: "12:13"
            // },
            // {
            //     type: "img",
            //     position: "left",
            //     content: logo1,
            //     avatar: logo1,
            //     time: "12:13"
            // },
            // {
            //     type: "text",
            //     position: "right",
            //     content: "Who are you?",
            //     avatar: logo1,
            //     time: "12:13"
            // },
        ],
        sid: "",
        user: null,
        member: null,   //群成员
    }
    static defaultProps = {
        id: 0,
        avatar: null,
        nickname: "...",
        info: "...",
        type: "single_msg",     // single_msg  group_msg
    }
    componentDidMount() {
        this.chatmessage.current.addEventListener("paste", this.onPaste);
        reactPage.Event1.on("recv", this.recv)
        reactPage.Event1.on("delmember", this.delmember)
        reactPage.Event1.on("exitgroup", this.getdata)
        this.getdata()
    }
    componentWillUnmount() {
        reactPage.Event1.removeListener("recv", this.recv)
        reactPage.Event1.removeListener("delmember", this.delmember)
        reactPage.Event1.removeListener("exitgroup", this.getdata)
        reactPage["Chat1"] = undefined
    }
    delmember(groupinfo) {
        if (this.props.type == 'group_msg') {
            if (groupinfo.id == this.props.id) {
                reactPage["HomeIndex"].column3_show_page(Empty1)
                reactPage["HomeIndex"].column4_show_page(Empty1)
            }
        }
        this.getdata()
    }
    getdata() {
        //获取用户信息
        let url = ser.http + "/chat_get_data"
        $$.ajax(url, { token: global.token, id: this.props.id, type: this.props.type }, (res) => {
            if (res.code == 200) {
                osim.log(res, "chat_get_data")
                //res.user      //群或用户数据
                //res.msg
                //res.sid
                //res.member    //仅群聊时有数据
                reactPage.Event1.emit("chat_get_data.user", res.user, res.sid)
                if (res.member){
                    reactPage.Event1.emit("load_data_group_member", res.member)
                }   
                //处理昵称、头像、时间、位置
                let msglist = res.msg.map((value, index) => {
                    value.time = $$.getdate(value.time, 5)
                    if (this.props.type == "single_msg") {
                        if (value._from == global.user.id) {        //自己发的
                            value.position = "left"
                            value.avatar = global.user.avatar
                        } else {
                            value.position = "right"
                            value.avatar = this.props.avatar
                        }
                    } else {      //群聊
                        if (value._from == global.user.id) {        //自己发的
                            value.position = "left"
                            value.avatar = global.user.avatar
                        } else {
                            value.position = "right"
                        }
                    }
                    return value
                })
                this.setState({
                    user: res.user,
                    sid: res.sid,
                    member: res.member,
                    msglist
                }, () => {
                    this.scrollToBottom()
                })
            }
            else if (res.code == 402) {
                $$.logout()
            }
        })
    }
    handleChange(event) {
        const name = event.target.name;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        this.state[name] = value;
    }
    onKeyDown(e) {
        if (this.chatmessage.current.innerText.length > 0) {
            this.btnblue.current.style.color = "#0e82ed"
            this.textarea_placeholder.current.style.display = "none"
        } else {
            this.btnblue.current.style.color = "#999"
            this.textarea_placeholder.current.style.display = "block"
        }
        if (e.code == 'Enter') {
            this.send();
        }
    }
    onKeyUp(e) {
        if (e.code == 'Enter') {
            this.chatmessage.current.innerHTML = "";
        }
        if (this.chatmessage.current.innerText.length > 0) {
            this.btnblue.current.style.color = "#0e82ed"
            this.textarea_placeholder.current.style.display = "none"
        } else {
            this.btnblue.current.style.color = "#999"
            this.textarea_placeholder.current.style.display = "block"
        }
    }
    //消息列表滚动到底
    scrollToBottom() {
        var scrollHeight = this.msglist.current.scrollHeight;
        var height = this.msglist.current.clientHeight;
        let s = scrollHeight - height;
        this.msglist.current.scrollTop = s > 0 ? s : 0;
    }
    recv(msg, sid) {
        // var data = {
        //     type: 'img', //消息类型, text和img
        //     time,        //发送时间
        //     uuid,        //消息id
        //     _from,       //谁发的
        //     nickname,      //发送者的昵称
        //     avatar,      //发送者的头像地址
        //     content: res.imageUrl    //消息内容
        // }
        if (sid == this.state.sid) {
            msg.time = $$.getdate(msg.time, 5)
            if (this.props.type == "single_msg") {
                msg.position = "right"
                msg.avatar = this.props.avatar
            } else {      //群聊
                msg.position = "right"
                msg.avatar = msg._from_avatar
            }
            this.state.msglist.push(msg)
            this.forceUpdate()
            this.scrollToBottom();
        }
    }
    send() {
        let time = $$.getTime();
        if (this.sendlasttime + 2 > time) {
            $$.alert("Too fast")
            return
        }
        var msg = this.chatmessage.current.innerHTML;
        if (msg == "") {
            return
        }
        let handleImg = false
        if (msg.match(/(.*?)(\<img.*?\>)(.*?)/)) {
            handleImg = true;
            msg = this.chatmessage.current.innerText;
        } else {
            msg = this.chatmessage.current.innerText;
        }
        //如果有图片需要单独发送
        if (handleImg) {
            for (let index = 0; index < this.chatmessage.current.children.length; index++) {
                const imgele = this.chatmessage.current.children[index];
                //发送到界面
                var obj = {
                    position: "left",
                    nickname: global.user.nickname,
                    avatar: global.user.avatar,
                    time: $$.getdate(time, 5),
                    content: imgele.src,
                    type: "img",
                }
                this.state.msglist.push(obj);

                //取图片二进制数据
                fetch(imgele.src).then(r => {
                    return r.blob();
                }).then(imgblob => {
                    var render = new FileReader();
                    render.readAsDataURL(imgblob);
                    render.onload = () => {
                        var imgbase64 = render.result;
                        $$.ajax(`${ser.http}/uploadimg`, { token: global.token, imgbase64 }, (res) => {
                            if (res.code == 200) {
                                // res.imageUrl
                                let uuid = $$.getSeq();
                                let data = {
                                    type: 'img',
                                    time,
                                    uuid,
                                    _from: global.user.id,
                                    content: res.imageUrl
                                }
                                let _from = global.user.id
                                let _to = this.props.id
                                SocketClient.send_to(this.props.type, _to, _from, data, this.state.sid)
                                let param2 = {
                                    type: this.props.type,
                                    id: this.props.id,
                                    time,
                                    nickname: this.props.nickname,
                                    avatar: this.props.avatar,
                                    info: ['Image']
                                }
                                reactPage.Event1.emit("update_chat_list", param2, this.state.sid)
                            }
                            else if (res.code == 402) {
                                $$.logout()
                            }
                        }, (err) => {
                            $$.alert("Sending failure.")
                        })
                    }
                })
            }
            this.setState({ msglist: this.state.msglist }, () => {
                this.scrollToBottom();
            });
        }

        //如果有文本消息
        if (msg) {
            var obj = {
                position: "left",
                nickname: global.user.nickname,
                avatar: global.user.avatar,
                time: $$.getdate(time, 5),
                content: msg,
                type: "text",
            }
            this.state.msglist.push(obj);
            {   //发送消息
                let uuid = $$.getSeq();
                let data = {
                    type: 'text',
                    time,
                    uuid,
                    _from: global.user.id,
                    content: msg
                }
                let _from = global.user.id
                let _to = this.props.id
                SocketClient.send_to(this.props.type, _to, _from, data, this.state.sid)
                let param2 = {
                    type: this.props.type,
                    id: this.props.id,
                    time,
                    nickname: this.props.nickname,
                    avatar: this.props.avatar,
                    info: msg
                }
                reactPage.Event1.emit("update_chat_list", param2, this.state.sid)
            }
            this.setState({ msglist: this.state.msglist }, () => {
                this.scrollToBottom();
            });
        }
        this.chatmessage.current.innerHTML = "";
        this.sendlasttime = time;
    }
    //剪贴板事件监听
    onPaste(event) {
        if (event.clipboardData || event.originalEvent) {
            var clipboardData = event.clipboardData || event.originalEvent.clipboardData
            var items, item, types;
            if (clipboardData) {
                items = clipboardData.items;
                if (!items) {
                    return;
                }
                for (var h = 0; h < items.length; h++) {
                    item = items[h];
                    if (item && item.kind === 'file' && item.type.match(/^image\//i)) {
                        event.preventDefault(); //屏蔽系统粘贴事件
                        var blob = item.getAsFile();
                        window.URL = window.URL || window.webkitURL;
                        var bloburl = window.URL.createObjectURL(blob);
                        var img = document.createElement("img");
                        img.setAttribute('src', bloburl);
                        this.chatmessage.current.appendChild(img);
                        break;
                    }
                    if (item && item.kind === 'string' && item.type == 'text/plain') {
                        event.preventDefault();
                        item.getAsString(str => {
                            this.chatmessage.current.innerText = str;
                        })
                    }
                }
            }
        }
    }
    screenshot() {
        osim.openScreenshot()
    }
    async sendfile() {
        let filepath = await osim.selectFile()
        $$.alert("Under development……")
    }
    sendmsg() {
        this.send()
    }
    info() {
        $$.alert("Under development……")
    }
    msglog() {
        $$.alert("Under development……")
    }
    render() {
        let _list = this.state.msglist.map((value, index) => {
            if (value.type == "text")
                return <Chat1Text {...value} />
            if (value.type == "img")
                return <Chat1Img {...value} />
            if (value.type == 'tips')
                return <Chat1Tips {...value} />
        })
        return (
            <div className="Chat1">
                <div className="tabar1">
                    <div className="left">
                        <div className="avatar"><SimpleImg src={this.props.avatar} /></div>
                        <div className="nickname">{this.props.nickname}</div>
                        <div className="info">{this.props.info}</div>
                    </div>
                    <div className="button">
                        {/* <a><font className="iconfont">&#xe65c;</font></a> */}
                        <a onClick={this.info}><font className="iconfont">&#xe643;</font></a>
                        {/* <a><font className="iconfont">&#xe627;</font></a> */}
                        <a onClick={this.msglog}><font className="iconfont">&#xe623;</font></a>
                    </div>
                </div>
                <div className="chatContent" ref={this.msglist}>
                    {_list}
                </div>
                <div className="sendMsg">
                    <div className="Chat1SendMsg">
                        <div className="textarea_placeholder" ref={this.textarea_placeholder}>Press [Enter] to send, [Ctrl + Alt + X] screenshot</div>
                        <a onClick={this.screenshot}><font className="iconfont">&#xe657;</font></a>
                        <a onClick={this.sendfile}><font className="iconfont">&#xe669;</font></a>
                        {/* <input placeholder="Type Something..." /> */}
                        <div ref={this.chatmessage} className="textarea" name="message" contenteditable="true" onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} />
                        <a onClick={this.sendmsg}><font ref={this.btnblue} className="iconfont">&#xe621;</font></a>
                    </div>
                </div>
            </div>
        )
    }
}

class Chat1UserInfo1 extends React.Component {
    constructor(props) {
        super(props)
        this.user = null
        this.sid = null
        this.set_user_data = this.set_user_data.bind(this)
        this.deleteContact = this.deleteContact.bind(this)
        
        //
        this.refinfo = React.createRef()
    }
    static defaultProps = {
        id: 0,
        avatar: logo1,
        nickname: "...",
        info: "...",
    }
    componentDidMount() {
        reactPage.Event1.on("chat_get_data.user", this.set_user_data)
    }
    componentWillUnmount() {
        reactPage.Event1.removeListener("chat_get_data.user", this.set_user_data)
    }
    set_user_data(user, sid) {
        this.user = user
        this.sid = sid
        this.refinfo.current.innerText = this.user.info
    }
    deleteContact(){
        $$.confirm("Are you sure you want to delete the contact", ()=>{
            let param = {
                token: global.token,
                uid: this.user.id,
                sid: this.sid
            }
            $$.ajax(ser.http + "/deleteContact", param, (res) => {
                if (res.code == 200) {
                    $$.alert("Delete succeeded")
                    reactPage["List1"].getdata()
                    reactPage["HomeIndex"].column3_show_page(Empty1)
                    reactPage["HomeIndex"].column4_show_page(Empty1)
                }
                else if (res.code == 402) {
                    $$.logout()
                } else {
                    $$.alert(res.msg)
                }
            })
        })
    }
    render() {
        return (
            <div className="Chat1UserInfo1">
                <div className="title">Details</div>
                <div className="avatar">
                    <SimpleImg src={this.props.avatar} />
                </div>
                <div className="nickname">{this.props.nickname}</div>
                <div className="info" ref={this.refinfo}>{this.props.info}</div>
                <div className="button">
                    {/* <button>Clear chat history</button> */}
                    <button onClick={this.deleteContact}>Delete Contact</button>
                </div>
            </div>
        )
    }
}


class AddMemberToGroup extends React.Component {
    constructor(props) {
        super(props)
        this.click = this.click.bind(this)
    }
    clickTimer = null
    click1() { }
    click2() { }
    click(member) {
        let param = { token: global.token, member, data: this.props }
        $$.ajax(ser.http + "/join_group", param, (res) => {
            if (res.code == 200) {
                reactPage.Event1.emit("load_data_group_member", res.member)
                $$.modalClose()
            } else if (res.code == 402) {
                $$.logout()
            } else {
                $$.alert(res.msg)
            }
        }, (err) => { })
    }
    render() {
        return (
            <SelectUser1 done={this.click} />
        )
    }
}

class Chat1GroupInfo1 extends React.Component {
    constructor(props) {
        super(props)
        this.data = []
        this.setdata = this.setdata.bind(this)
        this.click = this.click.bind(this)
        this.addmember = this.addmember.bind(this)
        this.delmember = this.delmember.bind(this)
        this.set_user_data = this.set_user_data.bind(this)
        this.exitgroup = this.exitgroup.bind(this)
        this.clearchathistory = this.clearchathistory.bind(this)
        //
        this.user = null
        this.sid = null
        //
        this.refinfo = React.createRef()
    }
    static defaultProps = {
        id: 0,
        avatar: logo1,
        nickname: "...",
        info: "...",
    }
    state = {
        current_uid: 0
    }
    componentDidMount() {
        reactPage.Event1.on("load_data_group_member", this.setdata)
        reactPage.Event1.on("chat_get_data.user", this.set_user_data)
    }
    componentWillUnmount() {
        reactPage.Event1.removeListener("load_data_group_member", this.setdata)
        reactPage.Event1.removeListener("chat_get_data.user", this.set_user_data)
    }
    set_user_data(user, sid) {
        this.user = user
        this.sid = sid
        this.refinfo.current.innerText = this.user.info
    }
    setdata(data) {
        this.data = data
        this.forceUpdate()
    }
    click(v) {
        this.setState({ current_uid: v.id })
    }
    addmember() {
        if (global.user.id != this.user.uid) {
            $$.alert("your are not an administrator.")
            return
        }
        $$.modal(AddMemberToGroup, "add member to group", this.props, 350, 500)
    }
    delmember() {
        if (global.user.id != this.user.uid) {
            $$.alert("your are not an administrator.")
            return
        }
        if (this.state.current_uid == 0) {
            $$.alert("please select a member.")
            return
        }
        $$.confirm("Are you sure you want to remove the member?", () => {
            let param = {
                token: global.token,
                gid: this.user.id,
                uid: this.state.current_uid
            }
            $$.ajax(ser.http + "/delmember", param, (res) => {
                if (res.code == 200) {
                    this.setdata(res.data)
                    $$.alert("Removal succeeded")
                }
                else if (res.code == 402) {
                    $$.logout()
                } else {
                    $$.alert(res.msg)
                }
            })
        })
    }
    exitgroup() {
        if (global.user.id == this.user.uid) {
            $$.confirm("You are an administrator and cannot leave the group.", () => { }, true, false)
            return
        }
        $$.confirm("Are you sure you want to exit the group?", () => {
            let param = {
                token: global.token,
                gid: this.user.id,
            }
            $$.ajax(ser.http + "/exitgroup", param, (res) => {
                if (res.code == 200) {
                    // this.setdata(res.data)
                    $$.alert("Exit succeeded")
                    reactPage["List1"].getdata()
                    reactPage["HomeIndex"].column3_show_page(Empty1)
                    reactPage["HomeIndex"].column4_show_page(Empty1)
                }
                else if (res.code == 402) {
                    $$.logout()
                } else {
                    $$.alert(res.msg)
                }
            })
        })
    }
    clearchathistory() {
        if (global.user.id != this.user.uid) {
            $$.alert("your are not an administrator.")
            return
        }
        $$.confirm("Are you sure you want to clear chat history?", () => {
            let param = {
                token: global.token,
                sid: this.sid,
                gid: this.user.id,
            }
            $$.ajax(ser.http + "/clearchathistory", param, (res) => {
                if (res.code == 200) {
                    reactPage["Chat1"].getdata()
                }
                else if (res.code == 402) {
                    $$.logout()
                }
            })
        })
    }
    render() {
        let _list = this.data.map((value, index) => {
            return <a className={this.state.current_uid == value.id ? "member_item active" : "member_item"} onClick={() => { this.click(value) }}>
                <SimpleImg src={value.avatar} />
                <div className="nickname2">{value.nickname}</div>
            </a>
        })
        return (
            <div className="Chat1GroupInfo1">
                <div className="title">Group Details</div>
                <div className="avatar">
                    <SimpleImg src={this.props.avatar} />
                </div>
                <div className="nickname">{this.props.nickname}</div>
                <div className="info" ref={this.refinfo}>{this.props.info}</div>
                <div className="iconarea">
                    <a title="add member" onClick={this.addmember}><font className="iconfont">&#xe829;</font></a>
                    <a title="delete member" onClick={this.delmember}><font className="iconfont">&#xe617;</font></a>
                    <a title="clear chat history" onClick={this.clearchathistory}><font className="iconfont">&#xe633;</font></a>
                    <a title="exit group" onClick={this.exitgroup}><font className="iconfont">&#xe606;</font></a>
                </div>
                <div className="title2">MEMBERS</div>
                <div className="member_list">{_list}</div>
            </div>
        )
    }
}


class AddContact1 extends React.Component {
    constructor(props) {
        super(props)
        reactPage["AddContact1"] = this;

        this.btn_save = React.createRef()
        this.click = this.click.bind(this)
        this.click1 = this.click1.bind(this)
        this.click2 = this.click2.bind(this)
        //
        this.handleEnterKey = this.handleEnterKey.bind(this)
        this.handleChange = this.handleChange.bind(this)
        //
        this.find_user = this.find_user.bind(this)
        this.find_user1 = this.find_user1.bind(this)
        this.find_user2 = this.find_user2.bind(this)

    }
    state = {
        id: 0,
        avatar: logo1,
        nickname: "OSIM",
        info: "osim chat.",
        username: "",
        tips: "Enter email from here, add a contact.",
        remarks: "",
    }
    componentWillUnmount() {
        reactPage["AddContact1"] = undefined;
    }
    handleChange(event) {
        const name = event.target.name;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        this.state[name] = value;
    }
    handleEnterKey = (e) => {
        const name = e.target.name;
        if (name == "username") {
            if (e.code == 'Enter') { //e.nativeEvent获取原生的事件对像
                this.find_user(e);
            }
        }
    }
    find_user_Timer = null;
    find_user() {
        this.find_user1(0, "Be searching")
        if (this.find_user_Timer) {
            clearTimeout(this.find_user_Timer);
            this.find_user_Timer = null;
        }
        this.find_user_Timer = setTimeout(this.find_user2, 500);
    }
    find_user1(state = 0, tips) {
        if (state == 0) {
            this.setState({ id: 0, tips })
        } else {
            this.setState({ tips: "Enter email from here, add a contact." })
        }
    }
    find_user2() {
        let rule = new RegExp(/^.{2,64}$/);
        if (rule.test(this.state.username) == false) {
            this.find_user1(0, "Please enter the correct email address.")
            this.click1(1)
            return
        }
        let param = {
            token: global.token,
            username: this.state.username
        };
        let url = ser.http + "/find_user";
        $$.ajax(url, param, (res) => {
            if (res.code == 200) {
                console.log(res);
                this.setState({
                    id: res.data.id,
                    avatar: res.data.avatar,
                    nickname: res.data.nickname,
                    info: res.data.info,
                })
            } else if (res.code == 402) {
                $$.logout()
            } else {
                this.find_user1(0, res.msg)
            }
        }, (err) => {
            this.find_user1(0, "error.")
        }, () => {
            this.find_user1(1)
        });
    }

    clickTimer = null;
    click() {
        this.click1(0)
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
            this.clickTimer = null;
        }
        this.clickTimer = setTimeout(this.click2, 500);
    }
    //修改按钮状态, 0 正在保存, 1 恢复正常
    click1(state = 0) {
        if (state == 0) {
            this.btn_save.current.style.backgroundColor = "#f1f1f1"
            this.btn_save.current.innerText = "sending..."
        } else {
            this.btn_save.current.style.backgroundColor = "#fff"
            this.btn_save.current.innerText = "Send"
        }
    }
    click2() {
        let rule = new RegExp(/^.{2,64}$/);
        if (rule.test(this.state.username) == false) {
            $$.alert("Please enter the correct email address.")
            this.click1(1)
            return
        }
        let param = {
            token: global.token,
            id: this.state.id,
            remarks: this.state.remarks
        };
        let url = ser.http + "/add_contact";
        $$.ajax(url, param, (res) => {
            if (res.code == 200) {
                this.setState({ id: 0 })
                $$.alert("Sent successfully.")
            } else if (res.code == 402) {
                $$.logout()
            } else {
                $$.alert(res.msg);
            }
        }, (err) => {
            $$.alert("Sent failure.");
        }, () => {
            this.click1(1)
        });
    }

    render() {
        return (
            <div className="AddContact1">
                <input placeholder="Enter an email address or user name" name="username" onKeyDown={this.handleEnterKey} onChange={this.handleChange.bind(this)} />
                {this.state.id > 0 && <>
                    <a className="List1Item" onClick={this.click}>
                        {this.state.active && <div className="bg"></div>}
                        <div className="left">
                            <SimpleImg src={this.state.avatar} />
                        </div>
                        <div className="right">
                            <div className="nickname">{this.state.nickname}</div>
                            <div className="info">{this.state.info}</div>
                        </div>
                    </a>
                    <textarea placeholder="Say something" name="remarks" onChange={this.handleChange.bind(this)}></textarea>
                    <button ref={this.btn_save} onClick={this.click}>Send</button>
                </>}
                {this.state.id == 0 && <div className="tips">{this.state.tips}</div>}
            </div>
        )
    }
}


class AddGroup1 extends React.Component {
    constructor(props) {
        super(props)
        reactPage["AddGroup1"] = this
        this.select_image = this.select_image.bind(this)
        this.save_avatar = this.save_avatar.bind(this)
        //保存
        this.save = this.save.bind(this)
        this.save1 = this.save1.bind(this)
        this.save2 = this.save2.bind(this)
        //创建ref对象
        this.btn_save = React.createRef()
        this.btn_save_avatar = React.createRef()
        this.editor = React.createRef(AvatarEditor);
    }
    state = {
        avatar: logo1,
        scale: 1,
        nickname: "",
        info: "",
    }
    componentWillUnmount() {
        reactPage["AddGroup1"] = undefined
    }
    handleScale = (e) => {
        const scale = parseFloat(e.target.value)
        this.setState({ scale })
    }
    handleSave() {
        const img = this.editor.current?.getImageScaledToCanvas().toDataURL()
        const rect = this.editor.current?.getCroppingRect()
        if (!img || !rect) return
        //保存图片
    }
    handleChange(event) {
        const name = event.target.name;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        this.setState({ [name]: value });
    }
    select_image() {
        osim.selectFile(2).then(buf => {
            const img = nativeImage.createFromDataURL(buf)
            this.setState({ avatar: img.toDataURL() })
        })
    }
    save_avatar() {
        console.log(this.btnsave.current);
        //修改按钮状态
        this.btn_save_avatar.current.style.backgroundColor = "#f1f1f1"
        this.btn_save_avatar.current.innerText = "saveing..."
    }
    saveTimer = null;
    //按钮点击事件
    save() {
        this.save1(0)
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        this.saveTimer = setTimeout(this.save2, 700);
    }
    //修改按钮状态, 0 正在保存, 1 恢复正常
    save1(state = 0) {
        if (state == 0) {
            this.btn_save.current.style.backgroundColor = "#f1f1f1"
            this.btn_save.current.innerText = "sending..."
        } else {
            this.btn_save.current.style.backgroundColor = "#fff"
            this.btn_save.current.innerText = "Done"
        }
    }
    //执行保存操作
    save2() {
        let r1 = $$.checkName(this.state.nickname, 1, 32);
        if (r1 != 1) {
            $$.confirm("group name are 2 to 32 characters long.")
            this.save1(1)
            return;
        }
        var rule2 = new RegExp(/^.{4,64}$/)
        if (rule2.test(this.state.info) == false) {
            $$.confirm("Please complete group description.")
            this.save1(1)
            return;
        }
        let avatar = null
        if (this.state.avatar == logo1) {
            avatar = null
        } else {
            avatar = this.editor.current?.getImageScaledToCanvas().toDataURL()
        }
        if (global.user.state == 0) {
            if (avatar == null) {
                $$.confirm("Please upload group avatar.")
                this.save1(1)
                return;
            }
        }
        let param = {
            token: global.token,
            avatar,
            info: this.state.info,
            nickname: this.state.nickname
        };
        let url = ser.http + "/add_group";
        $$.ajax(url, param, (res) => {
            if (res.code == 200) {
                $$.alert("Successfully.")
                $$.modalClose()
            } else if (res.code == 402) {
                $$.logout()
            } else {
                $$.confirm(res.msg);
            }
        }, (err) => {
            $$.confirm("Save failure.");
        }, () => {
            this.save1(1)
        });
    }
    render() {
        return (
            <div className="AddGroup1">
                <div className="line1">
                    <div className="label">Group Name</div>
                    <div className="value">
                        <input value={this.state.nickname} name="nickname" onChange={this.handleChange.bind(this)} />
                    </div>
                </div>
                <div className="line1">
                    <div className="label">Group Description</div>
                    <div className="value">
                        <input value={this.state.info} name="info" onChange={this.handleChange.bind(this)} />
                    </div>
                </div>
                <div className="line1">
                    <div className="label">Group Avatar</div>
                    <div className="value">
                        <div className="avatareditor">
                            <AvatarEditor
                                ref={this.editor}
                                image={this.state.avatar}
                                width={100}
                                height={100}
                                border={50}
                                color={[255, 255, 255, 0.6]} // RGBA
                                scale={this.state.scale}
                                rotate={0}
                            />
                            <div className="right">
                                <div className="line2">
                                    <div className="label">Scale</div>
                                    <input type="range" onChange={this.handleScale} min="1" max="2" step="0.01" defaultValue="1" />
                                </div>
                                <div className="line2">
                                    <div className="label">Image</div>
                                    <button onClick={this.select_image}>Select Image</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="line1">
                    <div className="label">.</div>
                    <div className="value">
                        <button ref={this.btn_save} onClick={this.save}>Done</button>
                    </div>
                </div>
            </div>
        )
    }
}

class SelectUser1 extends React.Component {
    constructor(props) {
        super(props)
        reactPage["SelectUser1"] = this
        this.sel = new Map()
        this.data = []
        this.click = this.click.bind(this)
        this.done = this.done.bind(this)
    }
    static defaultProps = {
        done: () => { }
    }
    componentDidMount() {
        this.getdata()
    }
    componentWillUnmount() {
        reactPage["SelectUser1"] = undefined
    }
    click(v) {
        if (this.sel.has(v.id)) {
            this.sel.delete(v.id)
        } else {
            this.sel.set(v.id, 1)
        }
        this.forceUpdate()
    }
    done() {
        let data = Array.from(this.sel.keys())
        this.props.done(data)
    }
    getdata() {
        this.data = []
        let url = ser.http + "/get/contact";
        $$.ajax(url, { token: global.token }, (res) => {
            if (res.code == 200) {
                this.data = res.data
                this.forceUpdate()
            } else if (res.code == 402) {
                $$.logout()
            }
        })
    }
    render() {
        let _list = this.data.map((value, index) => {
            return <a key={index} className={this.sel.has(value.id) ? "_item active" : "_item"} onClick={() => { this.click(value) }}>
                <SimpleImg src={value.avatar} />
                <div className="_nickname">{value.nickname}</div>
            </a>
        })
        return (
            <div className="SelectUser1">
                <div className="search">
                    <font className="iconfont">&#xe65c;</font>
                    <input placeholder="Search" />
                </div>
                <div className="_list">{_list}</div>
                <div className="button">
                    <button onClick={this.done}>Done</button>
                </div>
            </div>
        )
    }
}


export default class HomeIndex extends React.Component {
    constructor(props) {
        super(props);
        reactPage["HomeIndex"] = this;
        this.column1_click = this.column1_click.bind(this)
        this.column2_click = this.column2_click.bind(this)
        this.column3_show_page = this.column3_show_page.bind(this)
        this.column4_show_page = this.column4_show_page.bind(this)
    }
    componentDidMount() {
        // this.column3_show_page(Chat1)
        // this.column4_show_page(Chat1UserInfo1)
        this.column3_show_page(Empty1)
        this.column4_show_page(Empty1)
    }
    //点击菜单
    column1_click(v, i) {
        console.log(v, i);
        if (i >= 0) {
            let title = v.name.toUpperCase();
            reactPage["List1"].setTitle(v.key, title);
        }
        if (v.key == "addcontact") {        //添加好友
            $$.modal(AddContact1, "Add Contact", null, 440, 400);
        }
        else if (v.key == "addgroup") {   //创建群
            $$.modal(AddGroup1, "Add Group", null, 780, 500);
        }
        else if (v.key == "chat") {
            SocketClient.send_to("set_msg_num", "msg:num:chat") //服务器未读消息数量清空
            reactPage.Event1.emit("setnum", 1, 0)   //列表未读消息数量清空
            reactPage["List1"].getdata();  //获取chat列表数据
        }
        else if (v.key == "contact") {
            reactPage["List1"].getdata();
        }
        else if (v.key == "newcontact") {
            SocketClient.send_to("set_msg_num", "msg:num:newcontact")
            reactPage.Event1.emit("setnum", 3, 0)
            reactPage["List1"].getdata();
        } else if (v.key == "notice") {               //通知，公告
            //
        } else if (v.key == "groups") {               //群列表
            reactPage["List1"].getdata();
        }
    }
    //点击列表
    column2_click(v, i) {
        console.log(v, i);
        let type = reactPage["List1"].type
        if (type == "chat") {               //打开chat列表
            this.column3_show_page(Chat1, v)
            if (v.type == "single_msg") {
                reactPage["List1"].set_unread(v.sid)
                this.column4_show_page(Chat1UserInfo1, v)
            }
            else if (v.type == "group_msg") {
                reactPage["List1"].set_unread(v.sid)
                this.column4_show_page(Chat1GroupInfo1, v)
            }
        } else if (type == "newcontact") {                  //有新的联系人加我为好友
            $$.confirm("Accept each other as your friend?", () => {
                let param = {
                    token: global.token,
                    id: v.id
                }
                let url = ser.http + "/accept_new_contact";
                $$.ajax(url, param, (res) => {
                    if (res.code == 200) {
                        $$.alert("You've become friends.")
                    } else if (res.code == 402) {
                        $$.logout()
                    } else {
                        $$.alert("Loading failure.", false, 2)
                    }
                }, (err) => {
                    $$.alert("Loading failure.", false, 2)
                });
            })
        } else if (type == "contact") {                     //联系人列表
            this.column3_show_page(Chat1, v)
            this.column4_show_page(Chat1UserInfo1, v)
        } else if (type == "notice") {               //通知，公告
        } else if (type == "groups") {               //群列表
            v.type = "group_msg"
            this.column3_show_page(Chat1, v)
            this.column4_show_page(Chat1GroupInfo1, v)
        }
    }
    column3_show_page(InputComponent, props = null) {
        let element = document.getElementById('HomeIndex_column3')
        ReactDom.unmountComponentAtNode(element)
        let recEle = React.createElement(InputComponent, props);
        ReactDom.render(recEle, element);
    }
    column4_show_page(InputComponent, props = null) {
        let element = document.getElementById('HomeIndex_column4')
        ReactDom.unmountComponentAtNode(element)
        let recEle = React.createElement(InputComponent, props);
        ReactDom.render(recEle, element);
    }
    render() {
        return (
            <div className="HomeIndex">
                <div className="column1">
                    <Menu1 click={this.column1_click} />
                </div>
                <div className="column2" id="HomeIndex_column2">
                    <List1 click={this.column2_click} />
                </div>
                <div className="column3" id="HomeIndex_column3"></div>
                <div className="column4" id="HomeIndex_column4"></div>
            </div>
        )
    }
}