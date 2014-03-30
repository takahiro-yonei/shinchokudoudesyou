Ext.define('shinchoku.view.FollowFeedSheet', {
  extend: 'Ext.ActionSheet',
  xtype: 'followFeedSheet',

  config: {
    callFrom: null,
    feedItemId: null,

    items: [
      {
        xtype: 'textareafield',
        label: 'フォロー',
        name: 'comment',
        placeHolder: '追加したいコメントを入力ください'
      },{
        xtype: 'container',
        margin: 6,
        layout: {
          type: 'hbox'
        },
        items: [
          {
            xtype: 'button',
            itemId: 'cancel',
            text: 'cancel',
            margin: '0 6 0 0',
            flex: 1
          },{
            xtype: 'button',
            itemId: 'feed',
            text: 'feed',
            margin: '0 0 0 6',
            flex: 1
          }
        ]
      }
    ]

  },

  initialize: function(){
    var me = this;
    
    me.on('clearfields', me.onClearField);
    
    me.callParent(arguments);
  },


  onClearField: function(){
    var me = this;

    Ext.iterate(me.query('textfield'), function(fld, idx){
      fld.reset();
    });
  }
});