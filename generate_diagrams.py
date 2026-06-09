from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

OUT = Path("assets/diagrams")
OUT.mkdir(parents=True, exist_ok=True)

FONT_PATHS = [
    "C:/Windows/Fonts/YuGothB.ttc",
    "C:/Windows/Fonts/YuGothM.ttc",
    "C:/Windows/Fonts/meiryo.ttc",
    "C:/Windows/Fonts/msgothic.ttc",
]


def load_font(size):
    for path in FONT_PATHS:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


TITLE = load_font(54)
SUB = load_font(25)
BOX = load_font(24)
SMALL = load_font(18)
TINY = load_font(15)

COLORS = {
    "bg": "#f8fafc",
    "ink": "#172033",
    "muted": "#5b677d",
    "line": "#d9e2ef",
    "blue": "#2563eb",
    "green": "#16a34a",
    "orange": "#f59e0b",
    "red": "#dc2626",
    "cyan": "#0891b2",
    "purple": "#7c3aed",
    "panel": "#ffffff",
}


def wrap(draw, text, max_width, font):
    lines, line = [], ""
    for ch in text:
        test = line + ch
        if draw.textlength(test, font=font) <= max_width or not line:
            line = test
        else:
            lines.append(line)
            line = ch
    if line:
        lines.append(line)
    return lines


def draw_header(draw, title, subtitle):
    draw.text((80, 62), title, font=TITLE, fill=COLORS["ink"])
    y = 136
    for line in wrap(draw, subtitle, 1320, SUB)[:2]:
        draw.text((84, y), line, font=SUB, fill=COLORS["muted"])
        y += 38


def draw_box(draw, xy, title, body, color):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=22, fill=COLORS["panel"], outline=COLORS["line"], width=2)
    draw.rectangle((x1, y1, x2, y1 + 9), fill=color)
    draw.text((x1 + 24, y1 + 28), title, font=BOX, fill=COLORS["ink"])
    y = y1 + 74
    for line in wrap(draw, body, x2 - x1 - 48, SMALL)[:3]:
        draw.text((x1 + 24, y), line, font=SMALL, fill=COLORS["muted"])
        y += 27


def draw_arrow(draw, start, end):
    x1, y1 = start
    x2, y2 = end
    color = "#64748b"
    draw.line((x1, y1, x2, y2), fill=color, width=5)
    angle = math.atan2(y2 - y1, x2 - x1)
    size = 18
    points = [
        (x2, y2),
        (x2 - math.cos(angle - 0.45) * size, y2 - math.sin(angle - 0.45) * size),
        (x2 - math.cos(angle + 0.45) * size, y2 - math.sin(angle + 0.45) * size),
    ]
    draw.polygon(points, fill=color)


def render(filename, title, subtitle, boxes, links):
    image = Image.new("RGB", (1600, 900), COLORS["bg"])
    draw = ImageDraw.Draw(image)
    draw_header(draw, title, subtitle)
    for item in boxes:
        draw_box(draw, item["xy"], item["title"], item["body"], item["color"])
    for start, end in links:
        draw_arrow(draw, start, end)
    image.save(OUT / filename, quality=95)
    return image


def item(xy, title, body, color):
    return {"xy": xy, "title": title, "body": body, "color": COLORS[color]}


