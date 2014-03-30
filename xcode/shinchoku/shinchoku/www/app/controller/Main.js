Ext.define('shinchoku.controller.Main', {
  extend: 'Ext.app.Controller',

  config: {

    refs: {
      'main': 'appMain',
      'userPanel': 'userPanel',
      'userList': 'userList',
      'userDetail': 'userDetail',
      'replyPanel': 'replyPanel',
      'questionList': 'questionList',
      'questionDetail': 'questionDetail',
      'followFeedSheet': 'followFeedSheet'
    },

    control: {
      'appMain': {
        'loadusers': 'loadUsers',
        'showfollowsheet': 'showFollowFeedSheet'
      },

      'userList': {
        'recordtap': 'showUserDetail'
      },

      'userPanel #userDetail': {
        'backtouserlist': 'showUserList'
      },

      'questionList': {
        'recordtap': 'showQuestionDetail'
      },

      'replyPanel #questionDetail': {
        'backtoquestionlist': 'showQuestionList'
      },

      'followFeedSheet #cancel': {
        'tap': 'hideFollowFeedSheet'
      },

      'followFeedSheet #feed': {
        'tap': 'feedFollowComment'
      }

    }

  },


  loadUsers: function(){
    var me = this,
        list = me.getUserList();

    list.getStore().load();
  },

  showUserList: function(){
    var me = this;

    me.getUserDetail().up('#userPanel').setActiveItem(0);
    me.getUserList().getStore().loadPage(1);
  },

  showUserDetail: function(record){
    var me = this;
        panel = me.getUserDetail();

    panel.setRecord(record);
    panel.setUserId(record.get('Id'));

    panel.up('#userPanel').setActiveItem(1);
    panel.fireEvent('getnonclosedtasks');
  },

  showQuestionList: function(){
    var me = this;

    me.getQuestionDetail().up('#replyPanel').setActiveItem(0);
    me.getQuestionList().getStore().loadPage(1);
  },

  showQuestionDetail: function(record){
    var me = this;

    me.getQuestionDetail().setRecord(record);
    me.getQuestionDetail().up('#replyPanel').setActiveItem(1);
  },

  showFollowFeedSheet: function(panel, feedItemId){
    var me = this,
        sheet = me.getFollowFeedSheet();

    if(Ext.isEmpty(sheet)){
      sheet = Ext.widget('followFeedSheet');
      Ext.Viewport.add(sheet);
    }
    sheet.setCallFrom(panel);
    sheet.setFeedItemId(feedItemId);
    
    sheet.fireEvent('clearfields');
    sheet.show();
  },

  hideFollowFeedSheet: function(){
    var me = this,
        sheet = me.getFollowFeedSheet();

    if(!Ext.isEmpty(sheet)){

      var panel = sheet.getCallFrom();
      if(panel.getXTypes().indexOf('userDetail') > -1){
        panel.up('#userDetail').fireEvent('backtouserlist');
      }
      if(panel.getXTypes().indexOf('questionDetail') > -1){
        panel.up('#questionDetail').fireEvent('backtoquestionlist');
      }
      
      sheet.hide();
    }
  },

  feedFollowComment: function(){
    var me = this,
        sheet = me.getFollowFeedSheet();

    if(!Ext.isEmpty(sheet)){

      var callback = function(res){
        sheet.setMasked(false);
        Ext.Msg.alert('情報', 'フォローいれました');

        me.hideFollowFeedSheet();
      },
      failure = function(res, option){
        response = Ext.JSON.decode(res.responseText);
        sheet.setMasked(false);
        Ext.Msg.alert('エラー', '失敗しました...: \n' + response.errorMessage);
        logToConsole(response.errorMessage);
      };
      

      var feedItemId = sheet.getFeedItemId(),
          text = sheet.down('textareafield[name=comment]').getValue();

      sheet.setMasked({
        xtype: 'loadmask',
        message: 'フォロー中..'
      });
      Ext.util.FeedChatter.feedFreeComment(feedItemId, text, callback, failure);
    }
  }

});