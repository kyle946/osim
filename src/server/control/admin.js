var authenticator = require('authenticator');
const md5 = require('md5');
const common = require("./common");
const dbmysql = require("../plugins/dbmysql");


class adminController extends common {

    constructor() {
        super();
        this.test = this.test.bind(this);
        this.login = this.login.bind(this);
        this.verifylogin = this.verifylogin.bind(this);
        this.seallist = this.seallist.bind(this);
        this.companylist = this.companylist.bind(this);
        this.userlist = this.userlist.bind(this);
        this.jiebang = this.jiebang.bind(this);
        this.sealloglist = this.sealloglist.bind(this);
        this.sealinfo = this.sealinfo.bind(this);
        this.xufei = this.xufei.bind(this);
        this.modpwd = this.modpwd.bind(this);
        
    }

    async test(ctx) {

        try {
            var post = this.param(ctx);
            if (post == 0) return 0;

            var formattedKey = authenticator.generateKey();
            return this.response(ctx, { code: 200, formattedKey });

            //根据token取user_id
            // if (post.hasOwnProperty("token") == false) throw { code: 405, msg: '未传入 token' };
            // var user_id = await this.getuserid(post.token);
            // if (user_id == null) throw { code: 402, msg: 'token 无效或已经过期' };

        } catch (error) {
            var code = 500;
            var msg = 'error';
            if (typeof error == 'string') {
                code = 500;
                msg = error;
            } else if (typeof error == 'object') {
                code = error.code;
                msg = error.msg;
            }
            console.log(error);
            return this.response(ctx, { code, msg });
        }
    }

    async getuid(token) {
        var rkey = config.redis_pre + "admin_token2id_" + token;
        let uid = await new Promise((r, j) => {
            redisClient.get(rkey, (err, res) => {
                if (err) {
                    r(null);
                } else {
                    r(res);
                }
            });
        });
        return uid;
    }

