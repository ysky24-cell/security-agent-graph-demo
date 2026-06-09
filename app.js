const colors = {
  role: "#f59e0b",
  raciv: "#7c3aed",
  process: "#2563eb",
  record: "#16a34a",
  isms: "#0891b2",
  framework: "#dc2626",
  muted: "#94a3b8",
  ink: "#172033"
};

const state = {
  content: null,
  graphData: null,
  overviewGraph: {
    nodes: [],
    links: [],
    visibleTypes: new Set(["center", "control", "process", "role", "cost_model"]),
    search: "",
    selected: null,
    hovered: null,
    dragging: null,
    panning: null,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    animation: null,
    bound: false
  },
  selectedCostGroup: "ops",
  selectedCostDetail: "continuous-monitoring",
  includeRecords: true,
  activeBreachIds: new Set(["id-compromise", "component-cve", "cloud-misconfig"]),
  activeDecisionDetails: new Set(["identity-governance", "continuous-monitoring", "incident-response"])
};

const postureLabels = ["GV", "ID", "PR", "DE", "RS", "RC", "AI-GOV", "AI-MAP"];
const postureBaseline = [76, 72, 70, 68, 66, 64, 62, 60];
const decisionBaseline = [54, 50, 48, 46, 44, 42, 40, 38];
const palette = ["#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0891b2", "#dc2626", "#64748b"];
const racivMeta = {
  R: { label: "R 実行", color: "#2563eb" },
  A: { label: "A 説明責任", color: "#16a34a" },
  C: { label: "C 助言", color: "#f59e0b" },
  I: { label: "I 通知", color: "#64748b" },
  V: { label: "V 検証・監査", color: "#dc2626" }
};

const racivOverrides = {
  "continuous-monitoring": { "SOC": "R", "CSIRT": "A", "監査": "V", "検証": "V" },
  "log-review": { "分析": "R", "SOC": "R", "検証": "V" },
  "alert-tuning": { "SOC": "R", "リサーチャー": "C", "開発": "R" },
  "cve-triage": { "脆弱性": "R", "リサーチャー": "C", "CSIRT": "A" },
  "sbom-review": { "開発": "R", "脆弱性": "C", "検証": "V" },
  "patch-validation": { "検証": "V", "開発": "R", "アーキテクト": "C" },
  "incident-response": { "CSIRT": "R", "CISO": "A", "広報": "I", "法務": "C" },
  "forensics": { "フォレンジック": "R", "CSIRT": "C", "監査": "V", "検証": "V" },
  "lessons-learned": { "CSIRT": "R", "アーキテクト": "C", "監査": "V" },
  "policy-governance": { "ガバナンス": "R", "CISO": "A", "コンプライアンス": "C" },
  "supplier-audit": { "監査": "V", "コンプライアンス": "C", "調達": "I" },
  "bcp-exercise": { "BCP": "R", "CSIRT": "C", "CISO": "A" },
  "security-architecture": { "アーキテクト": "R", "開発": "C", "CISO": "A" },
  "cloud-posture": { "クラウド": "R", "アーキテクト": "C", "検証": "V" },
  "local-extension-review": { "検証": "V", "アーキテクト": "C", "ガバナンス": "A" },
  "privacy-impact": { "個人情報": "R", "法務": "C", "監査": "V" },
  "data-classification": { "個人情報": "R", "ガバナンス": "A", "開発": "C" },
  "dlp-operation": { "SOC": "R", "個人情報": "C", "検証": "V" },
  "ai-risk-management": { "CAIO": "A", "Security for AI": "R", "ガバナンス": "C" },
  "prompt-data-control": { "Security for AI": "R", "個人情報": "C", "開発": "R" },
  "ai-for-security": { "AI for Security": "R", "SOC": "C", "検証": "V" }
};

const costProcessGroups = [
  group("ops", "運用プロセス", "監視、ログ、SOC運用を継続的に回す分類", [
    detail("continuous-monitoring", "継続的監視", 2.0, 310, 0.4, 55, [["SOCアナリスト", 1500, 0.12], ["CSIRT", 1700, 0.06], ["監査・検証", 1300, 0.03]]),
    detail("log-review", "ログレビュー", 1.4, 190, 0.3, 35, [["分析アナリスト", 1400, 0.07], ["SOCアナリスト", 1500, 0.05], ["検証", 1200, 0.02]]),
    detail("alert-tuning", "検知ルール調整", 1.6, 240, 0.2, 25, [["SOCアナリスト", 1500, 0.07], ["セキュリティリサーチャー", 1800, 0.05], ["開発", 1500, 0.03]])
  ]),
  group("vuln", "脆弱性管理", "CVE、SBOM、修正判定を回す分類", [
    detail("cve-triage", "CVEトリアージ", 1.8, 280, 0.3, 40, [["脆弱性調査", 1600, 0.09], ["セキュリティリサーチャー", 1800, 0.06], ["CSIRT", 1700, 0.03]]),
    detail("sbom-review", "SBOMレビュー", 1.2, 170, 0.3, 30, [["開発", 1500, 0.05], ["脆弱性調査", 1600, 0.04], ["検証", 1200, 0.02]]),
    detail("patch-validation", "修正検証", 1.5, 230, 0.2, 25, [["検証", 1200, 0.07], ["開発", 1500, 0.05], ["セキュリティアーキテクト", 1900, 0.03]])
  ]),
  group("incident", "インシデント対応", "初動、封じ込め、フォレンジックを扱う分類", [
    detail("incident-response", "初動対応", 1.7, 260, 0.4, 55, [["CSIRT", 1700, 0.09], ["CISO", 2300, 0.03], ["広報・法務連携", 1400, 0.03]]),
    detail("forensics", "フォレンジック", 1.6, 270, 0.4, 50, [["フォレンジック", 1800, 0.09], ["CSIRT", 1700, 0.04], ["監査・検証", 1300, 0.03]]),
    detail("lessons-learned", "再発防止レビュー", 1.0, 150, 0.3, 35, [["CSIRT", 1700, 0.04], ["セキュリティアーキテクト", 1900, 0.03], ["監査", 1500, 0.03]])
  ]),
  group("governance", "ガバナンス・監査", "規程、監査、BCP、委託先を扱う分類", [
    detail("policy-governance", "規程・ルール管理", 1.2, 180, 0.6, 70, [["ガバナンス", 1600, 0.06], ["CISO", 2300, 0.03], ["コンプライアンス", 1500, 0.03]]),
    detail("supplier-audit", "委託先監査", 1.4, 210, 0.7, 80, [["監査", 1500, 0.07], ["コンプライアンス", 1500, 0.04], ["調達連携", 1200, 0.03]]),
    detail("bcp-exercise", "BCP訓練", 1.3, 190, 0.5, 60, [["BCP担当", 1400, 0.06], ["CSIRT", 1700, 0.03], ["CISO", 2300, 0.02]])
  ]),
  group("architecture", "アーキテクチャ", "設計、クラウド、ゼロトラストを扱う分類", [
    detail("security-architecture", "セキュリティ設計", 1.8, 330, 0.3, 40, [["セキュリティアーキテクト", 1900, 0.11], ["開発", 1500, 0.05], ["CISO", 2300, 0.02]]),
    detail("cloud-posture", "クラウド設定評価", 1.6, 250, 0.3, 35, [["クラウドセキュリティ", 1700, 0.08], ["セキュリティアーキテクト", 1900, 0.04], ["検証", 1200, 0.03]]),
    detail("local-extension-review", "ローカルアプリ・拡張機能審査", 1.5, 220, 0.4, 45, [["検証", 1200, 0.06], ["セキュリティアーキテクト", 1900, 0.04], ["ガバナンス", 1600, 0.03]])
  ]),
  group("privacy", "個人情報・機密情報", "個人情報、GDPR、機密情報の保護を扱う分類", [
    detail("privacy-impact", "PIA / DPIA", 1.4, 220, 0.5, 60, [["個人情報保護", 1600, 0.08], ["法務", 1700, 0.04], ["監査", 1500, 0.03]]),
    detail("data-classification", "情報分類・ラベリング", 1.1, 150, 0.4, 45, [["個人情報保護", 1600, 0.05], ["ガバナンス", 1600, 0.03], ["開発", 1500, 0.02]]),
    detail("dlp-operation", "DLP運用", 1.3, 190, 0.3, 35, [["SOCアナリスト", 1500, 0.05], ["個人情報保護", 1600, 0.04], ["検証", 1200, 0.03]])
  ]),
  group("ai", "AIセキュリティ", "Security for AI / AI for Security / CAIOを扱う分類", [
    detail("ai-risk-management", "AIリスク管理", 1.7, 330, 0.5, 65, [["CAIO", 2400, 0.06], ["Security for AI", 2000, 0.07], ["ガバナンス", 1600, 0.04]]),
    detail("prompt-data-control", "プロンプト・データ管理", 1.4, 230, 0.4, 50, [["Security for AI", 2000, 0.06], ["個人情報保護", 1600, 0.04], ["開発", 1500, 0.03]]),
    detail("ai-for-security", "AI for Security運用", 1.5, 260, 0.3, 40, [["AI for Security", 1900, 0.07], ["SOCアナリスト", 1500, 0.04], ["検証", 1200, 0.03]])
  ])
];

