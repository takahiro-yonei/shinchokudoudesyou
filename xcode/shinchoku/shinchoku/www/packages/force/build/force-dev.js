/**
 * @author Eran Davidov based on forcetk
 *
 * Force is port of the forcetk to Sencha Touch. It can be used to access low
 * level Force.com REST API, e.g. run SOQL queries, fetch object metadata and
 * info, etc.
 * 
 * Note: The documentation assumes that you're familiar with Force.com and 
 * how to create an app and obtain its OAuth2 client_id (client_secret). For
 * more information see http://www.force.com
 * 
 * ## Initialization
 * You only need to instantiate one Force object. Once it is initialized, it 
 * will populate a global instance at {@link Ext.force.Force.forceInstance}.
 * 
 * Since Force.com authentication might require redirecting to Force.com 
 * then returning to the application, handle the instantiation as early as
 * possible in the app. You can do this in your Ext.onReady method in app.js
 * as follows:
 * 
 *     Ext.onReady(function() {
 *       var forceParams = {
 *           local: {
 *             clientId: CLIENT_ID,
 *             redirectUrl: 'http://localhost:8888/index.html'
 *           },
 *           remote: {
 *               clientId: CLIENT_ID,
 *               redurectUrl: 'https://touchsf.heroku.com/index.html'
 *           }
 *       },
 *       mode = window.location.href.indexOf('//localhost') >= 0 ? 'local' : 'remote';
 *       
 *       console.log("Instantiating Force");
 *       force = Ext.create('Ext.force.Force', {
 *          clientId: CLIENT_ID_HERE,
 *          proxyUrl: "/proxy/",
 *       });
 *       force.authenticate(OAUTH_REDIRECT_URL); // e.g. This is where we'll be redirected back from Force.com after the authentication is complete. It must match what's defined in Force.com in the application's settings. Example: http://localhost:8888/index.html
 *     });
 * 
 * If the application is already authenticated and authorized, execution will
 * continue to launch the app. Otherwise, the browser will be redirected to
 * Force.com and after the user has authenticated and authrized the app, will be
 * redirected back to go through the force initialization again (this time 
 * without the redirect).
 * 
 * 
 * ## Using the API
 * 
 * Once authenticated, the force object may be used to query Force.com through
 * any of the defined API. For example, running an SOQL query can be done as
 * follows:
 *  
 *      force.query("SELECT Name from Contact", function(xhrResponse) {
 *          console.log("Received response from server: " + xhrResponse.responseText);
 *        }, function(xhrResponse) {
 *          console.log("Could not process SOQL: " + xhrResponse.status);
 *        }
 *      );
 * 
 */

