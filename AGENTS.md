# 境界採集 Liminal Space Archive 作業ルール

このファイルは、このリポジトリで施設資料の調査・追加・再分類・検証・公開を行うときの恒久ルールです。ユーザーの明示的な指示がこの文書と矛盾する場合は、ユーザーの指示を優先します。ユーザーが「調査のみ」「pushしない」など範囲を限定した場合、commit・push・公開を行いません。

## 短い依頼を受けたときの標準フロー

「○○を新資料として追加」「○○をもっと掘って」「この施設を追加」のような具体的な依頼は、追加作業の承認として扱います。途中確認を求めず、次の順に完了させます。

1. `pwd`、`git remote -v`、`git status --short`、`git log -5 --oneline` を確認し、作業開始commitを `BASE` として記録する。最新 `origin/main` を取得し、競合や無関係なローカル変更を確認する。
2. [docs/施設追加手順.md](docs/施設追加手順.md) と現在のCSV・registry・生成スクリプト・テスト・Pages workflowを確認する。
3. 公式情報を中心に、正式名称、所在地、現存・営業状態、資料テーマとの関係を調査する。ユーザーが指定した施設は採用確定であり、調査は除外判定ではなく登録情報の確認に使う。
4. 全 `data/*.csv` と既存registryを照合する。既存施設なら新しいidentityを作らず、ユーザーが求める横断資料への所属だけを追加する。新規資料でも `python3 -B tools/check-additions.py duplicates /tmp/候補.csv` と所在地・旧称・公式URLを使った意味上の照合を行う。
5. 正本CSVを既存列構成で作成し、既存行を削除・並べ替え・書き換えず、追加対象CSVの末尾へ追記する。新資料は `templates/新しい資料.csv` を基に作る。資料番号・IDは手入力せず、`data/material-registry.json` とbuild処理に任せる。
6. 関連リンクを実URLで確認し、`python3 -B tools/build-data.py` を実行する。生成物を手編集しない。生成時に `index.html` のローカルJS/CSS参照へ内容SHA-256由来のcache versionが反映される。
7. `tools/check-additions.py verify --base "$BASE"`、`tools/check-links.py`、全テスト、JavaScript構文検査、`git diff --check`を実行する。件数、資料番号、既存行順、ID、URL、検索・表示データを確認する。
8. 変更対象だけを明示的にstageする。`git add .`、`git add -A`、force push、破壊的reset、無関係な未追跡ファイルの削除は禁止する。commit後に`git fetch origin main`、`git push origin HEAD:main`、`git ls-remote origin refs/heads/main`で送信SHAを確認する。
9. GitHub ActionsのbuildとPages deploymentを確認し、公開HTML、参照される生成JS/JSON、資料名・件数・追加施設を実際に取得して確認する。push成功だけで完了と報告しない。

## 正本、ID、資料、表示

- 正本は `data/*.csv` と `data/material-registry.json`。資料名はCSVファイル名（`.csv`を除く）。
- `data/material-registry.json` の資料IDは永続キー、`number`は画面表示用の連番。既存資料のID・番号・順序を変更しない。新資料の番号はbuild後のregistryで確認する。
- CSVの行順は施設URL（資料ID＋行位置）に関係するため、既存行をソート・挿入・再作成しない。追加は対象CSVの末尾だけに行う。
- `generated/facility-data.json` と `generated/facility-data.js` はbuild生成物。`index.html`は生成JSを読み、`script.js`が資料一覧・検索・施設詳細を表示する。
- `facility-data.js`、`facility-data.json`、`material-registry.json`（リポジトリ直下）は旧互換ミラーであり、正本ではない。buildが存在するミラーを更新することがあるため、差分を確認し、今回の作業対象でないミラーや既存ローカル変更を勝手にstage・削除しない。
- 既存施設のID、identity、施設名、都道府県、市区町村、説明、公式サイト、Googleマップ、関連リンク、営業時間、行順を維持する。既存施設の削除・再採番・新規コピーは禁止する。
- 作品・番組・横断テーマ資料など、ユーザーが重複所属を指定した資料では、元資料から移動せず同一identityを複数資料から参照する。資料固有の排他的分類より、ユーザーの明示指定を優先する。

## ユーザー指定の強制収録

ユーザーが「入れる」「追加する」「収録する」「採用する」「必ず登録」など明示した施設・場所・項目は、100%収録する。通常の採用基準、資料テーマへの適合度、公式サイトの有無、現存・閉館状態、リンク不足、既存重複、調査の不確実さを理由に除外・保留へ戻さない。

