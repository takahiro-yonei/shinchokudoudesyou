Ext.define('shinchoku.view.Main', {
  extend: 'Ext.Container',
  xtype: 'appMain',

  requires: [
    'Ext.TitleBar',
    'shinchoku.view.ShinchokuTab'
  ],

  config: {
    layout: 'fit',
    items: [
      {
        xtype: 'shinchokuMain'
      }
    ]
  },

  initialize: function(){
    var me = this;

    me.callParent(arguments);
  }

});