Ext.define('Ext.force.Force', {
    
    statics: {
        /*
         * Once authenitcated, a global Force object will appear here for all proxies to be able to use. If you need access to lower level Force.com API, use this instance.
         */
        forceInstance: null,
    },
    
    config:{
        /**
         * @cfg {String} clientId the Force.com OAuth2 client_id.
         */
        clientId: null,
        
        /** 
         * @cfg {String} loginUrl The URL to redirect to for logging the user into salesforce.
         */
        loginUrl: 'https://login.salesforce.com/',
        
        /**
         * @cfg {String} proxyUrl The URL to use to proxy Force.com calls to the server. This must be provided for apps hosted off Force.com since Force.com does not allow cross-origin access from other web sites. Do not provide any value if you're hosting on Force.com, or using a native wrapper to run your application from a file:// location.
         */
        proxyUrl: null,
        
        /**
         * @cfg {Boolean} saveTokenLocally If <tt>true</tt>, will store the token locally in the browser for the next execution of the app, instead of requiring re-authentication with SalesForce every time the app is launched. This implies checking for a stored token upon app start. If <tt>false</tt>, no token will be looked for and the received token will not be stored. Defaults to <tt>true</tt>.
         */
        saveTokenLocally: true, 
        
       /**
        * @private
        */
        authzHeader: "Authorization",
        
        /**
         * Stores the refresh token received from the server.
         * @private 
         */
        refreshToken: null,
        
        /**
         * @cfg {String} sessionId 
         * Stores the session ID received from the server. Typically you do not need to provide this. For VisualForce apps hosted on the server, provide this when instantiating the class by retrieving it from the server with {!$Api.Session_ID}, e.g.
         *      Ext.create('Ext.force.Force', {
         *        sessionId: {!$Api.Session_ID},
         *      }
         *
         */
        sessionId: null,
        
        /**
         * Stores the API version received by the server.
         * @private
         */
        apiVersion: null,
        
        /**
         * Stores the instance URL received by the server.
         * @private
         */
        instanceUrl: null,
        
        /**
         * @cfg {Boolean} asyncAjax Set to make all ajax calls async.
         */
        asyncAjax: true
    },        
    
    constructor : function(config) {
        this.initConfig(config);
        if (this.getProxyUrl() === null) {
            if (location.protocol === 'file:') {
                // In PhoneGap
                this.setProxyUrl(null);
            } else {
                // In Visualforce
                this.setProxyUrl(location.protocol + "//" + location.hostname
                    + "/services/proxy");
            }
            this.setAuthzHeader("Authorization");
        } else {
            // On a server outside VF
            //this.setProxyUrl(proxyUrl); // no need to set, it's already configured
            this.setAuthzHeader("X-Authorization");
        }
        
    },
    
    /**
     * This library supports three ways of authenticating with the server:
     * 
     * 1. When hosted on a 3rd party server and redirecting to salesforce for OAuth2 authentication, you should provide the URL to redirect back to once done.
     * 2. When running as a packaged application on a phone (e.g. using PhoneGap Cordova), pass in the object received from the ChildBrowser plugin.
     * 3. If authenticating inside Force.com, call without any parameters. But make sure to provide the sessionID when creating the instance.
     * @param {String/Object} param can either be a URI in the app to redirect to after authentication, a credentials object recieved from ChildBrowser or nothing for Force.com authentication.
     */
    authenticate: function(param) {
        var redirectUri = param,
            credentials = param;
	if(this.getSessionId() == null) {
	    var oauthResponse = {};
	    if (window.location.hash && window.location.href.indexOf('access_token') > 0) {
		var message = window.location.hash.substr(1);
		var nvps = message.split('&');
		for (var nvp in nvps) {
		    var parts = nvps[nvp].split('=');
		    oauthResponse[parts[0]] = unescape(parts[1]);
		}
            } else if (Ext.isObject(credentials) && (credentials.accessToken || (credentials.data && credentials.data.accessToken))) {
                if (credentials.data) {
                    credentials = credentials.data;
                }
                oauthResponse = {
                    'access_token' : credentials.accessToken,
                    'instance_url' : credentials.instanceUrl,
                    'refresh_token' : credentials.refreshToken
                };
	    } else if (this.getSaveTokenLocally() && typeof(localStorage) != "undefined" && localStorage.salesforceToken) {
                // we have a stored token. Use it
                oauthResponse = JSON.parse(localStorage.salesforceToken);
                //console.log("Using stored token: " + oauthResponse);
            } 
            // Now check if we have oauth authentication
	    if(oauthResponse['access_token']) {
                this.sessionCallback(oauthResponse);
            } else if (Ext.isString(redirectUri)) {
		url = this.getAuthorizeUrl(redirectUri);
		window.location.href = url;
	    } else {
                Ext.Logger.error("Don't know how to authenticate. Please pass either a URI or a credentials object.");
            }
           } else if(window.location.href.indexOf('visual.force.com') > -1) {
               oauthResponse = {
               'access_token' : this.getSessionId(),
               'instance_url' : 'https://'+window.location.hostname,
               'refresh_token' : null
               };
           this.sessionCallback(oauthResponse);
           }
    },
    
    /**
     * @private
     */
    getAuthorizeUrl: function(redirectUri) {
        return this.getLoginUrl()+'services/oauth2/authorize?display=touch'
            +'&response_type=token&client_id='+escape(this.getClientId())
            +'&redirect_uri='+escape(redirectUri);
    },

    /** 
     * Called once redirected back from a login request.
     * @private
     */
    sessionCallback: function(oauthResponse) {
        if (typeof oauthResponse === 'undefined'
            || typeof oauthResponse['access_token'] === 'undefined') {
            Ext.Logger.warn("Did not receive token back from Force.com - not authenticated.");
            // 2DO:handle error with authentication
            /*
             errorCallback({
             status: 0, 
             statusText: 'Unauthorized', 
             responseText: 'No OAuth response'
             });
             */
        } else {
            this.setSessionToken(oauthResponse.access_token, null, oauthResponse.instance_url, oauthResponse.refresh_token);
	    window.location.href = window.location.href.split('#')[0]+'#';
            Ext.force.Force.forceInstance = this; // Make the singleton object accessible to rest of app
            if (typeof(localStorage) != "undefined") {
                if(this.getSaveTokenLocally()) {
                    // Store token for next session
                    console.log("Storing oauth");
                    localStorage.salesforceToken = JSON.stringify(oauthResponse);
                } else {
                    // remove any existing stored token - it might be obsolete by the time we come back to use it
                    localStorage.salesforceToken = null;
                    delete localStorage.salesforceToken; 
                }
            }
            //2DO: add callback in future
        }
    },

    
    
    /**
     * Refresh the access token. This is called by the library APIs and the Proxy in case the token expired in order to renew it.
     * @param callback function to call on success
     * @param error function to call on failure
     */
    refreshAccessToken: function(callback, error) {
        var that = this;
        var url = this.getLoginUrl() + '/services/oauth2/token';
        console.log("Refreshing access token");
        
        var headers = {};
        if (that.getProxyUrl() !== null) {
            headers['SalesforceProxy-Endpoint'] = url;
        }
        
        return Ext.Ajax.request({
            method: 'POST',
            url: (that.getProxyUrl() !== null) ? that.getProxyUrl(): url,
            disableCaching: true,
            params: 'grant_type=refresh_token&client_id=' + this.getClientId() + '&refresh_token=' + this.getRefreshToken(),
            success: callback,
            failure: error,
            dataType: "json",
            headers: headers
        });
        
        /*
        return $j.ajax({
            type: 'POST',
            url: (this.proxyUrl !== null) ? this.proxyUrl: url,
            cache: false,
            processData: false,
            data: 'grant_type=refresh_token&client_id=' + this.clientId + '&refresh_token=' + this.refreshToken,
            success: callback,
            error: error,
            dataType: "json",
            beforeSend: function(xhr) {
                if (that.proxyUrl !== null) {
                    xhr.setRequestHeader('SalesforceProxy-Endpoint', url);
                }
            }
        });
         */
    },

    /**
     * Set a session token and the associated metadata in the client.
     * @param {String} sessionId a salesforce.com session ID. In a Visualforce page,
     *                   use '{!$Api.sessionId}' to obtain a session ID.
     * @param {String} apiVersion Force.com API version defaults to v24.0
     * @param {String} instanceUrl Omit this if running on Visualforce; otherwise 
     *                   use the value from the OAuth token.
     * @private
     */
    setSessionToken: function(sessionId, apiVersion, instanceUrl, refreshToken) {
        this.setSessionId(sessionId);
        this.setApiVersion((typeof apiVersion === 'undefined' || apiVersion === null)
            ? 'v28.0': apiVersion);
        if (typeof instanceUrl === 'undefined' || instanceUrl == null) {
            // location.hostname can be of the form 'abc.na1.visual.force.com',
            // 'na1.salesforce.com' or 'abc.my.salesforce.com' (custom domains). 
            // Split on '.', and take the [1] or [0] element as appropriate
            var elements = location.hostname.split(".");
            
            var instance = null;
            if(elements.length == 4 && elements[1] === 'my') {
                instance = elements[0] + '.' + elements[1];
            } else if(elements.length == 3){
                instance = elements[0];
            } else {
                instance = elements[1];
            }
            
            this.setInstanceUrl("https://" + instance + ".salesforce.com");
        } else {
            this.setInstanceUrl(instanceUrl);
        }
        // only if we received a refresh token
        if (refreshToken != undefined) {
            this.setRefreshToken(refreshToken);
        }
        
        // finally, update the cached version if needed:
        if (this.getSaveTokenLocally() && typeof(localStorage) != "undefined" && localStorage.salesforceToken) {
            var oauth = JSON.parse(localStorage.salesforceToken);
            // update session token and instance URL. Refresh token (if any) stays the same
            oauth.access_token = this.getSessionId();
            oauth.instance_url = this.getInstanceUrl();
            localStorage.salesforceToken = JSON.stringify(oauth);
        }

        
    },

    /*
     * Low level utility function to call the Salesforce endpoint.
     * @param {String} path resource path relative to /services/data
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which Ext.Ajax will call will be passed in case of error
     * @param {String} method HTTP method for call
     * @param {Object} payload payload for POST/PATCH etc or null if none
     * @private
     */
   
    ajax: function(path, callback, error, method, payload, retry) {
        var that = this;
        var url = this.getInstanceUrl() + '/services/data' + path;
        
        var headers = {
            'Content-Type': 'application/json',
            'X-User-Agent': 'sencha-salesforce-toolkit/' + that.getApiVersion()
        };
        headers[that.getAuthzHeader()] = "OAuth " + that.getSessionId();
        if (that.getProxyUrl() !== null) {
            headers['SalesforceProxy-Endpoint'] = url;
        }
        
        return Ext.Ajax.request({
            method: method || "GET",
            async: that.getAsyncAjax(),
            url: (this.getProxyUrl() !== null) ? this.getProxyUrl(): url,
            headers: headers,
            disableCaching: true,
            jsonData: payload, // if there's data, it's JSON data
            success: callback,
            failure:  (!that.getRefreshToken() || retry ) ? error : function(xhResponse, options) {
                if (xhResponse.status === 401) {
                    that.refreshAccessToken(function(oauthResponse) {
                        var response = Ext.JSON.decode(oauthResponse.responseText);
                        that.setSessionToken(response.access_token, null,
                                             response.instance_url);
                        that.ajax(path, callback, error, method, payload, true);
                    },
                                            error);
                } else {
                    error(xhResponse, options);
                }
            }
        });
                
    },

    /**
     * Utility function to query the Chatter API and download a file
     * Note, raw XMLHttpRequest because JQuery mangles the arraybuffer
     * This should work on any browser that supports XMLHttpRequest 2 because arraybuffer is required. 
     * For mobile, that means iOS >= 5 and Android >= Honeycomb
     * @author Tom Gersic
     * @param{String} path resource path relative to /services/data
     * @param {String} mimetype of the file
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which request will be passed in case of error
     * @param {Boolean} true if we've already tried refresh token flow once. For function internal use only.
     **/
    getChatterFile: function(path,mimeType,callback,error,retry) {
        var that = this;
        var url = this.getInstanceUrl() + path;

        var request = new XMLHttpRequest();
        
        request.open("GET",  (this.getProxyUrl() !== null) ? this.getProxyUrl(): url, true);
        request.responseType = "arraybuffer";
        
        request.setRequestHeader(that.getAuthzHeader(), "OAuth " + that.getSessionId());
        request.setRequestHeader('X-User-Agent', 'sencha-salesforce-toolkit/' + that.getApiVersion());
        if (this.getProxyUrl() !== null) {
            request.setRequestHeader('SalesforceProxy-Endpoint', url);
        }
        
        request.onreadystatechange = function() {
            // continue if the process is completed
            if (request.readyState == 4) {
                // continue only if HTTP status is "OK"
                if (request.status == 200) {
                    try {
                        // retrieve the response
                        callback(request.response);
                    }
                    catch(e) {
                        // display error message
                        alert("Error reading the response: " + e.toString());
                    }
                }
                //refresh token in 401
                else if(request.status == 401 && !retry) {
                    that.refreshAccessToken(function(oauthResponse) {
                        var response = Ext.JSON.decode(oauthResponse.responseText);
                        that.setSessionToken(response.access_token, null,response.instance_url);
                        that.getChatterFile(path, mimeType, callback, error, true);
                    },
                                            error);
                } 
                else {
                    // display status message
                    error(request,request.statusText,request.response);
                }
            }            
            
        };

        request.send();
        
    },

    /*
     * Low level utility function to call the Salesforce endpoint specific for Apex REST API.
     * @param {String} path resource path relative to /services/apexrest
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which Ext.Ajax will be passed in case of error
     * @param {String} method HTTP method for call, defaults to "GET"
     * @param {Object} payload payload for POST/PATCH etc, or null if none
     * @param {Object} paramMap parameters to send as header values for POST/PATCH etc, defaults to {}
     * @param {Boolean} retry specifies whether to retry on error, for internal function use only
     */
    apexrest: function(path, callback, error, method, payload, paramMap, retry) {
        var that = this, paramName,
            url = this.getInstanceUrl() + '/services/apexrest' + path,
            headers = {
            'Content-Type': 'application/json',
            'X-User-Agent': 'sencha-salesforce-toolkit/' + that.getApiVersion()
        };
        
        headers[that.getAuthzHeader()] = "OAuth " + that.getSessionId();
        if (that.getProxyUrl() !== null) {
            headers['SalesforceProxy-Endpoint'] = url;
        }
	if (paramMap === null) {
	    paramMap = {};
	}
	for (paramName in paramMap) {
	    headers[paramName] = paramMap[paramName];
	}

        
        return Ext.Ajax.request({
            method: method || "GET",
            async: that.getAsyncAjax(),
            url: (that.getProxyUrl() !== null) ? that.getProxyUrl(): url,
            headers: headers,
            disableCaching: true,
            jsonData: payload,
            success: callback,
            failure: (!that.getRefreshToken() || retry ) ? error : function(xhResponse, options) {
                if (xhResponse.status === 401) {
                    that.refreshAccessToken(function(oauthResponse) {
                        var response = Ext.JSON.decode(oauthResponse.responseText);
                        that.setSessionToken(refresh.access_token, null,
                                             refresh.instance_url);
                        that.apexrest(path, callback, error, method, payload, paramMap, true);
                    },
                                            error);
                } else {
                    if (error) {
                        error(xhResponse, options);
                    }
                }
            }
        });
    },

    /*
     * Lists summary information about each Salesforce.com version currently 
     * available, including the version, label, and a link to each version's
     * root.
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    versions: function(callback, error) {
        return this.ajax('/', callback, error);
    },

    /*
     * Lists available resources for the client's API version, including 
     * resource name and URI.
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    resources: function(callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/', callback, error);
    },

    /*
     * Lists the available objects and their metadata for your organization's 
     * data.
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    describeGlobal: function(callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/sobjects/', callback, error);
    },

    /*
     * Describes the individual metadata for the specified object.
     * @param {String} objtype object type; e.g. "Account"
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    metadata: function(objtype, callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/sobjects/' + objtype + '/'
                         , callback, error);
    },

    /*
     * Completely describes the individual metadata at all levels for the 
     * specified object.
     * @param {String} objtype object type; e.g. "Account"
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    describe: function(objtype, callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/sobjects/' + objtype
                         + '/describe/', callback, error);
    },

    /*
     * Creates a new record of the given type.
     * @param objtype object type; e.g. "Account"
     * @param {Object} fields an object containing initial field names and values for 
     *               the record, e.g. {:Name "salesforce.com", :TickerSymbol 
     *               "CRM"}
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    create: function(objtype, fields, callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/sobjects/' + objtype + '/'
                         , callback, error, "POST", JSON.stringify(fields));
    },

    /*
     * Retrieves field values for a record of the given type.
     * @param objtype object type; e.g. "Account"
     * @param {String} id the record's object ID
     * @param {String} fields optional comma-separated list of fields for which
     *               to return values; e.g. Name,Industry,TickerSymbol
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    retrieve: function(objtype, id, fieldlist, callback, error) {
        if (!arguments[4]) {
            error = callback;
            callback = fieldlist;
            fieldlist = null;
        }
        var fields = fieldlist ? '?fields=' + fieldlist : '';
        this.ajax('/' + this.getApiVersion() + '/sobjects/' + objtype + '/' + id
                  + fields, callback, error);
    },

    /*
     * Upsert - creates or updates record of the given type, based on the 
     * given external Id.
     * @param {String} objtype object type; e.g. "Account"
     * @param {String}externalIdField external ID field name; e.g. "accountMaster__c"
     * @param {String} externalId the record's external ID value
     * @param {Object} fields an object containing field names and values for 
     *               the record, e.g. {:Name "salesforce.com", :TickerSymbol 
     *               "CRM"}
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    upsert: function(objtype, externalIdField, externalId, fields, callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/sobjects/' + objtype + '/' + externalIdField + '/' + externalId 
                         + '?_HttpMethod=PATCH', callback, error, "POST", JSON.stringify(fields));
    },

    /*
     * Updates field values on a record of the given type.
     * @param {String} objtype object type; e.g. "Account"
     * @param {String} id the record's object ID
     * @param {Object} fields an object containing initial field names and values for 
     *               the record, e.g. {:Name "salesforce.com", :TickerSymbol 
     *               "CRM"}
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    update: function(objtype, id, fields, callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/sobjects/' + objtype + '/' + id 
                         + '?_HttpMethod=PATCH', callback, error, "POST", JSON.stringify(fields));
    },

    /*
     * Deletes a record of the given type. Unfortunately, 'delete' is a 
     * reserved word in JavaScript.
     * @param {String} objtype object type; e.g. "Account"
     * @param {String} id the record's object ID
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    del: function(objtype, id, callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/sobjects/' + objtype + '/' + id
                         , callback, error, "DELETE");
    },

    /*
     * Executes the specified SOQL query.
     * @param {String} soql a string containing the query to execute - e.g. "SELECT Id, 
     *             Name from Account ORDER BY Name LIMIT 20"
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    query: function(soql, callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/query?q=' + escape(soql)
                         , callback, error);
    },
    
    /*
     * Queries the next set of records based on pagination.
     * <p>This should be used if performing a query that retrieves more than can be returned
     * in accordance with http://www.salesforce.com/us/developer/docs/api_rest/Content/dome_query.htm</p>
     * <p>Ex: forcetkClient.queryMore( successResponse.nextRecordsUrl, successHandler, failureHandler )</p>
     * 
     * @param {String} url - the url retrieved from nextRecordsUrl or prevRecordsUrl
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    queryMore: function( url, callback, error ){
        //-- ajax call adds on services/data to the url call, so only send the url after
        var serviceData = "services/data";
        var index = url.indexOf( serviceData );
        
        if( index > -1 ){
            url = url.substr( index + serviceData.length );
        } else {
            //-- leave alone
        }
        
        return this.ajax( url, callback, error );
    },

    /*
     * Executes the specified SOSL search.
     * @param {String} sosl a string containing the search to execute - e.g. "FIND 
     *             {needle}"
     * @param {Function} callback function to which response will be passed
     * @param {Function} error function to which XHR Response will be passed in case of error
     */
    search: function(sosl, callback, error) {
        return this.ajax('/' + this.getApiVersion() + '/search?q=' + escape(sosl)
                         , callback, error);
    }
    
});