    async verifylogin(ctx) {
        try {
            var post = this.verifySign(ctx);
            if (post == 0) return 0;
            let userinfo, code = 402;
            var rkey = config.redis_pre + "admin_token2id_" + post.token;
            let uid = await new Promise((r, j) => {
                redisClient.get(rkey, (err, res) => {
                    if (err) {
                        r(null);
                    } else {
                        r(res);
                    }
                });
            });
            if (uid) {
                var sql = "select * from admin_user where id=?";
                ctx.db = new dbmysql();
                userinfo = await ctx.db.findone(sql, [uid]);
                let expire = 86400;
                redisClient.expire(rkey, expire);
                code = 200;
                return this.response(ctx, { code, data: { userinfo, token: post.token, expire } });
            } else {
                return this.response(ctx, { code: 402 });
            }
        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    //续费
    async xufei(ctx) {
        try {
            var post = this.verifySign(ctx);
            if (post == 0) return 0;
            var uid = await this.getuid(post.token);
            if (!uid) {
                throw { code: 402, msg: "token无效" }
            }
            ctx.db = new dbmysql();

            if (post.hasOwnProperty("id") == false) throw { code: 405, msg: '未传入印章id' };
            if (post.hasOwnProperty("macaddr") == false) throw { code: 405, msg: '未传入印章地址' };
            if (post.hasOwnProperty("mima") == false) throw { code: 405, msg: '未传入操作密码' };
            if (post.hasOwnProperty("tianshu") == false) throw { code: 405, msg: '未传入天数' };
            if (post["macaddr"] == "") throw { code: 405, msg: '印章地址错误.' };
            if ( parseInt(post.id) <= 0 || parseInt(post.id) > 999999 ) throw { code: 405, msg: '参数错误' };
            if ( parseInt(post.tianshu) <= 0 || parseInt(post.tianshu) > 9999 ) throw { code: 405, msg: '参数错误' };

            //验证操作密码
            let adminuser = await ctx.db.findone("select id,mima from admin_user where id=?", [uid]);
            if(adminuser.mima!=post.mima){
                throw "操作密码错误！";
            }

            let seal = await ctx.db.findone("select id,macAddr,expireTime from seals where id=?", [post.id]);
            if (seal) {
                if (seal.macAddr == post.macaddr) {
                    let _sec = parseInt(post.tianshu) * 86400;
                    let expireTime = parseInt(seal.expireTime) + _sec;
                    let ret1 = await ctx.db.save({ expireTime, status: 1 }, "seals", "update", "id=" + post.id);
                    if(ret1.code==200){
                        return this.response(ctx, { code: 200 });
                    }
                    throw "修改失败！";
                }
            }
            throw "没有找到印章！";

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }


    //解绑
    async jiebang(ctx) {
        try {
            var post = this.verifySign(ctx);
            if (post == 0) return 0;
            var uid = await this.getuid(post.token);
            if (!uid) {
                throw { code: 402, msg: "token无效" }
            }
            ctx.db = new dbmysql();

            if (post.hasOwnProperty("id") == false) throw { code: 405, msg: '未传入印章id' };
            if (post.hasOwnProperty("macaddr") == false) throw { code: 405, msg: '未传入印章地址' };
            if (post.hasOwnProperty("mima") == false) throw { code: 405, msg: '未传入操作密码' };
            if (post["macaddr"] == "") throw { code: 405, msg: '印章地址错误.' };
            if (parseInt(post.id) <= 0) throw { code: 405, msg: '参数错误' };
            if (parseInt(post.id) > 999999) throw { code: 405, msg: '参数错误' };

            //验证操作密码
            let adminuser = await ctx.db.findone("select id,mima from admin_user where id=?", [uid]);
            if(adminuser.mima!=post.mima){
                throw "操作密码错误！";
            }

            let seal = await ctx.db.findone("select id,macAddr from seals where id=?", [post.id]);
            if (seal) {
                if (seal.macAddr == post.macaddr) {
                    let ret1 = await ctx.db.query("update seals set macAddr='',status=0 where id=?", [post.id]);
                    if(ret1){
                        return this.response(ctx, { code: 200 });
                    }
                    throw "修改失败！";
                }
            }
            throw "没有找到印章！";

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    


    //修改登录密码和操作密码
    async modpwd(ctx) {
        try {
            var post = this.verifySign(ctx);
            if (post == 0) return 0;
            var uid = await this.getuid(post.token);
            if (!uid) {
                throw { code: 402, msg: "token无效" }
            }
            ctx.db = new dbmysql();

            if (post.hasOwnProperty("mima1") == false) throw { code: 405, msg: '未传入旧密码' };
            if (post.hasOwnProperty("mima") == false) throw { code: 405, msg: '未传入新密码' };
            if (post.hasOwnProperty("modpwdtype") == false) throw { code: 405, msg: '未传入操作类型' };
            if (post.mima1=="") throw { code: 405, msg: '参数错误！' };
            if (post.mima=="") throw { code: 405, msg: '参数错误！' };

            //验证操作密码
            let adminuser = await ctx.db.findone("select id,passwd,mima from admin_user where id=?", [uid]);
            if(post.modpwdtype==1){
                if(adminuser.passwd!=md5(post.mima1)){
                    throw "原登录密码错误！";
                }
                let ret1 = await ctx.db.save({ passwd: md5(post.mima) }, "admin_user", "update", "id=" + uid);
                if(ret1.code==200){
                    return this.response(ctx, { code: 200 });
                }
                throw "修改失败！";
            }
            else if(post.modpwdtype==2){
                if(adminuser.mima!=post.mima1){
                    throw "原操作密码错误！";
                }
                let ret1 = await ctx.db.save({ mima: post.mima }, "admin_user", "update", "id=" + uid);
                if(ret1.code==200){
                    return this.response(ctx, { code: 200 });
                }
                throw "修改失败！";
            }

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    async login(ctx) {
        try {

            var post = this.verifySign(ctx);
            if (post == 0) return 0;

            if (post.hasOwnProperty("username") == false) throw { code: 405, msg: '未传入用户名' };
            if (post.hasOwnProperty("passwd") == false) throw { code: 405, msg: '未传入密码' };
            // if (post.hasOwnProperty("verifycode") == false) throw { code: 405, msg: '未传入 token' };

            let rule1 = new RegExp(/^[a-z0-9A-Z]{4,16}$/);
            if (rule1.test(post.username) == false) {
                throw { code: 405, msg: '请输入正确的登录账号.' };
            }

            let rule3 = new RegExp(/^.{4,16}$/);
            if (rule3.test(post.passwd) == false) {
                throw { code: 405, msg: '请输入6至16位字符的密码.' };
            }

            //谷歌 Google Authenticator 动态口令验证
            // var formattedKey = "ugel gcta 6rgq 4yok kztu zrnl deyi qwrz";
            // var authret = authenticator.verifyToken(formattedKey, post.verifycode);
            // if (!authret) {
            //     throw { code: 411, msg: "验证码不正确。" };
            // }

            ctx.db = new dbmysql();
            var sql = "select * from admin_user where username=?";
            var userinfo = await ctx.db.findone(sql, [post.username]);
            if (!userinfo) {
                throw { code: 503, msg: "无效用户" };
            }
            if (md5(post.passwd) != userinfo.passwd) {
                throw { code: 413, msg: "密码不正确." };
            }

            var d = new Date();
            var tokenstr = d.getTime() + '##' + userinfo.username + '##' + userinfo.id;
            var token = md5(tokenstr);
            let rtoken2id = config.redis_pre + "admin_token2id_" + token;
            // let rid2token = config.redis_pre + "admin_id2token_" + userinfo.id;

            // //如果原token还存在 ，则删除
            // let oldtoken = await redisClient.getsync(rid2token);
            // if (oldtoken) {
            //     redisClient.del(config.redis_pre + "admin_token2id_" + oldtoken);
            // }

            //保存token到redis，并延时
            let expire = 86400;
            redisClient.set(rtoken2id, userinfo.id);
            redisClient.expire(rtoken2id, expire);
            // redisClient.set(rid2token, token);
            // redisClient.expire(rid2token, expire);

            return this.response(ctx, { code: 200, msg: "success", data: { userinfo, token, expire } });

        } catch (error) {
            var code = 500;
            var msg = 'error';
            if (typeof error == 'string') {
                code = 500;
                msg = error;
            } else if (typeof error == 'object') {
                code = error.code;
                msg = error.msg;
            }
            console.log(error);
            return this.response(ctx, { code, msg });
        }
    }

    //印章
    async sealinfo(ctx) {
        try {
            var post = this.verifySign(ctx);
            if (post == 0) return 0;
            var uid = await this.getuid(post.token);
            if (!uid) {
                throw { code: 402, msg: "token无效" }
            }
            ctx.db = new dbmysql();
        
            if (post.hasOwnProperty("id") == false) throw { code: 405, msg: '未传入印章id' };

            let sql = `select s.*,c.name as company_name from seals s left join companys c on s.companyId=c.id where s.id=?`;
            let info = await ctx.db.findone(sql, [post.id]);
            let usenumjson =  await ctx.db.findone("select sum(num) as c from useSealLog where sealId=?", [post.id]);
            let data = {
                seal: info,
                usenum: usenumjson ? usenumjson.c : 0,
            }
            return this.response(ctx, { code: 200, data });

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    //印章列表
    async seallist(ctx) {
        try {
            var post = this.verifySign(ctx);
            if (post == 0) return 0;
            var uid = await this.getuid(post.token);
            if (!uid) {
                throw { code: 402, msg: "token无效" }
            }
            ctx.db = new dbmysql();

            //分页
            let pageSize = 20, page = 1, count = 0, pageCount = 1;
            if (post.hasOwnProperty("pageSize")) {
                pageSize = post.pageSize
            }
            if (post.hasOwnProperty("page")) {
                page = post.page
            }
            let pageSart = (page - 1) * pageSize
            let pageEnd = page * pageSize

            //判断搜索条件
            let where = "";
            if (post.hasOwnProperty("searchtext")) {
                if (post["searchtext"]) {
                    where += where != "" ? " and " : " where ";
                    where += ` (s.name like '%${post["searchtext"]}%') or (c.name like '%${post["searchtext"]}%') or (s.macAddr like '%${post["searchtext"]}%')`
                }
            }
            //过滤企业ID
            if(post.hasOwnProperty("companyId")){
                if(post["companyId"]){
                    where += where != "" ? " and " : " where ";
                    where += ` s.companyId='${post["companyId"]}' `;
                }
            }

            var list = [];
            let sql = `select s.*,c.name as company_name from seals s left join companys c on s.companyId=c.id ${where} order by id desc limit ${pageSart}, ${pageEnd}`;
            let res = await ctx.db.query(sql);
            if (res) {
                list = res;
            }
            let count1 = await ctx.db.findone(`select count(*) as c from seals s left join companys c on s.companyId=c.id ${where}`)
            count = count1.c

            pageCount = parseInt(count / pageSize);
            if (count % pageSize > 0) pageCount++;
            return this.response(ctx, { code: 200, data: list, count, page, pageSize, pageCount });

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    //企业列表
    async companylist(ctx) {
        try {
            var post = this.verifySign(ctx);
            if (post == 0) return 0;
            var uid = await this.getuid(post.token);
            if (!uid) {
                throw { code: 402, msg: "token无效" }
            }
            ctx.db = new dbmysql();

            //分页
            let pageSize = 20, page = 1, count = 0, pageCount = 1;
            if (post.hasOwnProperty("pageSize")) {
                pageSize = post.pageSize
            }
            if (post.hasOwnProperty("page")) {
                page = post.page
            }
            let pageSart = (page - 1) * pageSize
            let pageEnd = page * pageSize

            //判断搜索条件
            let where = "";
            if (post.hasOwnProperty("searchtext")) {
                if (post["searchtext"]) {
                    where += where != "" ? " and " : " where ";
                    where += ` c.name like '%${post["searchtext"]}%' `
                }
            }
            //过滤用户ID
            if(post.hasOwnProperty("uid")){
                if(post["uid"]){
                    where += where != "" ? " and " : " where ";
                    where += ` c.uid='${post["uid"]}' `;
                }
            }

            var list = [];
            let sql = `select c.*,u.nickname,u.mobile from companys c left join users u on c.uid=u.id ${where} order by id desc limit ${pageSart}, ${pageEnd}`;
            let res = await ctx.db.query(sql);
            if (res) {
                list = res;
            }
            let count1 = await ctx.db.findone(`select count(*) as c from companys c left join users u on c.uid=u.id ${where}`)
            count = count1.c

            pageCount = parseInt(count / pageSize);
            if (count % pageSize > 0) pageCount++;
            return this.response(ctx, { code: 200, data: list, count, page, pageSize, pageCount });

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    //用户列表
    async userlist(ctx) {
        try {
            var post = this.verifySign(ctx);
            if (post == 0) return 0;
            var uid = await this.getuid(post.token);
            if (!uid) {
                throw { code: 402, msg: "token无效" }
            }
            ctx.db = new dbmysql();

            //分页
            let pageSize = 20, page = 1, count = 0, pageCount = 1;
            if (post.hasOwnProperty("pageSize")) {
                pageSize = post.pageSize
            }
            if (post.hasOwnProperty("page")) {
                page = post.page
            }
            let pageSart = (page - 1) * pageSize
            let pageEnd = page * pageSize

            //判断搜索条件
            let where = "";
            if (post.hasOwnProperty("searchtext")) {
                if (post["searchtext"]) {
                    where += where != "" ? " and " : " where ";
                    where += ` (u.nickname like '%${post["searchtext"]}%') or (u.mobile like '%${post["searchtext"]}%') `
                }
            }
            //过滤企业ID
            if(post.hasOwnProperty("companyId")){
                if(post["companyId"]){
                    where += where != "" ? " and " : " where ";
                    where += ` u.companyId='${post["companyId"]}' `;
                }
            }

            var list = [];
            let sql = `select u.* from users u ${where} order by id desc limit ${pageSart}, ${pageEnd}`;
            let res = await ctx.db.query(sql);
            if (res) {
                list = res;
            }
            let count1 = await ctx.db.findone(`select count(*) as c from users u ${where}`)
            count = count1.c

            pageCount = parseInt(count / pageSize);
            if (count % pageSize > 0) pageCount++;
            return this.response(ctx, { code: 200, data: list, count, page, pageSize, pageCount });

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }

    

    //盖章记录列表
    async sealloglist(ctx) {
        try {
            var post = this.verifySign(ctx);
            if (post == 0) return 0;
            var uid = await this.getuid(post.token);
            if (!uid) {
                throw { code: 402, msg: "token无效" }
            }
            ctx.db = new dbmysql();

            //分页
            let pageSize = 20, page = 1, count = 0, pageCount = 1;
            if (post.hasOwnProperty("pageSize")) {
                pageSize = post.pageSize
            }
            if (post.hasOwnProperty("page")) {
                page = post.page
            }
            let pageSart = (page - 1) * pageSize
            let pageEnd = page * pageSize

            //判断搜索条件: 企业名称、印章名称、盖章的文件名
            let where = "";
            if (post.hasOwnProperty("searchtext")) {
                if (post["searchtext"]) {
                    where += where != "" ? " and " : " where ";
                    where += ` (u.sealName like '%${post["searchtext"]}%') or (u.companyName like '%${post["searchtext"]}%') or (u.fileName like '%${post["searchtext"]}%') `
                }
            }
            //过滤企业ID
            if(post.hasOwnProperty("companyId")){
                if(post["companyId"]){
                    where += where != "" ? " and " : " where ";
                    where += ` u.companyId='${post["companyId"]}' `;
                }
            }
            //过滤印章ID
            if(post.hasOwnProperty("sealId")){
                if(post["sealId"]){
                    where += where != "" ? " and " : " where ";
                    where += ` u.sealId='${post["sealId"]}' `;
                }
            }

            var list = [];
            let sql = `select u.* from useSealLog u ${where} order by id desc limit ${pageSart}, ${pageEnd}`;
            let res = await ctx.db.query(sql);
            if (res) {
                list = res;
            }
            let count1 = await ctx.db.findone(`select count(*) as c from useSealLog u ${where}`)
            count = count1.c

            pageCount = parseInt(count / pageSize);
            if (count % pageSize > 0) pageCount++;
            return this.response(ctx, { code: 200, data: list, count, page, pageSize, pageCount });

        } catch (error) {
            return this.response(ctx, error, false);
        }
    }


}

module.exports = new adminController();