Ext.define('shinchoku.boot.SfdcAuthorization', {

  singleton: true,

  setup: function(callback) {

    var success = function(creds){
      logToConsole("OAuth Returned:: " + JSON.stringify(creds));
      force = Ext.create('Ext.force.Force', {
          clientId:'3MVG9I1kFE5Iul2CjEY6J14vu5G0opJ6K50hACzHl_HyGNEFv96OQIhrwVeWx13r45Xr.OGHVtzOoyXGB5s5H',
          saveTokenLocally: false,
          apiVersion: 'v29.0'
        });
      force.authenticate(creds);
      
      force.query("Select Id,Name,Username,Title,Email From User Where Id = '" + force.getUserId() + "'",
        function(xhrRes){
          logToConsole("user query: " + xhrRes.responseText);
          var rtnObj = Ext.JSON.decode(xhrRes.responseText),
              loginUserId = rtnObj["records"][0]["Id"],
              loginUserName = rtnObj["records"][0]["Name"];
          
          force.setUserId(loginUserId);
          force.setUserName(loginUserName);

          callback();
        },
        function(xhrRes){
          logToConsole("Err " + xhrRes.responseText);
          callback();
        }
      );
      
    };

    var failure = function(objection){
      logToConsole(objection);

      callback();
    };

    //Call OAuth plugin
    cordova.require("salesforce/plugin/oauth").authenticate(success, failure);

    return this;
  }

});
