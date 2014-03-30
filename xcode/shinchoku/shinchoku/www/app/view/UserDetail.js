Ext.define('shinchoku.view.UserDetail', {
  extend: 'Ext.form.Panel',
  xtype: 'userDetail',

  requires: [
    'Ext.form.FieldSet',
    'Ext.field.Number',
    'Ext.field.Select',
    'Ext.field.DatePicker'
  ],

  config: {
    userId: null,
    tasks: null,
    itemId: 'userDetailInfo',
    items: [
      {
        xtype: 'fieldset',
        defaults: {
          readOnly: true,
          labelWidth: '40%',
          component: {
            readOnly: true
          }
        },
        items: [
          {
            xtype: 'textfield',
            name: 'Name',
            label: '名前'
          },{
            xtype: 'hiddenfield',
            name: 'Alias',
            label: 'alias'
          },{
            xtype: 'textfield',
            name: 'Title',
            label: 'タイトル'
          },{
            xtype: 'textfield',
            name: 'Task',
            label: '残タスク数'
          },{
            xtype: 'hiddenfield',
            name: 'UserType',
            label: 'user type'
          },{
            xtype: 'hiddenfield',
            name: 'Id',
            label: 'id'
          }
        ]
      },{
        layout: {
          type: 'vbox',
          pack: 'center',
          align: 'center'
        },
        defaults: {
          margin: 5
        },
        items: {
          xtype: 'button',
          itemId: 'questionButton',
          ui: 'action',
          text: '進捗...',
          width: '60%',
          minWidth: '200px'
        }
      }
    ],
    
    listeners: [
      {
        delegate: '#questionButton',
        event: 'tap',
        fn: function(){
          var me = this;
              tasks = me.getTasks();

          if(tasks.length == 0){
            me.confirmDoudesyo();
          } else {
            me.onDodesyo();
          }
        }
      }
    ]

  },

  initialize: function(){
    var me = this;

    me.on('getnonclosedtasks', me.getNonClosedTasks);
    me.callParent(arguments);
  },

  getNonClosedTasks: function(){
    var me = this,
        userId = me.getUserId();

    force.query("Select Id,Priority,ActivityDate,Subject From Task Where OwnerId = '" + userId + "' and IsClosed = false",
      function(xhrRes){
        logToConsole("task query: " + xhrRes.responseText);
        var rtnObj = Ext.JSON.decode(xhrRes.responseText),
            nonClosedTasks = rtnObj["records"];

        me.setTasks(nonClosedTasks);

        var count = Ext.isArray(nonClosedTasks) ? nonClosedTasks.length : '-';
        me.down('textfield[name=Task]').setValue(count);
      },
      function(xhrRes){
        logToConsole("Err " + xhrRes.responseText);
        me.down('textfield[name=Task]').setValue('-');
      }
    );
  },

  confirmDoudesyo: function(){
    var me = this;
    
    Ext.Msg.confirm('確認', '残タスクがないけど、<br/>本当に聞きますか？', function(btnId){
      if(btnId == 'yes'){
        me.onDodesyo();
      }
    });
  },

  onDodesyo: function(){
    var me = this,
        toUserId = me.getUserId();

    var callback = function(res){
      me.setMasked(false);

      response = Ext.JSON.decode(res.responseText);
      var feedItemId = response.records[0].last_feed_item_id;

      Ext.Msg.confirm('確認', 'フォローのコメントを<br/>入れますか？', function(btnId){
        if(btnId == 'yes'){
          me.up('appMain').fireEvent('showfollowsheet', me, feedItemId);
        } else {
          me.up('#userDetail').fireEvent('backtouserlist');
        }
      });
    },
    failure = function(res, option){
      response = Ext.JSON.decode(res.responseText);
      me.setMasked(false);
      Ext.Msg.alert('情報', '失敗しました...: \n' + response.errorMessage);
      logToConsole(response);
    };

    me.setMasked({
      xtype: 'loadmask',
      message: '進捗中..'
    });

    Ext.util.FeedChatter.feedItem(toUserId, callback, failure);
  }

});