const breachScenarios = [
  breach("id-compromise", "ID侵害", "認証・特権ID", ["MFA例外", "特権ID棚卸"], ["A.5.15", "A.8.2", "A.8.5"], ["IDガバナンス", "継続的監視"], ["CSF PR.AA", "CSF DE.CM"], [4, 6, 9, 6, 5, 3, 1, 1]),
  breach("detection-gap", "検知不備", "SOC・検知", ["EDRチューニング", "相関分析"], ["A.8.15", "A.8.16", "A.5.24"], ["ログレビュー", "初動対応"], ["CSF DE.CM", "CSF RS.AN"], [2, 4, 5, 10, 8, 4, 1, 1]),
  breach("component-cve", "OSS/CVE", "脆弱性", ["SBOM欠落", "CVE判定遅延"], ["A.8.8", "A.8.25", "A.8.32"], ["CVEトリアージ", "修正検証"], ["CSF ID.RA", "CSF PR.PS"], [2, 9, 8, 4, 4, 2, 1, 1]),
  breach("cloud-misconfig", "クラウド設定不備", "クラウド", ["公開ストレージ", "過剰権限"], ["A.5.23", "A.8.9", "A.8.3"], ["クラウド設定評価", "セキュリティ設計"], ["CSF PR.PS", "CSF GV.RM"], [4, 6, 9, 4, 4, 3, 1, 1]),
  breach("supplier-breach", "委託先侵害", "委託先", ["評価未実施", "接続権限過多"], ["A.5.19", "A.5.20", "A.5.22"], ["委託先監査", "規程・ルール管理"], ["CSF GV.SC", "CSF ID.IM"], [7, 6, 5, 4, 5, 4, 1, 1]),
  breach("ai-data-leak", "AIデータ漏えい", "AI・個人情報", ["入力分類なし", "DLP未連携"], ["A.5.34", "A.8.12", "A.8.11"], ["AIリスク管理", "プロンプト・データ管理"], ["AI RMF MAP", "AI RMF MANAGE"], [4, 5, 7, 4, 4, 3, 10, 9]),
  breach("local-app", "ローカルアプリ侵害", "端末", ["未承認アプリ", "端末制御なし"], ["A.8.1", "A.8.19", "A.8.7"], ["ローカルアプリ・拡張機能審査", "継続的監視"], ["CSF PR.PS", "CSF DE.CM"], [3, 5, 8, 6, 4, 3, 1, 1]),
  breach("extension-risk", "拡張機能侵害", "ブラウザ", ["権限過多", "審査なし"], ["A.8.19", "A.5.15", "A.8.12"], ["ローカルアプリ・拡張機能審査", "情報分類・ラベリング"], ["CSF PR.AA", "CSF GV.OC"], [4, 5, 8, 5, 4, 2, 2, 2]),
  breach("log-missing", "ログ欠落", "証跡", ["保存期間不足", "時刻同期なし"], ["A.8.15", "A.8.17", "A.5.28"], ["ログレビュー", "フォレンジック"], ["CSF DE.AE", "CSF RS.AN"], [2, 4, 4, 8, 9, 5, 1, 1]),
  breach("backup-failure", "復旧不備", "BCP", ["復旧訓練なし", "バックアップ検証なし"], ["A.5.30", "A.8.13", "A.5.29"], ["BCP訓練", "再発防止レビュー"], ["CSF RC.RP", "CSF GV.RM"], [4, 3, 5, 3, 5, 10, 1, 1]),
  breach("ransomware", "ランサムウェア", "端末・復旧", ["隔離遅延", "バックアップ未検証"], ["A.8.7", "A.8.13", "A.5.24"], ["初動対応", "BCP訓練"], ["CSF RS.MA", "CSF RC.RP"], [3, 4, 8, 7, 9, 9, 1, 1]),
  breach("phishing", "フィッシング", "人的要因", ["訓練不足", "報告経路なし"], ["A.6.3", "A.5.14", "A.5.24"], ["規程・ルール管理", "初動対応"], ["CSF PR.AT", "CSF RS.CO"], [5, 4, 6, 5, 7, 3, 1, 1]),
  breach("insider", "内部不正", "人的・権限", ["職務分掌不足", "監査ログ不足"], ["A.5.3", "A.5.15", "A.8.15"], ["IDガバナンス", "ログレビュー"], ["CSF GV.RR", "CSF DE.CM"], [8, 5, 7, 7, 6, 3, 1, 1]),
  breach("api-abuse", "API悪用", "アプリ", ["認可不備", "レート制限なし"], ["A.8.26", "A.8.28", "A.8.31"], ["セキュリティ設計", "修正検証"], ["OWASP API", "CSF PR.PS"], [3, 7, 9, 5, 5, 2, 2, 2]),
  breach("secrets-leak", "秘密情報流出", "開発", ["鍵管理なし", "リポジトリ混入"], ["A.8.24", "A.8.9", "A.5.10"], ["SBOMレビュー", "情報分類・ラベリング"], ["CSF PR.DS", "CSF ID.AM"], [3, 7, 8, 5, 5, 3, 2, 2]),
  breach("email-bec", "BEC/なりすまし", "業務", ["承認ルール不足", "送信ドメイン未整備"], ["A.5.14", "A.5.15", "A.8.23"], ["規程・ルール管理", "継続的監視"], ["CSF PR.AA", "CSF DE.CM"], [6, 4, 6, 6, 5, 3, 1, 1]),
  breach("privacy-complaint", "個人情報苦情", "プライバシー", ["同意管理不足", "PIA未実施"], ["A.5.34", "A.5.31", "A.5.33"], ["PIA / DPIA", "情報分類・ラベリング"], ["Privacy", "CSF GV.RM"], [7, 5, 6, 3, 4, 4, 3, 3]),
  breach("model-poisoning", "AIモデル汚染", "AI", ["学習データ検証なし", "モデル監視なし"], ["A.8.25", "A.8.28", "A.5.37"], ["AIリスク管理", "AI for Security運用"], ["AI RMF MEASURE", "AI RMF MANAGE"], [5, 6, 6, 7, 6, 3, 9, 10]),
  breach("prompt-injection", "プロンプトインジェクション", "生成AI", ["入力検証なし", "出力承認なし"], ["A.8.28", "A.8.12", "A.5.34"], ["プロンプト・データ管理", "AIリスク管理"], ["AI RMF MAP", "OWASP LLM"], [5, 5, 8, 5, 5, 3, 9, 9]),
  breach("audit-failure", "監査証跡不備", "監査", ["証跡台帳なし", "是正追跡なし"], ["A.5.35", "A.5.36", "A.8.15"], ["委託先監査", "再発防止レビュー"], ["CSF GV.OV", "CSF ID.IM"], [9, 5, 4, 6, 6, 4, 2, 2])
];

