const state = {
  content: null,
  selectedCostProcess: "continuous-monitoring",
  includeRecords: true,
  selectedBreach: "id-compromise",
  activeDecisionProcesses: new Set(["identity-governance", "continuous-monitoring", "incident-response"])
};

const costProcesses = [
  {
    id: "continuous-monitoring",
    name: "継続的監視",
    personMonths: 5.4,
    baseCost: 820,
    records: { personMonths: 0.9, cost: 120 },
    roles: [
      { name: "SOCアナリスト", ratio: 38, cost: 360 },
      { name: "CSIRT", ratio: 24, cost: 220 },
      { name: "セキュリティアーキテクト", ratio: 18, cost: 160 },
      { name: "監査・検証", ratio: 20, cost: 80 }
    ]
  },
  {
    id: "vulnerability-management",
    name: "脆弱性管理",
    personMonths: 4.1,
    baseCost: 680,
    records: { personMonths: 0.7, cost: 90 },
    roles: [
      { name: "脆弱性調査", ratio: 34, cost: 240 },
      { name: "開発", ratio: 28, cost: 210 },
      { name: "セキュリティリサーチャー", ratio: 20, cost: 150 },
      { name: "検証", ratio: 18, cost: 80 }
    ]
  },
  {
    id: "ai-risk-management",
    name: "AIリスク管理",
    personMonths: 3.8,
    baseCost: 760,
    records: { personMonths: 0.8, cost: 110 },
    roles: [
      { name: "CAIO", ratio: 24, cost: 240 },
      { name: "Security for AI", ratio: 28, cost: 220 },
      { name: "AI for Security", ratio: 18, cost: 140 },
      { name: "ガバナンス", ratio: 30, cost: 160 }
    ]
  },
  {
    id: "third-party-security",
    name: "委託先管理",
    personMonths: 3.2,
    baseCost: 520,
    records: { personMonths: 1.1, cost: 130 },
    roles: [
      { name: "ガバナンス", ratio: 30, cost: 160 },
      { name: "コンプライアンス", ratio: 24, cost: 120 },
      { name: "監査", ratio: 26, cost: 130 },
      { name: "CISO", ratio: 20, cost: 110 }
    ]
  }
];

const breachStories = [
  story("id-compromise", "ID侵害", "CVE発行後、認証基盤の既知脆弱性から特権IDが悪用される。", ["MFA例外管理", "特権ID棚卸", "ログ相関分析"], ["A.5.15 アクセス制御", "A.8.2 特権アクセス権", "A.8.15 ログ取得"], ["CSF PR.AA", "CSF DE.CM", "AI RMF MAP"], [82, 76, 72, 68, 64], [55, 48, 46, 50, 44]),
  story("detection-gap", "検知侵害", "EDRアラートの運用未整備により侵害兆候が長期間見落とされる。", ["検知ルール管理", "チューニング記録", "エスカレーション基準"], ["A.8.16 監視活動", "A.5.24 インシデント管理計画"], ["CSF DE.CM", "CSF RS.AN"], [78, 74, 70, 66, 62], [48, 44, 42, 46, 50]),
  story("component-cve", "脆弱コンポーネント", "OSSコンポーネントのCVE対応が遅れ、公開PoCから侵害される。", ["SBOM更新", "CVEトリアージ", "修正リリース判定"], ["A.8.8 技術的脆弱性管理", "A.8.25 セキュア開発ライフサイクル"], ["CSF ID.RA", "CSF PR.PS"], [80, 72, 74, 70, 66], [52, 46, 50, 48, 43]),
  story("cloud-misconfig", "クラウド設定不備", "公開ストレージと過剰権限が重なり、機密ファイルが外部公開される。", ["CSPM検知", "設定標準", "例外承認"], ["A.8.9 構成管理", "A.5.23 クラウドサービス利用"], ["CSF PR.PS", "CSF GV.RM"], [76, 70, 72, 68, 64], [46, 42, 48, 44, 40]),
  story("supplier-breach", "委託先侵害", "委託先の運用端末侵害から接続情報が流出する。", ["委託先評価", "接続権限管理", "監査証跡"], ["A.5.19 供給者関係", "A.5.22 供給者サービス監視"], ["CSF GV.SC", "CSF ID.IM"], [78, 73, 68, 67, 62], [50, 45, 41, 43, 39]),
  story("ai-data-leak", "AIデータ漏えい", "AI利用時のプロンプトに個人情報と機密仕様が混入する。", ["AI利用ルール", "入力データ分類", "DLP連携"], ["A.5.34 プライバシーと個人情報保護", "A.8.12 データ漏えい防止"], ["AI RMF MEASURE", "AI RMF MANAGE"], [74, 72, 70, 68, 66], [44, 46, 43, 40, 42]),
  story("local-app", "ローカルアプリ侵害", "未承認アプリが端末上で認証情報と業務データへアクセスする。", ["アプリ棚卸", "許可リスト", "端末制御"], ["A.8.1 利用者端末", "A.8.19 ソフトウェア導入"], ["CSF PR.PS", "CSF DE.CM"], [77, 72, 69, 66, 63], [49, 43, 42, 45, 41]),
  story("extension-risk", "拡張機能侵害", "ChromeやAI拡張機能の権限過多によりセッション情報が流出する。", ["拡張機能審査", "権限レビュー", "ブラウザポリシー"], ["A.8.19 ソフトウェア導入", "A.5.15 アクセス制御"], ["CSF PR.AA", "CSF GV.OC"], [76, 71, 68, 64, 62], [47, 42, 39, 40, 38]),
  story("log-missing", "ログ欠落", "監査ログの保存期間と時刻同期が不足し、侵害範囲を特定できない。", ["ログ保全", "時刻同期", "証跡レビュー"], ["A.8.15 ログ取得", "A.8.17 クロック同期"], ["CSF DE.AE", "CSF RS.AN"], [79, 73, 70, 65, 61], [51, 45, 40, 39, 36]),
  story("backup-failure", "復旧不備", "ランサム被害後、復旧手順とバックアップ検証が不足し停止が長期化する。", ["復旧訓練", "バックアップ検証", "BCP判断"], ["A.5.30 ICT継続性", "A.8.13 情報バックアップ"], ["CSF RC.RP", "CSF GV.RM"], [75, 72, 69, 68, 63], [45, 44, 43, 40, 36])
];

