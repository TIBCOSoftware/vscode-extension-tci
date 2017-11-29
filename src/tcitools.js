/*
 * Copyright © 2017. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

/**
 * Requires
 */
const config = require('./config');
const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');
const templates = require('./tcitools-templates');
const archiver = require('archiver');
const klawSync = require('klaw-sync');

/**
 * Internal variables
 */
const terminal = vscode.window.createTerminal('tcitools');
const outputChannel = vscode.window.createOutputChannel('tcitools');

/**
 * Launch web browser
 * @param {String} type the type of activity you want to launch
 * @param {String} region the region for which the url must be
 */
function openBrowser(type, region) {
    let url;

    if (type == 'apimodeler' || type == 'tcidocs') {
        url = config.urls[region][type];
    } else {
        url = config.urls[type];
    }

    outputChannel.appendLine('');
    outputChannel.appendLine(`Launching URL ${url}`);
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
}

/**
 * Check if the location for tibcli is correct
 * @param {String} tibcli
 * @return {Boolean} boolean
 */
function checkTibcli(tibcli) {
    outputChannel.show();
    outputChannel.appendLine('');
    outputChannel.appendLine('Checking if tibcli exists');

    if (tibcli == null || !fs.existsSync(tibcli)) {
        outputChannel.appendLine(`tibcli cannot be found at (${tibcli})`);
        return false;
    } else {
        outputChannel.appendLine(`tibcli is found at (${tibcli})`);
        return true;
    }
};

/**
 * Create a new Node.js app based on templates
 * @param {String} appname
 * @param {String} appversion
 * @param {String} rootPath
 * @param {Function} callback
 */
function createNewApp(appname, appversion, rootPath, callback) {
    /**
     * Create the directories needed for the files
     */
    fs.mkdirsSync(path.join(rootPath, appname));
    fs.mkdirsSync(path.join(rootPath, appname, 'util'));

    /**
     * Prepare the manifest.json
     */
    let manifest = templates.manifest;
    manifest.name = appname;
    manifest.description = 'Node.js app for ' + appname;
    manifest.version = appversion;
    manifest.endpoints[0].spec.name = appname;
    manifest.endpoints[0].spec.version = appversion;

    /**
     * Prepare the package.json
     */
    let packagefile = templates.package;
    packagefile.name = appname;
    packagefile.description = 'Node.js app for ' + appname;
    packagefile.version = appversion;

    /**
     * Write the files to disk
     */
    fs.writeJSONSync(path.join(rootPath, 'manifest.json'),
        manifest, 'utf-8');
    fs.writeJSONSync(path.join(rootPath, appname, 'package.json'),
        packagefile, 'utf-8');
    fs.writeFileSync(path.join(rootPath, appname, 'util', 'logger.js'),
        templates.logger, 'utf-8');
    fs.writeFileSync(path.join(rootPath, appname, '.env'),
        templates.dotenv, 'utf-8');
    fs.writeFileSync(path.join(rootPath, appname, 'server.js'),
        templates.server, 'utf-8');

    outputChannel.show();
    outputChannel.appendLine('');
    outputChannel.appendLine('Your app has been created!');
    callback(true);
};

/**
 * Runs the node app on the local machine
 * @param {String} rootPath
 */
function runApp(rootPath) {
    let rootfolder;
    outputChannel.show();
    outputChannel.appendLine('');

    if (fs.existsSync(path.join(rootPath, 'package.json'))) {
        rootfolder = rootPath;
    } else if (fs.existsSync(path.join(rootPath, 'manifest.json'))) {
        let temp = findPackageJson(rootPath);
        if (temp != null) {
            rootfolder = temp;
        } else {
            // eslint-disable-next-line max-len
            vscode.window.showErrorMessage('Neither package.json nor manifest.json are present');
        }
    } else {
        // eslint-disable-next-line max-len
        vscode.window.showErrorMessage('Neither package.json nor manifest.json are present');
        return;
    }
    outputChannel.appendLine(`The rootfolder has been set to ${rootfolder}`);
    terminal.show(true);
    terminal.sendText('cd ' + rootfolder, true);
    terminal.sendText('npm install', true);
    terminal.sendText('node .', true);
}

/**
 * Pushes the Node.js app to TIBCO Cloud Integration using tibcli
 * @param {String} rootPath
 * @param {String} tibcli
 */
function pushApp(rootPath, tibcli) {
    createZip(rootPath);

    let rootfolder;
    outputChannel.show();
    outputChannel.appendLine('');

    if (fs.existsSync(path.join(rootPath, 'manifest.json'))) {
        rootfolder = rootPath;
    } else if (fs.existsSync(path.join(rootPath, '..', 'manifest.json'))) {
        rootfolder = path.join(rootPath, '..');
    } else {
        // eslint-disable-next-line max-len
        vscode.window.showErrorMessage('manifest.json could not be found in the current folder or parent folder');
    }
    outputChannel.appendLine(`The rootfolder has been set to ${rootfolder}`);
    terminal.show(true);
    terminal.sendText(`cd ${rootfolder}/deployment`, true);
    terminal.sendText(tibcli + ' app push', true);
};