const breachScenarioGroups = [
  scenarioGroup("identity", "ID・人の侵害", "認証、権限、メール、内部不正を扱う分類", ["id-compromise", "phishing", "insider", "email-bec"]),
  scenarioGroup("operations", "運用・検知の侵害", "監視、ログ、初動、復旧の不足を扱う分類", ["detection-gap", "log-missing", "backup-failure", "ransomware"]),
  scenarioGroup("technology", "技術・脆弱性の侵害", "CVE、クラウド、API、秘密情報を扱う分類", ["component-cve", "cloud-misconfig", "api-abuse", "secrets-leak"]),
  scenarioGroup("thirdparty", "委託・監査の侵害", "外部委託、証跡、監査不備を扱う分類", ["supplier-breach", "audit-failure"]),
  scenarioGroup("data-ai", "データ・AIの侵害", "個人情報、AI、生成AIのリスクを扱う分類", ["ai-data-leak", "privacy-complaint", "model-poisoning", "prompt-injection"]),
  scenarioGroup("endpoint", "端末・拡張機能の侵害", "ローカルアプリ、ブラウザ拡張、端末制御を扱う分類", ["local-app", "extension-risk"])
];

const ismsCascadeLayers = [
  ismsLayer("L1 前提統制", ["A.5.3", "A.5.10", "A.5.14", "A.5.15", "A.5.19", "A.5.20", "A.5.22", "A.5.23", "A.6.3", "A.8.1", "A.8.2", "A.8.3", "A.8.5"]),
  ismsLayer("L2 技術・運用統制", ["A.8.7", "A.8.8", "A.8.9", "A.8.11", "A.8.12", "A.8.13", "A.8.15", "A.8.16", "A.8.17", "A.8.19", "A.8.23", "A.8.24", "A.8.25", "A.8.26", "A.8.28", "A.8.31", "A.8.32"]),
  ismsLayer("L3 検知・対応統制", ["A.5.24", "A.5.28", "A.5.29", "A.5.30", "A.8.15", "A.8.16", "A.8.17"]),
  ismsLayer("L4 証跡・是正統制", ["A.5.31", "A.5.33", "A.5.34", "A.5.35", "A.5.36", "A.5.37"]),
  ismsLayer("L5 経営判断ポスチャ", ["CSF GV", "CSF ID", "CSF PR", "CSF DE", "CSF RS", "CSF RC", "AI RMF"])
];

const decisionGroups = costProcessGroups.map((groupItem) => ({
  id: groupItem.id,
  name: groupItem.name,
  description: groupItem.description,
  details: groupItem.details.map((item) => ({
    id: item.id,
    name: item.name,
    cost: item.baseCost + item.records.cost,
    roles: item.roles.map((role) => role.name),
    improves: decisionImproveFor(item.id)
  }))
}));

function group(id, name, description, details) {
  return { id, name, description, details };
}

function detail(id, name, personMonths, baseCost, recordMonths, recordCost, roles) {
  return {
    id,
    name,
    personMonths,
    baseCost,
    records: { personMonths: recordMonths, cost: recordCost },
    roles: roles.map(([roleName, annualSalary, allocation, raciv], index) => ({
      name: roleName,
      raciv: raciv || inferRaciv(id, roleName, index),
      annualSalary,
      allocation,
      cost: Math.round(annualSalary * allocation)
    }))
  };
}

function inferRaciv(detailId, roleName, index) {
  const overrides = racivOverrides[detailId] || {};
  const matched = Object.entries(overrides).find(([keyword]) => roleName.includes(keyword));
  if (matched) return matched[1];
  if (roleName.includes("CISO") || roleName.includes("CAIO")) return "A";
  if (roleName.includes("監査") || roleName.includes("検証")) return "V";
  if (roleName.includes("法務") || roleName.includes("コンプライアンス") || roleName.includes("個人情報")) return "C";
  if (roleName.includes("広報") || roleName.includes("調達")) return "I";
  return index === 0 ? "R" : index === 1 ? "C" : "V";
}

function breach(id, name, category, lower, isms, processes, frameworks, impact) {
  return { id, name, category, lower, isms, processes, frameworks, impact };
}

function scenarioGroup(id, name, description, scenarioIds) {
  return { id, name, description, scenarioIds };
}

function ismsLayer(title, controls) {
  return { title, controls };
}

