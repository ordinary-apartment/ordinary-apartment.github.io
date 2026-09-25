# 境界採集：CSVで更新する施設資料台帳

## チャットで施設を追加する

Codexに「○○を追加して」「この施設群を資料○○として追加して」と依頼すると、[AGENTS.md](AGENTS.md) と[施設追加手順](docs/施設追加手順.md) に従って、重複確認、必要なCSVへの追記、生成、検証、commit、mainへのpushまで進めます。既存データ・行順・未追跡バックアップは保持します。Gitの認証・書込権限は必要です。

重複候補確認は `python3 -B tools/check-additions.py duplicates /tmp/候補.csv`、既存データの保全確認は `python3 -B tools/check-additions.py verify --base <作業開始commit>` で実行できます。候補CSVは `data/` の外に置いてください。

## 最初の設置

1. このフォルダの**中身**を、既存GitHubリポジトリの直下へ追加・上書きします。フォルダごと一段深く置かないでください。
2. `data/`、`generated/`、`tools/`、`tests/`、**`.github/workflows/build-data.yml`**も必ず追加します。Macで隠しフォルダを見るには Command + Shift + . を押します。
3. GitHubの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に変更します。
4. Actionsタブの **Build CSV and deploy Pages** が成功したら設置完了です。必要なら **Run workflow** で手動実行できます。

初期状態のJS/JSONも同梱しています。GitHubへアップロードする前でも `index.html` を開いて確認できます。今回はローカルでの生成・検証まで実施しています。GitHubへのアップロード・公開はまだ行っていません。

## 新しい資料を追加する

`templates/新しい資料.csv` をコピーして名前を変更し、施設を入力して **data/** にアップロードします。

例：`data/古いゲームセンター.csv` → 資料13「古いゲームセンター」。続けて `古いイオン.csv` を追加すると資料14になります。`script.js` の編集は不要です。

CSVを更新すると件数も更新されます。資料名はファイル名から `.csv` を除いた文字列です。`data/`直下の小文字拡張子 `.csv` が対象で、サブフォルダは対象外です。複数の新資料を同時に追加した場合はファイル名の文字コード順で採番します。

## CSVの列

|標準列|内容|
|---|---|
|都道府県|東京都など|
|市区町村|江東区など|
|店舗名・施設名|必須。「施設名」「店舗名」も使用可|
|分類|自由記入。資料名とは別の施設ごとの分類|
|説明・狙い目|複数行も可|
|公式サイト|httpまたはhttpsのURL。空欄可|
|Googleマップ|httpまたはhttpsのURL。空欄なら施設名・所在地から検索URLを自動生成|
|関連リンク1〜3タイトル / URL|最大3組。タイトルとhttp(s) URLを対で記入|

評価列（rankを含む）は廃止済みで、指定すると検証エラーになります。

UTF-8（BOMあり／なし）とWindows日本語のCP932に対応。テンプレートと移行済みCSVはUTF-8 BOM付きです。カンマや改行を含むセルはCSVの引用符で囲む必要があるため、表計算ソフトのCSV保存を使ってください。施設名以外は省略できます。

移行済みCSVには `雰囲気`（kind）、`公式検索`（officialSearch）、`地図検索名`（mapQueryName）も保存しています。これらは元の台帳で画面表示していなかった項目です。追加の独自列は生成JSONの `extra` に保存し、画面項目は増やしません。

空行は無視、見出しだけのCSVは0件の資料になります。施設名なし・列数不一致・重複見出し・不正なURLは処理を停止します。Actionsに表示されたエラーを直して再保存してください。エラー時は以前の公開サイトを維持します。

## 資料番号とリンク

画面に表示する資料番号は `data/material-registry.json` の `number` と一致します。資料固有の `id` は永続キー、`number` は現在の表示順を表す連番です。ユーザーが「資料17」と指定した場合は、画面の資料17とregistryのnumber 17を照合してください。番号から内容を推測せず、作業開始時に資料名・CSV・件数を確認します。

CSVを削除・統合すると、残った資料の `number` は1から詰め直されます。資料固有ID、施設ID、施設行順は再採番しません。CSVの名前変更は通常、新しい資料として扱います。番号を維持して改名したい場合のみ、管理ファイルの対応する `file` も新名に変更してください。既存資料の短縮名も変える場合は `short` を変更します。

施設へのURLは従来どおり資料キー＋行位置です。CSV内の行を並べ替えると、その行位置を参照する古い施設リンクの対象は変わります。

## GitHub Actionsの動作

既定ブランチの更新 → 全CSV検証 → JS/JSON生成 → 資料番号と生成物のコミット → GitHub Pages公開。

PRと既定以外のブランチでは検証のみで、公開しません。生成物は `generated/facility-data.js` と `generated/facility-data.json`。資料番号・資料名・資料別件数・総件数を含みます。CSVとバックアップは公開用ファイルに含めません（公開リポジトリのソースからは閲覧できます）。

自動コミットにはリポジトリへの書き込みが必要です。ブランチ保護や組織ポリシーが書き込みを禁止している場合はその設定への対応が必要です。別の更新と重なってpushが失敗した場合は、最新ブランチでRun workflowを再実行してください。生成物をpushできなければ公開も停止し、番号の食い違いを防ぎます。

以前の独自の公開ワークフローがある場合は、このワークフローと二重で公開しないよう無効化してください。既存の独自ドメイン用 `CNAME` と `images/` は存在すれば公開用にコピーします。

参考：[GitHub公式：カスタムワークフローによるPages公開](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 既存データの保管

- 12資料787件を `data/*.csv` へ移行しています。重複施設も元のまま保持しています。
- `backup/original/` に入力ファイル一式を無改変で保管しています。
- 元の `facilities.js` にあった、現在の画面で使われていない12件の補助博物館データも `backup/旧補助博物館データ.csv` と `backup/legacy-facility-data.json` に保管しています。787件への二重加算はしません。
- ルートの旧 `facilities.js` と `facility-catalog.js` も保持していますが、新しい台帳からは読み込みません。以後はCSVを編集してください。
- `styles.css`、`data.js`、`icon.png` は変更していません。

## 検索用ファイルのキャッシュ更新

通常の公開は `main` ブランチの `/ (root)` から行い、`git push origin main` で更新します。
JS/CSS変更後はpush前に `python3 -B tools/version-assets.py` を実行してください。HTML内の全ローカルJS/CSS（`generated/facility-data.js`を含む）に内容のSHA-256の先頭16桁をURLクエリとして付け、更新前のキャッシュの再利用を防ぎます。`python3 -B tools/version-assets.py --check` で更新漏れを検出できます。開いたままのタブは更新後に再読込してください。

## ローカルで生成する場合

Python 3.10以上（追加ライブラリ不要）でフォルダ内から実行します。

```sh
python3 tools/build-data.py
python3 -m unittest discover -s tests -v
```
