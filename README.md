# tci-tools
tci-tools is an extension for Microsoft Visual Studio Code which provides support for building awesome Node.js apps in TIBCO Cloud&trade; Integration. 

## Commands
![Image](images/commandlist.jpg)

* [Create deployment artifacts](docs/commands.md#create-deployment-artifacts)
* [Push Node.js app to TCI](docs/commands.md#push-nodejs-app-to-tci)
* [Run Node.js app](docs/commands.md#run-nodejs-app)
* [Add environment variable](docs/commands.md#add-environment-variable)
* [Create a new Node.js app](docs/commands.md#create-a-new-nodejs-app)
* [Open TIBCO Cloud Integration documentation](docs/commands.md#open-tibco-cloud-integration-documentation)
* [Open TIBCO Community](docs/commands.md#open-tibco-community)
* [Open API Modeler](docs/commands.md#open-api-modeler)
* [Display the version of TCI Tools](docs/commands.md#display-version)
* [Check installation status](docs/commands.md#check-installation-status)

## Requirements
To use this extension you need a valid account to TIBCO Cloud Integration (you can sign up at https://cloud.tibco.com/free-trial) and the `tibcli` utility (see https://integration.cloud.tibco.com/docs/getstarted/installation/download-tools.html for details)

## Extension Settings
This extension contributes the following settings:
* `tci.tibcli`: The full qualified path to the tibcli executable (including .exe on Windows) which is set to `c:/tmp/tibcli.exe` by default

## Installing the extension
You can install the extension using the VS Code --install-extension command line switch
```
code --install-extension tci-tools-x.x.x.vsix
```

## Supported systems
This release has been tested on Microsoft Windows 10 (with PowerShell) and macOS 10.12 (with Bash)

## Questions?
Feel free to open a Github issue or ask a question on the [TIBCO Community](https://community.tibco.com)

## Other TIBCO Cloud Integration repos
You might also want to visit our other repos
* [tci-awesome](https://github.com/TIBCOSoftware/tci-awesome), a curated set of awesome projects built on TIBCO Cloud Integration
* [Connectors for TIBCO Business Studio - Cloud Edition](https://github.com/TIBCOSoftware/tci-studio-samples)
* [tci-webintegrator](https://github.com/TIBCOSoftware/tci-webintegrator), the SDK to build cool extensions for our Web Integrator
* [Command Line Interface for Node.js](https://github.com/TIBCOSoftware/tibcli-node)

## Contributors
[Leon Stigter](https://github.com/retgits)

## Release Notes
See the [release notes](docs/release-notes.md) in the docs folder


## License
Copyright © 2017. TIBCO Software Inc.
This file is subject to the license terms contained
in the license file that is distributed with this file.