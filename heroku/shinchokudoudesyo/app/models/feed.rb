class Feed < ActiveRecord::Base


  def self.register_feed(from_user_id, to_user_id, feed_item_id)

    feeds = Feed.where("from_user_id = :from and to_user_id = :to", {from: from_user_id, to: to_user_id})
    if feeds.blank?
      # Feedデータを新規作成
      feed = Feed.new do |f|
        f.from_user_id = from_user_id
        f.to_user_id = to_user_id
        f.last_feed_item_id = feed_item_id
        f.feed_count = 1
      end

    else
      # 既存のデータを更新する
      feed = feeds.first

      feed.last_feed_item_id = feed_item_id
      feed.feed_count += 1
    end

    feed.save!
    return feed
  end



  def self.register_comment(feed_item_id, user_id)

    feeds = Feed.where("last_feed_item_id = :item_id", {item_id: feed_item_id})
    unless feeds.blank?
      feed = feeds.first
      # 回答をコメントとして返してる場合には feed_count をクリアする
      if feed.to_user_id == user_id
        feed.feed_count = 0
        feed.save!
      end
    else
      return nil
    end

    return feed
  end
end