function decisionImproveFor(id) {
  const base = {
    "identity-governance": [8, 5, 5, 4, 3, 2, 1, 1],
    "continuous-monitoring": [3, 4, 5, 9, 7, 3, 1, 1],
    "incident-response": [3, 3, 4, 5, 9, 6, 1, 1],
    "ai-risk-management": [5, 3, 4, 4, 4, 3, 10, 9],
    "supplier-audit": [7, 5, 4, 3, 4, 3, 1, 1],
    "privacy-impact": [6, 4, 6, 3, 4, 4, 4, 3]
  };
  return base[id] || [3, 3, 4, 4, 4, 3, id.includes("ai") ? 7 : 1, id.includes("ai") ? 6 : 1];
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function yen(value) {
  return `${Math.round(value).toLocaleString("ja-JP")}万円 / 年`;
}

async function init() {
  const [content, graphData] = await Promise.all([
    fetch("./content.json?v=20260609-organization-graph").then((res) => res.json()),
    fetch("./graph.json?v=20260609-force-graph").then((res) => res.json())
  ]);
  state.content = content;
  state.graphData = graphData;
  renderContent();
  bindTabs();
  renderGraph();
  renderCostDemo();
  renderBreachDemo();
  renderDecisionDemo();
}

function renderContent() {
  const { hero, overview_cards, article, checklist } = state.content;
  qs("#heroEyebrow").textContent = hero.eyebrow;
  qs("#heroTitle").textContent = hero.title;
  qs("#heroLead").textContent = hero.lead;
  qs("#overviewCards").innerHTML = overview_cards.map((card) => `
    <section class="overview-card"><h3>${card.title}</h3><p>${card.body}</p></section>
  `).join("");
  qs("#articleBody").innerHTML = article.map((item) => `
    <section class="article-card">
      <img src="${item.image}" alt="${item.heading}の図解" loading="lazy">
      <div class="article-card-body">
        <span class="article-number">${item.number}</span>
        <h3>${item.heading}</h3>
        <p>${item.summary}</p>
        <ul>${item.points.map((point) => `<li>${point}</li>`).join("")}</ul>
      </div>
    </section>
  `).join("");
  qs("#typeSummary").innerHTML = [
    ["役割", "CISO / CAIO / CSIRT / 監査"],
    ["プロセス", "RACIV / 詳細手順 / 工数"],
    ["管理策", "ISMS / NIST / OWASP / SCS"],
    ["記録", "判断ログ / 監査調書 / 台帳"]
  ].map(([label, text]) => `<div><strong>${label}</strong><span>${text}</span></div>`).join("");
  qs("#checklistItems").innerHTML = checklist.map((item) => `
    <section class="check-card"><h3>${item.title}</h3><p>${item.body}</p></section>
  `).join("");
}

function bindTabs() {
  const activate = (id) => {
    qsa(".tab-button").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === id));
    qsa(".tab-panel").forEach((panel) => panel.classList.toggle("is-active", panel.id === id));
    history.replaceState(null, "", `#${id}`);
    requestAnimationFrame(renderVisibleCharts);
  };
  qsa("[data-tab]").forEach((button) => button.addEventListener("click", () => activate(button.dataset.tab)));
  qsa("[data-tab-jump]").forEach((button) => button.addEventListener("click", () => activate(button.dataset.tabJump)));
  const initial = location.hash.replace("#", "");
  if (initial && qs(`#${initial}`)) activate(initial);
}

function renderVisibleCharts() {
  const id = qs(".tab-panel.is-active")?.id;
  if (id === "graph") renderGraph();
  if (id === "demo-cost") renderCostDemo();
  if (id === "demo-breach") renderBreachDemo();
  if (id === "demo-executive") renderDecisionDemo();
}

function renderGraph() {
  if (!state.graphData) return;
  const counts = state.graphData.meta?.counts || {};
  qs("#graphStats").innerHTML = [
    ["ノード", `${state.graphData.nodes.length}件`],
    ["リンク", `${state.graphData.links.length}件`],
    ["初期表示", [...state.overviewGraph.visibleTypes].join(" / ")],
    ["操作", "ドラッグ、ホイールズーム、クリック詳細、検索、種別フィルター"]
  ].map(([title, body]) => `<section class="overview-card"><h3>${title}</h3><p>${body}</p></section>`).join("");
  qs("#overviewGraphFilters").innerHTML = state.graphData.types.map((type) => `
    <label class="graph-filter ${state.overviewGraph.visibleTypes.has(type.id) ? "is-active" : ""}">
      <input type="checkbox" value="${type.id}" ${state.overviewGraph.visibleTypes.has(type.id) ? "checked" : ""}>
      <span><i style="background:${type.color}"></i>${type.label}</span>
      <small>${counts[type.id] || 0}</small>
    </label>
  `).join("");
  qs("#graphLegend").innerHTML = state.graphData.types
    .filter((type) => state.overviewGraph.visibleTypes.has(type.id))
    .map((type) => `<span><i style="background:${type.color}"></i>${type.label}</span>`)
    .join("");
  bindOverviewGraphControls();
  prepareOverviewGraph();
  drawVaultGraph(qs("#vaultGraphCanvas"));
  renderOverviewNodeDetail(state.overviewGraph.selected);
}

function prepareOverviewGraph() {
  const graph = state.overviewGraph;
  const sourceNodes = state.graphData.nodes;
  const sourceLinks = state.graphData.links;
  const search = graph.search.trim().toLowerCase();
  const visibleType = (node) => graph.visibleTypes.has(node.type);
  const searchMatch = (node) => !search || [node.label, node.summary, node.path, ...(node.tags || [])].join(" ").toLowerCase().includes(search);
  const visibleIds = new Set();
  sourceNodes.forEach((node) => {
    if (visibleType(node) && searchMatch(node)) visibleIds.add(node.id);
  });
  if (search) {
    sourceLinks.forEach((link) => {
      if (visibleIds.has(link.source)) visibleIds.add(link.target);
      if (visibleIds.has(link.target)) visibleIds.add(link.source);
    });
  }
  const oldById = new Map(graph.nodes.map((node) => [node.id, node]));
  const canvas = qs("#vaultGraphCanvas");
  const rect = canvas.getBoundingClientRect();
  graph.nodes = sourceNodes.filter((node) => visibleIds.has(node.id)).slice(0, search ? 120 : 80).map((node, index) => {
    const old = oldById.get(node.id);
    const angle = index * 2.399963;
    const radius = 80 + index * 2.8;
    return {
      ...node,
      x: old?.x ?? rect.width / 2 + Math.cos(angle) * radius,
      y: old?.y ?? rect.height / 2 + Math.sin(angle) * radius,
      vx: old?.vx ?? 0,
      vy: old?.vy ?? 0,
      fixed: node.type === "center",
      searchHit: searchMatch(node) && Boolean(search)
    };
  });
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  graph.links = sourceLinks
    .filter((link) => nodesById.has(link.source) && nodesById.has(link.target))
    .map((link) => ({ ...link, sourceNode: nodesById.get(link.source), targetNode: nodesById.get(link.target) }));
  if (!graph.selected || !nodesById.has(graph.selected.id)) graph.selected = graph.nodes.find((node) => node.type === "center") || graph.nodes[0] || null;
  if (graph.animation) cancelAnimationFrame(graph.animation);
  simulateOverviewGraph();
}

