const router = require('koa-router')()
const api = require("../control/api");



router.prefix("/osim");

//api
router.post('/', (ctx,next)=>{
    ctx.body = "OSIM聊天软件，Author: kyle946@163.com";
});
router.get('/', (ctx,next)=>{
    ctx.body = "OSIM聊天软件，Author: kyle946@163.com";
});

router.post('/login', api.login);
router.post('/update_user_info', api.update_user_info);
router.post('/find_user', api.find_user);
router.post('/add_contact', api.add_contact);
router.post('/get/newcontact', api.get_new_contact);
router.post('/get/contact', api.get_contact);
router.post('/accept_new_contact', api.accept_new_contact);
router.post('/chat_get_data', api.chat_get_data);
router.post('/uploadimg', api.uploadimg);
router.post('/get/chat', api.get_chat_list);
router.post('/add_group', api.add_group);
router.post('/get/groups', api.get_group);
router.post('/join_group', api.join_group);
router.post('/logout', api.logout);
router.post('/clearchathistory', api.clearchathistory);
router.post('/delmember', api.delmember);
router.post('/exitgroup', api.exitgroup);
router.post('/deleteContact', api.deleteContact);
router.post('/sendmail', api.sendmail);
router.post('/signup', api.signup);


module.exports = router