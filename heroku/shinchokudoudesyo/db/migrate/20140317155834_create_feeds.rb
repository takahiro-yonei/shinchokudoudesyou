class CreateFeeds < ActiveRecord::Migration
  def change
    create_table :feeds do |t|
      t.string :from_user_id
      t.string :to_user_id
      t.string :last_feed_item_id
      t.integer :feed_count

      t.timestamps

      t.index :from_user_id
      t.index :to_user_id
      t.index :last_feed_item_id
    end
  end
end
