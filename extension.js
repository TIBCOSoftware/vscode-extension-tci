/*
 * Copyright © 2017. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

/* eslint-disable max-len */

/**
 * Requires
 */
const tcitools = require('./src/tcitools');
const path = require('path');
const vscode = require('vscode');

/**
 * This method is called when the extension is activated
 * The extension is activated the very first time the command is executed
 * @param {Context} context
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand(
        'tci.cmdCheckInstallationStatus', cmdCheckInstallationStatus);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
        'tci.cmdLaunchAPIModeler', cmdLaunchAPIModeler);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
        'tci.cmdLaunchTIBCOCommunity', cmdLaunchTIBCOCommunity);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
        'tci.cmdLaunchTCIDocs', cmdLaunchTCIDocs);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
        'tci.cmdCreateZip', cmdCreateZip);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
        'tci.cmdCreateApp', cmdCreateApp);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
        'tci.cmdPushApp', cmdPushApp);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
        'tci.cmdRunApp', cmdRunApp);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
        'tci.cmdAddProperty', cmdAddProperty);

    context.subscriptions.push(disposable);
}

/**
 * This method is called to check the existence of tibcli
 */
function cmdCheckInstallationStatus() {
    if (tcitools.checkTibcli(vscode.workspace.getConfiguration('tci').get('tibcli'))) {
        vscode.window.showInformationMessage('tibcli was found on your system. You\'re ready to go!');
    } else {
        let messageItems = ['tibcli was not found, check the docs for instructions'];
        messageItems.push('Open docs');
        vscode.window.showErrorMessage.apply(this, messageItems).then(function(value) { // eslint-disable-line no-invalid-this
            if (value == 'Open docs') {
                tcitools.openBrowser('tooldocs');
            }
        });
    }
}

/**
 * This method is called to open API Modeler in a web browser
 */
function cmdLaunchAPIModeler() {
    let region = vscode.workspace.getConfiguration('tci').get('region');
    tcitools.openBrowser('apimodeler', region);
}

/**
* This method is called to open TIBCO Community in a web browser
*/
function cmdLaunchTIBCOCommunity() {
    let region = vscode.workspace.getConfiguration('tci').get('region');
    tcitools.openBrowser('community', region);
}

/**
* This method is called to open the TCI docs in a web browser
*/
function cmdLaunchTCIDocs() {
    let region = vscode.workspace.getConfiguration('tci').get('region');
    tcitools.openBrowser('tcidocs', region);
}

/**
* This method is called to create a zip file to push to TCI
*/
function cmdCreateZip() {
    if (vscode.workspace.rootPath == undefined) {
        vscode.window.showErrorMessage('To create zip files, you need to open a folder first');
    } else {
        tcitools.createZip(vscode.workspace.rootPath);
    }
}

/**
* This method is called to create a new app in VSCode
*/
function cmdCreateApp() {
    if (vscode.workspace.rootPath == undefined) {
        vscode.window.showErrorMessage('To create a new app, you need to open a folder first');
    } else {
        vscode.window.showInputBox({
            prompt: 'Enter the name and version of your new Node.js app.',
            placeHolder: 'myApp 1.0.0',
        }).then((appdetails) => {
            if (appdetails.split(' ').length < 2) {
                vscode.window.showErrorMessage(`(${appdetails}) is not a valid name and version`);
            } else {
                let details = appdetails.split(' ');
                tcitools.createNewApp(details[0], details[1], vscode.workspace.rootPath, function() {
                    vscode.workspace.openTextDocument(path.join(vscode.workspace.rootPath, details[0], 'server.js')).then((document) => {
                        vscode.window.showTextDocument(document);
                    });
                });
            }
        });
    }
}

/**
* This method is called to push an app to TCI using tibcli
*/
function cmdPushApp() {
    if (tcitools.checkTibcli(vscode.workspace.getConfiguration('tci').get('tibcli'))) {
        tcitools.pushApp(vscode.workspace.rootPath, vscode.workspace.getConfiguration('tci').get('tibcli'));
    } else {
        let messageItems = ['tibcli was not found, check the docs for instructions'];
        messageItems.push('Open docs');
        vscode.window.showErrorMessage.apply(this, messageItems).then(function(value) { // eslint-disable-line no-invalid-this
            if (value == 'Open docs') {
                tcitools.openBrowser('tooldocs');
            }
        });
    }
}

/**
* This method is called to run an app locally
*/
function cmdRunApp() {
    if (vscode.workspace.rootPath == undefined) {
        vscode.window.showErrorMessage('To run an app, you need to open a folder first');
    } else {
        tcitools.runApp(vscode.workspace.rootPath);
    }
}

/**
* This method is called to add an environment variable to the manifest
*/
function cmdAddProperty() {
    vscode.window.showInputBox({
        prompt: 'Please enter the name, type and default value of your new Env var.',
        placeHolder: 'DB_USER string admin',
    }).then((vardetails) => {
        if (vardetails.split(' ').length < 3) {
            vscode.window.showErrorMessage(`(${vardetails}) is not a valid name, type and default value.`);
            return;
        } else {
            let details = vardetails.split(' ');
            tcitools.updateManifestVariables(null, details[0], details[1], details[2], vscode.workspace.rootPath);
        }
    });
}

/**
 * This method is called when the extension is deactivated
 */
function deactivate() {}

/**
 * Exports
 */
exports.activate = activate;
exports.deactivate = deactivate;
