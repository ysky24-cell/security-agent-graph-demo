const state = {
  graph: null,
  content: null,
  nodes: [],
  links: [],
  typeMap: new Map(),
  enabledTypes: new Set(),
  selectedNode: null,
  hoveredNode: null,
  search: "",
  transform: { x: 0, y: 0, k: 1 },
  draggingNode: null,
  draggingView: false,
  lastPointer: null,
  animationFrame: null
};

const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

async function boot() {
  const [graph, content] = await Promise.all([
    fetch("./graph.json").then((res) => res.json()),
    fetch("./content.json").then((res) => res.json())
  ]);

  state.graph = graph;
  state.content = content;
  state.typeMap = new Map(graph.types.map((type) => [type.id, type]));
  state.enabledTypes = new Set(graph.types.map((type) => type.id));
  prepareGraph();
  renderArticle();
  renderTypeSummary();
  renderChecklist();
  renderFilters();
  renderDetail(state.nodes[0]);
  bindTabs();
  bindGraphControls();
  resizeCanvas();
  tick();
}

function prepareGraph() {
  const centerId = "system";
  const center = state.graph.nodes.find((node) => node.id === centerId);
  const radius = 285;

  state.nodes = state.graph.nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / state.graph.nodes.length;
    const isCenter = node.id === centerId;
    return {
      ...node,
      x: isCenter ? 0 : Math.cos(angle) * radius,
      y: isCenter ? 0 : Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      r: isCenter ? 28 : 15,
      fixed: isCenter,
      weight: 1
    };
  });

  const nodeMap = new Map(state.nodes.map((node) => [node.id, node]));
  state.links = state.graph.links
    .map((link) => ({
      ...link,
      sourceNode: nodeMap.get(link.source),
      targetNode: nodeMap.get(link.target)
    }))
    .filter((link) => link.sourceNode && link.targetNode);

  state.links.forEach((link) => {
    link.sourceNode.weight += 0.15;
    link.targetNode.weight += 0.15;
  });
}

function renderArticle() {
  const articleBody = document.getElementById("articleBody");
  articleBody.innerHTML = state.content.article
    .map((section) => `
      <section>
        <h2>${escapeHtml(section.heading)}</h2>
        ${section.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
      </section>
    `)
    .join("");
}

function renderTypeSummary() {
  const typeSummary = document.getElementById("typeSummary");
  typeSummary.innerHTML = state.graph.types
    .map((type) => `<span class="type-chip" style="color:${type.color}"><span class="chip-dot"></span>${escapeHtml(type.label)}</span>`)
    .join("");
}

function renderChecklist() {
  const checklist = document.getElementById("checklistItems");
  checklist.innerHTML = state.content.checklist
    .map((item) => `
      <div class="check-item">
        <span class="check-box" aria-hidden="true"></span>
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.body)}</p>
        </div>
      </div>
    `)
    .join("");
}

function renderFilters() {
  const filterPanel = document.getElementById("filterPanel");
  filterPanel.innerHTML = state.graph.types
    .map((type) => `
      <button class="filter-chip is-on" data-type="${type.id}" style="--type-color:${type.color}; color:${type.color}">
        <span class="chip-dot"></span>${escapeHtml(type.label)}
      </button>
    `)
    .join("");

  filterPanel.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.type;
      if (state.enabledTypes.has(type)) {
        state.enabledTypes.delete(type);
        button.classList.remove("is-on");
      } else {
        state.enabledTypes.add(type);
        button.classList.add("is-on");
      }
      requestDraw();
    });
  });
}

function bindTabs() {
  document.querySelectorAll("[data-tab], [data-tab-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab || button.dataset.tabJump;
      setActiveTab(tab);
    });
  });
}

function setActiveTab(tab) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === tab);
  });
  if (tab === "graph") {
    setTimeout(resizeCanvas, 40);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindGraphControls() {
  document.getElementById("searchInput").addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    requestDraw();
  });

  document.getElementById("resetView").addEventListener("click", () => {
    state.transform = { x: 0, y: 0, k: 1 };
    state.enabledTypes = new Set(state.graph.types.map((type) => type.id));
    document.querySelectorAll(".filter-chip").forEach((button) => button.classList.add("is-on"));
    document.getElementById("searchInput").value = "";
    state.search = "";
    renderDetail(state.nodes[0]);
    requestDraw();
  });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", resizeCanvas);
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!state.transform.x && !state.transform.y) {
    state.transform.x = rect.width / 2;
    state.transform.y = rect.height / 2;
  }
  requestDraw();
}

function tick() {
  simulate();
  draw();
  state.animationFrame = requestAnimationFrame(tick);
}

