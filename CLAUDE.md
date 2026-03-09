# CLAUDE.md - Apple Silicon Lab プロジェクト

## 基本ルール
- 日本語でコミュニケーションすること
- Conventional Commits を使用（feat:, fix:, docs:, style:, refactor:）
- コミットメッセージは日本語で記述

## 安全ルール
- `.env` ファイルは絶対にコミットしない
- APIキー等の機密情報は環境変数経由で管理
- `rm -rf` 等の破壊的コマンド実行前に必ず確認
- `git push --force` は禁止

## コーディング規約
- TypeScript strict mode 必須
- コンポーネントは関数コンポーネント + Hooks のみ
- Tailwind CSS v4 のユーティリティクラスを優先（カスタムCSS最小限）
- Astro islands: インタラクティブが必要なコンポーネントのみ React (client:visible)
- 静的コンテンツは Astro コンポーネントで実装

## プロジェクト構成
- `src/data/chips.json` — 全チップスペックデータ（編集時は型定義 `src/types/chip.ts` と整合させる）
- `src/pages/chip/[slug].astro` — チップ個別詳細ページ（動的ルート）
- `src/components/compare/` — 比較ツール（React islands）
- `src/layouts/BaseLayout.astro` — 共通レイアウト

## データ更新ルール
- 新チップ追加時は `src/data/chips.json` に追記
- `id`, `slug` はケバブケース（例: `m5-pro`）
- `color` は指示書記載のチップ別カラーコードを使用
- ベンチマーク値は出所を確認した実測値のみ

## デプロイ
- main ブランチへの push で Cloudflare Pages に自動デプロイ
- ビルドコマンド: `pnpm build`
- 出力ディレクトリ: `dist`
- Node.js バージョン: 20以上

## コスト
- ホスティング: Cloudflare Pages Free プラン（月間リクエスト無制限）
- 外部API: なし（全データ静的管理）
- コスト目標: 0円/月
