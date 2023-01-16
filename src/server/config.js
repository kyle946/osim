
module.exports =  {
    "port": 8383,
    "db1": {
        host: "127.0.0.1",
        port: 3306,
        user: "root",
        pwd: "",
        name: "osim",
    },
    "rd1": {
        host: "127.0.0.1",
        port: 6379,
        pre: "osim:",
        pwd: "",
    },
    "StaticResUrl": "http://127.0.0.1:8383",   //静态资源地址
    "msgExpire": 1, //消息保存几天 ,单位:天
    "numberOfHistoryChats": 100,        //历史消息最多保存多少条
    "chat_conversation_list": 3,    //聊天会话列表保存多少天, 单位:天
    "smtp_host": "",
    "smtp_user": "",
    "smtp_pass": "",
}