/**
 * This class is used to read {@link Ext.data.Model} data from the force.com server in a JSON format.
 * You should not need to change any configuration options here. See the documentation for {@link Ext.force.ForceProxy}
 * for more information.
 *
 */
Ext.define('Ext.force.ForceReader', {
    extend:  Ext.data.reader.Json ,
    alias : 'reader.force',

    config: {
        
        rootProperty: 'records'

    },
    
    
    /**
     * If there's no "records" element in the data, create one with the ID of the object that was created.
     */
    getRoot: function(data) {
        if (data.records) {
            return data.records;
        }
        if (data.id) { // did we get a record ID from a create?
            return [
                {
                    Id: data.id
                }
            ];
        }
        if (data.request.options.operation.getAction() == "destroy" && data.status >= 200 && data.status < 300) {
            // this was a destroy operation. If it was successful, pull the ID out of the request
            return [
                {
                    Id: data.request.options.records[0].getId()
                }
            ];
        }
        // otherwise, return the data as is
        return data;
    }
    
    
});

/**
 * This class is used to write {@link Ext.data.Model} data to the force.com server in a JSON format.
 * You should not need to change any configuration options here. See the documentation for {@link Ext.force.ForceProxy}
 * for more information.
 */
Ext.define('Ext.force.ForceWriter', {
    extend:  Ext.data.writer.Json ,
    alias: 'writer.force',

    config: {
        writeAllFields:false // only write changed fields
    },

    //inherit docs
    writeRecords: function(request, data) {
        var rec = data;
        
        //<<debug>
        if (Ext.isArray(data) && data.length > 1) {
            // we only allow single updates at once for Force
            Ext.Logger.error("ForceWriter: Cannot update more than one record at once. received " + data.length + " records.");
        }
        //</debug>
        
        if (Ext.isArray(rec)) {
            rec = data[0];
        }
        
        if (rec) { // no record, nothing to do
            // remove the ID property from the record. Force gets that via the URL
            rec = Ext.apply({}, rec);
            delete rec[request.getOperation().getModel().getIdProperty()];
            
            request.setJsonData(rec);
        }
        
        return request;
        
    }

 });

