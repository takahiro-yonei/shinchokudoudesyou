class FeedCommentText < ActiveRecord::Base

  scope :comments_by_type, lambda{|comment_type| where(:comment_type => comment_type)}

  def self.choose_comment_text(comment_type)
    comment = FeedCommentText.comments_by_type(comment_type).sample


    if comment.blank?
      return '進捗ダメです'
    else
      return comment.text
    end
  end
end
