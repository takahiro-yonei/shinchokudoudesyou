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
        asyncAjax: true,

        /**
         * @cfg {String} login User Id
         */
        userId: null,


        userName: null
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
                    'user_id' : credentials.userId,
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
                //<debug>
                Ext.Logger.error("Don't know how to authenticate. Please pass either a URI or a credentials object.");
                //</debug>
            }
        } else if(window.location.href.indexOf('visual.force.com') > -1) {
            oauthResponse = {
                'user_id': this.getUserId(),
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
            //<debug>
            Ext.Logger.warn("Did not receive token back from Force.com - not authenticated.");
            //</debug>
            // 2DO:handle error with authentication
            /*
             errorCallback({
             status: 0, 
             statusText: 'Unauthorized', 
             responseText: 'No OAuth response'
             });
             */
        } else {
            this.setSessionToken(oauthResponse.access_token, null, oauthResponse.instance_url, oauthResponse.refresh_token, oauthResponse.user_id);
            window.location.href = window.location.href.split('#')[0]+'#';
            Ext.force.Force.forceInstance = this; // Make the singleton object accessible to rest of app
            if (typeof(localStorage) != "undefined") {
                if(this.getSaveTokenLocally()) {
                    // Store token for next session
                    //console.log("Storing oauth");
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
        //console.log("Refreshing access token");
        
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
    setSessionToken: function(sessionId, apiVersion, instanceUrl, refreshToken, userId) {
        this.setSessionId(sessionId);
        if(userId != null){
            this.setUserId(userId);
        }
        this.setApiVersion((typeof apiVersion === 'undefined' || apiVersion === null) ? 'v29.0': apiVersion);
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
                        that.setSessionToken(response.access_token, null, response.instance_url);
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
                        that.setSessionToken(response.access_token, null, response.instance_url);
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

    postFeedWithMention: function(toUserId, text, callback, error){
        var path = Ext.String.format('/{0}/chatter/feeds/user-profile/me/feed-items', this.getApiVersion()),
            params = {
                'body': {
                    'messageSegments': [
                        {
                            'type': 'mention',
                            'id': toUserId
                        },{
                            'type': 'text',
                            'text': text
                        }
                    ]
                }
            };
        return this.ajax(path, callback, error, 'POST', params);

    },

    postCommentWithMention: function(feedItemId, text, callback, error){
        var path = Ext.String.format('/{0}/chatter/feed-items/{1}/comments', this.getApiVersion(), feedItemId),
            params = {
                'body': {
                    'messageSegments': [
                        {
                            'type': 'text',
                            'text': text
                        }
                    ]
                }
            };
        return this.ajax(path, callback, error, 'POST', params);

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
                        that.setSessionToken(refresh.access_token, null, refresh.instance_url);
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
