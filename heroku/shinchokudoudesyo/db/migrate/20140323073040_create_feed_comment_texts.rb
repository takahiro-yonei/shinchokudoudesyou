class CreateFeedCommentTexts < ActiveRecord::Migration
  def change
    create_table :feed_comment_texts do |t|
      t.string :comment_type
      t.text :text

      t.timestamps
    end
  end
end
