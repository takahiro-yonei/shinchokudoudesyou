# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20140323073040) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "feed_comment_texts", force: true do |t|
    t.string   "comment_type"
    t.text     "text"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "feed_texts", force: true do |t|
    t.text     "text"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "feeds", force: true do |t|
    t.string   "from_user_id"
    t.string   "to_user_id"
    t.string   "feed_item_id"
    t.integer  "feed_count"
    t.integer  "reply_count"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "feeds", ["feed_item_id"], name: "index_feeds_on_feed_item_id", using: :btree
  add_index "feeds", ["from_user_id"], name: "index_feeds_on_from_user_id", using: :btree
  add_index "feeds", ["to_user_id"], name: "index_feeds_on_to_user_id", using: :btree

end
