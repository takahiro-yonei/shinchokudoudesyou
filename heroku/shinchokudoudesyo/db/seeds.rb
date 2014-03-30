# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

#-----------------------------------------
# FeedText
FeedText.delete_all

FeedText.create(:text => "進捗どうですか？")
FeedText.create(:text => "進捗ッ！進捗ゥ！")
FeedText.create(:text => "簡単な質問をしよう...本当に簡単な質問だ..\n進捗は共有し、進めなければならない。当然だ。ここまではわかるな...\nそこでだ。「お前の進捗はどうなっている？」")


#-----------------------------------------
# FeedComment
FeedCommentText.delete_all

FeedCommentText.create(:comment_type => 'OK', :text => "極めて順調ですッ！")
FeedCommentText.create(:comment_type => 'OK', :text => "最高に「OK！」ってやつだァァァァ！")
FeedCommentText.create(:comment_type => 'OK', :text => "'進捗'した者が全て報われるとは限らん\nしかし！\n成功した者は皆すべからく'進捗'しておる！")
FeedCommentText.create(:comment_type => 'OK', :text => "'進捗はいいか？\nオレはできてる'")
FeedCommentText.create(:comment_type => 'OK', :text => "やれやれ...\n明日また聞いてください。\n本当の'進捗'をお見せしますよ。")

FeedCommentText.create(:comment_type => 'NG', :text => "進捗ダメです！")
FeedCommentText.create(:comment_type => 'NG', :text => "進捗..？いえ、知らない子ですね。")
FeedCommentText.create(:comment_type => 'NG', :text => "進捗..？無駄無駄無駄無駄無駄無駄無駄無駄無駄無駄無駄無駄ァ！")
FeedCommentText.create(:comment_type => 'NG', :text => "まだあわてるような時間じゃない...")
FeedCommentText.create(:comment_type => 'NG', :text => "こ、これは..まさか'進捗どうですか？'！？\n -> どうした、雷電　顔色が悪いぞ...？")
FeedCommentText.create(:comment_type => 'NG', :text => "'進捗'ゆえに人は苦しまねばならぬ！\n'進捗'ゆえに人は悲しまねばならぬ！")
