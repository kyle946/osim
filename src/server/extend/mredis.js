
const redis = require("redis");
const config = require("../config");


class mredis {

    constructor() {
        this.pre = "";
        this.client = null;
        this.connect();
    }

    connect() {
        let cc = config["rd1"]
        this.pre = cc.pre
        this.client = redis.createClient(cc.port, cc.host)
        // this.client.auth(cc.pwd);
    }

    close() {
        this.client.end();
    }


    async setex(key, sec, val) {
        key = this.pre + key
        await this.client.sendCommand("setex", [key, sec, val])
    }

    async set(key, val) {
        key = this.pre + key
        await this.client.sendCommand("set", [key, val])
    }

    async incrby(key, val) {
        key = this.pre + key
        await this.client.sendCommand("incrby", [key, val])
    }

    get(key) {
        key = this.pre + key
        return new Promise((r, j) => {
            this.client.sendCommand("get", [key], (err, res) => {
                r(res)
            })
        })
    }

    async del(key) {
        let arr = []
        if (Array.isArray(key)) {
            arr = key.map(value => {
                return this.pre + value
            })
        } else {
            key = this.pre + key
            arr.push(key)
        }
        await this.client.sendCommand("del", arr)
    }

    async expire(key, sec) {
        key = this.pre + key
        await this.client.sendCommand("expire", [key, sec])
    }

    exists(key) {
        key = this.pre + key
        return new Promise((r, j) => {
            this.client.sendCommand("exists", [key], (err, res) => {
                r(res)
            })
        })
    }

    hget(key, field) {
        key = this.pre + key
        return new Promise((r, j) => {
            this.client.sendCommand("hget", [key, field], (err, res) => {
                r(res)
            })
        })
    }

    hset(key, field, val) {
        key = this.pre + key
        return new Promise((r, j) => {
            this.client.sendCommand("hset", [key, field, val], (err, res) => {
                r(res)
            })
        })
    }

    async hmset(key, obj) {
        key = this.pre + key
        let arr = [key]
        for (let x in obj) {
            const el = obj[x]
            arr.push(x)
            arr.push(el)
        }
        await this.client.sendCommand("hmset", arr)
    }

    hexists(key, field) {
        key = this.pre + key
        return new Promise((r, j) => {
            this.client.sendCommand("hexists", [key, field], (err, res) => {
                r(res)
            })
        })
    }

    async lpush(key, cmd) {
        key = this.pre + key
        let arr = [key].concat(cmd)
        await this.client.sendCommand("lpush", arr)
    }

    async rpush(key, cmd) {
        key = this.pre + key
        let arr = [key].concat(cmd)
        await this.client.sendCommand("rpush", arr)
    }


    lrange(key, start = 0, end = -1) {
        key = this.pre + key
        return new Promise((r, j) => {
            this.client.sendCommand("lrange", [key, start, end], (err, res) => {
                r(res)
            })
        })
    }

    lrem(key, val) {
        key = this.pre + key
        return new Promise((r, j) => {
            this.client.sendCommand("lrem", [key, 0, val], (err, res) => {
                r(res)
            })
        })
    }

    llen(key) {
        key = this.pre + key
        return new Promise((r, j) => {
            this.client.sendCommand("llen", [key], (err, res) => {
                r(res)
            })
        })
    }


    ltrim(key, start = 0, end = 0) {
        key = this.pre + key
        return new Promise((r, j) => {
            this.client.sendCommand("ltrim", [key, start, end], (err, res) => {
                r(res)
            })
        })
    }

    async sort(key, cmd) {
        key = this.pre + key
        let arr = [key].concat(cmd)
        // console.log("sort", arr)
        return new Promise((r, j) => {
            this.client.sendCommand("sort", arr, (err, res) => {
                r(res)
            })
        })
    }

}


module.exports = mredis;