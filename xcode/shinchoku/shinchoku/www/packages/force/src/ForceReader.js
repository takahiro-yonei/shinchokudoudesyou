/**
 * This class is used to read {@link Ext.data.Model} data from the force.com server in a JSON format.
 * You should not need to change any configuration options here. See the documentation for {@link Ext.force.ForceProxy}
 * for more information.
 *
 */
Ext.define('Ext.force.ForceReader', {
    extend: 'Ext.data.reader.Json',
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
