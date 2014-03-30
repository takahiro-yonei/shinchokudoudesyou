/**
 * This class is used to write {@link Ext.data.Model} data to the force.com server in a JSON format.
 * You should not need to change any configuration options here. See the documentation for {@link Ext.force.ForceProxy}
 * for more information.
 */
Ext.define('Ext.force.ForceWriter', {
    extend: 'Ext.data.writer.Json',
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
