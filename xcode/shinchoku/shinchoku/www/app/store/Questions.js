Ext.define('shinchoku.store.Questions', {
  extend: 'Ext.data.Store',

  config: {
    model: 'shinchoku.model.Question',
    autoLoad: false,
    remoteSort: true,
    sorters: [{property: 'updated_at', direction: 'DESC'}],
    remoteGroup: false,
    clearOnPageLoad: true,

    proxy: {
      type: 'ajax',
      url: 'https://shinchokudoudesyo.herokuapp.com/shinchoku/xxxxxx/view',
      headers: {
        'X-Sfdc-Token': force.getSessionId(),
        'X-Sfdc-Refresh-Token': force.getRefreshToken(),
        'X-Sfdc-InstanceUrl': force.getInstanceUrl(),
        'X-Sfdc-ApiVersion': force.getApiVersion()
      },
      model: 'shinchoku.model.Question',
      reader: {
        type: 'json',
        rootProperty: 'records'
      }
    }
  }
});