/**
 * @author Eran Davidov
 *
 * The {@link Ext.force.ForceProxy ForceProxy} class is meant to be used with a {@link Ext.data.Store} in order to fetch information from and update a Force.com via the salesforce REST API.
 * 
 * Before the proxy can be used, a {@link Ext.force.Force Force} object must be instantiated, which will handle any needed user authentication and authorization. See the documentation for {@link Ext.force.Force} for more details on instantiating the class.
 * 
 * The proxy uses SOQL to fetch lists of objects into the store, then allows the store to update and delete individual records, as well as create new ones. 
 * 
 * ## Defining a Store
 * 
 * You define a store with a Force.com proxy as follows:
 * 
 *     var myStore = Ext.create("Ext.data.Store", {
 *       model: "Contact",
 *       proxy: {
 *         type: 'force',
 *         table: 'Contact',
 *       }
 *     });
 *
 * Note that the proxy only fetches the fields defined in the model, not the entire data structure in Force.com. That means that if the local Contact model only defines the 'Name' and 'Id' fields, only those fields will be fetched.
 * The 'Id' field must be defined and must be called out as the ID, as follows:
 * 
 *     Ext.define('forceapp.model.Contact', {
 *       extend: 'Ext.data.Model',
 *
 *       config: {
 *         fields: [
 *          'Id',
 *          'FirstName',
 *          {name:'Birthdate', type:'date'}
 *        ],
 *        idProperty: 'Id' // Let Sencha Touch know which field is the ID for the object
 *       }
 *     });
 *
 * 
 * ## Configuring the Proxy
 * 
 * ### Table Name
 * 
 * The {@link Ext.force.ForceProxy#table table} configuration parameter tells the proxy which table to read from / write to on Force.com. By default, the name of the table is derived from the model, but if your model is called SampleApp.store.Contact, you should explicitly set the table name to 'Contact' to identify the Force.com table.
 * 
 * 
 * ## Configuring the Store
 * 
 * Configuring the store changes the behavior of the proxy. 
 * 
 * ### Paging
 * 
 * By default, SOQL queries will fetch a 25-record page from the server. You can disable paging by setting {@link Ext.data.proxy.Server#pageParam pageParam} to <tt>false</tt> as follows:
 * 
 *     var myStore = Ext.create("Ext.data.Store", {
 *       model: "Contact",
 *       pageParam: false,
 *       proxy: {
 *         type: 'force',
 *         table: 'Contact',
 *       }
 *     });
 * 
 * You can change the page size and paging behavior by tweaking the paging parameters for of the proxy as documented in {@link Ext.data.proxy.Server}.
 * 
 * 
 * ### Remote Filters
 * 
 * By default Sencha Touch stores do filtering locally. If you'd like to use the SOQL WHERE clause to filter remotely, you must first set the store's {@link Ext.data.Store#remoteFilter} configuration option to true. You can then define filters that will be passed to the server.
 * 
 *     var myStore = Ext.create("Ext.data.Store", {
 *       model: "Contact",
 *       remoteFilter: true,
 *       filters: {property: 'Email', value:'\%.com'},
 *       proxy: {
 *         type: 'force',
 *         table: 'Contact',
 *       }
 *     });
 *
 * 
 * The above example filters by any email that ends in ".com" and translates into a <tt>WHERE Email like '%.com'</tt> clause in the SOQL query.
 * 
 * Additional supported filters include exact textual match:
 * 
 *     filters: {property: 'Email', value:'eran@socialbuglabs.com'}
 * 
 * Exact DateTime matches (only for fields defined in the model to be of type <tt>date</tt>):
 * 
 *     filters: {property: 'LastUpdated', value: new Date()}
 * This will convert the date value to a full date-time ISO8601 value in the WHERE clause.
 * 
 * Date matches (only for fields defined in the model to be of type <tt>date</tt>):
 * 
 *     filters: {property: 'Birthdate', value: '1990-06-03'}
 * 
 * Note: In this case the WHERE clause will contain exactly the value provided without enclosing quote marks, e.g. WHERE Birthdate = 1996-06-03
 * 
 * Boolean matches:
 * 
 *     filters: {property: 'Working', value: true} // or false
 * 
 * Note: This is converted to WHERE Working = TRUE 
 * 
 * Generic SOQL WHERE segments (possibly multiple segments to be appended with AND):
 * 
 *     filters: [
 *       {property: 'SOQL', value:'Birthdate > 1970-01-01'},
 *       {property: 'SOQL', value:'Birthdate < 1979-12-31'},
 *      ]
 * 
 * ### Remote Sorting
 * 
 * By default Sencha Touch stores sort the fetched data locally. To have the SOQL query include an ORDER BY clause for the server, you must set the <tt>remoteSort</tt> property to <tt>true</tt> like this:
 * 
 *     var myStore = Ext.create("Ext.data.Store", {
 *       model: "Contact",
 *       remoteSort: true,
 *       sorters: 'FirstName', // can also be an array of field names. See the Store class documentation for more information.
 *       proxy: {
 *         type: 'force',
 *         table: 'Contact',
 *       }
 *     });
 * 
 * ### Local Grouping when Using Remote Sorting
 * 
 * Sencha Touch grouping can be used to visually group records together based on an arbitrary characteristic. This is not to be confused with SOQL grouping that merges records together. If you use Sencha Touch grouping (which relies on sorting the records) and also use remote sorting, you must provide the name of the field to sort by, as follows:
 *
 * 
 * 
 *     var myStore = Ext.create("Ext.data.Store", {
 *       model: "Contact",
 *       remoteSort: true,
 *       sorters: 'FirstName', // can also be an array of field names. See the Store class documentation for more information.
 *       remoteGroup: true,
 *       grouper: {
 *         groupFn: function(record) {
 *           return record.get('LastName')[0]; // Assuming we've defined LastName as a field to fetch in the model
 *         },
 *         sortProperty: 'LastName' // tell the proxy to add an ORDER BY LastName
 *       },
 *       proxy: {
 *         type: 'force',
 *         table: 'Contact',
 *       }
 *     });
 * 
 * 
 * ## Limitations
 * The proxy currently does not provide support for date fields. These can be read from the server, but will be sent back as datetime.
 * 
 */
