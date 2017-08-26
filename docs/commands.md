# Commands

## Check installation status
This command checks whether or not the `tibcli` utility has been installed on the machine at the location you have configured (see below for details on `extension settings`).

## Create a new Node.js app
With TIBCO Cloud Integration you can build Node.js apps from the API specs you design or you can start with the minimum of boilerplate code. This command creates a manifest.json file and a few other files you'll need to create your next Node.js app

## Create deployment artifacts
You can push a Node.js app to TIBCO Cloud Integration using the `tibcli` or by uploading it through the web. In both cases you'll need a zipfile containing the code and the manifest. This command creates a directory `deployment` in which the manifest and zip are placed

## Launch Node.js app locally
Before pushing your app to TIBCO Cloud Integration, you probably want to test it first. This command installs all the dependencies (from package.json) your app relies on and runs your Node.js app on your machine. 

## Open API Modeler
If you want to build a Node.js app based on an API specification you can use this command to launch the TIBCO Cloud Integration - API Modeler in a browser and visually design the API your Node.js app will expose. You can download a stub implementation from there as well!

## Open TIBCO Cloud Integration Documentation
This command simply launches a browser window and opens the documentation for TIBCO Cloud Integration

## Open TIBCO Community
The TIBCO Community is a great place to get in contact with experts on TIBCO Cloud Integration. If you have a question, you can post it there too!

## Push Node.js app to TCI
Push your Node.js app to TIBCO Cloud Integration!

## Add environment variable
Add a new Environment variable to the manifest.json file so you can use it in your Node.js code with the `process.env` context

## Display version
Display the version of the extension you're running.