function simulateOverviewGraph() {
  const graph = state.overviewGraph;
  const canvas = qs("#vaultGraphCanvas");
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  graph.nodes.forEach((node) => {
    if (node.fixed && !graph.dragging) {
      node.x += (centerX - node.x) * 0.08;
      node.y += (centerY - node.y) * 0.08;
      node.vx *= 0.7;
      node.vy *= 0.7;
      return;
    }
    node.vx += (centerX - node.x) * 0.0009;
    node.vy += (centerY - node.y) * 0.0009;
  });
  graph.links.forEach((link) => {
    const source = link.sourceNode;
    const target = link.targetNode;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const desired = source.type === "center" || target.type === "center" ? 110 : 72;
    const force = (distance - desired) * 0.006 * (link.strength || 1);
    const fx = dx / distance * force;
    const fy = dy / distance * force;
    if (source !== graph.dragging) {
      source.vx += fx;
      source.vy += fy;
    }
    if (target !== graph.dragging) {
      target.vx -= fx;
      target.vy -= fy;
    }
  });
  for (let i = 0; i < graph.nodes.length; i++) {
    for (let j = i + 1; j < graph.nodes.length; j++) {
      const a = graph.nodes[i];
      const b = graph.nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distanceSq = Math.max(40, dx * dx + dy * dy);
      const force = Math.min(1.8, 2200 / distanceSq);
      const distance = Math.sqrt(distanceSq);
      const fx = dx / distance * force;
      const fy = dy / distance * force;
      if (a !== graph.dragging) {
        a.vx -= fx;
        a.vy -= fy;
      }
      if (b !== graph.dragging) {
        b.vx += fx;
        b.vy += fy;
      }
    }
  }
  graph.nodes.forEach((node) => {
    if (node === graph.dragging) return;
    node.vx *= 0.86;
    node.vy *= 0.86;
    node.x += node.vx;
    node.y += node.vy;
    node.x = Math.max(24, Math.min(rect.width - 24, node.x));
    node.y = Math.max(24, Math.min(rect.height - 24, node.y));
  });
  drawVaultGraph(canvas);
  graph.animation = requestAnimationFrame(simulateOverviewGraph);
}

function bindOverviewGraphControls() {
  const graph = state.overviewGraph;
  if (!graph.bound) {
    const canvas = qs("#vaultGraphCanvas");
    qs("#overviewGraphSearch").addEventListener("input", (event) => {
      graph.search = event.target.value;
      prepareOverviewGraph();
      renderGraph();
    });
    qs("#overviewGraphReset").addEventListener("click", () => {
      graph.search = "";
      graph.visibleTypes = new Set(state.graphData.meta?.initial_visible_types || ["center", "control", "process", "role", "cost_model"]);
      graph.selected = null;
      qs("#overviewGraphSearch").value = "";
      renderGraph();
    });
    canvas.addEventListener("mousedown", (event) => {
      const point = toOverviewGraphPoint(event);
      const node = findOverviewNode(point.x, point.y);
      if (node) {
        graph.dragging = node;
        graph.selected = node;
        renderOverviewNodeDetail(node);
      } else {
        graph.panning = { x: event.clientX, y: event.clientY, offsetX: graph.offsetX, offsetY: graph.offsetY };
      }
    });
    canvas.addEventListener("mousemove", (event) => {
      const point = toOverviewGraphPoint(event);
      if (graph.dragging) {
        graph.dragging.x = point.x;
        graph.dragging.y = point.y;
        graph.dragging.vx = 0;
        graph.dragging.vy = 0;
      } else if (graph.panning) {
        graph.offsetX = graph.panning.offsetX + event.clientX - graph.panning.x;
        graph.offsetY = graph.panning.offsetY + event.clientY - graph.panning.y;
      }
      graph.hovered = findOverviewNode(point.x, point.y);
      canvas.style.cursor = graph.dragging || graph.panning ? "grabbing" : graph.hovered ? "grab" : "move";
    });
    window.addEventListener("mouseup", () => {
      graph.dragging = null;
      graph.panning = null;
    });
    canvas.addEventListener("click", (event) => {
      const point = toOverviewGraphPoint(event);
      const node = findOverviewNode(point.x, point.y);
      if (node) {
        graph.selected = node;
        renderOverviewNodeDetail(node);
      }
    });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      graph.scale = Math.max(0.65, Math.min(1.8, graph.scale + (event.deltaY > 0 ? -0.08 : 0.08)));
      drawVaultGraph(canvas);
    }, { passive: false });
    window.addEventListener("resize", resizeOverviewCanvas);
    graph.bound = true;
  }
  qsa("#overviewGraphFilters input").forEach((input) => {
    input.onchange = () => {
      if (input.checked) graph.visibleTypes.add(input.value);
      else graph.visibleTypes.delete(input.value);
      graph.visibleTypes.add("center");
      renderGraph();
    };
  });
}

function findOverviewNode(x, y) {
  const graph = state.overviewGraph;
  for (let index = graph.nodes.length - 1; index >= 0; index--) {
    const node = graph.nodes[index];
    const radius = overviewNodeRadius(node) + 5;
    if (Math.hypot(node.x - x, node.y - y) <= radius) return node;
  }
  return null;
}

function toOverviewGraphPoint(event) {
  const rect = qs("#vaultGraphCanvas").getBoundingClientRect();
  const graph = state.overviewGraph;
  return {
    x: (event.clientX - rect.left - graph.offsetX) / graph.scale,
    y: (event.clientY - rect.top - graph.offsetY) / graph.scale
  };
}

function renderOverviewNodeDetail(node) {
  const detail = qs("#overviewNodeDetail");
  if (!node) {
    detail.innerHTML = `<p class="eyebrow">Node Detail</p><h3>ノードを選択</h3><p>グラフ上のノードをクリックすると詳細を表示します。</p>`;
    return;
  }
  const related = state.overviewGraph.links
    .filter((link) => link.source === node.id || link.target === node.id)
    .slice(0, 8)
    .map((link) => link.source === node.id ? link.targetNode : link.sourceNode);
  detail.innerHTML = `
    <p class="eyebrow">Node Detail</p>
    <h3>${node.label}</h3>
    <p class="node-type">${overviewTypeLabel(node.type)}</p>
    <p>${node.summary || "概要は未設定です。"}</p>
    <dl class="node-detail-list">
      <div><dt>種別</dt><dd>${node.type}</dd></div>
      <div><dt>接続</dt><dd>${related.length}件</dd></div>
      ${node.path ? `<div><dt>文書</dt><dd>${node.path}</dd></div>` : ""}
    </dl>
    ${node.tags?.length ? `<div class="tag-row">${node.tags.slice(0, 8).map((tag) => `<span>${tag}</span>`).join("")}</div>` : ""}
    ${related.length ? `<h4>隣接ノード</h4><ul>${related.map((item) => `<li>${item.label}</li>`).join("")}</ul>` : ""}
  `;
}

function resizeOverviewCanvas() {
  prepareOverviewGraph();
}