function simulate() {
  const visibleNodes = state.nodes.filter(isNodeVisible);
  const visibleLinks = state.links.filter((link) => isNodeVisible(link.sourceNode) && isNodeVisible(link.targetNode));

  for (const link of visibleLinks) {
    const dx = link.targetNode.x - link.sourceNode.x;
    const dy = link.targetNode.y - link.sourceNode.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const targetDistance = link.source === "system" || link.target === "system" ? 190 : 142;
    const force = (distance - targetDistance) * 0.004;
    const fx = (dx / distance) * force;
    const fy = (dy / distance) * force;
    if (!link.sourceNode.fixed) {
      link.sourceNode.vx += fx;
      link.sourceNode.vy += fy;
    }
    if (!link.targetNode.fixed) {
      link.targetNode.vx -= fx;
      link.targetNode.vy -= fy;
    }
  }

  for (let i = 0; i < visibleNodes.length; i += 1) {
    const a = visibleNodes[i];
    for (let j = i + 1; j < visibleNodes.length; j += 1) {
      const b = visibleNodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(8, Math.hypot(dx, dy));
      const force = 650 / (distance * distance);
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      if (!a.fixed) {
        a.vx -= fx;
        a.vy -= fy;
      }
      if (!b.fixed) {
        b.vx += fx;
        b.vy += fy;
      }
    }
  }

  for (const node of visibleNodes) {
    if (node.fixed || state.draggingNode === node) {
      node.vx *= 0.2;
      node.vy *= 0.2;
      continue;
    }
    node.vx += -node.x * 0.0009;
    node.vy += -node.y * 0.0009;
    node.vx *= 0.88;
    node.vy *= 0.88;
    node.x += node.vx;
    node.y += node.vy;
  }
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.save();
  ctx.translate(state.transform.x, state.transform.y);
  ctx.scale(state.transform.k, state.transform.k);

  const visibleLinks = state.links.filter((link) => isNodeVisible(link.sourceNode) && isNodeVisible(link.targetNode));
  const visibleNodes = state.nodes.filter(isNodeVisible);

  drawLinks(visibleLinks);
  drawNodes(visibleNodes);
  ctx.restore();
}

function drawLinks(links) {
  ctx.lineCap = "round";
  for (const link of links) {
    const highlighted = state.selectedNode && (link.sourceNode === state.selectedNode || link.targetNode === state.selectedNode);
    ctx.strokeStyle = highlighted ? "rgba(0, 104, 183, 0.62)" : "rgba(51, 51, 51, 0.14)";
    ctx.lineWidth = highlighted ? 2.2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(link.sourceNode.x, link.sourceNode.y);
    ctx.lineTo(link.targetNode.x, link.targetNode.y);
    ctx.stroke();

    if (highlighted) {
      const mx = (link.sourceNode.x + link.targetNode.x) / 2;
      const my = (link.sourceNode.y + link.targetNode.y) / 2;
      drawLinkLabel(link.label, mx, my);
    }
  }
}

