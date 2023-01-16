import React from 'react'; 
import ReactDom from 'react-dom'; 
const EventEmitter = require('events').EventEmitter; 
import MyRouter from "./MyRouter/MyRouter";
//
global.user = {};
global.token = "";
global.reactPage = {};
// 消息数量 | chat数量(setnum) | 删除好友(delete_contact) | 退出群聊(exit_group) | 加入群聊(join_group)
// 异地登录强制退出(force_logout) | socket断开(connected)
// 加载群成员数据(load_data_group_member) | 
// 聊天消息接收 | 群消息接收 | 更新chat列表
reactPage.Event1 = new EventEmitter();
reactPage.Event1.setMaxListeners(128)
osim.conf().then(res=>{
    global.ser = {
        ws:  res.ws,
        http: res.http
    }
})
var eleroot = document.getElementById('root');
var ele = React.createElement(MyRouter, null);
ReactDom.render(ele, eleroot);