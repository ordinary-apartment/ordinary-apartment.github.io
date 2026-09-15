/* 記録の追加・変更は、このファイルだけでできます。 */
window.ARCHIVE_DATA=[
{id:'after-hours',title:'診療後の廊下',category:'病院',date:'2024.11.03',place:'東京都',image:'https://images.unsplash.com/photo-1516841273335-e39b37888115?auto=format&fit=crop&w=1600&q=86',tags:['病院','廊下','蛍光灯','夜'],excerpt:'消灯の少し前。人の気配だけが先に帰った。',body:'面会時間が終わったあとの廊下。清掃用ワックスの匂いと、等間隔の蛍光灯。突き当たりの窓だけが、まだ外の時間を覚えていた。'},
{id:'pool',title:'季節外れのプール',category:'リミナル',date:'2024.09.18',place:'千葉県',image:'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=1600&q=86',tags:['水辺','学校','青','不在'],excerpt:'水を抜いた場所には、夏の輪郭だけが残る。',body:'柵の向こう、使われなくなったプール。底に溜まった雨水が薄い空を映し、遠くの運動部の声が壁に跳ね返っていた。'},
{id:'last-train',title:'終電後のホーム',category:'移動',date:'2025.01.12',place:'神奈川県',image:'https://images.unsplash.com/photo-1524721696987-b9527df9e512?auto=format&fit=crop&w=1600&q=86',tags:['駅','夜','人工光','移動'],excerpt:'線路の音が止むと、駅は巨大な待合室になる。',body:'最終列車が去ったあと。電光掲示板だけが律儀に明日を指していた。いつも通る場所が、誰のためでもない空間に戻る短い時間。'},
{id:'service-area',title:'午前四時のサービスエリア',category:'移動',date:'2025.02.07',place:'静岡県',image:'https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=1600&q=86',tags:['道路','夜','自販機','移動'],excerpt:'白い照明と、自動販売機の低い駆動音。',body:'長距離バスの休憩で降りた。売店は閉まり、ベンチには誰もいない。眠気の中で見る案内板は、どこかの施設模型のようだった。'},
{id:'civic-hall',title:'閉館した市民会館',category:'建築',date:'2023.12.21',place:'埼玉県',image:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=86',tags:['公共施設','椅子','昭和','昼'],excerpt:'予定表のないロビーに、椅子だけが並んでいる。',body:'建替えを待つ旧市民会館。赤い布張りの椅子、曇ったガラス、剥がされた催事ポスター。人が集まった記憶が家具の配置に残っていた。'},
{id:'hotel',title:'海辺のホテル、三階',category:'リミナル',date:'2024.06.28',place:'茨城県',image:'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=86',tags:['ホテル','廊下','海','昼'],excerpt:'同じ扉が続く。海は見えるのに波音はしない。',body:'平日の古いホテル。三階の廊下には湿った絨毯の匂いがあり、窓の外だけが明るかった。部屋番号は規則正しく、どこまでも続きそうに見えた。'},
{id:'underpass',title:'雨の地下道',category:'都市',date:'2024.04.09',place:'東京都',image:'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?auto=format&fit=crop&w=1600&q=86',tags:['地下','雨','タイル','都市'],excerpt:'地上の雨音が、ここでは換気扇の音になる。',body:'古いタイル張りの地下道。雨の日は足音が少なく、出口の四角い光だけが妙に遠く見える。壁の地図には、もうない店の名前があった。'},
{id:'waiting-room',title:'無人の待合室',category:'病院',date:'2025.03.14',place:'群馬県',image:'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=1600&q=86',tags:['病院','椅子','朝','待つ'],excerpt:'呼ばれる人のいない番号表示が、00のまま光る。',body:'診療開始前の待合室。ビニールの椅子は一脚ずつ微妙に角度が違う。受付の奥で紙をめくる音だけがしていた。'},
{id:'arcade',title:'シャッター街の午後',category:'都市',date:'2023.08.26',place:'栃木県',image:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=86',tags:['商店街','昼','看板','記憶'],excerpt:'閉じた店名が、通りの歴史を声に出している。',body:'真夏のアーケード。日差しは遮られているのに暑く、色褪せた看板が高いところに残る。自転車が一台だけ通り過ぎた。'},
{id:'municipal-web',title:'更新の止まった町のウェブ',category:'ウェブ',date:'2025.05.30',place:'online',image:'https://images.unsplash.com/photo-1481487196290-c152efe083f5?auto=format&fit=crop&w=1600&q=86',tags:['ウェブ','自治体','記録','2000年代'],excerpt:'リンク集とアクセスカウンター。画面の中にも廃墟はある。',body:'統合前の町が残した旧サイト。青いリンク、低解像度の写真、最終更新日の表記。サーバー上で停止した時間を、スクリーンショットとして採集した。'}];

/* 4列×10行の見本用に40枠を作っています。実際には gallery:['画像1','画像2'] のように指定できます。 */
window.ARCHIVE_DATA.forEach((item,index,all)=>{
  item.gallery=item.gallery||Array.from({length:40},(_,offset)=>all[(index+offset)%all.length].image);
});
