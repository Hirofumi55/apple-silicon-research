# Apple Silicon Lab

> Apple Siliconチップ（M1〜M5 / A15〜A19 Pro）のスペック・ベンチマーク完全比較サイト

[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-orange?logo=cloudflare)](https://apple-silicon-research.pages.dev)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-ff5d01?logo=astro)](https://astro.build)

## 概要

- M1〜M5 Max / A15〜A19 Pro の全チップをスペック比較
- CPU/GPU/Neural Engine コア数・メモリ帯域・ベンチマークを一覧表示
- インタラクティブな3チップ比較ツール（URL共有対応）
- 世代進化タイムライン・アーキテクチャ解説

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Astro 5 (SSG) |
| UIライブラリ | React 19 (Islands) |
| スタイリング | Tailwind CSS v4 |
| アニメーション | GSAP ScrollTrigger |
| グラフ | Recharts |
| ホスティング | Cloudflare Pages (0円/月) |

## ローカル開発

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # 静的ビルド
pnpm preview    # ビルド結果をプレビュー
```

## ディレクトリ構成

```
src/
├── data/chips.json          # 全チップデータ（M/Aシリーズ）
├── types/chip.ts            # TypeScript型定義
├── pages/
│   ├── index.astro          # トップページ
│   ├── m-series.astro       # Mシリーズ一覧
│   ├── a-series.astro       # Aシリーズ一覧
│   ├── compare.astro        # 比較ツール
│   ├── timeline.astro       # タイムライン
│   ├── architecture.astro   # 技術解説
│   └── chip/[slug].astro    # チップ詳細（動的ルート）
├── components/
│   ├── common/              # Header・Footer・ThemeToggle等
│   ├── chip/                # ChipCard
│   └── compare/             # ChipCompareTool・BenchmarkChart等
├── layouts/BaseLayout.astro
└── styles/global.css
public/
├── images/og/               # OGP画像
├── manifest.webmanifest     # PWA設定
└── robots.txt
```

## デプロイ

`main`ブランチへのpushでCloudflare Pagesに自動デプロイされます。

- ビルドコマンド: `pnpm build`
- 出力ディレクトリ: `dist`
- Node.js: 20以上

## データ更新

新チップを追加する場合は `src/data/chips.json` に追記してください。  
`id`・`slug` はケバブケース（例: `m6`, `m6-pro`）、`series` は `'m'` または `'a'` を指定。

## ライセンス

このサイトは非公式のファンサイト・教育目的コンテンツです。  
Apple・M1・M2等はApple Inc.の商標です。
