/*
 * Copyright © 2017. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

/**
 * Dependencies needed to run this extension
 */
var vscode = require('vscode');
var fs = require('fs-extra');
var path = require('path');
var klawSync = require('klaw-sync')
var templates = require('./tibcli-node-templates');

/**
 * The details of the tci-tools extension
 */
var extension = {
    'version': '0.3.0',
    'name': 'tci-tools',
    'publisher': 'retgits'
};

/**
 * The URLs required by this extension
 */
var urls = {
    'tciDocs': 'https://integration.cloud.tibco.com/docs/index.html',
    'tciCommunity': 'https://community.tibco.com/products/tibco-cloud-integration',
    'apiModeler': 'https://integration.cloud.tibco.com/apispecs',
    'toolsDocs': 'https://github.com/TIBCOSoftware/vscode-extension-tci'
};

/**
 * Internal variables
 */
var tibcli = false;
var terminal = vscode.window.createTerminal('tci-tools');
var outputChannel = vscode.window.createOutputChannel('tci-tools');

/**
 * Opens the default webbrowser with the URL
 * @param {String} url 
 */
function launchBrowserWithUrl(url) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
};

/**
 * Runs the node app on the local machine
 */
function runNodeApp(workspaceRootFolder) {
    var appRootFolder = determineAppRootFolder(workspaceRootFolder, 'cmdRunNodeApp')

    if (appRootFolder != null) {
        terminal.show(true);
        terminal.sendText('cd ' + appRootFolder, true);
        terminal.sendText('npm install', true);
        terminal.sendText('node .', true);
    }
}

/**
 * Determines the rootfolder of the Node.js app
 * This is determined by which folder contains package.json
 */
function determineAppRootFolder(workspaceRootFolder, cmdName) {
    outputChannel.show();
    outputChannel.appendLine(`Finding root folder to execute ${cmdName}`);

    var appRootFolder = null;

    if (fs.existsSync(workspaceRootFolder + '/package.json')) {
        appRootFolder = workspaceRootFolder;
    }

    var filterFunction = item => path.win32.basename(item.path) === 'package.json' && item.path.indexOf('node_modules') < 0;
    var paths = klawSync(workspaceRootFolder, { filter: filterFunction });

    if (paths.length == 0) {
        vscode.window.showErrorMessage('We couldn\'t find the package.json file to determine the rootfolder ');
        outputChannel.appendLine(`Cannot execute ${cmdName} as no folder containing package.json could be found in the workspace`);
        return null;
    } else {
        appRootFolder = paths[0].path;
        appRootFolder = appRootFolder.substring(0, appRootFolder.lastIndexOf(path.sep));
        outputChannel.appendLine(`execute ${cmdName} with ${appRootFolder} as the root folder`);
        return appRootFolder;
    }
}

/**
 * Creates the deployment artifact app.zip and moves that into a deployment folder
 * together with the manifest.json file
 */
function createDeploymentArtifacts(workspaceRootFolder) {
    var appRootFolder = determineAppRootFolder(workspaceRootFolder, 'cmdCreateDeploymentArtifacts');
    var deploymentFolder = null;

    if (appRootFolder != null) {
        if (appRootFolder == workspaceRootFolder) {
            fs.mkdirSync(workspaceRootFolder + '/../deployment');
            deploymentFolder = path.join(workspaceRootFolder + '/../deployment');
        } else {
            fs.mkdirSync(workspaceRootFolder + '/deployment');
            deploymentFolder = path.join(workspaceRootFolder + '/deployment');
        }
    } else {
        return;
    }

    fs.copy(appRootFolder + '/../manifest.json', appRootFolder + '/../deployment/manifest.json', function (err) {
        if (err) {
            outputChannel.show();
            outputChannel.appendLine(err);
        }
    });

    var spawn = require("child_process").spawn, child;
    var child = null;

    if (/^win/.test(process.platform)) {
        child = spawn("powershell.exe", ['Get-ChildItem ' + appRootFolder + ' | where { $_.Name -notin "node_modules"} | Compress-Archive -DestinationPath ' + appRootFolder + '/../deployment/app.zip -Force']);
    } else if (/^darwin/.test(process.platform)) {
        child = spawn("zip", ['-r', '-X', appRootFolder + '/../deployment/app.zip', appRootFolder, '-x', '"node_modules"']);
    } else if (/^linux/.test(process.platform)) {
        child = spawn("zip", ['-r', '-X', appRootFolder + '/../deployment/app.zip', appRootFolder, '-x', '"node_modules"']);
    } else {
        vscode.window.showErrorMessage('This command is not supported on ' + process.platform);
    }

    child.stdout.on("data", function (data) {
        outputChannel.show();
        outputChannel.appendLine(data);
    });
    child.stderr.on("data", function (data) {
        outputChannel.show();
        outputChannel.appendLine(data);
    });
    child.stdin.end();

    outputChannel.appendLine('Deployment folder and artifacts created!');
    outputChannel.appendLine(`Check out ${deploymentFolder} for the artifacts`);
    vscode.window.showInformationMessage('Deployment folder and artifacts created!');
};

