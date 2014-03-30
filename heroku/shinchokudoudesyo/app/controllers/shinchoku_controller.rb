class ShinchokuController < ApplicationController
  before_action :require_sfdc_token

  #--------------------------------------
  # feed to force.com
  #--------------------------------------
  def feed
    oauth_token = request.headers['X-Sfdc-Token']
    refresh_token = request.headers['X-Sfdc-Refresh-Token']
    instance_url = request.headers['X-Sfdc-InstanceUrl']
    api_version = request.headers['X-Sfdc-ApiVersion']

    begin
      #------------------------------
      # Chatterに投稿
      client = Force.new :instance_url => instance_url,
                         :oauth_token => oauth_token,
                         :refresh_token => refresh_token,
                         :client_id => ENV['CLIENT_ID'],
                         :client_secret => ENV['CLIENT_SECRET']

      feed_text = FeedText.choose_feed_text + "\n#進捗どうですか"
      to_user_id = params[:to_user_id]
      feed_body = {'body' => {'messageSegments' => [{'type' => 'mention', 'id' => to_user_id},{'type' => 'text', 'text' => feed_text}]}}

      res = client.post "/services/data/#{api_version}/chatter/feeds/user-profile/me/feed-items", feed_body.to_json


      #------------------------------
      # 投稿記録をheroku側に保持する
      from_user_id = res.body.actor.id
      to_user_id = params[:to_user_id]
      feed_item_id = res.body.id

      new_feed = Feed.register_feed(from_user_id, to_user_id, feed_item_id)

      @res = {success: true, errorMessage: '', records: [new_feed], total: 1}
      render :json => @res, :status => 200
    rescue => err
      puts err.backtrace
      @res = {success: false, errorMessage: err.message, records: [], total: 0}
      render :json => @res, :status => 500
    end
  end


  #--------------------------------------
  # add Comment from mobile
  #--------------------------------------
  def comment
    oauth_token = request.headers['X-Sfdc-Token']
    refresh_token = request.headers['X-Sfdc-Refresh-Token']
    instance_url = request.headers['X-Sfdc-InstanceUrl']
    api_version = request.headers['X-Sfdc-ApiVersion']

    begin
      #------------------------------
      # Chatterに投稿
      client = Force.new :instance_url => instance_url,
                         :oauth_token => oauth_token,
                         :refresh_token => refresh_token,
                         :client_id => ENV['CLIENT_ID'],
                         :client_secret => ENV['CLIENT_SECRET']

      feed_item_id = params[:feed_item_id]
      feed_text = FeedCommentText.choose_comment_text(params[:comment_type])
      feed_body = {'body' => {'messageSegments' => [{'type' => 'text', 'text' => feed_text}]}}

      res = client.post "/services/data/#{api_version}/chatter/feed-items/#{feed_item_id}/comments", feed_body.to_json
      

      #------------------------------
      # 回答をheroku側に記録する
      user_id = res.body.user.id
      upd_feed = Feed.register_comment(feed_item_id, user_id)

      @res = {success: true, errorMessage: '', records: [upd_feed], total: 1}
      render :json => @res, :status => 200, :layout => "feed"
    rescue => err
      
      puts err.backtrace
      @res = {success: false, errorMessage: err.message, records: [], total: 0}
      render :json => @res, :status => 500, :layout => "feed"
    end    
  end


  #--------------------------------------
  # view how many "shinchoku-doudesyou"
  #--------------------------------------
  def view_to_me
    oauth_token = request.headers['X-Sfdc-Token']
    refresh_token = request.headers['X-Sfdc-Refresh-Token']
    instance_url = request.headers['X-Sfdc-InstanceUrl']
    api_version = request.headers['X-Sfdc-ApiVersion']

    begin

      to_user_id = params[:user_id]
      feeds = Feed.where('to_user_id = ? and feed_count > 0', to_user_id)

      @res = {success: true, errorMessage: '', records: feeds, total: feeds.length}
      render :json => @res, :status => 200, :layout => "feed"
    rescue => err
      puts err.backtrace
      @res = {success: false, errorMessage: err.message, records: [], total: 0}
      render :json => @res, :status => 500, :layout => "feed"
    end
  end


  #--------------------------------------
  # add comment from force.com
  #--------------------------------------
  def comment_from_force

    begin
      feed_item_id = params[:feed_item_id]
      user_id = params[:user_id]

      upd_feed = Feed.register_comment(feed_item_id, user_id)

      @res = {success: true, errorMessage: '', records: [upd_feed], total: 1}
      render :json => @res, :status => 200, :layout => "feed"
    rescue => err
      puts err.backtrace
      @res = {success: false, errorMessage: err.message, records: [], total: 0}
      render :json => @res, :status => 500, :layout => "feed"
    end
  end

end
