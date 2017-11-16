/*
 * Copyright © 2017. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

/* eslint-disable max-len */

/**
 * Dependencies needed to run this extension
 */
const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');
const klawSync = require('klaw-sync');
const templates = require('./tibcli-node-templates');

/**
 * The details of the tci-tools extension
 */
const extension = {
    'version': '0.4.1',
    'name': 'tci-tools',
    'publisher': 'retgits',
};

/**
 * The URLs required by this extension
 */
const urls = {
    'tciDocs': 'https://integration.cloud.tibco.com/docs/index.html',
    'tciCommunity': 'https://community.tibco.com/products/tibco-cloud-integration',
    'apiModeler': 'https://integration.cloud.tibco.com/apispecs',
    'toolsDocs': 'https://github.com/TIBCOSoftware/vscode-extension-tci',
};

/**
 * Internal variables
 */
const terminal = vscode.window.createTerminal('tci-tools');
const outputChannel = vscode.window.createOutputChannel('tci-tools');

/**
 * Opens the default webbrowser with the URL
 * @param {String} url 
 */
function launchBrowserWithUrl(url) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
};

/**
 * Runs the node app on the local machine
 * @param {String} workspaceRootFolder
 */
function runNodeApp(workspaceRootFolder) {
    let appRootFolder = determineAppRootFolder(workspaceRootFolder, 'cmdRunNodeApp');

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
 * @param {String} workspaceRootFolder
 * @param {String} cmdName
 * @return {String} appRootFolder
 */
function determineAppRootFolder(workspaceRootFolder, cmdName) {
    outputChannel.show();
    outputChannel.appendLine(`Finding root folder to execute ${cmdName}`);

    let appRootFolder = null;

    if (fs.existsSync(workspaceRootFolder + '/package.json')) {
        appRootFolder = workspaceRootFolder;
    }

    let filterFunction = (item) => path.win32.basename(item.path) === 'package.json' && item.path.indexOf('node_modules') < 0;
    let paths = klawSync(workspaceRootFolder, {filter: filterFunction});

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
 * @param {String} workspaceRootFolder
 */
function createDeploymentArtifacts(workspaceRootFolder) {
    let appRootFolder = determineAppRootFolder(workspaceRootFolder, 'cmdCreateDeploymentArtifacts');
    let deploymentFolder = null;

    if (appRootFolder != null) {
        if (appRootFolder == workspaceRootFolder) {
            fs.mkdirsSync(workspaceRootFolder + '/../deployment');
            deploymentFolder = path.join(workspaceRootFolder + '/../deployment');
        } else {
            fs.mkdirsSync(workspaceRootFolder + '/deployment');
            deploymentFolder = path.join(workspaceRootFolder + '/deployment');
        }
    } else {
        return;
    }

    fs.copySync(appRootFolder + '/../manifest.json', appRootFolder + '/../deployment/manifest.json', {overwrite: true});

    let spawn = require('child_process').spawn;
    let child = null;

    if (/^win/.test(process.platform)) {
        child = spawn('powershell.exe', ['Get-ChildItem ' + appRootFolder + ' | where { $_.Name -notin "node_modules"} | Compress-Archive -DestinationPath ' + appRootFolder + '/../deployment/app.zip -Force'], {cwd: appRootFolder});
    } else if (/^darwin/.test(process.platform)) {
        child = spawn('zip', ['-r', '-X', appRootFolder + '/../deployment/app.zip', '.', '-x', '"node_modules"'], {cwd: appRootFolder});
    } else if (/^linux/.test(process.platform)) {
        child = spawn('zip', ['-r', '-X', appRootFolder + '/../deployment/app.zip', '.', '-x', '"node_modules"'], {cwd: appRootFolder});
    } else {
        vscode.window.showErrorMessage('This command is not supported on ' + process.platform);
    }

    child.stdout.on('data', function(data) {
        outputChannel.show();
        outputChannel.appendLine(data);
    });
    child.stderr.on('data', function(data) {
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
 * @return {Boolean} boolean
 */
function checkTibcliExists(tibcli) {
    outputChannel.show();
    outputChannel.appendLine('Checking if tibcli exists...');

    if (tibcli == null || !fs.existsSync(tibcli)) {
        outputChannel.appendLine(`tibcli parameter was set to ${tibcli} but executable was not found`);
        return false;
    } else {
        outputChannel.appendLine(`tibcli parameter was set to ${tibcli} and executable was found`);
        return true;
    }
};

/**
 * Create a new Node.js app based on templates
 * @param {String} appName
 * @param {String} appVersion
 * @param {String} rootPath
 * @param {Function} callback
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
    let manifestContent = templates.manifestjson;
    manifestContent = manifestContent.replace(/%%APPNAME%%/g, appName);
    manifestContent = manifestContent.replace(/%%APPVERSION%%/g, appVersion);
    fs.writeFileSync(path.join(rootPath, 'manifest.json'), manifestContent, 'utf-8');


    fs.mkdirsSync(path.join(rootPath, appName));
    fs.mkdirsSync(path.join(rootPath, appName, 'util'));

    let packageJsonContent = templates.packagejson;
    packageJsonContent = packageJsonContent.replace(/%%APPNAME%%/g, appName);
    packageJsonContent = packageJsonContent.replace(/%%APPVERSION%%/g, appVersion);
    fs.writeFileSync(path.join(rootPath, appName, 'package.json'), packageJsonContent, 'utf-8');

    let loggerJsContent = templates.loggerjs;
    fs.writeFileSync(path.join(rootPath, appName, 'util', 'logger.js'), loggerJsContent, 'utf-8');

    let configContent = templates.dotenv;
    fs.writeFileSync(path.join(rootPath, appName, '.env'), configContent, 'utf-8');

    let serverJsContent = templates.serverjs;
    fs.writeFileSync(path.join(rootPath, appName, 'server.js'), serverJsContent, 'utf-8');

    callback(true);
};

/**
 * Pushes the Node.js app to TIBCO Cloud Integration using tibcli
 * @param {String} workspaceRootFolder
 * @param {String} tibcli
 */
function pushNodejsApp(workspaceRootFolder, tibcli) {
    createDeploymentArtifacts(workspaceRootFolder);

    let appRootFolder = determineAppRootFolder(workspaceRootFolder, 'cmdPushNodejsApp');

    terminal.show(true);

    if (appRootFolder == workspaceRootFolder) {
        let parentFolder = path.join(workspaceRootFolder, '..');
        terminal.sendText('cd ' + parentFolder + '/deployment', true);
    } else {
        terminal.sendText('cd ' + workspaceRootFolder + '/deployment', true);
    }

    terminal.sendText(tibcli + ' app push', true);
    terminal.sendText('cd ' + workspaceRootFolder, true);
};

/**
 * Adds a new Environment Variable to the manifest.json file
 * @param {String} propertyName
 * @param {String} propertyType
 * @param {String} propertyDefaultValue
 * @param {String} workspaceRootFolder
 */
function addPropertyToManifest(propertyName, propertyType, propertyDefaultValue, workspaceRootFolder) {
    let manifestFile = '';

    // manifest can only be in workspace root or the parent folder of that
    if (fs.existsSync(workspaceRootFolder + '/manifest.json')) {
        manifestFile = workspaceRootFolder + '/manifest.json';
    } else {
        manifestFile = workspaceRootFolder + '/../manifest.json';
    }

    let manifestContent = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    let propertiesSection = manifestContent.properties;
    let newProp = JSON.parse('{"name" : "' + propertyName + '","datatype" : "' + propertyType + '","default" : "' + propertyDefaultValue + '"}');

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