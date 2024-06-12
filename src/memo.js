const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('./util');

/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
function getWebViewContent(context, templatePath) {
    const resourcePath = util.getExtensionFileAbsolutePath(context, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
    // resource="local" 区分 针对引用本地的资源特殊处理
    html = html.replace(/(<link.+?resource="local" href="|<script.+?resource="local" src="|<img.+?resource="local" src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });
    return html;
}



/**
 * 读取文件内容
 * @param {*} absolutePath 文件绝对路径
 */
function readFile(absolutePath) {
    try {
        let data = fs.readFileSync(absolutePath, 'utf-8');
        return data
    } catch (err) {
        console.log("err: 读取本地文件失败")
        return false
    }
}

const messageHandler = {

}

module.exports = function (context) {
    context.subscriptions.push(vscode.commands.registerCommand('WTool.memo', function (uri) {
        //读取codeFile文件信息
        const panel = vscode.window.createWebviewPanel( //创建WebView
            'memo', // viewType
            "📜 备忘录", // 视图标题
            vscode.ViewColumn.Two, // 显示在编辑器的哪个部位
            {
                enableScripts: true, // 启用JS，默认禁用
                retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
            }
        );
        let readInfo = readFile('/Users/wangtao/Documents/localConfig/memo.json')
        let fileInfo = []
        if (readInfo && eval('(' + readInfo + ')').length > 0) {
            fileInfo = eval('(' + readInfo + ')')
        }
        panel.webview.html = getWebViewContent(context, 'src/view/index.html');
        panel.webview.postMessage({
            cmd: 'getInfo',
            data: fileInfo
        });
        panel.webview.onDidReceiveMessage(message => {
            console.log('插件收到的消息：', message);
            if (messageHandler[message.cmd]) {
                messageHandler[message.cmd](panel, uri, message);
            } else {
                util.showError(`未找到名为 ${message.cmd} 回调方法!`);
            }
        }, undefined, context.subscriptions);
    }));
};