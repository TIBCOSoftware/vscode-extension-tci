/*
Copyright © 2017. TIBCO Software Inc.
This file is subject to the license terms contained
in the license file that is distributed with this file.
*/

/**
 * Dependencies needed to run the unit tests
 */
var vscode = require('vscode');
var assert = require('chai').assert;
var expect = require('chai').expect;
var rewire = require('rewire');
var fs = require('fs-extra');
var path = require('path');

/**
 * Files from the extension that will be used in the test
 */
var extension = require('../extension');
var tools = require('../src/tci-tools');
var templates = require('../src/tibcli-node-templates');
var package = require('../package.json');

/**
 * Variables
 * These might change based on your machine
 */
var TIBCLI_CORRECT_LOCATION = 'd:/Apps/TIBCO/tibcli.exe'
var TIBCLI_FAKE_LOCATION = 'd:/Apps/tibcli.exe'
var WORKSPACE_ROOT = 'd:/Apps/test'

/**
 * Core checks validate the extension.js file
 */
suite('Core checks', function () {
    // Set the slow timer to 10000 as reflection mi
    this.slow(10000);

    var app = rewire('../extension');
    var activationEvents = package.activationEvents;
    var commands = package.contributes.commands;

    test('activationEvents and commands in package.json match', function () {
        for (var index = 0; index < activationEvents.length; index++) {
            var element = activationEvents[index].substring(10);
            assert.equal(element, commands[index].command)
        }
    });

    test('Every activationEvent has a corresponding function in extension.js', function () {
        for (var index = 0; index < activationEvents.length; index++) {
            var element = activationEvents[index].substring(14);
            assert.isFunction(app.__get__(element));
        }
    });
});

/**
 * Templates checks validate the templates.js file
 */
suite('Templates checks', function () {
    // Set the slow timer to 10000 as reflection mi
    this.slow(10000);

    test('dotenv is a string', function () {
        assert.isString(templates.dotenv)
    });

    test('dotenv contains the http port 8000', function () {
        assert.notEqual(templates.dotenv.indexOf('HTTP_PORT=8000'), -1)
    });

    test('server.js is a string', function () {
        assert.isString(templates.serverjs)
    });

    test('package.json is a string', function () {
        assert.isString(templates.packagejson)
    });

    test('manifest.json is a string', function () {
        assert.isString(templates.manifestjson)
    });

    test('logger.js is a string', function () {
        assert.isString(templates.loggerjs)
    });
});

/**
 * Tools checks validate the tci-tools.js file
 */
suite('Tools checks', function () {
    // Set the slow timer to 10000 as reflection mi
    this.slow(10000);

    test('Name, publisher and version should be correct', function () {
        assert.equal(package.name, tools.extension.name);
        assert.equal(package.publisher, tools.extension.publisher);
        assert.equal(package.version, tools.extension.version);
    });

    test('URLs should be correct', function () {
        assert.equal(tools.urls.apiModeler, 'https://integration.cloud.tibco.com/apispecs');
        assert.equal(tools.urls.tciCommunity, 'https://community.tibco.com/products/tibco-cloud-integration');
        assert.equal(tools.urls.tciDocs, 'https://integration.cloud.tibco.com/docs/index.html');
        assert.equal(tools.urls.toolsDocs, 'https://github.com/TIBCOSoftware/vscode-extension-tci');
    });
});

/**
 * Functional checks walk through a custom scenario and check the correctness of the code
 */
suite('Scenario checks', function () {
    // Set the slow timer to 10000 as reflection mi
    this.slow(10000);

    setup(function () {
        fs.mkdirsSync(WORKSPACE_ROOT);
    });

    test('A non-existing tibcli location should fail', function () {
        assert.isFalse(tools.checkTibcliExists(TIBCLI_FAKE_LOCATION));
    });

    test('An existing tibcli location should not fail', function () {
        assert.isTrue(tools.checkTibcliExists(TIBCLI_CORRECT_LOCATION));
    });

    test('Create a new Node.js app', function () {
        tools.createNewNodejsApp('myApp', '1.0.0', WORKSPACE_ROOT, function () { });
        expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'manifest.json'))).to.be.true;
        expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'myApp', 'package.json'))).to.be.true;
        expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'myApp', 'server.js'))).to.be.true;
        expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'myApp', '.env'))).to.be.true;
        expect(fs.existsSync(path.join(WORKSPACE_ROOT, 'myApp', 'util', 'logger.js'))).to.be.true;
    });

    test('Properties section should not exist', function () {
        var manifestFile = path.join(WORKSPACE_ROOT, 'manifest.json');
        var manifestContent = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        var propertiesSection = manifestContent.properties;
        assert.isUndefined(propertiesSection);
    });

    test('Add property should work', function () {
        tools.addPropertyToManifest('DB_USER', 'string', WORKSPACE_ROOT);
    });

    test('Properties section should exist', function () {
        var manifestFile = path.join(WORKSPACE_ROOT, 'manifest.json');
        var manifestContent = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        var propertiesSection = manifestContent.properties;
        assert.isNotNull(propertiesSection);
        assert.equal(propertiesSection[0].name, 'DB_USER');
    });

    test('Create deployment artifacts', function () {
        tools.createDeploymentArtifacts(WORKSPACE_ROOT); 
    });

    test('Create deployment artifacts - second time to check overwrite', function () {
        tools.createDeploymentArtifacts(WORKSPACE_ROOT); 
    });
});