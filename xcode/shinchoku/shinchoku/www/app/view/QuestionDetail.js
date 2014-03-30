Ext.define('shinchoku.view.QuestionDetail', {
  extend: 'Ext.form.Panel',
  xtype: 'questionDetail',

  requires: [
    'Ext.form.FieldSet',
    'Ext.field.Number',
    'Ext.field.Select',
    'Ext.field.DatePicker',
    'Ext.field.Hidden'
  ],

  config: {
    itemId: 'questionDetailInfo',
    items: [
      {
        xtype: 'fieldset',
        defaults: {
          readOnly: true,
          component: {
            readOnly: true
          }
        },
        items: [
          {
            xtype: 'textfield',
            name: 'from_user_name',
            label: 'From'
          },{
            xtype: 'textfield',
            name: 'display_updated_datetime',
            label: 'Last Date'
          },{
            xtype: 'hiddenfield',
            name: 'from_user_id',
            label: 'FromId'
          },{
            xtype: 'hiddenfield',
            name: 'to_user_id',
            label: 'ToId'
          },{
            xtype: 'hiddenfield',
            name: 'id',
            label: 'id'
          },{
            xtype: 'hiddenfield',
            name: 'last_feed_item_id',
            label: 'feed_item_id'
          }
        ]
      },{
        layout: {
          type: 'vbox',
          pack: 'center',
          align: 'center'
        },
        defaults: {
          margin: 8
        },
        items: [
          {
            xtype: 'container',
            html: '[ "進捗"どうですか？ ]'
          },{
            xtype: 'button',
            itemId: 'replyDameDeath',
            action: 'NG',
            ui: 'action',
            text: 'ダメです',
            width: '60%',
            minWidth: '200px',
            handler: function(){
              var panel = this.up('questionDetail'),
                  question = panel.getRecord();

              panel.onReply(question.get('last_feed_item_id'), 'NG');
            }
          },{
            xtype: 'button',
            itemId: 'replyOKDeath',
            action: 'OK',
            ui: 'action',
            text: 'OKです',
            width: '60%',
            minWidth: '200px',
            handler: function(){
              var panel = this.up('questionDetail'),
                  question = panel.getRecord();

              panel.onReply(question.get('last_feed_item_id'), 'OK');
            }
          }
        ]
      }
    ]
  },


  initialize: function(){
    var me = this;
    
    me.callParent(arguments);
  },

  onReply: function(feedItemId, reply){
    var me = this;

    var callback = function(res){
      me.setMasked(false);
      
      response = Ext.JSON.decode(res.responseText);
      var feedItemId = response.records[0].last_feed_item_id;

      Ext.Msg.confirm('確認', 'フォローのコメントを<br/>入れますか？', function(btnId){
        if(btnId == 'yes'){
          me.up('appMain').fireEvent('showfollowsheet', me, feedItemId);
        } else {
          logToConsole(me.up('#questionDetail').getId());
          me.up('#questionDetail').fireEvent('backtoquestionlist');
        }
      });
    },
    failure = function(res, option){
      response = Ext.JSON.decode(res.responseText);
      me.setMasked(false);
      Ext.Msg.alert('エラー', '失敗しました...: \n' + response.errorMessage);
      logToConsole(response.errorMessage);
    };
    
    me.setMasked({
      xtype: 'loadmask',
      message: '回答中..'
    });

    Ext.util.FeedChatter.feedComment(feedItemId, reply, callback, failure);
  }

});