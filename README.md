# Security Control Cost Graph Demo

セキュリティ組織における **管理策・プロセス・役割・RACIV・工数・人件費・AI削減効果** の関係を、グラフビューで可視化するデモです。

GitHub Pages 上で動作する静的デモとして作成しており、SCS / ISMS / Pマーク / NIST CSF などの管理策要求を起点に、必要となるプロセス、文書、証跡、役割、スキル、工数をたどれる構成にしています。

## Demo

GitHub Pages:

```text
https://ysky24-cell.github.io/security-agent-graph-demo/
```

## このデモで見えるもの

このデモは、単なる組織図や文書一覧ではなく、セキュリティ業務を以下のような連鎖として表現します。

```text
管理策 / 要求事項
  ↓
必要なプロセス
  ↓
必要な文書・証跡
  ↓
RACIV上の役割
  ↓
必要スキル・必要レベル
  ↓
年間工数・人月
  ↓
人件費
  ↓
AI補助による削減効果
```

これにより、上流サプライチェーンから要求される管理策や、認証取得・監査対応・脆弱性対応・侵害対応に必要な業務量を、構造的に確認できます。

## 主なユースケース

### 1. 管理策対応コストの可視化

SCS、ISMS、Pマーク、NIST CSF などの管理策を満たすために、どのプロセスが必要で、どの役割がどれだけ関与するかを可視化します。

例：

```text
SCS: 委託先管理
  ↓
サードパーティセキュリティ管理
  ↓
委託先評価プロセス
  ↓
Security Auditor / Cyber Risk Analyst / Business Owner
  ↓
年間工数・人件費
```

### 2. AI導入効果の説明

AIが補助できる作業と、人間が責任を持つべき作業を分けて表示します。

AI補助対象の例：

- 証跡収集
- 差分要約
- 一次分類
- チケット・報告書ドラフト
- 管理策と証跡のマッピング
- 監査準備資料の整理

一方で、以下は人間が責任を持つ前提です。

- 最終承認
- リスク受容
- 例外承認
- 重大インシデント判断
- 対外報告判断
- 経営判断

### 3. 侵害発生時の影響パス確認

侵害やCVE悪用が発生した場合に、どのプロセスが起動し、どの管理策ポスチャが低下し、どの証跡が必要になるかを確認できます。

例：

```text
CVE悪用疑い
  ↓
影響資産
  ↓
脆弱性管理
  ↓
インシデント対応
  ↓
フォレンジック
  ↓
顧客支援
  ↓
証跡収集
  ↓
ISMS / NIST CSF ポスチャ低下
  ↓
是正対応
```

### 4. 経営判断・提案資料への活用

人間だけで運用した場合の工数と、AI補助後の工数・コストを比較できます。

表示例：

- 年間人月
- 年収ベース人件費
- 間接費込み人件費
- 外注換算コスト
- AI補助後コスト
- 削減額
- 削減率
- 侵害時の追加工数
- 説明責任が残る領域

## 画面構成

### 表紙

デモの目的、管理策からAI削減効果までの流れを、セクションカードと図解で説明します。

### セキュリティ組織グラフ概要

Obsidian風の物理シミュレーショングラフで、役割、プロセス、管理策、台帳、証跡、コストモデルの関係を探索できます。

主な機能：

- ノードドラッグ
- ホイールズーム
- パン移動
- ノード検索
- 種別フィルター
- ノードクリックによる詳細表示

### 工数算出

管理策またはプロセス単位で、RACIV別工数、人月、人件費、AI補助後の削減効果を確認できます。

### 侵害パス

侵害シナリオを選択し、起動するプロセス、必要な役割、追加工数、影響する管理策、必要証跡を確認できます。

### 経営判断

AI導入・人員配置・外注・監査対応・プロセス改善の観点から、経営向けに判断材料を整理します。

### 公開前チェック

GitHub Pages公開前に、機密情報や内部情報が含まれていないか確認するチェックリストです。

## 技術構成

このデモは、GitHub Pagesでそのまま動く静的サイトです。

