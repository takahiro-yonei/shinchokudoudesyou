# Connector for Sencha Touch Apps to Interface with Salesforce REST API

This package includes two main components:

* Ext.force.Force: A class that allows low-level interaction with the Force.com REST
  API. It is functionally equivalent to the forcetk library, but relies
  only on the Sencha Touch library.
* Ext.force.ForceProxy: A proxy that works alongside Sencha Touch
  stores to allow manipulating SalesForce data.
  

## Package contents
* docs/ - this guide.
* force.pkg - the Sencha Touch package that can be used in your applications.
* node/ - A node.js wrapper application for deployment on heroku or other hosting
  platform. It contains the a wrapper that passes proxy calls from the
  app to the force.com REST endpoint. The touchapp directory inside
  contains a sample Sencha Touch application.
* local_hybrid/ - a tweak to the Sencha Touch application in
    node/touchapp to make it work as a bundled app on a mobile
    device. See the authentication changes to app.js in that
    directory.
* visualforce/ - a tweak to the Sencha Touch applicaiton to make it
  work as a depoyed VisualForce page. See the app.js and
  MobileSample_Sencha.page files inside the directory.

Note: the local_hybrid and visualforce directories are not complete
  apps, just the files that have changed from the master files in the
  node/touchapp sample.
  


## Installing the package for use in other apps
In order to use the package (force.pkg) in your Sencha Touch apps, you first need
to install it in your system. You'll need Sencha Cmd version 4.0 or
newer for this to work. To download Sencha Cmd, see
[Sencha Cmd Download](http://www.sencha.com/products/sencha-cmd/download).

Once Sencha Cmd is installed, run the following command in the package directory to add the package to
the system,:
    sencha package add force.pkg
You only need to run this once on your system. Sencha Cmd will keep a
copy of the package.

In order to use the package in an app that was generated with Sencha
Cmd, do the following:

1. Edit your <appdir>/app.json file and add the package to the list of
requirements for your app, e.g.:

      /**
      * List of package names to require for the cmd build process
      */
      "requires": [
        "force"
      ],
This will instruct the Sencha Cmd to add the app when building your application.

2. Add the package to your code path for development by adding the
following to the top of your application's app.js file:

      //<debug>
      Ext.Loader.setPath({
        'Ext.force': 'packages/force/src',
      });
      //</debug>

3. Finally, run the following command in the application's root directory
to have Sencha Command install the package:

      sencha app refresh -packages
You will notice that your application directory now has a 'packages'
directory with a 'force' subdirectory where the package resides.

## Using the package in your app

There are two things you need to do in order to use the package:

1. Set up an Ext.force.Force object which authenticates with Force.com
and allows the app to access data remotely. See the documentation of
the class for examples.
2. Configure a store with an Ext.force.ForceProxy proxy. See the
documentation of the class for examples on how to use.

## Register for a Developer Edition Instance on Force.com

On the Salesforce Platform, you can get a Developer Edition licensed instance (which is sometimes called an org, short for organization).  This instance is completely free and never expires, meaning that you can build your applications without a risk of cost.

In order to get a Developer Edition instance, go here:

[http://developer.force.com/join ](http://developer.force.com/join)


## Creating a Connected App Definition on Force.com
For a third party application to communicate with Salesforce API’s
securely, they must have a Connected App definition.  This will give
the app the keys required to identify itself  and allow a Salesforce
admin to control it:

1. Log into your Developer Edition Org.
2. Open the Setup menu by clicking [Your Name] > Setup.
3. Create a new Connected App by going to App Setup > Create > Apps.
4. Click the ‘New’ button in the Connected Apps list.
5. Fill out all required fields and click ‘Save’:
6. Connected App: YourAppName
7. Developer Name: YourAppName
8. Contact Email: Your email
9. Callback URL: https://(yourapplicationurl)/index.html
NOTE: This must have an https:// secure URL, or run on localhost.
Select all available OAuth scopes

In node//touchapp/app.js, update the client ID to be the Consumer Key and callback URL to be the callback URL from the Connected App definition.

## Installing the sample application on Heroku
1. Sign up for a Heroku account. If you do not have an existing Heroku account, sign up here:
[https://id.heroku.com/signup ](https://id.heroku.com/signup)

2. Download the Heroku Toolbelt. Heroku uses a polyglot framework that is tied to the source control software git.  When an application is pushed via git to a Heroku endpoint, the framework handles the required dependencies for deployment.  Heroku also offers command line tools for monitoring and controlling the application itself.  To download the Heroku Toolbelt, go here:
[https://toolbelt.heroku.com/](https://toolbelt.heroku.com/)

3. Init git and log into Heroku.  In the command line, go to the
application directory and run:
		git init
		git add -A
		git commit -m 'first commit'
		heroku login

4. Create the Heroku Application. 
		heroku apps:create
or
        heroku apps:create {appname}
Where {appname} refers to the desired app name.  Without the app name set, Heroku will autogenerate a random appname for you.  This will create the remote endpoints for deploying to Heroku.

5. Deploy to Heroku. With Heroku, this can be done easily using git to push the code.  On the command line, enter: 

        git push heroku master

## Installing the Salesforce Mobile SDK
Learn more about the Salesforce Mobile SDK here: [http://developer.force.com/mobile](http://developer.force.com/mobile)

Using NPM, you install the following packages:
- forceios
- forcedroid

To get the latest version of the Salesforce Mobile SDK:
[https://github.com/forcedotcom/SalesforceMobileSDK-iOS](https://github.com/forcedotcom/SalesforceMobileSDK-iOS)
[https://github.com/forcedotcom/SalesforceMobileSDK-Android](https://github.com/forcedotcom/SalesforceMobileSDK-Android)


## Creating a Local Hybrid application with Salesforce Mobile SDK
Install the Touch Framework and this package.  Use the code from /local_hybrid as a start for your application.  Key differences in this sample from the node sample:
- Running locally, Cordova handles the login in a distinct window.  Ext.OnReady handles the flow, catches the success, authenticates and then loads the necessary store.
- Stores are set to autoLoad = false

Create a hybrid local sample application with the SDK.  Delete the
files inside www, except for:

- bootconfig.json (this holds your consumer key and other information for OAuth)
- cordova-2.3.0.js (the JavaScript side for Cordova)
- cordova.force.js (the JavaScript for the SDK Cordova plugins)

And replace with your own application.

## Creating a Remote Hybrid application with Salesforce Mobile SDK
Install the Touch Framework and this package.  Use the code from
/visualforce as a start for your application.  Key differences in this
sample from the node sample:

- Visualforce can set the session directly and in this case hands it to app.js via the local_session_id variable.

Compile the MobileSample_Sencha Visualforce page into your org.
Convert your app into a zip and load as a Static Resource.  In this demo, the static resource is named mysenchademo and was created from a production build directory.

Create a hybrid remote sample application with the SDK.  Set the remote URL to be /apex/MobileSample_Sencha.