function renderCostDemo() {
  qs("#costProcessGroups").innerHTML = costProcessGroups.map((groupItem) => {
    const activeGroup = groupItem.id === state.selectedCostGroup;
    return `
      <section class="process-group-card ${activeGroup ? "is-active" : ""}">
        <button class="process-group-head" data-cost-group="${groupItem.id}">
          <strong>${groupItem.name}</strong>
          <span>${groupItem.description}</span>
        </button>
        <div class="detail-chip-row">
          ${groupItem.details.map((item) => `<button class="detail-chip ${item.id === state.selectedCostDetail ? "is-active" : ""}" data-cost-detail="${item.id}" data-cost-group="${groupItem.id}">${item.name}</button>`).join("")}
        </div>
      </section>
    `;
  }).join("");
  qsa("[data-cost-group]").forEach((button) => button.addEventListener("click", () => {
    const groupItem = costProcessGroups.find((item) => item.id === button.dataset.costGroup);
    state.selectedCostGroup = groupItem.id;
    state.selectedCostDetail = groupItem.details[0].id;
    renderCostDemo();
  }));
  qsa("[data-cost-detail]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    state.selectedCostGroup = button.dataset.costGroup;
    state.selectedCostDetail = button.dataset.costDetail;
    renderCostDemo();
  }));
  qs("#recordsToggle").onclick = () => {
    state.includeRecords = !state.includeRecords;
    renderCostDemo();
  };

  const groupItem = costProcessGroups.find((item) => item.id === state.selectedCostGroup);
  const selected = groupItem.details.find((item) => item.id === state.selectedCostDetail);
  const groupTotals = summarizeDetails(groupItem.details);
  const selectedTotal = summarizeDetails([selected]);
  qs("#costProcessTitle").textContent = `${groupItem.name} / ${selected.name}`;
  qs("#recordsToggle").textContent = `記録帳票 ${state.includeRecords ? "ON" : "OFF"}`;
  qs("#recordsToggle").setAttribute("aria-pressed", String(state.includeRecords));
  qs("#costSummary").innerHTML = [
    ["選択詳細の年間人月", `${selectedTotal.months.toFixed(1)}人月 / 年`],
    ["選択詳細の概算人件費", yen(selectedTotal.cost)],
    ["代表プロセス合計", `${groupTotals.months.toFixed(1)}人月 / ${yen(groupTotals.cost)}`]
  ].map(metric).join("");
  drawBars(qs("#processCostCanvas"), groupItem.details.map((item, index) => {
    const total = summarizeDetails([item]);
    return { label: item.name, value: total.cost, color: palette[index % palette.length] };
  }), "万円/年");
  const roleCosts = new Map();
  selected.roles.forEach((role) => {
    const key = `${role.raciv}:${role.name}`;
    const current = roleCosts.get(key) || { label: role.name, raciv: role.raciv, value: 0, allocation: 0 };
    current.value += role.cost;
    current.allocation += role.allocation;
    roleCosts.set(key, current);
  });
  if (state.includeRecords) {
    roleCosts.set("V:記録帳票・承認", { label: "記録帳票・承認", raciv: "V", value: selected.records.cost, allocation: 0 });
  }
  const roleData = [...roleCosts.values()].map((item) => ({
    label: `${item.raciv} ${item.label}`,
    value: item.value,
    color: racivMeta[item.raciv]?.color || colors.muted,
    raciv: item.raciv,
    name: item.label,
    allocation: item.allocation
  }));
  qs("#roleCostLegend").innerHTML = Object.entries(racivMeta).map(([key, meta]) => `<span><i style="background:${meta.color}"></i>${meta.label}</span>`).join("");
  qs("#roleRacivMatrix").innerHTML = roleData.map((item) => {
    const meta = racivMeta[item.raciv] || racivMeta.I;
    const allocationText = item.allocation ? `${Math.round(item.allocation * 100)}%` : "帳票工数";
    return `
      <div class="raciv-role-row">
        <span class="raciv-badge" style="--raciv-color:${meta.color}">${meta.label}</span>
        <strong>${item.name}</strong>
        <span>${allocationText}</span>
        <span>${yen(item.value)}</span>
      </div>
    `;
  }).join("");
  drawBars(qs("#roleCostCanvas"), roleData, "万円/年");
}

function summarizeDetails(details) {
  return details.reduce((sum, item) => {
    sum.months += item.personMonths + (state.includeRecords ? item.records.personMonths : 0);
    sum.cost += item.baseCost + (state.includeRecords ? item.records.cost : 0);
    return sum;
  }, { months: 0, cost: 0 });
}

function renderBreachDemo() {
  qs("#breachScenarioSwitches").innerHTML = breachScenarioGroups.map((groupItem) => {
    const scenarios = groupItem.scenarioIds.map((id) => breachScenarios.find((item) => item.id === id)).filter(Boolean);
    const activeCount = scenarios.filter((item) => state.activeBreachIds.has(item.id)).length;
    return `
      <section class="process-group-card scenario-group-card ${activeCount ? "is-active" : ""}">
        <div class="process-group-head static">
          <strong>${groupItem.name}</strong>
          <span>${groupItem.description}</span>
          <em>${activeCount}/${scenarios.length} ON</em>
        </div>
        <div class="detail-chip-row scenario-detail-row">
          ${scenarios.map((item) => {
            const active = state.activeBreachIds.has(item.id);
            return `<button class="scenario-switch ${active ? "is-active" : ""}" data-breach-id="${item.id}"><span>${item.category}</span><strong>${item.name}</strong></button>`;
          }).join("")}
        </div>
      </section>
    `;
  }).join("");
  qsa("[data-breach-id]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.breachId;
    if (state.activeBreachIds.has(id)) state.activeBreachIds.delete(id);
    else state.activeBreachIds.add(id);
    renderBreachDemo();
  }));
  const active = breachScenarios.filter((item) => state.activeBreachIds.has(item.id));
  const impact = postureBaseline.map((value, index) => Math.max(20, value - active.reduce((sum, item) => sum + item.impact[index], 0)));
  const cascade = buildIsmsCascade(active);
  qs("#breachActiveSummary").innerHTML = active.length
    ? [
      ...active.map((item) => `<div><strong>${item.name}</strong><span>${item.isms.join(" / ")}</span></div>`),
      `<div><strong>ISMS連鎖</strong><span>${cascade.impactedLayerCount}層 / ${cascade.impactedControlCount}件が不成立</span></div>`
    ].join("")
    : `<div><strong>未選択</strong><span>シナリオをONにしてください</span></div>`;
  qs("#breachImpact").innerHTML = postureLabels.map((label, index) => `<div><strong>${label}</strong><span>-${postureBaseline[index] - impact[index]}pt</span></div>`).join("");
  drawBreachChain(qs("#breachChainCanvas"), active);
  drawRadar(qs("#breachRadarCanvas"), postureLabels, [
    { name: "平常時", values: postureBaseline, color: "#2563eb" },
    { name: "シナリオON後", values: impact, color: "#dc2626" }
  ]);
}