function drawLinkLabel(label, x, y) {
  ctx.save();
  ctx.font = "11px Noto Sans JP, sans-serif";
  const width = ctx.measureText(label).width + 14;
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  roundRect(ctx, x - width / 2, y - 11, width, 22, 11);
  ctx.fill();
  ctx.fillStyle = "#0068b7";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawNodes(nodes) {
  for (const node of nodes) {
    const type = state.typeMap.get(node.type);
    const color = type?.color || "#0072bc";
    const selected = node === state.selectedNode;
    const hovered = node === state.hoveredNode;
    const matched = matchesSearch(node);
    const radius = (node.r + node.weight * 1.8) * (selected ? 1.22 : hovered ? 1.12 : 1);

    ctx.save();
    ctx.shadowColor = selected ? "rgba(0, 114, 188, 0.32)" : "rgba(0, 0, 0, 0.14)";
    ctx.shadowBlur = selected ? 18 : 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = matched ? 4 : selected ? 3 : 2;
    ctx.strokeStyle = matched ? "#f5a623" : "#ffffff";
    ctx.stroke();

    if (node.id === "system") {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    drawNodeLabel(node, radius);
    ctx.restore();
  }
}

function drawNodeLabel(node, radius) {
  const label = node.label;
  ctx.font = node.id === "system" ? "600 13px Noto Sans JP, sans-serif" : "500 12px Noto Sans JP, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const maxWidth = node.id === "system" ? 190 : 132;
  const lines = wrapText(label, maxWidth);
  const lineHeight = 15;
  const width = Math.min(maxWidth, Math.max(...lines.map((line) => ctx.measureText(line).width)) + 16);
  const height = lines.length * lineHeight + 8;
  const x = node.x - width / 2;
  const y = node.y + radius + 8;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.fillStyle = "#333333";
  lines.forEach((line, index) => ctx.fillText(line, node.x, y + 5 + index * lineHeight));
}

function wrapText(text, maxWidth) {
  const tokens = text.includes(" ") ? text.split(" ") : [...text];
  const lines = [];
  let line = "";
  for (const token of tokens) {
    const next = text.includes(" ") ? `${line}${line ? " " : ""}${token}` : `${line}${token}`;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = token;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function renderDetail(node) {
  if (!node) return;
  state.selectedNode = node;
  const type = state.typeMap.get(node.type);
  const neighbors = state.links
    .filter((link) => link.sourceNode === node || link.targetNode === node)
    .map((link) => ({
      label: link.sourceNode === node ? link.targetNode.label : link.sourceNode.label,
      relation: link.label
    }))
    .slice(0, 8);

  document.getElementById("nodeDetail").innerHTML = `
    <div class="detail-title">
      <div class="detail-meta">
        <span class="type-chip" style="color:${type.color}"><span class="chip-dot"></span>${escapeHtml(type.label)}</span>
        ${(node.tags || []).map((tag) => `<span class="type-chip">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <h3>${escapeHtml(node.label)}</h3>
      <p>${escapeHtml(node.summary)}</p>
    </div>
    <div class="detail-section">
      <h4>説明</h4>
      ${(node.details || []).map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
    </div>
    <div class="detail-section">
      <h4>接続</h4>
      <ul>
        ${neighbors.map((item) => `<li>${escapeHtml(item.relation)}: ${escapeHtml(item.label)}</li>`).join("")}
      </ul>
    </div>
  `;
  requestDraw();
}

function onPointerDown(event) {
  canvas.setPointerCapture(event.pointerId);
  const point = toGraphPoint(event);
  const node = findNode(point);
  state.lastPointer = { x: event.clientX, y: event.clientY };
  if (node) {
    state.draggingNode = node;
    renderDetail(node);
  } else {
    state.draggingView = true;
  }
}

function onPointerMove(event) {
  const point = toGraphPoint(event);
  state.hoveredNode = findNode(point);
  canvas.style.cursor = state.hoveredNode ? "grab" : state.draggingView ? "grabbing" : "default";

  if (state.draggingNode) {
    state.draggingNode.x = point.x;
    state.draggingNode.y = point.y;
    state.draggingNode.vx = 0;
    state.draggingNode.vy = 0;
  } else if (state.draggingView && state.lastPointer) {
    state.transform.x += event.clientX - state.lastPointer.x;
    state.transform.y += event.clientY - state.lastPointer.y;
    state.lastPointer = { x: event.clientX, y: event.clientY };
  }
  requestDraw();
}

function onPointerUp() {
  state.draggingNode = null;
  state.draggingView = false;
  state.lastPointer = null;
}

function onWheel(event) {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const oldK = state.transform.k;
  const nextK = clamp(oldK * (event.deltaY > 0 ? 0.9 : 1.1), 0.48, 2.3);
  const graphX = (mouseX - state.transform.x) / oldK;
  const graphY = (mouseY - state.transform.y) / oldK;
  state.transform.k = nextK;
  state.transform.x = mouseX - graphX * nextK;
  state.transform.y = mouseY - graphY * nextK;
  requestDraw();
}

function toGraphPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - state.transform.x) / state.transform.k,
    y: (event.clientY - rect.top - state.transform.y) / state.transform.k
  };
}

function findNode(point) {
  const visible = state.nodes.filter(isNodeVisible).slice().reverse();
  return visible.find((node) => {
    const radius = node.r + node.weight * 1.8 + 10;
    return Math.hypot(point.x - node.x, point.y - node.y) <= radius;
  });
}

function isNodeVisible(node) {
  if (!state.enabledTypes.has(node.type)) return false;
  if (!state.search) return true;
  return matchesSearch(node) || state.links.some((link) => {
    const connected = link.sourceNode === node || link.targetNode === node;
    return connected && (matchesSearch(link.sourceNode) || matchesSearch(link.targetNode));
  });
}

function matchesSearch(node) {
  if (!state.search) return false;
  const haystack = [node.label, node.summary, ...(node.tags || [])].join(" ").toLowerCase();
  return haystack.includes(state.search);
}

function requestDraw() {
  draw();
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

boot().catch((error) => {
  document.body.innerHTML = `<main class="container" style="padding:48px 0"><h1>読み込みに失敗しました</h1><p>${escapeHtml(error.message)}</p></main>`;
});
