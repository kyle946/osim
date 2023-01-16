const http = require('http')
const Koa = require('koa')
const logger = require('koa-logger')
const json = require('koa-json')
const cors = require('koa2-cors')
const views = require('koa-views')
const mredis = require("./extend/mredis")
const sockser = require("./control/sockser")
const config = require("./config")


//设置时区
process.env.TZ = 'Asia/Shanghai'
global.rd = new mredis();
//从命令行获取启动参数，如：nodejs indexjs 8383
// var args = process.argv.splice(2);
// global.ser_port = args[0];


//----step----  加载koa2
const app = new Koa()
const bodyparser = require('koa-body')
// const bodyparser = require('koa-bodyparser')
app.use(bodyparser({ multipart: true, formLimit: '100mb', jsonLimit: '100mb' }));
app.use(logger())
app.use(json())
app.use(cors());
const httpServer = http.createServer(app.callback())
let socketIo = require("socket.io")
global.io = new socketIo.Server(httpServer, {
    path: "/osim/socket.io",
    cors:{
        origin: "*"
    }
})
io.on("connection", sockser.connection)
const apiroute = require('./extend/apiroute')
app.use(apiroute.routes(), apiroute.allowedMethods())
app.use(require('koa-static')(__dirname + '/public'))
//----step----  error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});
//----step----  logger
app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})
httpServer.listen(config["port"])
