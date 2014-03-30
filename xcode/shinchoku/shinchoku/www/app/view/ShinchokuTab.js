Ext.define('shinchoku.view.ShinchokuTab', {
  extend: 'Ext.TabPanel',
  xtype: 'shinchokuMain',

  requires: [
    'Ext.TitleBar',
    'shinchoku.view.UserPanel',
    'shinchoku.view.ReplyPanel',
    'shinchoku.view.Setting'
  ],

  fullscreen: true,

  config: {
    tabBarPosition: 'bottom',
    activeItem: 0,
    itemId: 'mainView',
    items: [
      {
        xtype: 'userPanel',
        iconCls: 'team',
        title: 'Q'
      },{
        xtype: 'replyPanel',
        iconCls: 'info',
        title: 'A'
      },{
        xtype: 'setting',
        iconCls: 'user',
        title: 'User'
      }
    ]
  },

  initialize: function(){
    var me = this;

    me.callParent(arguments);
  }

});