// path 与 fs 是 node 环境自带不需要通过 npm 安装
const path = require('path')
const fs = require('fs')

// 获取项目根目录路径
const appDirectory = fs.realpathSync(path.resolve(__dirname, '../'))
// 获取目标文件的函数
const resolveApp = relativePath => path.resolve(appDirectory, relativePath)

module.exports = {
  DevMode: 'development',    // development,  production
  appPath: resolveApp('.'),
  appRender: resolveApp('src'),
  appDist: resolveApp('dist'),
  appIndexJs: resolveApp('src/index.js'),
  appIndexHtml: resolveApp('src/index.html'),
  resolveApp
}