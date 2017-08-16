/*
 * Copyright © 2017. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

// Dependencies
var vscode = require('vscode');
var fs = require('fs');

// URLs
const tciDocumentationURL = 'https://integration.cloud.tibco.com/docs/index.html';
const tciCommunityURL = 'https://community.tibco.com/products/tibco-cloud-integration';
const tciAPIModelerURL = 'https://integration.cloud.tibco.com/apispecs';
const tciToolsDocumentationURL = 'https://github.com/TIBCOSoftware/vscode-extension-tci'

// Constants
const extensionVendor = 'retgits'
const extensionName = 'tci-tools'

// Variables
var tibcliFound = false;

function activate(context) {
    var terminal = vscode.window.createTerminal('tci-tools');
    var statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

    registerCommands();

    /**
     * Registers all commands in VSCode
     */
    function registerCommands() {
        var disposable = vscode.commands.registerCommand('tci.createDeploymentArtifacts', cmdCreateDeploymentArtifacts);
        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('tci.createNodejsApp', cmdCreateNodejsApp);
        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('tci.pushNodejsApp', cmdPushNodeApp);
        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('tci.launchAPIModeler', cmdLaunchAPIModelerURL);
        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('tci.launchNodeAppLocally', cmdLaunchNodeApp);
        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('tci.launchTIBCOCommunity', cmdLaunchTIBCOCommunity);
        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('tci.launchTCIDocs', cmdLaunchTCIDocs);
        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('tci.checkInstallationStatus', cmdCheckInstallationStatus);
        context.subscriptions.push(disposable);

        disposable = vscode.commands.registerCommand('tci.addEnvVar', cmdAddEnvVar);
        context.subscriptions.push(disposable);
    }

    /**
     * Checks the installation status of the prerequisites for this extension
     */
    function cmdCheckInstallationStatus() {
        checkTibcli(true);
    }

    /**
     * Adds a new Environment Variable to the manifest.json file
     */
    function cmdAddEnvVar() {
        var manifestFile = '';

        // manifest can only be in workspace root or the parent folder of that
        if (fs.existsSync(vscode.workspace.rootPath + '/manifest.json')) {
            manifestFile = vscode.workspace.rootPath + '/manifest.json';
        } else {
            manifestFile = vscode.workspace.rootPath + '/../manifest.json';
            var parentDir = path.resolve(process.cwd(), '..');
        }

        vscode.window.showInputBox({
            prompt: 'Please enter the name and type of your new Env var.',
            placeHolder: 'DB_USER string'
        }).then(vardetails => {
            if (vardetails.split(' ').length != 2) {
                vscode.window.showErrorMessage(vardetails + ' is not a valid name and type.');
                return;
            } else {
                var details = vardetails.split(' ');
                var manifestContent = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
                var propertiesSection = manifestContent.properties

                if (propertiesSection == null) {
                    propertiesSection = [];
                    var newProp = JSON.parse('{"name" : "' + details[0] + '","datatype" : "' + details[1] + '","default" : ""}')
                    propertiesSection.push(newProp);
                } else {
                    var newProp = JSON.parse('{"name" : "' + details[0] + '","datatype" : "' + details[1] + '","default" : ""}')
                    propertiesSection.push(newProp);
                }

                manifestContent.properties = propertiesSection

                fs.writeFileSync(manifestFile, JSON.stringify(manifestContent), 'utf8');
            }
        });
    }

    /**
     * Check if the tibcli executable exists at the given location
     * @param {boolean} showSuccessMessage 
     */
    function checkTibcli(showSuccessMessage) {
        statusBarItem.text = "Checking if tibcli exists...";
        statusBarItem.show();

        var tibcli = vscode.workspace.getConfiguration('tci').get('tibcli');

        if (tibcli == null) {
            var messageItems = ['The tibcli location is not set, visit ' + tciToolsDocumentationURL + ' for instructions']
            messageItems.push('Open in browser');
            vscode.window.showErrorMessage.apply(this, messageItems).then(function (value) {
                if (value == 'Open in browser') {
                    launchWebBrowserWithURL(tciToolsDocumentationURL);
                }
            });
            setTibcliFound(false);
            disposeStatusbar();
            return false;
        }

        if (fs.existsSync(tibcli)) {
            setTibcliFound(true);
            var messageItems = ['tibcli was found on your system. You\'re ready to go!']
            if (showSuccessMessage) {
                vscode.window.showInformationMessage.apply(this, messageItems).then(function () {
                });
            }
            disposeStatusbar();
            return true;
        } else {
            var messageItems = ['tibcli doesn\'t exist or isn\'t accessible, visit ' + tciToolsDocumentationURL + ' for instructions']
            messageItems.push('Open in browser');
            vscode.window.showErrorInformationMessage.apply(this, messageItems).then(function (value) {
                if (value == 'Open in browser') {
                    launchWebBrowserWithURL(tciToolsDocumentationURL);
                }
            });
            setTibcliFound(false);
            disposeStatusbar();
            return false;
        }
    }

    /**
     * Create the deployment artifacts to upload using the TCI web UI
     * or through the tibcli
     */
    function cmdCreateDeploymentArtifacts() {
        var appRootFolder = determineAppRootFolder()

        if (appRootFolder == null) {
            vscode.window.showErrorMessage('We couldn\'t find the server.js file :( ');
            return;
        }

        if (/^win/.test(process.platform)) {
            terminal.show(true);

            if (appRootFolder == vscode.workspace.rootPath) {
                var parentFolder = appRootFolder.substring(0, appRootFolder.lastIndexOf('\\'));
                terminal.sendText('New-Item -Path ' + parentFolder + ' -Name "deployment" -ItemType "directory" | Out-Null', true);
            } else {
                terminal.sendText('New-Item -Path ' + vscode.workspace.rootPath + ' -Name "deployment" -ItemType "directory" | Out-Null', true);
                terminal.sendText('cd ' + appRootFolder, true);
            }

            terminal.sendText('Copy-Item ../manifest.json ../deployment | Out-Null', true);
            terminal.sendText('Get-ChildItem . | where { $_.Name -notin "node_modules"} | Compress-Archive -DestinationPath ../deployment/app.zip -Force | Out-Null', true);

            terminal.sendText('cd ' + vscode.workspace.rootPath, true);
        } else if (/^darwin/.test(process.platform)) {
            terminal.show(true);

            if (appRootFolder == vscode.workspace.rootPath) {
                var parentFolder = appRootFolder.substring(0, appRootFolder.lastIndexOf('/'));
                terminal.sendText('mkdir -p ' + parentFolder + '/deployment', true);
            } else {
                terminal.sendText('mkdir -p ' + vscode.workspace.rootPath + '/deployment', true);
                terminal.sendText('cd ' + appRootFolder, true);
            }

            terminal.sendText('cp ../manifest.json ../deployment', true);
            terminal.sendText('zip -r -X ../deployment/app.zip . -x "node_modules"', true);

            terminal.sendText('cd ' + vscode.workspace.rootPath, true);
        } else {
            vscode.window.showErrorMessage('This command is not supported on ' + process.platform);
        }
    }

    /**
     * Push the Node.js app using the tibcli
     */
    function cmdPushNodeApp() {
        if (!isTibcliFound()) {
            var isTibcliNowFound = checkTibcli(false);
            if (!isTibcliNowFound) {
                return;
            }
        }

        cmdCreateDeploymentArtifacts();

        var tibcli = vscode.workspace.getConfiguration('tci').get('tibcli');

        if (/^win/.test(process.platform)) {
            terminal.show(true);

            if (appRootFolder == vscode.workspace.rootPath) {
                var parentFolder = appRootFolder.substring(0, appRootFolder.lastIndexOf('\\'));
                terminal.sendText('cd ' + parentFolder + '/deployment', true);
            } else {
                terminal.sendText('cd ' + vscode.workspace.rootPath + '/deployment', true);
            }

            terminal.sendText(tibcli + ' app push', true);

            terminal.sendText('cd ' + vscode.workspace.rootPath, true);
        } else if (/^darwin/.test(process.platform)) {
            terminal.show(true);

            if (appRootFolder == vscode.workspace.rootPath) {
                var parentFolder = appRootFolder.substring(0, appRootFolder.lastIndexOf('/'));
                terminal.sendText('cd ' + parentFolder + '/deployment', true);
            } else {
                terminal.sendText('cd ' + vscode.workspace.rootPath + '/deployment', true);
            }

            terminal.sendText(tibcli + ' app push', true);

            terminal.sendText('cd ' + vscode.workspace.rootPath, true);
        } else {
            vscode.window.showErrorMessage('This command is not supported on ' + process.platform);
        }

    }

    /**
     * Launch the Node.js app locally
     */
    function cmdLaunchNodeApp() {
        var appRootFolder = determineAppRootFolder()

        if (appRootFolder == null) {
            vscode.window.showErrorMessage('We couldn\'t find the server.js file :( ');
            return;
        }

        terminal.show(true);
        terminal.sendText('cd ' + appRootFolder, true);
        terminal.sendText('npm install', true);
        terminal.sendText('node .', true);
    }

    /**
     * Determines the rootfolder of the Node.js app
     * This is determined by which folder contains server.js
     */
    function determineAppRootFolder() {
        var appRootFolder = null;
        if (fs.existsSync(vscode.workspace.rootPath + '/server.js')) {
            appRootFolder = vscode.workspace.rootPath;
        }

        var dirs = fs.readdirSync(vscode.workspace.rootPath).filter(function (file) {
            return fs.statSync(vscode.workspace.rootPath + '/' + file).isDirectory();
        });

        dirs.forEach(function (element) {
            if (fs.existsSync(vscode.workspace.rootPath + '/' + element + '/server.js')) {
                appRootFolder = vscode.workspace.rootPath + '/' + element;
            }
        });

        return appRootFolder;
    }

    /**
     * Create a new Node.js app based on template files
     */
    function cmdCreateNodejsApp() {
        var workspaceFolder = vscode.workspace.rootPath;

        if (workspaceFolder == null) {
            vscode.window.showErrorMessage('To create a new Node.js app you need to open a folder in Visual Studio Code where the code can be stored.');
            return;
        }

        vscode.window.showInputBox({
            prompt: 'Please enter the name and version of your new Node.js app.',
            placeHolder: 'myApp 1.0.0'
        }).then(appdetails => {
            if (appdetails.split(' ').length != 2) {
                vscode.window.showErrorMessage(appdetails + ' is not a valid name and version.');
                return;
            } else {
                var details = appdetails.split(' ');
                writeTemplateFilesToWorkspace(details[0], details[1]);
            }
        });
    }

    /**
     * Write the template files to the workspace location
     * @param {String} appName 
     * @param {String} appVersion 
     */
    function writeTemplateFilesToWorkspace(appName, appVersion) {
        var extension = vscode.extensions.getExtension(extensionVendor + '.' + extensionName);

        manifestContent = fs.readFileSync(extension.extensionPath + '/templates/manifest.json', 'utf-8');
        manifestContent = manifestContent.replace(/%%APPNAME%%/g, appName);
        manifestContent = manifestContent.replace(/%%APPVERSION%%/g, appVersion);
        fs.writeFileSync(vscode.workspace.rootPath + '/manifest.json', manifestContent, 'utf-8');

        fs.mkdirSync(vscode.workspace.rootPath + '/' + appName);
        fs.mkdirSync(vscode.workspace.rootPath + '/' + appName + '/util');

        packageJsonContent = fs.readFileSync(extension.extensionPath + '/templates/package.json', 'utf-8');
        packageJsonContent = packageJsonContent.replace(/%%APPNAME%%/g, appName);
        packageJsonContent = packageJsonContent.replace(/%%APPVERSION%%/g, appVersion);
        fs.writeFileSync(vscode.workspace.rootPath + '/' + appName + '/package.json', packageJsonContent, 'utf-8');

        loggerJsContent = fs.readFileSync(extension.extensionPath + '/templates/logger.js', 'utf-8');
        fs.writeFileSync(vscode.workspace.rootPath + '/' + appName + '/util/logger.js', loggerJsContent, 'utf-8');

        configContent = fs.readFileSync(extension.extensionPath + '/templates/dotenv', 'utf-8');
        fs.writeFileSync(vscode.workspace.rootPath + '/' + appName + '/.env', configContent, 'utf-8');

        serverJsContent = fs.readFileSync(extension.extensionPath + '/templates/server.js', 'utf-8');
        fs.writeFileSync(vscode.workspace.rootPath + '/' + appName + '/server.js', serverJsContent, 'utf-8');

        vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/' + appName + '/server.js');

        vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/' + appName + '/server.js').then(document => {
            vscode.window.showTextDocument(document);
        });
    }

    /** 
     * Opens the TIBCO Cloud Integration - API Modeler URL 
     */
    function cmdLaunchAPIModelerURL() {
        launchWebBrowserWithURL(tciAPIModelerURL);
    }

    /** 
     * Opens the TIBCO Community page for TIBCO Cloud Integation 
     */
    function cmdLaunchTIBCOCommunity() {
        launchWebBrowserWithURL(tciCommunityURL);
    }

    /** 
     * Opens the TIBCO Cloud Integration Documentation 
     */
    function cmdLaunchTCIDocs() {
        launchWebBrowserWithURL(tciDocumentationURL);
    }

    /**
     * Opens the default webbrowser with the URL
     * @param {String} url 
     */
    function launchWebBrowserWithURL(url) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
    }

    /**
     * Hides the statusbar
     */
    function disposeStatusbar() {
        statusBarItem.hide();
    }

    /**
     * Helper method to set the value of tibcliFound
     * @param {boolean} found 
     */
    function setTibcliFound(found) {
        tibcliFound = found;
    }

    /**
     * Helper method to get the value of tibcliFound
     */
    function isTibcliFound() {
        return tibcliFound;
    }
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;