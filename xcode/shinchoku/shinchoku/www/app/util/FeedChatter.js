Ext.define('shinchoku.util.FeedChatter', {
  singleton: true,
  alternateClassName: 'Ext.util.FeedChatter',


  feedItem: function(toUserId, successCallback, failureCallback){

    var params = {
      'to_user_id': toUserId
    },
    headers = {
      'X-Sfdc-Token': force.getSessionId(),
      'X-Sfdc-Refresh-Token': force.getRefreshToken(),
      'X-Sfdc-InstanceUrl': force.getInstanceUrl(),
      'X-Sfdc-ApiVersion': force.getApiVersion()
    };

    Ext.Ajax.request({
      method: 'POST',
      async: force.getAsyncAjax(),
      url: 'https://shinchokudoudesyo.herokuapp.com/shinchoku/feed',
      headers: headers,
      disableCaching: true,
      jsonData: params,
      success: successCallback,
      failure: failureCallback
    });
  },


  feedComment: function(feedItemId, replyType, successCallback, failureCallback){

    var params = {
      'feed_item_id': feedItemId,
      'comment_type': replyType
    },
    headers = {
      'X-Sfdc-Token': force.getSessionId(),
      'X-Sfdc-Refresh-Token': force.getRefreshToken(),
      'X-Sfdc-InstanceUrl': force.getInstanceUrl(),
      'X-Sfdc-ApiVersion': force.getApiVersion()
    };

    Ext.Ajax.request({
      method: 'POST',
      async: force.getAsyncAjax(),
      url: 'https://shinchokudoudesyo.herokuapp.com/shinchoku/comment',
      headers: headers,
      disableCaching: true,
      jsonData: params,
      success: successCallback,
      failure: failureCallback
    });

  },


  feedFreeComment: function(feedItemId, text, successCallback, failureCallback){
    force.postCommentWithMention(feedItemId, text, successCallback, failureCallback);
  }


});