```text
HTML
CSS
Vanilla JavaScript
Canvas API
JSON
GitHub Pages
```

外部フレームワークやビルド工程は使用していません。

使用していないもの：

```text
React
Vue
Vite
D3.js
Cytoscape.js
vis-network
npm build
バックエンドAPI
データベース
```

## ファイル構成

```text
docs/
  ├─ index.html
  ├─ style.css
  ├─ app.js
  ├─ graph.json
  ├─ content.json
  └─ assets/
      └─ diagrams/
          ├─ 01-overview.png
          ├─ 02-control-to-process.png
          ├─ 03-process-to-raciv.png
          ├─ 04-role-cost-skill.png
          ├─ 05-ai-cost-reduction.png
          ├─ 06-cve-posture-impact.png
          └─ 07-commercial-proposal.png
```

## データモデル概要

### Role Node

役割ノードには、役割名、必要スキル、年収レンジ、AI補助可能性、関連プロセスなどを持たせています。

例：

```json
{
  "type": "role",
  "role_name": "Security Auditor",
  "required_skills": ["ISMS", "監査", "証跡確認"],
  "salary_bands": {
    "JP": {
      "senior": {
        "min": 8500000,
        "median": 10000000,
        "max": 11500000
      }
    }
  },
  "ai_assistability": 0.65,
  "ai_replaceability": 0.2
}
```

### Process Node

プロセスノードには、年間頻度、RACIV別工数、AI削減率、必要文書、必要証跡などを持たせています。

例：

```json
{
  "type": "process",
  "process_name": "脆弱性管理",
  "annual_frequency": 12,
  "raciv_effort": [
    {
      "raciv": "R",
      "role_id": "role-vulnerability-assessment-specialist",
      "required_level": "mid",
      "hours_per_run": 17,
      "ai_reduction_rate": 0.45
    }
  ]
}
```

### Control Node

管理策ノードには、フレームワーク、管理策ID、必要プロセス、必要文書、必要証跡を持たせています。

例：

```json
{
  "type": "control",
  "framework": "SCS",
  "control_id": "SCS-VENDOR",
  "control_name": "委託先管理",
  "required_processes": [
    "サードパーティセキュリティ管理",
    "委託先評価プロセス"
  ]
}
```

## コスト計算の考え方

### 基本式

```text
年間工数[h] = hours_per_run × annual_frequency
年間人月 = 年間工数 ÷ 160
時間単価 = 年収 × loaded cost multiplier ÷ 年間稼働時間
人間コスト = 年間工数 × 時間単価
AI補助後コスト = 人間コスト × (1 - ai_reduction_rate)
削減額 = 人間コスト - AI補助後コスト
削減率 = 削減額 ÷ 人間コスト
```

### 初期パラメータ

```text
1人月 = 160時間
年間稼働時間 = 1,600時間
loaded cost multiplier = 1.35
外注換算 = loaded cost × 1.5
```

## 表示切替

グラフデモでは、複数の視点で表示を切り替えられます。

### Scenario View

```text
通常運用
監査対応
侵害発生時
サプライチェーン要求
AI導入効果
```

### Cost View

```text
人月
年収ベース
間接費込み
外注換算
AI補助後
損失影響
```

### Message Tone

```text
技術向け
経営向け
監査向け
提案向け
```

### Region / Scenario

```text
Region: JP / US proxy
Scenario: Low / Base / High
```

## 注意事項

このデモに含まれる年収、工数、AI削減率、侵害時追加工数は、すべて **公開デモ用の概算値** です。

実際の提案・見積りでは、以下で補正してください。

- 顧客の実人件費
- 委託単価
- 対象システム数
- 月間チケット件数
- 監査頻度
- 管理策要求レベル
- 既存自動化率
- 既存文書整備状況
- 組織規模
- 業界特性

また、このデモではAIを最終責任者として扱いません。  
AIは、証跡収集、要約、分類、ドラフト、比較、整理を補助する前提です。  
最終承認、リスク受容、例外承認、重大インシデント判断は人間が担います。

## License

This repository is a public demo / sample.  
Do not include confidential, customer-specific, or internal operational data.
