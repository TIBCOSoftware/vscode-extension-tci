/*
Copyright © 2017. TIBCO Software Inc.
This file is subject to the license terms contained
in the license file that is distributed with this file.
*/
var vscode = require('vscode');
var fs = require('fs');

var foundTibcli = false;

const tciDocumentationURL = 'https://integration.cloud.tibco.com/docs/index.html';
const tciCommunityURL = 'https://community.tibco.com/products/tibco-cloud-integration';
const tciAPIModelerURL = 'https://integration.cloud.tibco.com/apispecs';
const tciToolsDocumentationURL = 'https://github.com/TIBCOSoftware/tci-samples/'

function activate(context) {
    var terminal = vscode.window.createTerminal('tci-tools');
    var statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

    registerCommands();

    function registerCommands() {
        var disposable = vscode.commands.registerCommand('tci.checkInstallationStatus', function () {
            checkInstallationStatus(true);
        });

        var disposable = vscode.commands.registerCommand('tci.generateDeploymentArtifacts', function () {
            generateDeploymentArtifacts();
        });

        var disposable = vscode.commands.registerCommand('tci.pushNodejsApp', function () {
            generateDeploymentArtifacts(true);
        });

        var disposable = vscode.commands.registerCommand('tci.launchAPIModeler', function () {
            launchBrowserWithURL(tciAPIModelerURL);
        });

        var disposable = vscode.commands.registerCommand('tci.launchNodeAppLocally', function () {
            launchNodeAppLocally();
        });

        var disposable = vscode.commands.registerCommand('tci.launchTIBCOCommunity', function () {
            launchBrowserWithURL(tciCommunityURL);
        });

        var disposable = vscode.commands.registerCommand('tci.launchTCIDocs', function () {
            launchBrowserWithURL(tciDocumentationURL);
        });

        context.subscriptions.push(disposable);
    }

    function launchBrowserWithURL(url) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
    }

    function launchNodeAppLocally() {
        var workspaceFolder = vscode.workspace.rootPath;

        if (workspaceFolder == null) {
            vscode.window.showInformationMessage('To start a Node.js app locally you need to select a folder in Visual Studio Code (this is the folder that contains your server.js file)');
            return;
        }

        terminal.show(true);
        terminal.sendText('npm install', true);
        terminal.sendText('node .', true);
    }

    function checkInstallationStatus(showSuccessMessage) {
        statusBarItem.text = "Checking if tibcli exists...";
        statusBarItem.show();

        var tibcli = vscode.workspace.getConfiguration('tci').get('tibcli');

        if (tibcli == null) {
            var messageItems = ['The tibcli location is not set, visit ' + tciToolsDocumentationURL + ' for instructions']
            messageItems.push('Open in browser');
            vscode.window.showInformationMessage.apply(this, messageItems).then(function (value) {
                if (value == 'Open in browser') {
                    launchBrowserWithURL(tciToolsDocumentationURL);
                } else {
                    disposeStatusbar();
                }
            });
            setTibcliFound(false);
            return false;
        }

        var tibcliExists = fs.existsSync(tibcli);

        if (!tibcliExists) {
            var messageItems = ['tibcli doesn\'t exist or isn\'t accessible, visit ' + tciToolsDocumentationURL + ' for instructions']
            messageItems.push('Open in browser');
            vscode.window.showInformationMessage.apply(this, messageItems).then(function (value) {
                if (value == 'Open in browser') {
                    launchBrowserWithURL(tciToolsDocumentationURL);
                } else {
                    disposeStatusbar();
                }
            });
            setTibcliFound(false);
            return false;
        } else {
            setTibcliFound(true);
            var messageItems = ['tibcli was found on your system. You\'re ready to go!']
            if (showSuccessMessage) {
                vscode.window.showInformationMessage.apply(this, messageItems).then(function () {
                    disposeStatusbar();
                });
            }
            return true;
        }
    }

    function generateDeploymentArtifacts(pushOnSuccess) {
        if (!isTibcliFound()) {
            var isTibcliNowFound = checkInstallationStatus();
            if (!isTibcliNowFound) {
                return;
            }
        }

        var workspaceFolder = vscode.workspace.rootPath;

        if (workspaceFolder == null) {
            vscode.window.showInformationMessage('To push an app to TCI you need to select a folder in Visual Studio Code');
            return;
        }

        if (/^win/.test(process.platform)) {

            var parentFolder = workspaceFolder.substring(0, workspaceFolder.lastIndexOf('\\'));
            var tibcli = vscode.workspace.getConfiguration('tci').get('tibcli');

            terminal.show(true);
            terminal.sendText('New-Item -Path ' + parentFolder + ' -Name "deployment" -ItemType "directory" | Out-Null', true);
            terminal.sendText('Copy-Item ../manifest.json ../deployment | Out-Null', true);
            terminal.sendText('Get-ChildItem . | where { $_.Name -notin "node_modules"} | Compress-Archive -DestinationPath ../deployment/app.zip -Force | Out-Null', true);
            terminal.sendText('cd ../deployment', true);

            if (pushOnSuccess) {
                terminal.sendText(tibcli + ' app push', true);
            } else {
                var messageItems = ['Your deployment artifacts have been built... open file location?']
                messageItems.push('Yes');
                vscode.window.showInformationMessage.apply(this, messageItems).then(function (value) {
                    if (value == 'Yes') {
                        terminal.sendText('Invoke-Item ' + parentFolder + '\\deployment', true);
                    }
                });
            }
        } else if (/^darwin/.test(process.platform)) {

            var parentFolder = workspaceFolder.substring(0, workspaceFolder.lastIndexOf('/'));
            var tibcli = vscode.workspace.getConfiguration('tci').get('tibcli');

            terminal.show(true);
            terminal.sendText('mkdir -p ' + parentFolder + '/deployment', true);
            terminal.sendText('cp ../manifest.json ../deployment', true);
            terminal.sendText('zip -r -X ../deployment/app.zip . -x "node_modules"', true);
            terminal.sendText('cd ../deployment', true);

            if (pushOnSuccess) {
                terminal.sendText(tibcli + ' app push', true);
            } else {
                var messageItems = ['Your deployment artifacts have been built... open file location?']
                messageItems.push('Yes');
                vscode.window.showInformationMessage.apply(this, messageItems).then(function (value) {
                    if (value == 'Yes') {
                        //terminal.sendText('Invoke-Item ' + parentFolder + '\\deployment',true);
                        terminal.sendText('open .', true);
                    }
                });
            }
        } else {
            vscode.window.showErrorMessage('This command is not supported on ' + process.platform);
        }
    }

    function disposeStatusbar() {
        statusBarItem.hide();
    }

    function setTibcliFound(found) {
        foundTibcli = found;
    }

    function isTibcliFound() {
        return foundTibcli;
    }
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;