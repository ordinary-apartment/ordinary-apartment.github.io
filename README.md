# 境界採集 — リミナルスペース＋個人アーカイブ

スマートフォンで見やすい、閲覧専用の静的Webサイトです。ログイン、投稿、写真アップロード機能はありません。

## いちばん簡単な開き方

1. `public` → `site` フォルダを開きます。
2. `index.html` をダブルクリックします。
3. ブラウザにサイトが表示されます。

仮写真はインターネット上の画像を使っているため、写真表示にはネット接続が必要です。

## 記録を編集・追加する

内容はすべて `public/site/data.js` にあります。各記録は `{` から `}` までの一まとまりです。既存の記録をコピーし、`id`（重複しない半角英数字）、`title`、`category`、`date`、`place`、`image`、`tags`、`excerpt`、`body` を変更してください。記号のカンマや引用符を消すと表示できない場合があるため、編集前のコピーを残すと安心です。

## 自分の写真に差し替える

1. `public/site/images` フォルダを作り、写真を入れます。
2. 一覧の代表写真は、`data.js` の `image` を `images/hospital-01.jpg` のように変更します。
3. 詳細ページへ複数写真を出すには、その記録内へ `gallery:['images/hospital-01.jpg','images/hospital-02.jpg','images/hospital-03.jpg']` を追加します。写真の数は自由です。
4. ファイル名は半角英数字とハイフンがおすすめです。

## 色を変える

`public/site/styles.css` の先頭にある `:root` 内を編集します。`--mint` は薄緑、`--paper` は背景、`--ink` は文字色です。

## ファイルの役割

- `public/site/index.html`: ページの土台
- `public/site/styles.css`: 色、余白、スマホ・PCのレイアウト
- `public/site/data.js`: 記録データ（主に編集するファイル）
- `public/site/facilities.js`: 病院内タリーズの外部資料
- `public/site/facility-catalog.js`: CSVから取り込んだ全国候補・植物園・科学系施設
- `public/site/script.js`: 検索、タグ、ランダム閲覧などの動き

一般的なレンタルサーバーやGitHub Pagesでは、`public/site` の中身をアップロードしてください。公開前に、人物、住所、車のナンバー、医療情報などの写り込みを確認してください。
