
const mysql = require("mysql");
const config = require("../config");

class dbmysql {


    constructor() {
        this.conn = {};
        
        this.connect = this.connect.bind(this);
        this.close = this.close.bind(this);
        this.query = this.query.bind(this);
        this.findone = this.findone.bind(this);
        this.save = this.save.bind(this);

        //
        this.connect();
    }

    
    connect(dbname = "db1") {
        let cc = config[dbname];
        let options = {
            host: cc.host,
            user: cc.user,
            port: cc.port,
            password: cc.pwd,
            database: cc.name,
            dateStrings: true,
            stringifyObjects: true
        }
        this.conn = mysql.createConnection(options);
        this.conn.connect();
        console.log('Mysql: Connection %d acquired', this.conn.threadId);
    }


    close(){
        console.log('Mysql: Connection %d released', this.conn.threadId);
        this.conn.end();
    }


    /**
     * 
     * @param {*} sql   查询语句 
     * @param {*} value     占位符的值
     */
    async query(sql, value = []) {
        var res = await new Promise( (r, j) => {
            this.conn.query(sql, value, (error, result, fields) => {
                if (error) {
                    console.log('mysql error', error);
                    return r(null);
                }else{
                    return r(result);
                }
            });
        });
        return res;
    }


    /**
     * 
     * @param {*} sql   查询语句 
     * @param {*} value     占位符的值
     */
    async findone(sql, value = []) {
        let res = await this.query(sql, value);
        if (res) {
            if (Array.isArray(res)) {
                if (res.length > 0) {
                    return res[0];
                }
            }
        }
        return null;
    }


    /**
     * 数据库 insert 和 update 操作
     * 
     * 
     *  插入演示：
     *  var data = { config_label: "test", config_name: '测试', config_val: 'test' };
     *  var ret = await this.save(data, "sysconfig", "insert");
     * 
     *  更新演示：
     *  var data = {config_name: '测试222'};
     *  var where = "\`config_label\`='test'";
     *  var ret = await this.save(data, "sysconfig", "update", where);
     * 
     * @param {*} data 
     * @param {*} table 
     * @param {*} act 
     * @param {*} where 
     */
     async save(data = [], table = null, act = 'insert', where = null) {
        var code = 400;
        var msg = 'error';
        /*
        if(Array.isArray(data)==false){
            msg="data error";
            return {code,msg};
        }*/
        if (typeof data != 'object') {
            msg = "data error";
            return { code, msg };
        }
        if (table == null) {
            msg = "table error";
            return { code, msg };
        }

        if (act == 'insert') {
            var field = [];
            var value = [];
            for (let x in data) {
                if (x == "" || data[x] == "") {
                    continue;
                }
                field.push(x);
                value.push(data[x]);
            }

            var sql = `insert into \`${table}\` (??) values (?)`;
            var ret = await this.query(sql, [field, value]);

            if (ret && typeof ret == 'object') {
                if(ret.hasOwnProperty('affectedRows')){
                    if (ret['affectedRows'] == 1) {
                        let insertId = ret['insertId'];
                        code = 200;
                        msg = 'success';
                        return { code, msg, insertId };
                    }
                }
            }
        }
        else if (act == 'update') {
            if (where == null) {
                msg = 'where error!';
                return { code, msg };
            }

            var field = "";
            var value = [];
            for (let x in data) {
                if (x == "") {
                    continue;
                }
                field = field + x + ' = ? ,';
                value.push(data[x]);
            }
            field = field.substr(0, field.length - 1);

            var sql = `update \`${table}\` set ${field} where ${where}`;
            var ret = await this.query(sql, value);
            if (typeof ret == "object") {
                if (ret["changedRows"] > 0) {
                    code = 200;
                    msg = 'success';
                    return { code, msg };
                }
            }
            // msg = sql
        }
        return { code, msg };
    }
}

module.exports = dbmysql;