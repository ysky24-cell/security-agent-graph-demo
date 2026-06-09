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
  state.content = await fetch("./content.json").then((res) => res.json());
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
  qs("#graphStats").innerHTML = [
    ["役割", "CISO、CAIO、CSIRT、SOC、監査、AI専門家"],
    ["RACIV", "役割とプロセスを責任、説明、助言、通知、検証で接続"],
    ["記録", "判断ログ、監査調書、台帳、是正記録が証跡になる"],
    ["フレームワーク", "下位要求をISMSに変換し、CSF/AI RMFで経営判断へ渡す"]
  ].map(([title, body]) => `<section class="overview-card"><h3>${title}</h3><p>${body}</p></section>`).join("");
  qs("#graphLegend").innerHTML = [
    ["役割", colors.role],
    ["RACIV", colors.raciv],
    ["プロセス", colors.process],
    ["記録", colors.record],
    ["ISMS", colors.isms],
    ["上位FW", colors.framework]
  ].map(([label, color]) => `<span><i style="background:${color}"></i>${label}</span>`).join("");
  drawVaultGraph(qs("#vaultGraphCanvas"));
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
  qs("#breachScenarioSwitches").innerHTML = breachScenarios.map((item) => {
    const active = state.activeBreachIds.has(item.id);
    return `<button class="scenario-switch ${active ? "is-active" : ""}" data-breach-id="${item.id}"><span>${item.category}</span><strong>${item.name}</strong></button>`;
  }).join("");
  qsa("[data-breach-id]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.breachId;
    if (state.activeBreachIds.has(id)) state.activeBreachIds.delete(id);
    else state.activeBreachIds.add(id);
    renderBreachDemo();
  }));
  const active = breachScenarios.filter((item) => state.activeBreachIds.has(item.id));
  const impact = postureBaseline.map((value, index) => Math.max(20, value - active.reduce((sum, item) => sum + item.impact[index], 0)));
  qs("#breachActiveSummary").innerHTML = active.length
    ? active.map((item) => `<div><strong>${item.name}</strong><span>${item.isms.join(" / ")}</span></div>`).join("")
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
  const { ctx, width, height } = setupCanvas(canvas);
  if (width < 120 || height < 120) return;
  ctx.clearRect(0, 0, width, height);
  const nodes = [
    ...nodeGroup(["CISO", "CAIO", "CSIRT", "SOC", "監査", "AI専門家"], "role", 0.18, height),
    ...nodeGroup(["R", "A", "C", "I", "V"], "raciv", 0.34, height),
    ...nodeGroup(["監視", "脆弱性管理", "インシデント対応", "AIリスク管理", "委託先管理", "BCP"], "process", 0.50, height),
    ...nodeGroup(["判断ログ", "監査調書", "台帳", "是正記録"], "record", 0.66, height),
    ...nodeGroup(["ISMS A.5", "ISMS A.8", "ISMS規格項番"], "isms", 0.80, height),
    ...nodeGroup(["NIST CSF", "AI RMF", "OWASP", "SCS"], "framework", 0.92, height)
  ].map((node, index) => ({ ...node, id: index, x: node.x * width }));
  const links = [];
  nodes.filter((n) => n.type === "role").forEach((role) => nodes.filter((n) => n.type === "raciv").forEach((r) => links.push([role, r, 0.12])));
  nodes.filter((n) => n.type === "raciv").forEach((r) => nodes.filter((n) => n.type === "process").forEach((p) => links.push([r, p, 0.20])));
  nodes.filter((n) => n.type === "process").forEach((p) => nodes.filter((n) => n.type === "record").forEach((r) => links.push([p, r, 0.16])));
  nodes.filter((n) => n.type === "record").forEach((r) => nodes.filter((n) => n.type === "isms").forEach((i) => links.push([r, i, 0.18])));
  nodes.filter((n) => n.type === "isms").forEach((i) => nodes.filter((n) => n.type === "framework").forEach((f) => links.push([i, f, 0.22])));
  links.forEach(([from, to, alpha]) => {
    ctx.strokeStyle = rgba("#94a3b8", alpha);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.bezierCurveTo((from.x + to.x) / 2, from.y, (from.x + to.x) / 2, to.y, to.x, to.y);
    ctx.stroke();
  });
  nodes.forEach((node) => drawGraphNode(ctx, node, colors[node.type]));
}

function nodeGroup(labels, type, x, height) {
  const gap = height / (labels.length + 1);
  return labels.map((label, index) => ({ label, type, x, y: gap * (index + 1) }));
}

function drawBreachChain(canvas, active) {
  const { ctx, width, height } = setupCanvas(canvas);
  if (width < 120 || height < 120) return;
  ctx.clearRect(0, 0, width, height);
  const activeLower = unique(active.flatMap((item) => item.lower)).slice(0, 10);
  const activeIsms = unique(active.flatMap((item) => item.isms)).slice(0, 10);
  const activeProcesses = unique(active.flatMap((item) => item.processes)).slice(0, 10);
  const activeFrameworks = unique(active.flatMap((item) => item.frameworks)).slice(0, 8);
  const columns = [
    ["下位FW未成立", activeLower, colors.framework],
    ["ISMS中間層", activeIsms, colors.isms],
    ["後続プロセス未成立", activeProcesses, colors.process],
    ["経営ポスチャ低下", activeFrameworks, colors.role]
  ];
  columns.forEach(([title, items, color], col) => {
    const x = width * (0.12 + col * 0.25);
    ctx.fillStyle = colors.ink;
    ctx.font = "700 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(title, x, 28);
    const gap = Math.min(42, (height - 80) / Math.max(items.length, 1));
    items.forEach((label, row) => drawGraphNode(ctx, { label, x, y: 72 + row * gap, type: "process" }, color, 5));
  });
  for (let col = 0; col < columns.length - 1; col++) {
    const fromItems = columns[col][1];
    const toItems = columns[col + 1][1];
    fromItems.forEach((_, row) => {
      const from = { x: width * (0.12 + col * 0.25) + 58, y: 72 + row * Math.min(42, (height - 80) / Math.max(fromItems.length, 1)) };
      const to = { x: width * (0.12 + (col + 1) * 0.25) - 58, y: 72 + (row % Math.max(toItems.length, 1)) * Math.min(42, (height - 80) / Math.max(toItems.length, 1)) };
      arrow(ctx, from, to, "#94a3b8");
    });
  }
}

function unique(items) {
  return [...new Set(items)];
}

function drawGraphNode(ctx, node, color, radius = 7) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(node.label, node.x, node.y + 22);
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