/**
 * Checks whether the tibcli executable exists in that location.
 * @param {String} tibcli
 */
function checkTibcliExists(tibcli) {
    outputChannel.show();
    outputChannel.appendLine('Checking if tibcli exists...');

    if (tibcli == null || !fs.existsSync(tibcli)) {
        outputChannel.appendLine(`tibcli parameter was set to ${tibcli} but executable was not found`);
        setTibcli(false);
        return false;
    } else {
        outputChannel.appendLine(`tibcli parameter was set to ${tibcli} and executable was found`);
        setTibcli(true);
        return true;
    }
};

/**
 * Helper method to set the value of tibcli
 * @param {boolean} found 
 */
function setTibcli(found) {
    tibcliFound = found;
};

/**
 * Helper method to get the value of tibcli
 */
function hasTibcli() {
    return tibcli;
};

/**
 * Create a new Node.js app based on templates
 */
function createNewNodejsApp(appName, appVersion, rootPath, callback) {
    if (rootPath == null) {
        vscode.window.showErrorMessage('To create a new Node.js app you need to open a folder in Visual Studio Code where the code can be stored.');
        return;
    } else {
        writeTemplateFiles(appName, appVersion, rootPath, callback);
    }
};

/**
 * Write the template files to the workspace location
 * @param {String} appName 
 * @param {String} appVersion 
 * @param {String} rootPath 
 * @param {Function} callback 
 */
function writeTemplateFiles(appName, appVersion, rootPath, callback) {
    manifestContent = templates.manifestjson
    manifestContent = manifestContent.replace(/%%APPNAME%%/g, appName);
    manifestContent = manifestContent.replace(/%%APPVERSION%%/g, appVersion);
    fs.writeFileSync(path.join(rootPath, 'manifest.json'), manifestContent, 'utf-8');


    fs.mkdirSync(path.join(rootPath, appName));
    fs.mkdirSync(path.join(rootPath, appName, 'util'));

    packageJsonContent = templates.packagejson
    packageJsonContent = packageJsonContent.replace(/%%APPNAME%%/g, appName);
    packageJsonContent = packageJsonContent.replace(/%%APPVERSION%%/g, appVersion);
    fs.writeFileSync(path.join(rootPath, appName, 'package.json'), packageJsonContent, 'utf-8');

    loggerJsContent = templates.loggerjs
    fs.writeFileSync(path.join(rootPath, appName, 'util', 'logger.js'), loggerJsContent, 'utf-8');

    configContent = templates.dotenv
    fs.writeFileSync(path.join(rootPath, appName, '.env'), configContent, 'utf-8');

    serverJsContent = templates.serverjs
    fs.writeFileSync(path.join(rootPath, appName, 'server.js'), serverJsContent, 'utf-8');

    callback(true);
};

/**
 * Pushes the Node.js app to TIBCO Cloud Integration using tibcli
 */
function pushNodejsApp(workspaceRootFolder, tibcli) {

    createDeploymentArtifacts(workspaceRootFolder);

    var appRootFolder = determineAppRootFolder(workspaceRootFolder, 'cmdPushNodejsApp');

    terminal.show(true);

    if (appRootFolder == workspaceRootFolder) {
        var parentFolder = path.join(workspaceRootFolder, '..');
        terminal.sendText('cd ' + parentFolder + '/deployment', true);
    } else {
        terminal.sendText('cd ' + workspaceRootFolder + '/deployment', true);
    }

    terminal.sendText(tibcli + ' app push', true);
    terminal.sendText('cd ' + workspaceRootFolder, true);
};

/**
 * Adds a new Environment Variable to the manifest.json file
 */
function addPropertyToManifest (propertyName, propertyType, workspaceRootFolder) {
    var manifestFile = '';

    // manifest can only be in workspace root or the parent folder of that
    if (fs.existsSync(workspaceRootFolder + '/manifest.json')) {
        manifestFile = workspaceRootFolder + '/manifest.json';
    } else {
        manifestFile = workspaceRootFolder + '/../manifest.json';
    }

    var manifestContent = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    var propertiesSection = manifestContent.properties;
    var newProp = JSON.parse('{"name" : "' + propertyName + '","datatype" : "' + propertyType + '","default" : ""}');

    if (propertiesSection == null) {
        propertiesSection = [];
        propertiesSection.push(newProp);
    } else {
        propertiesSection.push(newProp);
    }

    manifestContent.properties = propertiesSection;

    fs.writeFileSync(manifestFile, JSON.stringify(manifestContent), 'utf8');
};

/**
 * Exports
 */
exports.extension = extension;
exports.urls = urls;
exports.checkTibcliExists = checkTibcliExists;
exports.launchBrowserWithUrl = launchBrowserWithUrl;
exports.createNewNodejsApp = createNewNodejsApp;
exports.addPropertyToManifest = addPropertyToManifest;
exports.createDeploymentArtifacts = createDeploymentArtifacts;
exports.runNodeApp = runNodeApp;
exports.pushNodejsApp = pushNodejsApp;