調査で確認できない項目は空欄、「不明」「公開終了」など既存仕様に適した注記にする。推測でURL、住所、営業状態、設計者、歴史的因果関係を作らない。ユーザー指定施設が正本CSV、生成データ、公開データに存在することを作業完了前に機械的に確認する。

## リンクと情報源

- 公式サイト欄は施設自身、所有者、自治体、運営法人などの公式案内を記録する。
- 関連リンクは施設単位で判定し、1施設最大3件。カテゴリ全体の参考記事を無関係な全施設へコピーしない。同じ記事を使う場合も、記事本文・見出し・写真等でその施設を実際に扱っていることを確認する。
- URL文字列、検索結果スニペット、ドメイン名だけで登録しない。登録前に実URLへアクセスし、2xx、リダイレクト後も目的ページが残ること、ページタイトルと本文が対象施設に関係することを確認する。404、410、接続不能、削除済み、トップページへの強制転送、対象性を確認できないPDFは登録しない。
- 公式サイトと関連リンクが同一URL、正規化後に同一、またはリダイレクト後に同一ページにならないことを確認する。検査は `python3 -B tools/check-links.py data/対象資料.csv --check-official-overlap` で行う。公式個別ページを関連リンクに記録するようユーザーが指定した場合は、公式サイト欄とは異なる個別ページであることを確認して登録する。
- 個人ブログ、訪問記、写真記録、note、地域ブログ、専門家・研究者の調査ページも、独自の観察や写真、展示・建物・街区の具体的記述があれば採用候補とする。転載だけの薄い記事、広告主体、SEO量産記事、無関係な検索結果は除外する。
- Googleマップ欄は実在地点を示すURLを使用する。閉店・解体・消滅施設は旧所在地・跡地として妥当な地点を使い、現存と誤認させる説明をしない。URLを推測しない。

## 監査・分類・調査のみの依頼

既存資料の全件監査では、施設名だけで決めず、公式説明・所在地・用途・設立経緯・現況を1件ずつ確認する。移動が必要な場合も既存identityを維持し、他資料を意図せず変更しない。横断資料の重複はエラーではなく、ユーザー指示に必要な所属として扱う。

「調査してください」「候補抽出」「採否判定まで」「まず報告」と指定された場合はデータ、CSV、registry、生成物、commit、pushを変更しない。候補表に採用・保留・除外、根拠URL、現況、重複を記録して報告し、確認後の実装依頼を待つ。

## 生成、検証、Git、Pages

通常の検証コマンドは次のとおりです。通信エラーや権限エラーは隠さず、必要な権限を要求して再試行する。

```sh
python3 -B tools/build-data.py
python3 -B -m unittest discover -s tests -v
python3 -B tools/check-additions.py verify --base "$BASE"
python3 -B tools/check-links.py data/対象資料.csv
python3 -B tools/check-links.py data/対象資料.csv --check-official-overlap
node --check data.js
node --check script.js
node --check generated/facility-data.js
git diff --check
git diff --cached --check
```

`verify`はBASE commitのCSV全行・列、既存registry、既存生成データの資料順・全施設フィールド・行順が先頭から保持され、変更が追加だけであることを検証する。生成後は総資料数、対象資料件数、総レコード数、重複identity、欠損URL、検索・詳細表示を確認する。

GitHub Actionsは `.github/workflows/build-data.yml` がテスト→build→（既定ブランチのみ）生成物commit→Pages artifact→Pages deploymentを行う。PR・既定以外のbranchは公開しない。通常の公開確認では、公開`index.html`の`generated/facility-data.js?v=`を取得し、参照JS/JSONの資料数・施設数・対象施設を確認する。cache versionは生成ファイル内容のSHA-256先頭16桁であり、手動でversion値だけを変更しない。

commit前に`git diff --cached --name-only`で今回のCSV、registry、生成物、必要なcache参照だけであることを確認する。既存の無関係な変更・未追跡候補CSV・バックアップ・root旧ミラーはstageしない。push後はActionsのbuildとPages deploymentの両方を確認し、公開反映を取得できない場合は未完了として報告する。

## 参照文書

詳細な列仕様、文字コード、CSV追記、候補CSV、リンク確認、append-only検証の説明は [docs/施設追加手順.md](docs/施設追加手順.md) を正本とする。実装とこの文書が矛盾する場合は、まずbuild・workflow・テストの実際の挙動を確認し、必要な修正をユーザーへ報告する。AGENTS.mdの更新だけを行う依頼では、施設データ・registry・生成データを変更しない。