const decisionProcesses = [
  { id: "identity-governance", name: "IDガバナンス", cost: 420, roles: ["CISO", "IAM担当", "監査"], improves: [8, 5, 4, 4, 3] },
  { id: "continuous-monitoring", name: "継続的監視", cost: 680, roles: ["SOC", "CSIRT", "分析アナリスト"], improves: [4, 9, 7, 5, 3] },
  { id: "incident-response", name: "インシデント対応", cost: 520, roles: ["CSIRT", "フォレンジック", "広報連携"], improves: [3, 4, 8, 6, 4] },
  { id: "ai-risk-management", name: "AIリスク管理", cost: 560, roles: ["CAIO", "Security for AI", "法務"], improves: [5, 3, 4, 9, 8] },
  { id: "supplier-audit", name: "委託先監査", cost: 360, roles: ["監査", "コンプライアンス", "調達"], improves: [6, 3, 3, 4, 5] },
  { id: "privacy-control", name: "個人情報管理", cost: 410, roles: ["個人情報保護", "DPO相当", "監査"], improves: [5, 3, 3, 6, 7] }
];

const postureLabels = ["Govern", "Identify", "Protect", "Detect", "Respond"];
const decisionBaseline = [54, 50, 48, 46, 44];

function story(id, name, lead, lower, isms, upper, before, after) {
  return { id, name, lead, lower, isms, upper, before, after };
}