Ext.define('Ext.force.ForceProxy', {
    extend:  Ext.data.proxy.Ajax ,

                                                       
    alias: 'proxy.force',

    config: {
        /**
         * Disabled since Force.com does not support multiple operations in the same action.
         * @private
         */
        batchActions: false, 
        
        /**
         * @cfg {Boolean} useDefaultXhrHeader
         * Since cross-domain requests are not supported by Force.com, we set this to <tt>true</tt>.
         * @private
         */
        useDefaultXhrHeader: true,

        /**
         * @property {Object} actionMethods
         * Map to Force.com required method.
         * @private
         */
        actionMethods: {
            create : 'POST',
            read   : 'GET',
            update : 'POST',
            destroy: 'DELETE'
        },
        
        /**
         * @cfg {String} table
         * Optional Table name to use. If not provided the model's name will be used
         */
        table: null,

        /**
         * @cfg {Object} [headers=undefined]
         * Any headers to add to the Ajax request.
         * @private
         */
        headers: {
            'Content-Type': 'application/json'
        },
        
        reader: 'force',
        writer: 'force'
    },
    
    
    /**
     * Performs Ajax request.
     * @protected
     * @param operation
     * @param callback
     * @param scope
     * @return {Object}
     */
    doRequest: function(operation, callback, scope) {
        var me = this,
            writer  = me.getWriter(),
            request = me.buildRequest(operation),
            force=Ext.force.Force.forceInstance;

        request.setConfig({
            headers  : me.getHeaders(),
            timeout  : me.getTimeout(),
            method   : me.getMethod(request),
            callback : me.createRequestCallback(request, operation, callback, scope),
            scope    : me,
            proxy    : me,
            useDefaultXhrHeader: me.getUseDefaultXhrHeader()
        });
        
        
        var headers = request.getHeaders();
        headers['X-User-Agent'] = 'sencha-touch/' + force.getApiVersion();
        headers[force.getAuthzHeader()] = "OAuth " + force.getSessionId();
        if (force.getProxyUrl() !== null) {
            headers['SalesforceProxy-Endpoint'] = request.getUrl();
            request.setUrl(force.getProxyUrl());
        }
        
        /*
        failure:  (!that.getRefreshToken() || retry ) ? error : function(xhResponse, options) {
                if (xhResponse.status === 401) {
                    that.refreshAccessToken(function(oauthResponse) {
                        var response = Ext.JSON.decode(oauthResponse.responseText);
                        that.setSessionToken(response.access_token, null,
                                             response.instance_url);
                        that.ajax(path, callback, error, method, payload, true);
                    },
                                            error);
                } else {
                    error(xhResponse, options);
                }
*/        
        
        
        
        
        
        if (operation.getWithCredentials() || me.getWithCredentials()) {
            request.setWithCredentials(true);
            request.setUsername(me.getUsername());
            request.setPassword(me.getPassword());
        }

        // We now always have the writer prepare the request
        request = writer.write(request);

        Ext.Ajax.request(request.getCurrentConfig());

        return request;
    },
    
    /**
     * Creates and returns an Ext.data.Request object based on the options passed by the {@link Ext.data.Store Store}
     * that this Proxy is attached to.
     * @param {Ext.data.Operation} operation The {@link Ext.data.Operation Operation} object to execute
     * @return {Ext.data.Request} The request object
     */
    buildRequest: function(operation) {
        var me = this,
            params = Ext.applyIf(operation.getParams() || {}, me.getExtraParams() || {}),
            request,
            args = me.getParams(operation); //fetch any sorters, filters etc separately to encode them appropriately
        
        //params = Ext.applyIf(params, me.getParams(operation));

        request = Ext.create('Ext.data.Request', {
            params   : params,
            args: args, //  use the request's args parameter to store any modifiers for later processing
            action   : operation.getAction(),
            records  : operation.getRecords(),
            url      : operation.getUrl(),
            operation: operation,
            proxy    : me
        });
        
        request.setUrl(me.buildUrl(request));
                
        operation.setRequest(request);

        return request;
    },

    
    
    
    /**
     * Returns the HTTP method name for a given request. By default this returns based on a lookup on
     * {@link #actionMethods}.
     * @param {Ext.data.Request} request The request object.
     * @return {String} The HTTP method to use (should be one of 'GET', 'POST', 'PUT' or 'DELETE').
     */
    getMethod: function(request) {
        return this.getActionMethods()[request.getAction()];
    },

    /**
     * @private
     * @param {Ext.data.Request} request The Request object.
     * @param {Ext.data.Operation} operation The Operation being executed.
     * @param {Function} callback The callback function to be called when the request completes.
     * This is usually the callback passed to `doRequest`.
     * @param {Object} scope The scope in which to execute the callback function.
     * @return {Function} The callback function.
     */
    createRequestCallback: function(request, operation, callback, scope) {
        var me = this,
            force=Ext.force.Force.forceInstance;

        return function(options, success, response) {
            // Do we need to flag to operation to avoid circular refreshes?
            if (!success && force.getRefreshToken() && response.status === 401) {
                force.refreshAccessToken(
                    function(oauthResponse) {
                        var response = Ext.JSON.decode(oauthResponse.responseText);
                        force.setSessionToken(response.access_token, null,
                                              response.instance_url);
                        me.doRequest(operation, callback, scope); // restart the operation
                    },
                    function(response) {
                        // error function will process the original failure
                        me.processResponse(success, operation, request, response, callback, scope);
                    });
            } else {
                // success, or failure unrelated to the token, pass it on
                me.processResponse(success, operation, request, response, callback, scope);
            }
        };
    },

    // Force specific changes:
    
    /**
     * Return the generic URL on which the Writer will add additional parameters
     * @private
     * @param {Ext.data.Request} request The request
     * @return {String} The url
     */
    getUrl: function(request) {
        var me=this, url,
            force=Ext.force.Force.forceInstance,
            action=request.getAction(),
            model = this.getModel(),
            modelName= me.getTable() ? me.getTable() : model.getName(),
            operation=request.getOperation(),
            params = request.getArgs(),
            sortParam = me.getSortParam(),
            pageParam = me.getPageParam(),
            limitParam = me.getLimitParam(),
            startParam = me.getStartParam(),
            filterParam = me.getFilterParam();
        if (!force) {
            Ext.log.warn("Cannot make Force calls until the user has authenticated with SalesForce. Call Force.authenticate with the appropriate parameters first");
        }
        // start with a Base URL. Specifics will be updated by the writer
        url = force.getInstanceUrl() + '/services/data' + '/' + force.getApiVersion() + '/';
        
        var urlBuilder = {
            // read entire or subset of table
            'read': function() {
                var fieldNames = me.getModel().getFields().keys,
                    base;
                base = 'select ' + fieldNames.join(',') + ' from ' + modelName;
                // filtering
                if (params[filterParam]) {
                    base += " WHERE " + params[filterParam];
                }
                
                // Sorting
                if (params[sortParam]) {
                    base += " ORDER BY " + params[sortParam];
                }
                
                // paging
                if (params[pageParam] !== undefined) {
                    base += ' LIMIT ' + parseInt(params[limitParam], 10) + ' OFFSET ' + parseInt(params[startParam], 10);
                }
                Ext.Logger.warn("Query: " + base);
                return 'query?q=' + encodeURIComponent(base);
            },
            // Create a record
            'create': function() {
                if (operation.getRecords().length > 1) {
                    Ext.Logger.warn("Too many records being created at once. The create operation can only handle one record at once");
                }
                var rec = operation.getRecords()[0],
                    base = 'sobjects/' + modelName + '/';
                return base;
            },
            // Update a record
            'update': function() {
                if (operation.getRecords().length > 1) {
                    Ext.Logger.warn("Too many records being updated at once. The update operation can only handle one record at once");
                }
                var rec = operation.getRecords()[0],
                    base = 'sobjects/' + modelName + '/' + rec.get(model.getIdProperty())
                         + '?_HttpMethod=PATCH';
                return base;
            },
            // Destroy a record
            'destroy': function() {
                if (operation.getRecords().length > 1) {
                    Ext.Logger.warn("Too many records being destroyed at once. The destroy operation can only handle one record at once");
                }
                var rec = operation.getRecords()[0],
                    base = 'sobjects/' + modelName + '/' + rec.get(model.getIdProperty());
                return base;
                
            }
        };
        url += urlBuilder[action]();
        return url;
    },
    
    /**
     * Encodes the array of {@link Ext.util.Sorter} objects into a string to be sent in the request url. This is a simple SOQL list, with ASC or DESC appended. SalesForce does not support multiple sort orders, so only the order of the first supplied sorter will be used.
     * @param {Ext.util.Sorter[]} sorters The array of {@link Ext.util.Sorter Sorter} objects
     * @return {String} The encoded sorters
     * @private
     */
    encodeSorters: function(sorters) {
        var min = [],
            length = sorters.length,
            i = 0,
            sortClause = "",
            sorterList = [];
        for (i in sorters) {
            if (!sorters[i].getProperty() && !sorters[i].getSortProperty()) {
                Ext.Logger.warn("Sorter or Grouper does not have a property or sortProperty defined: " + sorters[i]);
            }
            sorterList.push(sorters[i].getProperty() || sorters[i].getSortProperty());
        }
        sorterList = Ext.clean(sorterList); // remove any undefined property names
        sortClause = sorterList.join(", ") + " " + sorters[0].getDirection();
        return sortClause;
    },

    /**
     * Encodes the array of {@link Ext.util.Filter} objects into a string to be sent in the request url. Can only handle property / value pairs, not functions or regexes, since it's being sent as an SOQL query to the server. If value contains the % character, a Like expression will be generated instead of exact equality.
     * @param {Ext.util.Filter[]} filters The array of {@link Ext.util.Filter Filter} objects
     * @return {String} The encoded filters
     */
    encodeFilters: function(filters) {
        var terms = [], i, whereClause = "", filter,
            model = this.getModel(),
            fields = model.getFields(),
            field, index;
        for (i in filters) {
            if (filters[i].getProperty() && filters[i].getValue() !== undefined) {
                terms.push({
                    property: filters[i].getProperty(),
                    value   : filters[i].getValue()
                });
            }
        }
        if (terms.length == 0) {
            return nil; // no where clause
        }
        // now replace the terms one by one with SOQL terms
        for (i in terms) {
            filter = terms[i];
            field = fields.get(filter.property);
            if (filter.property == "SOQL") {
                // This is raw SOQL. Simply add it to the list
                terms[i] = filter.value;
            } else if (Ext.isBoolean(filter.value)) {
                terms[i] = filter.property + " = " + (terms[i].value ? "TRUE" : "FALSE");
            } else if (field && field.getType().type == "date") { 
                // It's a date field. Check the type of value provided
                if (Ext.isDate(filter.value)) {
                    terms[i] = filter.property + ' = ' + filter.value.toISOString();
                } else {
                    // not a date, so pass as-is
                    terms[i] = filter.property + ' = ' + filter.value;
                }
            } else if (Ext.isString(filter.value)) {
                var likeness = filter.value.indexOf('\%') != -1;
                terms[i] = filter.property + (likeness ? " LIKE " : " = ") + "'" + filter.value + "'";
            } else {
                // catch all, just do string conversion
                //<<debug>
                Ext.Logger.warn("ForceProxy does not handle the filter data type for " + filter.property + " of type " + typeof filter.value) ;
                //</debug>
                terms[i] = filter.property + " = " + filter.value;
            }
        }
        whereClause = terms.join(" AND ");
        return whereClause;
    }


});

