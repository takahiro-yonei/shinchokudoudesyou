Ext.define('shinchoku.view.UserPanel', {
  extend: 'Ext.Container',
  xtype: 'userPanel',

  requires: [
    'Ext.TitleBar',
    'shinchoku.view.UserList',
    'shinchoku.view.UserDetail'
  ],

  config: {
    layout: 'fit',
    items: {
      itemId: 'userPanel',
      xtype: 'container',
      layout: 'card',
      activeItem: 0,
      title: 'yonet',

      items: [
        {
          itemId: 'userList',
          layout: 'fit',
          items: [
            {
              docked: 'top',
              xtype: 'titlebar',
              title: '進捗どうでしょう？'
            },{
              xtype: 'userList'
            }
          ]
        },{
          itemId: 'userDetail',
          layout: 'fit',
          items: [
            {
              docked: 'top',
              xtype: 'titlebar',
              title: '進捗どうでしょう？',
              items: [
                {
                  xtype: 'button',
                  ui: 'back',
                  text: '<<<',
                  itemId: 'backToUserListButton'
                }
              ]
            },{
              xtype: 'userDetail'
            }
          ],

          listeners: [
            {
              delegate: '#backToUserListButton',
              event: 'tap',
              fn: function(){
                this.fireEvent('backtouserlist');
              }
            }
          ]
        }
      ]
    }
    
  }


});