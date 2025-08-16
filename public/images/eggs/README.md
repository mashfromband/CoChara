# 卵画像について

このディレクトリには、各卵タイプに対応する画像ファイルを配置します。

## 命名規則

画像ファイルは、卵タイプのIDに対応する名前で保存してください。
例：
- classic.png - クラシック卵の画像
- pastel.png - パステル卵の画像
- cosmic.png - コズミック卵の画像
- natural.png - ナチュラル卵の画像
- fire.png - ファイアー卵の画像
- aurora.png - オーロラ卵の画像

任意でSVG（ベクター）も用意可能です：
- {id}_egg.svg（例：classic_egg.svg）

EggImageは以下の順で読み込みを試みます：
1) /images/eggs/{id}.png
2) /images/eggs/{id}_egg.svg（PNGが無い場合のフォールバック）
3) どちらも無い場合はグラデーションのプレースホルダー

## 画像仕様

- 推奨サイズ: 240px × 360px (幅 × 高さ)
- 形式: PNG (透過背景推奨)
- 解像度: 72dpi以上

## 注意事項

- 画像が見つからない場合は、EggImageコンポーネントがTailwindのグラデーションを使用したプレースホルダーを表示します
- 新しい卵タイプを追加する場合は、対応する画像も追加してください
- 旧仕様の {id}_egg_low.png / _medium.png / _high.png は使用しません