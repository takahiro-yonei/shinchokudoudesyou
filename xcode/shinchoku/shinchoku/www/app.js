/*
 This file is generated and updated by Sencha Cmd. You can edit this file as
 needed for your application, but these edits will have to be merged by
 Sencha Cmd when it performs code generation tasks such as generating new
 models, controllers or views and when running "sencha app upgrade".
 
 Ideally changes to this file would be limited and most work would be done
 in other places (such as Controllers). If Sencha Cmd cannot merge your
 changes and its generated code, it will produce a "merge conflict" that you
 will need to resolve manually.
 */

// DO NOT DELETE - this directive is required for Sencha Cmd packages to work.
//@require @packageOverrides

//<debug>
Ext.Loader.setPath({
 'Ext': 'touch/src',
 'Ext.ux': 'touch/src/ux',
 'Ext.force': 'packages/force/src',
 'shinchoku': 'app'
});
//</debug>

var force;
var logToConsole = cordova.require("salesforce/util/logger").logToConsole;

Ext.require([
 'Ext.data.Connection',
 'Ext.Ajax',
 'Ext.force.Force',
 'Ext.force.ForceReader',
 'Ext.force.ForceWriter',
 'Ext.force.ForceProxy',
 'Ext.device.*',
 'Ext.plugin.PullRefresh',
 'Ext.plugin.ListPaging',
 'Ext.ux.util.BootManager',
 'shinchoku.util.FeedChatter',
 'shinchoku.boot.SfdcAuthorization'
], function(){
  Ext.onReady(function(){
    


    Ext.ux.BootManager.init([{
      path: 'shinchoku.boot.SfdcAuthorization',
      callback: Ext.emptyFn
    }], {
      name: 'shinchoku',
  
      requires: [
        'Ext.MessageBox'
      ],

      controllers: [
        'Main'
      ],
      
      views: [
        'Main',
        'FollowFeedSheet'
      ],

      models: [
        'User',
        'Question'
      ],

      stores: [
        'Users',
        'Questions'
      ],

      icon: {
        '57': 'resources/icons/Icon.png',
        '72': 'resources/icons/Icon~ipad.png',
        '114': 'resources/icons/Icon@2x.png',
        '144': 'resources/icons/Icon~ipad@2x.png'
      },
      
      isIconPrecomposed: true,
      
      startupImage: {
        '320x460': 'resources/startup/320x460.jpg',
        '640x920': 'resources/startup/640x920.png',
        '768x1004': 'resources/startup/768x1004.png',
        '748x1024': 'resources/startup/748x1024.png',
        '1536x2008': 'resources/startup/1536x2008.png',
        '1496x2048': 'resources/startup/1496x2048.png'
      },
      
      launch: function() {
        logToConsole("Ext.application launch!");
      
        // Destroy the #appLoadingIndicator element
        Ext.fly('appLoadingIndicator').destroy();
      
        // Initialize the main view
        var viewMain = Ext.create('shinchoku.view.Main');
        Ext.Viewport.add(viewMain);

        var store = Ext.data.StoreManager.get('Users');
      },
      
      onUpdated: function() {
        Ext.Msg.confirm(
          "Application Update",
          "This application has just successfully been updated to the latest version. Reload now?",
          function(buttonId) {
            if (buttonId === 'yes') {
              window.location.reload();
            }
          }
        );
      }
    });
  });
});


