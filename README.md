# Azure OpenAI リアルタイム WebRTC サンプル

このリポジトリは、Azure OpenAI のリアルタイム API（プレビュー）を使用して、ブラウザ上で音声入出力を行う WebRTC サンプルアプリケーションです。

## ディレクトリ構成

```
src/
  ├─ index.html       # UI (入力フォームとログ出力)
  └─ app.js           # WebRTC セッションとデータチャネルの実装
```

## 前提条件

- Azure OpenAI リソース
- リアルタイム API プレビュー リソース
- ブラウザ（WebRTC 対応）

## 設定方法

1. `src/index.html` をブラウザで開く
2. 以下の入力欄に値を入力
   - **Resource Name**: Azure OpenAI リソース名
   - **API Key**: Azure OpenAI の API キー
   - **Deployment**: 音声モデルのデプロイ名（例: `gpt-4o-realtime-preview`）
   - **WebRTC Region**: リアルタイム API エンドポイントのリージョン（例: `eastus2`）
3. 「Start Session」ボタンをクリックし、マイクの使用を許可
4. 音声入力すると、AI が応答音声を再生します

## 主な機能

- 音声キャプチャ: ブラウザのマイク入力を取得し、RTCPeerConnection に追加
- WebRTC シグナリング: OpenAI リアルタイム API で SDP オファー/アンサー交換
- データチャネル: テキストベースのイベント（セッション更新、エラー、終了）を送受信
- 音声再生: サーバーからの音声ストリームを再生
- ログ出力: 画面上のテキストエリアに通信状況を表示

## 使い方例
特別なビルドは不要です。
ブラウザで `index.html` を開き、必要な情報を入力して「Start Session」ボタンをクリックするだけお試しいただけます。

また、Azure Static Web Apps や GitHub Pages などのホスティングサービスを利用して、簡単にデプロイできます。

## ライセンス

MIT © TAKASHI OKAWA