function yen(value) {
  return `${Math.round(value).toLocaleString("ja-JP")}万円`;
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

async function init() {
  state.content = await fetch("./content.json").then((res) => res.json());
  renderContent();
  bindTabs();
  bindCostDemo();
  renderCostDemo();
  bindBreachDemo();
  renderBreachDemo();
  renderDecisionDemo();
  renderGraph();
}

function renderContent() {
  const { hero, overview_cards, article, checklist } = state.content;
  qs("#heroEyebrow").textContent = hero.eyebrow;
  qs("#heroTitle").textContent = hero.title;
  qs("#heroLead").textContent = hero.lead;

  qs("#overviewCards").innerHTML = overview_cards.map((card) => `
    <section class="overview-card">
      <h3>${card.title}</h3>
      <p>${card.body}</p>
    </section>
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
    <section class="check-card">
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </section>
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
  const activePanel = qs(".tab-panel.is-active");
  if (!activePanel) return;
  if (activePanel.id === "demo-cost") renderCostDemo();
  if (activePanel.id === "demo-breach") renderBreachDemo();
  if (activePanel.id === "demo-executive") renderDecisionDemo();
  if (activePanel.id === "graph") renderGraph();
}

function bindCostDemo() {
  qs("#costProcessTabs").innerHTML = costProcesses.map((process) => `
    <button class="local-tab ${process.id === state.selectedCostProcess ? "is-active" : ""}" data-cost-id="${process.id}">${process.name}</button>
  `).join("");

  qsa("[data-cost-id]").forEach((button) => button.addEventListener("click", () => {
    state.selectedCostProcess = button.dataset.costId;
    renderCostDemo();
  }));

  qs("#recordsToggle").addEventListener("click", () => {
    state.includeRecords = !state.includeRecords;
    renderCostDemo();
  });
}

function renderCostDemo() {
  const process = costProcesses.find((item) => item.id === state.selectedCostProcess) || costProcesses[0];
  const recordCost = state.includeRecords ? process.records.cost : 0;
  const recordMonths = state.includeRecords ? process.records.personMonths : 0;
  const totalCost = process.baseCost + recordCost;
  const totalMonths = process.personMonths + recordMonths;

  qsa("[data-cost-id]").forEach((button) => button.classList.toggle("is-active", button.dataset.costId === process.id));
  qs("#costProcessTitle").textContent = process.name;
  qs("#recordsToggle").textContent = `記録帳票 ${state.includeRecords ? "ON" : "OFF"}`;
  qs("#recordsToggle").setAttribute("aria-pressed", String(state.includeRecords));
  qs("#costSummary").innerHTML = [
    ["年間人月", `${totalMonths.toFixed(1)}人月`],
    ["概算人件費", yen(totalCost)],
    ["記録帳票分", state.includeRecords ? `${process.records.personMonths.toFixed(1)}人月 / ${yen(process.records.cost)}` : "除外中"]
  ].map(([label, value]) => metric(label, value)).join("");

  drawBars(qs("#processCostCanvas"), [
    { label: "基本運用", value: process.baseCost, color: "#2563eb" },
    { label: "記録帳票", value: recordCost, color: "#f59e0b" }
  ], "万円");

  qs("#roleCostLegend").innerHTML = process.roles.map((role) => `<span><i></i>${role.name}</span>`).join("");
  drawBars(qs("#roleCostCanvas"), process.roles.map((role, index) => ({
    label: role.name,
    value: Math.round((role.cost / process.baseCost) * totalCost),
    color: palette[index % palette.length]
  })), "万円");
}

function bindBreachDemo() {
  qs("#breachStoryTabs").innerHTML = breachStories.map((item) => `
    <button class="local-tab ${item.id === state.selectedBreach ? "is-active" : ""}" data-breach-id="${item.id}">${item.name}</button>
  `).join("");

  qsa("[data-breach-id]").forEach((button) => button.addEventListener("click", () => {
    state.selectedBreach = button.dataset.breachId;
    renderBreachDemo();
  }));
}

function renderBreachDemo() {
  const breach = breachStories.find((item) => item.id === state.selectedBreach) || breachStories[0];
  qsa("[data-breach-id]").forEach((button) => button.classList.toggle("is-active", button.dataset.breachId === breach.id));
  qs("#breachTitle").textContent = breach.name;
  qs("#breachFlow").innerHTML = [
    ["CVE発行 / 侵害イベント", breach.lead],
    ["下位フレームワーク未成立", breach.lower.join(" / ")],
    ["ISMS管理策未成立", breach.isms.join(" / ")],
    ["上位フレームワーク低下", breach.upper.join(" / ")]
  ].map(([label, body], index) => `
    <div class="flow-item">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div><strong>${label}</strong><p>${body}</p></div>
    </div>
  `).join("");
  drawRadar(qs("#breachRadarCanvas"), postureLabels, [
    { name: "侵害前", values: breach.before, color: "#2563eb" },
    { name: "侵害後", values: breach.after, color: "#dc2626" }
  ]);
  qs("#breachImpact").innerHTML = postureLabels.map((label, index) => {
    const diff = breach.before[index] - breach.after[index];
    return `<div><strong>${label}</strong><span>-${diff}pt</span></div>`;
  }).join("");
}

function renderDecisionDemo() {
  qs("#decisionProcessGrid").innerHTML = decisionProcesses.map((process) => {
    const active = state.activeDecisionProcesses.has(process.id);
    return `
      <button class="decision-card ${active ? "is-active" : ""}" data-decision-id="${process.id}">
        <span>${active ? "追加中" : "未追加"}</span>
        <strong>${process.name}</strong>
        <small>${process.roles.join(" / ")}</small>
        <em>${yen(process.cost)}</em>
      </button>
    `;
  }).join("");

  qsa("[data-decision-id]").forEach((button) => button.addEventListener("dblclick", () => {
    const id = button.dataset.decisionId;
    if (state.activeDecisionProcesses.has(id)) state.activeDecisionProcesses.delete(id);
    else state.activeDecisionProcesses.add(id);
    renderDecisionDemo();
  }));

  const active = decisionProcesses.filter((item) => state.activeDecisionProcesses.has(item.id));
  const totalCost = active.reduce((sum, item) => sum + item.cost, 0);
  const uniqueRoles = new Set(active.flatMap((item) => item.roles));
  const after = decisionBaseline.map((base, index) => Math.min(95, base + active.reduce((sum, item) => sum + item.improves[index], 0)));
  const avgImprove = after.reduce((sum, value, index) => sum + (value - decisionBaseline[index]), 0) / after.length;

  qs("#decisionCostCards").innerHTML = [
    ["追加プロセス", `${active.length}件`],
    ["追加役割", `${uniqueRoles.size}種`],
    ["年間追加費用", yen(totalCost)],
    ["平均改善幅", `+${avgImprove.toFixed(1)}pt`]
  ].map(([label, value]) => metric(label, value)).join("");

  drawRadar(qs("#decisionRadarCanvas"), postureLabels, [
    { name: "現状", values: decisionBaseline, color: "#64748b" },
    { name: "投資後", values: after, color: "#16a34a" }
  ]);
}

function renderGraph() {
  const stats = [
    ["役割ノード", "CISO、CAIO、監査、CSIRT、AI専門家"],
    ["プロセスノード", "監視、対応、管理策運用、監査、BCP"],
    ["管理策ノード", "ISMSを中層に各フレームワークを接続"],
    ["記録ノード", "判断ログ、台帳、監査調書、是正記録"]
  ];
  qs("#graphStats").innerHTML = stats.map(([title, body]) => `<section class="overview-card"><h3>${title}</h3><p>${body}</p></section>`).join("");
  drawMiniGraph(qs("#graphCanvas"));
}

function metric(label, value) {
  return `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`;
}

const palette = ["#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0891b2", "#dc2626"];

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function drawBars(canvas, data, unit) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  const max = Math.max(...data.map((item) => item.value), 1);
  const left = 128;
  const top = 28;
  const barHeight = Math.min(42, (height - top * 2) / data.length - 12);
  ctx.font = "13px system-ui";
  ctx.textBaseline = "middle";
  data.forEach((item, index) => {
    const y = top + index * (barHeight + 18);
    const barWidth = (width - left - 72) * (item.value / max);
    ctx.fillStyle = "#334155";
    ctx.fillText(item.label, 16, y + barHeight / 2);
    ctx.fillStyle = "#e2e8f0";
    roundRect(ctx, left, y, width - left - 72, barHeight, 8);
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
  ctx.clearRect(0, 0, width, height);
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = Math.min(width, height) * 0.32;
  const steps = 4;
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let step = 1; step <= steps; step++) {
    const r = (radius * step) / steps;
    polygon(ctx, labels.length, cx, cy, r);
    ctx.strokeStyle = "#dbe3ef";
    ctx.stroke();
  }

  labels.forEach((label, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / labels.length;
    const x = cx + Math.cos(angle) * (radius + 34);
    const y = cy + Math.sin(angle) * (radius + 24);
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.stroke();
    ctx.fillStyle = "#334155";
    ctx.fillText(label, x, y);
  });

  series.forEach((item) => {
    ctx.beginPath();
    item.values.forEach((value, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / labels.length;
      const r = radius * (value / 100);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = `${item.color}30`;
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  });

  series.forEach((item, index) => {
    const x = 22 + index * 112;
    ctx.fillStyle = item.color;
    roundRect(ctx, x, 18, 14, 14, 4);
    ctx.fill();
    ctx.fillStyle = "#334155";
    ctx.textAlign = "left";
    ctx.fillText(item.name, x + 22, 25);
  });
}

function drawMiniGraph(canvas) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  const nodes = [
    { label: "外部基準", x: 90, y: 85, color: "#0f766e" },
    { label: "管理策", x: 260, y: 85, color: "#2563eb" },
    { label: "プロセス", x: 430, y: 85, color: "#7c3aed" },
    { label: "RACIV役割", x: 600, y: 85, color: "#f59e0b" },
    { label: "記録類", x: 430, y: 210, color: "#16a34a" },
    { label: "判断ログ", x: 600, y: 210, color: "#dc2626" }
  ];
  const links = [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 3]];
  ctx.lineWidth = 2;
  links.forEach(([from, to]) => arrow(ctx, nodes[from], nodes[to]));
  nodes.forEach((node) => {
    ctx.fillStyle = node.color;
    roundRect(ctx, node.x - 60, node.y - 22, 120, 44, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, node.x, node.y);
  });
}

function polygon(ctx, sides, cx, cy, radius) {
  ctx.beginPath();
  for (let index = 0; index < sides; index++) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function arrow(ctx, from, to) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const startX = from.x + Math.cos(angle) * 66;
  const startY = from.y + Math.sin(angle) * 28;
  const endX = to.x - Math.cos(angle) * 66;
  const endY = to.y - Math.sin(angle) * 28;
  ctx.strokeStyle = "#94a3b8";
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - Math.cos(angle - 0.45) * 10, endY - Math.sin(angle - 0.45) * 10);
  ctx.lineTo(endX - Math.cos(angle + 0.45) * 10, endY - Math.sin(angle + 0.45) * 10);
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

window.addEventListener("resize", () => {
  renderCostDemo();
  renderBreachDemo();
  renderDecisionDemo();
  renderGraph();
});

init();
