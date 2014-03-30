class CreateFeedTexts < ActiveRecord::Migration
  def change
    create_table :feed_texts do |t|
      t.text :text

      t.timestamps
    end
  end
end