images = [
    render(
        "01-overview.png",
        "Security Vault 現在構成",
        "役割、プロセス、管理策、記録、外部基準、判断ログを分け、公開DOCSでは構造だけを説明する。",
        [
            item((80, 250, 390, 430), "役割", "CISO / CAIO / CSIRT / 監査 / AI専門家", "blue"),
            item((470, 250, 780, 430), "プロセス", "RACIV、詳細手順、工数、連携先を管理", "purple"),
            item((860, 250, 1170, 430), "管理策", "ISMSを中層にNIST、OWASP、SCSへ接続", "green"),
            item((1250, 250, 1520, 430), "経営判断", "未決定理由、リスク分類、資源配分へ展開", "orange"),
            item((470, 560, 780, 735), "記録類", "台帳、監査調書、判断ログ、是正記録", "cyan"),
            item((860, 560, 1170, 735), "外部基準", "公的基準、規格項番、ガイドラインを参照", "red"),
        ],
        [((390, 340), (470, 340)), ((780, 340), (860, 340)), ((1170, 340), (1250, 340)), ((625, 430), (625, 560)), ((1015, 560), (1015, 430))],
    ),
    render(
        "02-control-to-process.png",
        "管理策からプロセスへの展開",
        "管理策を文書要求で止めず、成立条件、実行プロセス、証跡、監査まで接続する。",
        [
            item((100, 285, 390, 500), "外部要求", "OWASP / SCS / Pマーク / NIST / 公的基準", "cyan"),
            item((485, 285, 775, 500), "ISMS管理策", "中層として各フレームワークを変換し接続", "green"),
            item((870, 285, 1160, 500), "成立条件", "前提管理策、依存関係、侵害連鎖を明示", "orange"),
            item((1255, 285, 1505, 500), "プロセス", "運用手順、RACIV、記録帳票、監査証跡", "purple"),
        ],
        [((390, 392), (485, 392)), ((775, 392), (870, 392)), ((1160, 392), (1255, 392))],
    ),
    render(
        "03-process-to-raciv.png",
        "プロセスとRACIV",
        "実行責任、説明責任、助言、通知、検証を分け、Vには監査も含める。",
        [
            item((100, 300, 360, 520), "Process", "継続的監視、脆弱性管理、AIリスク管理など", "purple"),
            item((470, 240, 705, 420), "R", "実行責任。SOC、開発、CSIRTなど", "blue"),
            item((750, 240, 985, 420), "A", "説明責任。CISO、CAIO、責任者", "green"),
            item((1030, 240, 1265, 420), "C / I", "助言と通知。法務、個人情報、委託先", "orange"),
            item((1310, 240, 1545, 420), "V", "検証、監査、品質確認、独立レビュー", "red"),
            item((650, 590, 1160, 735), "判断ログ", "決定、未決定、未決定理由、NIST区分、詳細理由を残す", "cyan"),
        ],
        [((360, 410), (470, 335)), ((360, 410), (750, 335)), ((360, 410), (1030, 335)), ((360, 410), (1310, 335)), ((870, 420), (870, 590))],
    ),
    render(
        "04-role-cost-skill.png",
        "役割、資格、工数、コスト",
        "職種別JDとスキルを、プロセス工数と人件費に接続する。",
        [
            item((90, 270, 380, 500), "JD", "ミッション、日常業務、ツール、成果物、連携先", "blue"),
            item((475, 270, 765, 500), "レベル", "ジュニア、ミドル、シニアと資格を対応付け", "green"),
            item((860, 270, 1150, 500), "工数", "プロセス人月、記録帳票、監査対応を算定", "orange"),
            item((1245, 270, 1515, 500), "コスト", "役割別人件費、追加投資、改善効果を表示", "red"),
        ],
        [((380, 385), (475, 385)), ((765, 385), (860, 385)), ((1150, 385), (1245, 385))],
    ),
    render(
        "05-audit-governance.png",
        "公的基準、監査、ガバナンス",
        "システム管理基準、システム監査基準、情報セキュリティ監査基準をプロセスへ統合する。",
        [
            item((100, 250, 430, 470), "公的基準", "外部資料として保管し、名称を整理して参照", "cyan"),
            item((510, 250, 840, 470), "監査プロセス", "監査計画、実施、調書、報告、是正確認", "purple"),
            item((920, 250, 1250, 470), "記録類", "監査調書台帳、監査報告台帳、是正台帳", "green"),
            item((610, 580, 990, 740), "ISMS接続", "追加管理策と規格項番をISMS管理策へ相互リンク", "orange"),
        ],
        [((430, 360), (510, 360)), ((840, 360), (920, 360)), ((1080, 470), (860, 580)), ((675, 470), (780, 580))],
    ),
    render(
        "06-cve-posture-impact.png",
        "侵害パスとポスチャ低下",
        "CVEや侵害イベントから、下位未成立、ISMS未成立、上位ポスチャ低下までを説明する。",
        [
            item((90, 285, 360, 505), "CVE / 侵害", "ID侵害、検知不備、クラウド設定不備など", "red"),
            item((455, 285, 725, 505), "下位未成立", "SBOM、MFA、DLP、拡張機能審査など", "orange"),
            item((820, 285, 1090, 505), "ISMS未成立", "A.5、A.8の成立条件と依存管理策が欠落", "green"),
            item((1185, 285, 1505, 505), "上位低下", "NIST CSF / AI RMFのポスチャを前後比較", "blue"),
        ],
        [((360, 395), (455, 395)), ((725, 395), (820, 395)), ((1090, 395), (1185, 395))],
    ),
    render(
        "07-commercial-proposal.png",
        "経営判断と提案利用",
        "未決定理由、プロセス追加、役割追加、コスト、改善幅を同じ物語で提示する。",
        [
            item((100, 260, 390, 485), "未決定理由", "人的、組織的、プロセス的、財務的制約を分類", "red"),
            item((485, 260, 775, 485), "プロセス追加", "不足管理策を満たすプロセスを選択", "purple"),
            item((870, 260, 1160, 485), "役割追加", "RACIVに必要な職種とレベルを配置", "blue"),
            item((1255, 260, 1515, 485), "投資効果", "人件費とCSF / AI RMF改善を提示", "green"),
        ],
        [((390, 372), (485, 372)), ((775, 372), (870, 372)), ((1160, 372), (1255, 372))],
    ),
]

sheet = Image.new("RGB", (1200, 675), COLORS["bg"])
draw = ImageDraw.Draw(sheet)
for index, image in enumerate(images, start=1):
    thumb = image.resize((400, 225))
    x = ((index - 1) % 3) * 400
    y = ((index - 1) // 3) * 225
    sheet.paste(thumb, (x, y))
    draw.rectangle((x + 10, y + 10, x + 70, y + 42), fill="#ffffff", outline=COLORS["line"])
    draw.text((x + 22, y + 15), f"{index:02d}", font=TINY, fill=COLORS["ink"])
sheet.save(OUT / "contact-sheet.png", quality=95)

print(f"generated {len(images)} images")
