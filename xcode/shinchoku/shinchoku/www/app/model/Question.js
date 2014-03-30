Ext.define('shinchoku.model.Question', {
  extend: 'Ext.data.Model',

  config: {
    fields: [
      'id',
      {name: 'from_user_id', type: 'string'},
      {name: 'to_user_id', type: 'string'},
      {name: 'last_feed_item_id', type: 'string'},
      {name: 'feed_count', type: 'int'},
      {name: 'created_at', type: 'date'},
      {name: 'updated_at', type: 'date'},
      {name: 'from_user_name', convert: function(value, record){
        var store = Ext.data.StoreManager.get('Users'),
            user = store.getById(record.get('from_user_id'));

        if(Ext.isEmpty(user)){
          return record.get('from_user_id');
        } else {
          return user.get('Name');
        }
      }},
      {name: 'to_user_name', convert: function(value, record){
        var store = Ext.data.StoreManager.get('Users'),
            user = store.getById(record.get('to_user_id'));

        if(Ext.isEmpty(user)){
          return record.get('to_user_id');
        } else {
          return user.get('Name');
        }
      }},
      {name: 'display_updated_datetime', convert: function(value, record){
        return Ext.Date.format(record.get('updated_at'), 'Y-m-d H:i:s');
      }}
    ],

    idProperty: 'id'
  }

});