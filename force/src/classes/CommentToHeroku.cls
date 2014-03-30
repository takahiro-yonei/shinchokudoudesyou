public with sharing class CommentToHeroku {

  private List<FeedComment> comments;
  private final String TO_HEROKU = '#進捗どうですか';

	public CommentToHeroku(List<FeedComment> pComments) {
		comments = pComments;
	}

  /**
   * 対象となるFeedItemIdを抽出する
   *  - 特定のハッシュタグを含んでいるFeedが対象...
   */
  public Set<Id> getTargetFeedItemIds(){
    Set<Id> feedItemIds = new Set<Id>();
    for(FeedComment fc : comments){
      feedItemIds.add(fc.feedItemId);
    }

    Set<Id> rtnIds = new Set<Id>();
    for(FeedItem feed : [Select Body From FeedItem Where Id IN :feedItemIds]){
      if(String.isNotBlank(feed.Body) && feed.Body.contains(TO_HEROKU)){
        rtnIds.add(feed.Id);
      }
    }

    return rtnIds;
  }

  /**
   * HerokuへのCallout
   */
  @future (callout=true)
  public static void doPost(Set<Id> targetFeedItemIds, String sessionId){

    try{
      if(targetFeedItemIds.isEmpty()){
        return;
      }
      if(targetFeedItemIds.size() > 10){
        throw new CommentToHerokuException('一度にポストできるのは10件まで...');
      }

      for(Id feedItemId : targetFeedItemIds){
        Boolean rtn = postToHeroku(feedItemId, sessionId);
      }

      return;
    }catch(Exception ex){
      System.debug('Line:[' + ex.getLineNumber() + '] ' + ex.getMessage() + '/' + ex.getStackTraceString());
      throw ex;
    }
  }

  private static Boolean postToHeroku(Id feedItemId, String sessionId){
    try{
      HttpRequest req = new HttpRequest();

      System.debug(UserInfo.getSessionId());
      req.setEndpoint('https://shinchokudoudesyo.herokuapp.com/shinchoku/commentforce');
      req.setMethod('POST');
      req.setHeader('X-Sfdc-Session', sessionId);

      String sendBody = 'feed_item_id=' + feedItemId
        + '&user_id=' + UserInfo.getUserId();
      req.setBody(sendBody);
      
      // Timeout設定: 30s
      req.setTimeout(30000);

      Http http = new Http();
      HttpResponse res = http.send(req);
      

      return res.getStatusCode() == 200;
    }catch(Exception ex){
      System.debug('Line:[' + ex.getLineNumber() + '] ' + ex.getMessage() + '/' + ex.getStackTraceString());
      throw ex;
    }
  }


  public class CommentToHerokuException extends Exception {}
}