function renderDecisionDemo() {
  qs("#decisionProcessGrid").innerHTML = decisionGroups.map((groupItem) => {
    const allActive = groupItem.details.every((detailItem) => state.activeDecisionDetails.has(detailItem.id));
    return `
      <section class="process-group-card ${allActive ? "is-active" : ""}">
        <button class="process-group-head" data-decision-group="${groupItem.id}">
          <strong>${groupItem.name}</strong>
          <span>${allActive ? "全詳細プロセス ON" : groupItem.description}</span>
        </button>
        <div class="detail-chip-row">
          ${groupItem.details.map((item) => `<button class="detail-chip ${state.activeDecisionDetails.has(item.id) ? "is-active" : ""}" data-decision-detail="${item.id}">${item.name}</button>`).join("")}
        </div>
      </section>
    `;
  }).join("");
  qsa("[data-decision-group]").forEach((button) => button.addEventListener("click", () => {
    const groupItem = decisionGroups.find((item) => item.id === button.dataset.decisionGroup);
    const allActive = groupItem.details.every((item) => state.activeDecisionDetails.has(item.id));
    groupItem.details.forEach((item) => {
      if (allActive) state.activeDecisionDetails.delete(item.id);
      else state.activeDecisionDetails.add(item.id);
    });
    renderDecisionDemo();
  }));
  qsa("[data-decision-detail]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const id = button.dataset.decisionDetail;
    if (state.activeDecisionDetails.has(id)) state.activeDecisionDetails.delete(id);
    else state.activeDecisionDetails.add(id);
    renderDecisionDemo();
  }));
  const details = decisionGroups.flatMap((groupItem) => groupItem.details).filter((item) => state.activeDecisionDetails.has(item.id));
  const totalCost = details.reduce((sum, item) => sum + item.cost, 0);
  const roles = new Set(details.flatMap((item) => item.roles));
  const after = decisionBaseline.map((value, index) => Math.min(95, value + details.reduce((sum, item) => sum + item.improves[index], 0)));
  const avgImprove = after.reduce((sum, value, index) => sum + value - decisionBaseline[index], 0) / after.length;
  qs("#decisionCostCards").innerHTML = [
    ["追加詳細プロセス", `${details.length}件`],
    ["必要役割", `${roles.size}種`],
    ["年間追加費用", yen(totalCost)],
    ["平均改善幅", `+${avgImprove.toFixed(1)}pt`]
  ].map(metric).join("");
  drawRadar(qs("#decisionRadarCanvas"), postureLabels, [
    { name: "現状", values: decisionBaseline, color: "#64748b" },
    { name: "投資後", values: after, color: "#16a34a" }
  ]);
}

