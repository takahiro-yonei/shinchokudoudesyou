Ext.define('shinchoku.view.Setting', {
  extend: 'Ext.Container',
  xtype: 'setting',

  requires: [
    'Ext.TitleBar'
  ],

  config: {
    itemId: 'replyPanel',
    layout: 'fit',
    items: {
      xtype: 'container',
      layout: 'card',
      activeItem: 0,

      items: [
        {
          itemId: 'questionList',
          layout: 'fit',
          items: [
            {
              docked: 'top',
              xtype: 'titlebar',
              title: force.getUserName()
            },{
              layout: {
                type: 'vbox',
                pack: 'center',
                align: 'center'
              },
              items: [
                {
                  xtype: 'button',
                  ui: 'action',
                  itemId: 'logoutButton',
                  text: 'LogOut',
                  width: '60%'
                }
              ]
            }
          ]
        }
      ]
    },
    
    listeners: [
      {
        delegate: '#logoutButton',
        event: 'tap',
        fn: function(){
          cordova.require("salesforce/plugin/oauth").logout();
        }
      }
    ]

  }

});