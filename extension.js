/*
 * Copyright © 2017. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

/* eslint-disable max-len */
/* eslint-disable no-invalid-this */

/**
 * Dependencies needed to run this extension
 */
const vscode = require('vscode');
const tools = require('./src/tci-tools');

/**
 * This method is called when the extension is activated
 * The extension is activated the very first time the command is executed
 * @param {Context} context 
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('tci.cmdCheckInstallationStatus', cmdCheckInstallationStatus);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('tci.cmdCheckExtensionVersion', cmdCheckExtensionVersion);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('tci.cmdLaunchAPIModeler', cmdLaunchAPIModeler);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('tci.cmdLaunchTIBCOCommunity', cmdLaunchTIBCOCommunity);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('tci.cmdLaunchTCIDocs', cmdLaunchTCIDocs);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('tci.cmdCreateDeploymentArtifacts', cmdCreateDeploymentArtifacts);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('tci.cmdCreateNodejsApp', cmdCreateNodejsApp);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('tci.cmdPushNodejsApp', cmdPushNodejsApp);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('tci.cmdRunNodeApp', cmdRunNodeApp);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('tci.cmdAddPropertyToManifest', cmdAddPropertyToManifest);
    context.subscriptions.push(disposable);
}

/**
 * UI handler for cmdCheckInstallationStatus
 */
function cmdCheckInstallationStatus() {
    if (tools.checkTibcliExists(vscode.workspace.getConfiguration('tci').get('tibcli'))) {
        vscode.window.showInformationMessage('tibcli was found on your system. You\'re ready to go!');
    } else {
        let messageItems = ['The tibcli location is not set or tibcli doesn\'t exist, visit ' + tools.urls.toolsDocs + ' for instructions'];
        messageItems.push('Open in browser');
        vscode.window.showErrorMessage.apply(this, messageItems).then(function(value) {
            if (value == 'Open in browser') {
                tools.launchBrowserWithUrl(tools.urls.toolsDocs);
            }
        });
    }
}

/**
 * UI handler for cmdCheckExtensionVersion
 */
function cmdCheckExtensionVersion() {
    vscode.window.showInformationMessage(`You\'re running version ${tools.extension.version} of ${tools.extension.publisher}.${tools.extension.name}`);
}

/**
 * UI handler for cmdLaunchAPIModeler
 */
function cmdLaunchAPIModeler() {
    tools.launchBrowserWithUrl(tools.urls.apiModeler);
}

/**
 * UI handler for cmdLaunchTIBCOCommunity
 */
function cmdLaunchTIBCOCommunity() {
    tools.launchBrowserWithUrl(tools.urls.tciCommunity);
}

/**
 * UI handler for cmdLaunchTCIDocs
 */
function cmdLaunchTCIDocs() {
    tools.launchBrowserWithUrl(tools.urls.tciDocs);
}

/**
 * UI handler for cmdCreateDeploymentArtifacts
 */
function cmdCreateDeploymentArtifacts() {
    tools.createDeploymentArtifacts(vscode.workspace.rootPath);
}

/**
 * UI handler for cmdCreateNodejsApp
 */
function cmdCreateNodejsApp() {
    vscode.window.showInputBox({
        prompt: 'Please enter the name and version of your new Node.js app.',
        placeHolder: 'myApp 1.0.0',
    }).then((appdetails) => {
        if (appdetails.split(' ').length != 2) {
            vscode.window.showErrorMessage(appdetails + ' is not a valid name and version.');
            return;
        } else {
            let details = appdetails.split(' ');
            tools.createNewNodejsApp(details[0], details[1], vscode.workspace.rootPath, function() {
                vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/' + details[0] + '/server.js').then((document) => {
                    vscode.window.showTextDocument(document);
                });
            });
        }
    });
}

/**
 * UI handler for cmdPushNodejsApp
 */
function cmdPushNodejsApp() {
    if (tools.checkTibcliExists(vscode.workspace.getConfiguration('tci').get('tibcli'))) {
        tools.pushNodejsApp(vscode.workspace.rootPath, vscode.workspace.getConfiguration('tci').get('tibcli'));
    } else {
        let messageItems = ['The tibcli location is not set or tibcli doesn\'t exist, visit ' + tools.urls.toolsDocs + ' for instructions'];
        messageItems.push('Open in browser');
        vscode.window.showErrorMessage.apply(this, messageItems).then(function(value) {
            if (value == 'Open in browser') {
                tools.launchBrowserWithUrl(tools.urls.toolsDocs);
            }
        });
    }
}

/**
 * UI handler for cmdRunNodeApp
 */
function cmdRunNodeApp() {
    tools.runNodeApp(vscode.workspace.rootPath);
}

/**
 * UI handler for cmdAddPropertyToManifest
 */
function cmdAddPropertyToManifest() {
    vscode.window.showInputBox({
        prompt: 'Please enter the name, type and default value of your new Env var.',
        placeHolder: 'DB_USER string',
    }).then((vardetails) => {
        if (vardetails.split(' ').length != 3) {
            vscode.window.showErrorMessage(vardetails + ' is not a valid name, type and default value.');
            return;
        } else {
            let details = vardetails.split(' ');
            tools.addPropertyToManifest(details[0], details[1], details[2], vscode.workspace.rootPath);
        }
    });
}

/**
 * This method is called when the extension is deactivated
 */
function deactivate() {

}

/**
 * Exports
 */
exports.activate = activate;
exports.deactivate = deactivate;