function metric([label, value]) {
  return `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function drawVaultGraph(canvas) {
  drawOverviewGraph(canvas);
}

function drawOverviewGraph(canvas) {
  const { ctx, width, height } = setupCanvas(canvas);
  if (width < 120 || height < 120) return;
  ctx.clearRect(0, 0, width, height);
  const graph = state.overviewGraph;
  ctx.save();
  ctx.translate(graph.offsetX, graph.offsetY);
  ctx.scale(graph.scale, graph.scale);
  drawOverviewLinks(ctx);
  drawOverviewNodes(ctx);
  ctx.restore();
}

function drawOverviewLinks(ctx) {
  const graph = state.overviewGraph;
  const selected = graph.selected;
  graph.links.forEach((link) => {
    const active = selected && (link.source === selected.id || link.target === selected.id);
    ctx.strokeStyle = active ? rgba("#2563eb", 0.55) : rgba("#94a3b8", 0.18);
    ctx.lineWidth = active ? 1.8 : 0.9;
    ctx.beginPath();
    ctx.moveTo(link.sourceNode.x, link.sourceNode.y);
    ctx.lineTo(link.targetNode.x, link.targetNode.y);
    ctx.stroke();
  });
}

function drawOverviewNodes(ctx) {
  const graph = state.overviewGraph;
  graph.nodes.forEach((node) => {
    const color = overviewTypeColor(node.type);
    const radius = overviewNodeRadius(node);
    const active = graph.selected?.id === node.id || graph.hovered?.id === node.id || node.searchHit;
    ctx.fillStyle = active ? rgba(color, 0.22) : rgba(color, 0.08);
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + (active ? 9 : 5), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (active || node.important || ["center", "control", "process", "role", "cost_model"].includes(node.type)) {
      drawOverviewNodeLabel(ctx, node, active);
    }
  });
}

function drawOverviewNodeLabel(ctx, node, active) {
  ctx.fillStyle = active ? "#0f172a" : "#334155";
  ctx.font = `${active || node.important ? "700" : "600"} ${active ? 13 : 11}px system-ui`;
  ctx.textAlign = "center";
  const label = node.label.length > 18 ? `${node.label.slice(0, 17)}...` : node.label;
  ctx.fillText(label, node.x, node.y + overviewNodeRadius(node) + 15);
}

function overviewNodeRadius(node) {
  if (node.type === "center") return 28;
  if (node.important || node.id.startsWith("hub:")) return 16;
  const base = Number(node.radius) || 11;
  return Math.max(8, Math.min(15, base));
}

function overviewTypeColor(type) {
  return state.graphData?.types?.find((item) => item.id === type)?.color || colors.muted;
}

function overviewTypeLabel(type) {
  return state.graphData?.types?.find((item) => item.id === type)?.label || type;
}

function drawBreachChain(canvas, active) {
  const { ctx, width, height } = setupCanvas(canvas);
  if (width < 120 || height < 120) return;
  ctx.clearRect(0, 0, width, height);
  const activeLower = unique(active.flatMap((item) => item.lower)).slice(0, 10);
  const activeProcesses = unique(active.flatMap((item) => item.processes)).slice(0, 6);
  const activeFrameworks = unique(active.flatMap((item) => item.frameworks)).slice(0, 6);
  const cascade = buildIsmsCascade(active);
  const columns = [
    { title: "下位トリガー", nodes: activeLower.map((label) => ({ label, status: "direct" })) },
    ...cascade.layers,
    { title: "後続プロセス", nodes: activeProcesses.map((label) => ({ label, status: "cascade" })) },
    { title: "上位ポスチャ", nodes: activeFrameworks.map((label) => ({ label, status: "cascade" })) }
  ];
  const xGap = width / Math.max(columns.length, 1);
  columns.forEach((column, col) => {
    const x = xGap * col + xGap / 2;
    ctx.fillStyle = colors.ink;
    ctx.font = "700 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(column.title, x, 26);
    const items = column.nodes.length ? column.nodes.slice(0, 6) : [{ label: "未影響", status: "inactive" }];
    const gap = Math.min(54, (height - 92) / Math.max(items.length, 1));
    items.forEach((item, row) => {
      drawCascadeNode(ctx, { ...item, x, y: 72 + row * gap });
    });
  });
  drawCascadeLegend(ctx, width);
  for (let col = 0; col < columns.length - 1; col++) {
    const fromItems = columns[col].nodes.length ? columns[col].nodes.slice(0, 6) : [{ label: "未影響", status: "inactive" }];
    const toItems = columns[col + 1].nodes.length ? columns[col + 1].nodes.slice(0, 6) : [{ label: "未影響", status: "inactive" }];
    fromItems.forEach((_, row) => {
      const fromX = xGap * col + xGap / 2 + 46;
      const toX = xGap * (col + 1) + xGap / 2 - 46;
      const fromY = 72 + row * Math.min(54, (height - 92) / Math.max(fromItems.length, 1));
      const toY = 72 + (row % Math.max(toItems.length, 1)) * Math.min(54, (height - 92) / Math.max(toItems.length, 1));
      arrow(ctx, { x: fromX, y: fromY }, { x: toX, y: toY }, col < cascade.firstCascadeColumn ? "#cbd5e1" : "#f97316");
    });
  }
}

function drawCascadeLegend(ctx, width) {
  const items = [
    ["直接不成立", "#dc2626"],
    ["連鎖不成立", "#f97316"],
    ["未影響", "#94a3b8"]
  ];
  const startX = Math.max(18, width - 300);
  items.forEach(([label, color], index) => {
    const x = startX + index * 96;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, 42, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.font = "700 11px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 9, 46);
  });
}

function buildIsmsCascade(active) {
  const directControls = new Set(unique(active.flatMap((item) => item.isms)));
  const directLayerIndexes = ismsCascadeLayers
    .map((layer, index) => layer.controls.some((control) => directControls.has(control)) ? index : -1)
    .filter((index) => index >= 0);
  const firstImpactedLayer = directLayerIndexes.length ? Math.min(...directLayerIndexes) : -1;
  const layers = ismsCascadeLayers.map((layer, index) => {
    const direct = layer.controls.filter((control) => directControls.has(control)).map((label) => ({ label, status: "direct" }));
    const cascaded = firstImpactedLayer >= 0 && index > firstImpactedLayer
      ? layer.controls.filter((control) => !directControls.has(control)).slice(0, 4 - direct.length).map((label) => ({ label, status: "cascade" }))
      : [];
    return { title: layer.title, nodes: [...direct, ...cascaded] };
  });
  const impacted = layers.flatMap((layer) => layer.nodes).filter((node) => node.status !== "inactive");
  return {
    layers,
    firstCascadeColumn: firstImpactedLayer < 0 ? Number.MAX_SAFE_INTEGER : firstImpactedLayer,
    impactedLayerCount: layers.filter((layer) => layer.nodes.length).length,
    impactedControlCount: impacted.length
  };
}

function drawCascadeNode(ctx, node) {
  const paletteByStatus = {
    direct: { fill: "#fee2e2", border: "#dc2626", dot: "#dc2626", text: "#7f1d1d" },
    cascade: { fill: "#fffbeb", border: "#f97316", dot: "#f97316", text: "#78350f" },
    inactive: { fill: "#f8fafc", border: "#cbd5e1", dot: "#94a3b8", text: "#64748b" }
  };
  const style = paletteByStatus[node.status] || paletteByStatus.inactive;
  const width = 92;
  const height = 34;
  ctx.fillStyle = style.fill;
  ctx.strokeStyle = style.border;
  ctx.lineWidth = 1.4;
  roundRect(ctx, node.x - width / 2, node.y - height / 2, width, height, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = style.dot;
  ctx.beginPath();
  ctx.arc(node.x - width / 2 + 12, node.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = style.text;
  ctx.font = "700 11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(node.label, node.x + 7, node.y + 4);
}

function unique(items) {
  return [...new Set(items)];
}

function drawGraphNode(ctx, node, color, radius = 10) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.font = "13px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(node.label, node.x, node.y + 27);
}

function drawBars(canvas, data, unit) {
  const { ctx, width, height } = setupCanvas(canvas);
  if (width < 160 || height < 100) return;
  ctx.clearRect(0, 0, width, height);
  const max = Math.max(...data.map((item) => item.value), 1);
  const left = 140;
  const top = 28;
  const barHeight = Math.min(38, (height - top * 2) / data.length - 10);
  if (barHeight <= 0) return;
  ctx.font = "13px system-ui";
  ctx.textBaseline = "middle";
  data.forEach((item, index) => {
    const y = top + index * (barHeight + 14);
    const barWidth = (width - left - 92) * (item.value / max);
    ctx.fillStyle = "#334155";
    ctx.fillText(item.label, 14, y + barHeight / 2);
    ctx.fillStyle = "#e2e8f0";
    roundRect(ctx, left, y, width - left - 92, barHeight, 8);
    ctx.fill();
    ctx.fillStyle = item.color;
    roundRect(ctx, left, y, barWidth, barHeight, 8);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.fillText(`${item.value}${unit}`, left + barWidth + 10, y + barHeight / 2);
  });
}

function drawRadar(canvas, labels, series) {
  const { ctx, width, height } = setupCanvas(canvas);
  if (width < 160 || height < 160) return;
  ctx.clearRect(0, 0, width, height);
  const cx = width / 2;
  const cy = height / 2 + 12;
  const radius = Math.min(width, height) * 0.31;
  for (let step = 1; step <= 4; step++) {
    polygon(ctx, labels.length, cx, cy, radius * step / 4);
    ctx.strokeStyle = "#dbe3ef";
    ctx.stroke();
  }
  labels.forEach((label, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / labels.length;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.strokeStyle = "#e2e8f0";
    ctx.stroke();
    ctx.fillStyle = "#334155";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(label, cx + Math.cos(angle) * (radius + 34), cy + Math.sin(angle) * (radius + 24));
  });
  series.forEach((item) => {
    ctx.beginPath();
    item.values.forEach((value, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / labels.length;
      const x = cx + Math.cos(angle) * radius * value / 100;
      const y = cy + Math.sin(angle) * radius * value / 100;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = rgba(item.color, 0.18);
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  });
  series.forEach((item, index) => {
    ctx.fillStyle = item.color;
    roundRect(ctx, 22 + index * 120, 18, 14, 14, 4);
    ctx.fill();
    ctx.fillStyle = "#334155";
    ctx.textAlign = "left";
    ctx.fillText(item.name, 44 + index * 120, 25);
  });
}

function polygon(ctx, sides, cx, cy, radius) {
  ctx.beginPath();
  for (let index = 0; index < sides; index++) {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / sides;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function arrow(ctx, from, to, color) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - Math.cos(angle - 0.45) * 8, to.y - Math.sin(angle - 0.45) * 8);
  ctx.lineTo(to.x - Math.cos(angle + 0.45) * 8, to.y - Math.sin(angle + 0.45) * 8);
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx, x, y, width, height, radius) {
  if (width <= 0 || height <= 0) return;
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function rgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.addEventListener("resize", renderVisibleCharts);
init();
