const path = require('path')
const fs = require('fs')
const webpack = require("webpack");

// 获取项目根目录路径
const appDirectory = fs.realpathSync(path.resolve(__dirname, './'))
// 获取目标文件的函数
const resolveApp = relativePath => path.resolve(appDirectory, relativePath)

module.exports = {
    // mode: "production",        //  development,  production
    entry: resolveApp("src/index.js"),
    target: 'electron-main',
    node: {
        __dirname: false,
    },
    output: {
        filename: 'main.js',
        libraryTarget: 'commonjs2',
        path: resolveApp("resources")
    },
    externals: ['ffi-napi', 'ref-napi', 'ref-array-napi', 'ref-struct-napi', "main1"],
    externals: {
        'ffi-napi': require("ffi-napi"),
        'main1': require("main1")
    },
    externals: {
        'ffi-napi': "commonjs ffi-napi",
        'main1': "commonjs main1"
    },
    plugins: [
        new webpack.ExternalsPlugin("commonjs", ["ffi-napi"]),
        new webpack.ExternalsPlugin("commonjs", ["main1"])
    ],
    devtool: 'inline-source-map',
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        // alias: {
        //     '@src': paths.appSrc,
        //     '@main': paths.resolveApp("src/main")
        // },
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            }
        ]
    }
}

//代码混淆
if (process.env.NODE_ENV === 'production') {
    module.exports.plugins = (module.exports.plugins || []).concat([new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        compress: false
    })]);
}