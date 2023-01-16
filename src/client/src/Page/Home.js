import React from "react";
import ReactDom from 'react-dom';
// import { Route, HashRouter as Router, Switch, NavLink, Link } from 'react-router-dom'
// import { createHashHistory } from "history";
// const history = createHashHistory();
import SocketClient from "./SocketClient";
import $$ from "../comm"
import "./Home.less"
import HomeIndex from "./HomeIndex"
import Set from "./Set"
import SimpleImg from "./SimpleImg"
import Title2 from "./Title2"
import Empty1 from "./Empty1";


export default class Home extends React.Component {
    constructor(props) {
        super(props);
        reactPage["Home"] = this
        this.setonlie = this.setonlie.bind(this)
        this.setavatar = this.setavatar.bind(this)
        this.state = {
            companyName: "index",
            online: true,
            avatar: null,
        }
    }
    setonlie(online) {
        this.setState({ online })
    }
    setavatar(avatar) {
        this.setState({ avatar })
    }
    force_logout(){
        $$.logout()
        $$.confirm("Your account is logged in elsewhere, and you are forced to log out", () => { }, true, false)
    }
    componentWillUnmount() {
        reactPage["Home"] = undefined;
        reactPage.Event1.removeListener("force_logout", this.force_logout)
    }
    componentDidMount() {
        this.onSwitchMenu("index")
        //判断有没设置昵称和头像
        if (user.state == 0) {
            $$.confirm("Please set the nickname and profile picture first.", () => {
                reactPage["Home"].onSwitchMenu('set');
            }, true, false)
        }
        //开发模式下获取token
        if (process.env.NODE_ENV == "development") {
            osim.cache_get("token")
                .then(res => {
                    global.token = res
                    SocketClient.connect()  //连接服务器
                })
            osim.cache_get("user")
                .then(res => {
                    global.user = res;
                    this.setState({ avatar: res.avatar })
                    reactPage.Event1.emit("setnum", 1, user.num_chat)
                    reactPage.Event1.emit("setnum", 3, user.num_new_contact)
                })
        } else {
            SocketClient.connect()  //连接服务器
        }
        //获取消息
        $$.onload('open', "Loading offline messages.");
        setTimeout(() => {
            reactPage["List1"].setTitle('chat', 'CHAT');
            reactPage["List1"].getdata('chat');  //获取chat列表数据
            $$.onload('close')
        }, 1000);
        //
        reactPage.Event1.on("force_logout", this.force_logout)
    }
    onSwitchMenu(key, e) {
        //隐藏所有的组件节点
        var nodes = document.getElementsByClassName("mount_object");
        for (let i = 0; i < nodes.length; i++) {
            let ii = nodes[i];
            ii.style.display = "none";
            ii.style.width = "0px";
        }
        switch (key) {
            case 'index': {
                let recEle = React.createElement(HomeIndex, null);
                ReactDom.render(recEle, document.getElementById('m_home_index'));
                m_home_index.style.display = 'flex';
                m_home_index.style.width = "100%";
                //
            } break;
            case 'file': {
                let recEle = React.createElement(Empty1, null);
                ReactDom.render(recEle, document.getElementById('m_home_file'));
                m_home_file.style.display = 'flex';
                m_home_file.style.width = "100%";
            } break;
            case 'set': {
                let recEle = React.createElement(Set, null);
                ReactDom.render(recEle, document.getElementById('m_home_set'));
                m_home_set.style.display = 'flex';
                m_home_set.style.width = "100%";
            } break;
            default: {
                //
            } break;
        }
        this.setState({ companyName: key })
    }
    onExit(e) {
        $$.confirm("Are you sure you want to log out?", () => {
            $$.logout()
        })
    }
    // dlg_me(e){
    //     $$.modal(HomeIndex, "我的", null, 440, 580);
    // }
    render() {
        return (
            <div className="mainIndex">
                <Title2 />
                <div className="leftMenu">
                    <a className="logo1">
                        <SimpleImg gray={this.state.online ? false : true} src={this.state.avatar} />
                    </a>
                    <a className={this.state.companyName == 'index' ? 'item' : 'txt'} onClick={this.onSwitchMenu.bind(this, 'index')}><font className="iconfont">&#xe643;</font></a>
                    <a className={this.state.companyName == 'file' ? 'item' : 'txt'} onClick={this.onSwitchMenu.bind(this, 'file')}><font className="iconfont">&#xe648;</font></a>
                    <a className={this.state.companyName == 'set' ? 'item' : 'txt'} onClick={this.onSwitchMenu.bind(this, 'set')}><font className="iconfont">&#xe612;</font></a>
                    {/* <a className='txt' onClick={this.dlg_me.bind(this)}><font className="iconfont">&#xe8bb;</font></a> */}
                    <a className={this.state.online ? 'btn_exit' : 'btn_exit_offline'} onClick={this.onExit.bind(this)}>
                        <div className="txt"><font className="iconfont">&#xe634;</font></div>
                    </a>
                    <div className="bg"></div>
                </div>
                <div className="mainIndexRight">
                    <div className="mount_object" id="m_home_index"></div>
                    <div className="mount_object" id="m_home_file"></div>
                    <div className="mount_object" id="m_home_set"></div>
                </div>
            </div>
        );
    }
}