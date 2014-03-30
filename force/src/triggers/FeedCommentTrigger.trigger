trigger FeedCommentTrigger on FeedComment (after insert) {


  if(Trigger.isAfter && Trigger.isInsert){
    // コメント回答記録をHerokuへ送信する
    CommentToHeroku handler = new CommentToHeroku(Trigger.new);
    Set<Id> feedItemIds = handler.getTargetFeedItemIds();

    CommentToHeroku.doPost(feedItemIds, UserInfo.getSessionId());
  }

}