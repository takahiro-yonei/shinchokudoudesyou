Ext.define('shinchoku.store.Users', {
  extend: 'Ext.data.Store',

  config: {
    model: 'shinchoku.model.User',
    autoLoad: false,
    remoteSort: true,
    sorters: 'UserType, FirstName',
    remoteGroup: false,

    filters: [
      {property: 'IsActive', value: true}
    ],

    proxy: {
      type: 'force',
      table: 'User'
    }
  }
});