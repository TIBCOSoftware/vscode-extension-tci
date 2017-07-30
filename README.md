# tci-tools
tci-tools is an extension for Microsoft Visual Studio Code which provides support for building awesome Node.js apps in TIBCO Cloud&trade; Integration. 

## Commands
![Image](images/commandlist.jpg)
### Check installation status
This command checks whether or not the `tibcli` utility has been installed on the machine at the location you have configured (see below for details on `extension settings`).
### Create a new Node.js app
With TIBCO Cloud Integration you can build Node.js apps from the API specs you design or you can start with the minimum of boilerplate code. This command creates a manifest.json file and a few other files you'll need to create your next Node.js app
### Create deployment artifacts
You can push a Node.js app to TIBCO Cloud Integration using the `tibcli` or by uploading it through the web. In both cases you'll need a zipfile containing the code and the manifest. This command creates a directory `deployment` in which the manifest and zip are placed
### Launch Node.js app locally
Before pushing your app to TIBCO Cloud Integration, you probably want to test it first. This command installs all the dependencies (from package.json) your app relies on and runs your Node.js app on your machine. 
### Open API Modeler
If you want to build a Node.js app based on an API specification you can use this command to launch the TIBCO Cloud Integration - API Modeler in a browser and visually design the API your Node.js app will expose. You can download a stub implementation from there as well!
### Open TIBCO Cloud Integration Documentation
This command simply launches a browser window and opens the documentation for TIBCO Cloud Integration
### Open TIBCO Community
The TIBCO Community is a great place to get in contact with experts on TIBCO Cloud Integration. If you have a question, you can post it there too!
### Push Node.js app to TCI
Push your Node.js app to TIBCO Cloud Integration!

## Requirements
To use this extension you need a valid account to TIBCO Cloud Integration (you can sign up at https://cloud.tibco.com/free-trial) and the `tibcli` utility (see https://integration.cloud.tibco.com/docs/getstarted/installation/download-tools.html for details)

## Extension Settings
This extension contributes the following settings:
* `tci.tibcli`: The full qualified path to the tibcli executable (including .exe on Windows) which is set to `c:/tmp/tibcli.exe` by default

## Installing the extension
You can install the extension using the VS Code --install-extension command line switch
```
code --install-extension tci-tools-0.1.0.vsix
```

## Supported systems
This release has been tested on Microsoft Windows 10 (with PowerShell) and macOS 10.12 (with Bash)

## Questions?
Feel free to open a Github issue or ask a question on the [TIBCO Community](https://community.tibco.com)

## Contributors
[Leon Stigter](https://github.com/retgits)

## Release Notes

### 0.1.0
Added ability to create a new Node.js app and refactored code for maintanance purposes

### 0.0.3
Correct error for Windows 10, which caused zipfile to be built wrongly

### 0.0.2
Added support for macOS 10.12 (Sierra)

### 0.0.1
Initial release of tci-tools on Windows

## License
Copyright © 2017. TIBCO Software Inc.
This file is subject to the license terms contained
in the license file that is distributed with this file.