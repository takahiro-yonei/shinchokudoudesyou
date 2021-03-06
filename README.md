# "進捗"どうですか？


「進捗どうですか？」はボタン１つでメンバーにFeedを投稿し、また、回答するためのアプリケーションです。

ログイン先のSalesforce環境のユーザに対して、ボタン1つで「進捗どうですか？」という旨のFeedを、メンション付きで投稿することができます。なお、Feedには「#進捗どうですか」というハッシュタグがつけられます。

また、どのユーザから上記のFeedを受け取ったかを確認することができ、ボタン1つで回答することができます。なお、回答は元のFeedにコメントを追加する、という形で回答を返します。

「進捗どうですか？」というフレーズは、マジメに聞いているケースと、コミュニケーションを円滑にするために遊びを交えて聞くケースが多く見受けられます。本アプリでは、主に後者をターゲットにして、Chatter上で気軽にコミュニケーションをとることをサポートしていきます。（もちろん、前者のつもりで聞いて頂く場合に使用しても問題ありません。お互いの信頼関係が築けている場合には..）


## 動画

https://www.youtube.com/watch?v=mB_vD-rjxo4

## 利用方法

iOSアプリのビルドは、XCodeを使ってビルドします。

```.xcode/shinchoku/shinchoku.xcodeproj``` を開いて、shinchokuプロジェクトをビルドを実行してください。

## アーキテクチャ

##### モバイル
本アプリは、Sencha Touchを使ったハイブリッドアプリケーションです。

Salesforceへの認証には、Salesforce Mobile SDK for Hybridを利用しています。

ハイブリッドアプリケーションからSalesforceへの連携では、[Sencha Touch connector for Salesforce REST API](https://market.sencha.com/extensions/sencha-touch-connector-for-salesforce-rest-api)というSenchaTouchPackageを利用しています。

##### Heroku
モバイルからのリクエストを受けて、Salesforceにリクエストを転送しています。

本アプリから「進捗どうですか？」と投稿した回数や、投稿に対して回答した記録を保持するためにHerokuを利用しています。

HerokuからSalesforceへの連携では、[force.rb](https://github.com/heroku/force.rb)というRuby Gemを利用しています。

#### force.com
回答を返す際に、ブラウザからの回答をHeroku側にも記録させる場合には、リモートサイトの設定が必要となります。

「設定」->「管理」->「セキュリティのコントロール」->「リモートサイトの設定」で、

```https://shinchokudoudesyo.herokuapp.com``` リモートサイトのURLとして追加してください。

## ライセンス
[GNU General Public License, version 3.0](http://www.gnu.org/copyleft/gpl.html)