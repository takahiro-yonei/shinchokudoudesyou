class FeedText < ActiveRecord::Base

  def self.choose_feed_text
    feed_text = FeedText.all.sample


    if feed_text.blank?
      return '進捗どうですか？'
    else
      return feed_text.text
    end
  end
end