/**
 * Function to update the manifest and depending on the action remove
 * or add the variable
 * @param {String} action
 * @param {String} name
 * @param {String} type
 * @param {String} value
 * @param {String} rootPath
 */
function updateManifestVariables(action, name, type, value, rootPath) {
    let rootfolder;
    outputChannel.show();
    outputChannel.appendLine('');

    if (fs.existsSync(path.join(rootPath, 'manifest.json'))) {
        rootfolder = rootPath;
    } else if (fs.existsSync(path.join(rootPath, '..', 'manifest.json'))) {
        rootfolder = path.join(rootPath, '..');
    } else {
        // eslint-disable-next-line max-len
        vscode.window.showErrorMessage('manifest.json could not be found in the current folder or parent folder');
    }
    outputChannel.appendLine(`The rootfolder has been set to ${rootfolder}`);

    let manifest = fs.readJSONSync(path.join(rootfolder, 'manifest.json'));

    let properties = manifest.properties;

    if (properties == null) {
        properties = [];
    }
    let property = {name: name, datatype: type, default: value};
    properties.push(property);
    // eslint-disable-next-line max-len
    outputChannel.appendLine('Successfully added environment variable from manifest.json!');

    manifest.properties = properties;
    fs.writeJSONSync(path.join(rootfolder, 'manifest.json'),
        manifest, 'utf-8');
}

/**
 * Creates the app.zip and moves that into a deployment folder
 * @param {String} rootPath
 */
function createZip(rootPath) {
    let rootfolder;
    outputChannel.show();
    outputChannel.appendLine('');

    if (fs.existsSync(path.join(rootPath, 'package.json'))) {
        rootfolder = rootPath;
    } else if (fs.existsSync(path.join(rootPath, 'manifest.json'))) {
        let temp = findPackageJson(rootPath);
        if (temp != null) {
            rootfolder = temp;
        } else {
            // eslint-disable-next-line max-len
            vscode.window.showErrorMessage('Neither package.json nor manifest.json are present');
        }
    } else {
        // eslint-disable-next-line max-len
        vscode.window.showErrorMessage('Neither package.json nor manifest.json are present');
        return;
    }
    // eslint-disable-next-line max-len
    outputChannel.appendLine(`The rootfolder has been set to ${rootfolder}`);

    /**
     * Create a folder for the deployment in the parent folder
     */
    fs.mkdirsSync(path.join(rootfolder, '..', 'deployment'));

    /**
     * Copy the manifest.json there
     */
    fs.copySync(path.join(rootfolder, '..', 'manifest.json'),
        path.join(rootfolder, '..', 'deployment', 'manifest.json'),
        {overwrite: true});

    /**
     * Create a file to stream archive data to
     */
    let output = fs.createWriteStream(path.join(rootfolder,
        '..', 'deployment', 'app.zip'));
    let archive = archiver('zip', {
        zlib: {level: 9},
    });

    /**
     * Receive the 'close' event, meaning the zip file was created
     */
    output.on('close', function() {
        outputChannel.appendLine('The zip file has been created');
        // eslint-disable-next-line max-len
        outputChannel.appendLine(`The app.zip file is ${archive.pointer()} bytes.`);
    });

    /**
     * Catch all errors, warnings and other events that are fired
     *
     * The 'end' event is fired when the data source is drained no matter what
     * was the data source. It is not part of this library but rather from the
     * NodeJS Stream API.
     * @see: https://nodejs.org/api/stream.html#stream_event_end
     */
    output.on('end', function() {
        outputChannel.appendLine('Data has been drained');
    });

    archive.on('warning', function(err) {
        outputChannel.appendLine(err);
    });

    archive.on('error', function(err) {
        outputChannel.appendLine(err);
    });

    /**
     * Pipe archive data to the file and add all files
     * excluding the node_modules folder and as a last step finalize
     * the archive.
     */
    archive.pipe(output);

    // eslint-disable-next-line max-len
    archive.glob('**/*', {dot: true, ignore: 'node_modules/**', cwd: rootfolder});

    archive.finalize();
};

/**
 * Find the subfolder containing the package.json file
 * @param {String} folder
 * @return {String} folder containing the package.json
 */
function findPackageJson(folder) {
    // eslint-disable-next-line max-len
    let filterFunction = (item) => path.win32.basename(item.path) === 'package.json' && item.path.indexOf('node_modules') < 0;
    let paths = klawSync(folder, {filter: filterFunction});

    if (paths.length == 0) {
        return null;
    } else {
        let appRootFolder = paths[0].path;
        // eslint-disable-next-line max-len
        appRootFolder = appRootFolder.substring(0, appRootFolder.lastIndexOf(path.sep));
        return appRootFolder;
    }
}

/**
 * Exports
 */
exports.openBrowser = openBrowser;
exports.checkTibcli = checkTibcli;
exports.createNewApp = createNewApp;
exports.createZip = createZip;
exports.updateManifestVariables = updateManifestVariables;
exports.runApp = runApp;
exports.pushApp = pushApp;
