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
    extend: 'Ext.data.proxy.Ajax',

    requires: ['Ext.util.MixedCollection', 'Ext.Ajax'],
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
        //<debug>
        if (!force) {
            Ext.log.warn("Cannot make Force calls until the user has authenticated with SalesForce. Call Force.authenticate with the appropriate parameters first");
        }
        //</debug>
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
                //<debug>
                Ext.Logger.warn("Query: " + base);
                //</debug>
                return 'query?q=' + encodeURIComponent(base);
            },
            // Create a record
            'create': function() {
                //<debug>
                if (operation.getRecords().length > 1) {
                    Ext.Logger.warn("Too many records being created at once. The create operation can only handle one record at once");
                }
                //</debug>
                var rec = operation.getRecords()[0],
                    base = 'sobjects/' + modelName + '/';
                return base;
            },
            // Update a record
            'update': function() {
                //<debug>
                if (operation.getRecords().length > 1) {
                    Ext.Logger.warn("Too many records being updated at once. The update operation can only handle one record at once");
                }
                //</debug>
                var rec = operation.getRecords()[0],
                    base = 'sobjects/' + modelName + '/' + rec.get(model.getIdProperty())
                         + '?_HttpMethod=PATCH';
                return base;
            },
            // Destroy a record
            'destroy': function() {
                //<debug>
                if (operation.getRecords().length > 1) {
                    Ext.Logger.warn("Too many records being destroyed at once. The destroy operation can only handle one record at once");
                }
                //</debug>
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
            //<debug>
            if (!sorters[i].getProperty() && !sorters[i].getSortProperty()) {
                Ext.Logger.warn("Sorter or Grouper does not have a property or sortProperty defined: " + sorters[i]);
            }
            //</debug>
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
