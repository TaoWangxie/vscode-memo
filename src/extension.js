
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	require('./memo')(context); // memo

}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
