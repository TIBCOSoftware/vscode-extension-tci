# Building and contributing
You want to contribute to this Visual Code extension? Awesome!

## Building from source
You can build your own installer of the plugin by downloading the source from this repository and following a few easy steps:
```bash
# install vsce, the packaging tool for Visual Studio Code Extensions
$ npm install -g vsce

# clone this repository
$ git clone https://github.com/TIBCOSoftware/vscode-extension-tci

# create a vsix
$ cd vscode-extension-tci
vsce package
```

## Running unit tests
If you make changes, please be sure to update the test cases in `/test/extension.test.js` or add your own test file and make sure the tests are completing successfully before sending a pull request.

## Linting
This project uses the Google style guide for JavaScript with some notable exceptions:
* The linebreak style is set to Windows
* Switch colon spacing is turned off
* Max line length is turned off

To run the the linter and see if your code conforms to the standards execute `npm run-script linter`