#!/usr/bin/env python3
"""Generate UML Robustness Diagrams as SVG for E-Office FSM UNDIP Tim 2."""
import xml.etree.ElementTree as ET
import math
import os

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── SVG helpers ──────────────────────────────────────────────────────────────

def svg_root(w, h):
    svg = ET.Element("svg", xmlns="http://www.w3.org/2000/svg",
                     width=str(w), height=str(h),
                     viewBox=f"0 0 {w} {h}")
    # white background
    ET.SubElement(svg, "rect", width=str(w), height=str(h), fill="white")
    # arrowhead marker
    defs = ET.SubElement(svg, "defs")
    marker = ET.SubElement(defs, "marker", id="arr",
                           markerWidth="10", markerHeight="7",
                           refX="10", refY="3.5", orient="auto")
    ET.SubElement(marker, "polygon", points="0 0, 10 3.5, 0 7", fill="black")
    marker2 = ET.SubElement(defs, "marker", id="arr2",
                            markerWidth="10", markerHeight="7",
                            refX="0", refY="3.5", orient="auto")
    ET.SubElement(marker2, "polygon", points="10 0, 0 3.5, 10 7", fill="black")
    return svg

def text(parent, x, y, content, bold=False, size=12, anchor="middle", color="black"):
    t = ET.SubElement(parent, "text",
                      x=str(x), y=str(y),
                      fill=color,
                      style=f"font-family:Arial,sans-serif;font-size:{size}px;"
                            f"font-weight:{'bold' if bold else 'normal'};"
                            f"text-anchor:{anchor};")
    t.text = content
    return t

def title_text(parent, x, y, content):
    return text(parent, x, y, content, bold=True, size=16, anchor="start")

def multiline_text(parent, cx, top_y, lines, size=11, bold=False, anchor="middle"):
    for i, line in enumerate(lines):
        text(parent, cx, top_y + i * (size + 3), line, bold=bold, size=size, anchor=anchor)

# ── UML Stereotypes ──────────────────────────────────────────────────────────

def draw_actor(parent, cx, cy, label, size=18):
    """Stick figure actor."""
    r = size * 0.55
    # head
    ET.SubElement(parent, "circle", cx=str(cx), cy=str(cy - size * 1.5),
                  r=str(r), fill="white", stroke="black", **{"stroke-width": "2"})
    body_top = cy - size * 1.5 + r
    body_bot = cy + size * 0.3
    arm_y = cy - size * 0.6
    leg_y = body_bot
    # body
    ET.SubElement(parent, "line",
                  x1=str(cx), y1=str(body_top), x2=str(cx), y2=str(body_bot),
                  stroke="black", **{"stroke-width": "2"})
    # arms
    ET.SubElement(parent, "line",
                  x1=str(cx - size * 0.8), y1=str(arm_y),
                  x2=str(cx + size * 0.8), y2=str(arm_y),
                  stroke="black", **{"stroke-width": "2"})
    # legs
    ET.SubElement(parent, "line",
                  x1=str(cx), y1=str(leg_y),
                  x2=str(cx - size * 0.7), y2=str(cy + size * 1.1),
                  stroke="black", **{"stroke-width": "2"})
    ET.SubElement(parent, "line",
                  x1=str(cx), y1=str(leg_y),
                  x2=str(cx + size * 0.7), y2=str(cy + size * 1.1),
                  stroke="black", **{"stroke-width": "2"})
    # label (split by space for multiline)
    words = label.split()
    lines = []
    cur = ""
    for w in words:
        if len(cur) + len(w) + 1 > 12:
            lines.append(cur.strip())
            cur = w
        else:
            cur += " " + w
    lines.append(cur.strip())
    label_y = cy + size * 1.3
    for i, ln in enumerate(lines):
        text(parent, cx, label_y + i * 14, ln, size=11, anchor="middle")

def draw_boundary(parent, cx, cy, w, h, label_lines):
    """Rectangle with thick left border = Boundary."""
    lx = cx - w // 2
    ty = cy - h // 2
    # main rect
    ET.SubElement(parent, "rect",
                  x=str(lx), y=str(ty), width=str(w), height=str(h),
                  fill="white", stroke="black", **{"stroke-width": "1.5"})
    # thick left border
    ET.SubElement(parent, "line",
                  x1=str(lx), y1=str(ty), x2=str(lx), y2=str(ty + h),
                  stroke="black", **{"stroke-width": "5"})
    # label inside
    n = len(label_lines)
    start_y = cy - (n - 1) * 7
    for i, ln in enumerate(label_lines):
        text(parent, cx + 2, start_y + i * 14, ln, size=11)

def draw_control(parent, cx, cy, r, label_lines):
    """Circle with notch arrow at top-left = Control."""
    ET.SubElement(parent, "circle", cx=str(cx), cy=str(cy),
                  r=str(r), fill="white", stroke="black", **{"stroke-width": "1.5"})
    # notch: small curved arrow at top-left of circle
    angle = math.radians(315)  # top-left
    nx = cx + r * math.cos(angle)
    ny = cy + r * math.sin(angle)
    # draw a small arrow indicator (open arrowhead)
    arrow_len = 9
    arrow_angle = math.radians(45)
    ax1 = nx + arrow_len * math.cos(arrow_angle + 0.5)
    ay1 = ny + arrow_len * math.sin(arrow_angle + 0.5)
    ax2 = nx + arrow_len * math.cos(arrow_angle - 0.5)
    ay2 = ny + arrow_len * math.sin(arrow_angle - 0.5)
    ET.SubElement(parent, "line",
                  x1=str(nx), y1=str(ny), x2=str(ax1), y2=str(ay1),
                  stroke="black", **{"stroke-width": "2"})
    ET.SubElement(parent, "line",
                  x1=str(nx), y1=str(ny), x2=str(ax2), y2=str(ay2),
                  stroke="black", **{"stroke-width": "2"})
    # label
    n = len(label_lines)
    start_y = cy - (n - 1) * 7
    for i, ln in enumerate(label_lines):
        text(parent, cx, start_y + i * 14, ln, size=11)

def draw_entity(parent, cx, cy, r, label_lines):
    """Circle with underline = Entity."""
    ET.SubElement(parent, "circle", cx=str(cx), cy=str(cy),
                  r=str(r), fill="white", stroke="black", **{"stroke-width": "1.5"})
    # underline
    ET.SubElement(parent, "line",
                  x1=str(cx - r), y1=str(cy + r + 4),
                  x2=str(cx + r), y2=str(cy + r + 4),
                  stroke="black", **{"stroke-width": "2"})
    # label
    n = len(label_lines)
    start_y = cy - (n - 1) * 7
    for i, ln in enumerate(label_lines):
        text(parent, cx, start_y + i * 14, ln, size=11)

def arrow(parent, x1, y1, x2, y2, label="", label_side="top", offset=12, back=False):
    """Directed arrow with optional label."""
    mid_x = (x1 + x2) / 2
    mid_y = (y1 + y2) / 2
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    if length == 0:
        return
    # perpendicular offset for label
    px = -dy / length * offset
    py = dx / length * offset
    marker_end = "url(#arr)"
    marker_start = "url(#arr2)" if back else "none"
    ET.SubElement(parent, "line",
                  x1=str(x1), y1=str(y1), x2=str(x2), y2=str(y2),
                  stroke="black", **{"stroke-width": "1.3",
                                     "marker-end": marker_end,
                                     "marker-start": marker_start})
    if label:
        lx = mid_x + px
        ly = mid_y + py
        # small white bg
        words = label.split("\n")
        for wi, wl in enumerate(words):
            text(parent, lx, ly + wi * 13, wl, size=10, anchor="middle")

def curved_arrow(parent, x1, y1, x2, y2, label="", curve=40):
    """Curved arrow (for return paths)."""
    cx_ = (x1 + x2) / 2
    cy_ = (y1 + y2) / 2
    dx = x2 - x1; dy = y2 - y1
    length = math.hypot(dx, dy)
    if length == 0:
        return
    px = -dy / length * curve
    py = dx / length * curve
    qx = cx_ + px; qy = cy_ + py
    path = f"M {x1} {y1} Q {qx} {qy} {x2} {y2}"
    ET.SubElement(parent, "path", d=path,
                  fill="none", stroke="black",
                  **{"stroke-width": "1.3", "marker-end": "url(#arr)"})
    if label:
        lx = qx; ly = qy - 6
        for wi, wl in enumerate(label.split("\n")):
            text(parent, lx, ly + wi * 13, wl, size=10, anchor="middle")

def save(svg, filename):
    tree = ET.ElementTree(svg)
    ET.indent(tree, space="  ")
    path = os.path.join(OUT_DIR, filename)
    tree.write(path, encoding="unicode", xml_declaration=False)
    print(f"Saved: {path}")

# ── UC-01: LOGIN ─────────────────────────────────────────────────────────────
def uc01():
    W, H = 950, 420
    svg = svg_root(W, H)
    title_text(svg, 20, 35, "UC-01: LOGIN")

    # positions
    actor_x, actor_y = 70, 200
    form_x, form_y = 220, 200
    sso_x, sso_y = 220, 320
    auth_x, auth_y = 430, 200
    sess_x, sess_y = 630, 200
    session_ent_x, session_ent_y = 800, 160
    akun_x, akun_y = 800, 280

    draw_actor(svg, actor_x, actor_y, "Pengguna")
    draw_boundary(svg, form_x, form_y, 110, 55, ["Form Login"])
    draw_boundary(svg, sso_x, sso_y, 110, 50, ["SSO UNDIP", "Endpoint"])
    draw_control(svg, auth_x, auth_y, 45, ["Auth", "Controller"])
    draw_control(svg, sess_x, sess_y, 45, ["Session", "Controller"])
    draw_entity(svg, session_ent_x, session_ent_y, 38, ["Session"])
    draw_entity(svg, akun_x, akun_y, 38, ["Akun"])

    # arrows
    arrow(svg, actor_x + 22, actor_y - 10, form_x - 56, form_y, "1: input\nemail+password")
    arrow(svg, form_x + 55, form_y, auth_x - 46, auth_y, "2: submitData\n(email, password)")
    arrow(svg, auth_x, auth_y + 46, sso_x + 4, sso_y - 26, "3: validateSSO\n(token)")
    curved_arrow(svg, sso_x + 56, sso_y - 5, auth_x + 10, auth_y + 47, "3.1: ssoValid()", 35)
    arrow(svg, auth_x + 20, auth_y - 30, akun_x - 38, akun_y - 10, "4: findUserByEmail()")
    arrow(svg, auth_x + 46, auth_y, sess_x - 46, sess_y, "5: createSession()")
    arrow(svg, sess_x + 10, sess_y - 35, session_ent_x - 38, session_ent_y + 5, "5.1: <<create>>")
    curved_arrow(svg, form_x - 4, form_y + 28, actor_x + 20, actor_y + 18, "6: notifikasi login", -35)

    save(svg, "uc01_login.svg")

# ── UC-02: LENGKAPI PROFIL ───────────────────────────────────────────────────
def uc02():
    W, H = 950, 380
    svg = svg_root(W, H)
    title_text(svg, 20, 35, "UC-02: LENGKAPI PROFIL")

    actor_x, actor_y = 70, 190
    form_x, form_y = 230, 190
    ctrl_x, ctrl_y = 430, 190
    mhs_x, mhs_y = 640, 150
    dep_x, dep_y = 800, 150
    prodi_x, prodi_y = 800, 280

    draw_actor(svg, actor_x, actor_y, "Mahasiswa")
    draw_boundary(svg, form_x, form_y, 130, 60, ["Form Profil", "Mahasiswa"])
    draw_control(svg, ctrl_x, ctrl_y, 50, ["Profile", "Completion", "Controller"])
    draw_entity(svg, mhs_x, mhs_y, 36, ["Mahasiswa"])
    draw_entity(svg, dep_x, dep_y, 36, ["Departemen"])
    draw_entity(svg, prodi_x, prodi_y, 36, ["Program", "Studi"])

    arrow(svg, actor_x + 22, actor_y, form_x - 66, form_y, "1: isi NIM/tahun\nmasuk/departemen")
    arrow(svg, form_x + 66, form_y, ctrl_x - 51, ctrl_y, "2: submitProfile(data)")
    arrow(svg, ctrl_x + 30, ctrl_y - 35, mhs_x - 37, mhs_y + 5, "3: <<create>>\nMahasiswa")
    arrow(svg, ctrl_x + 40, ctrl_y - 20, dep_x - 37, dep_y + 10, "4: findDepartemen(id)")
    arrow(svg, ctrl_x + 45, ctrl_y + 25, prodi_x - 37, prodi_y - 5, "5: findProdi(id)")
    curved_arrow(svg, form_x - 10, form_y + 31, actor_x + 20, actor_y + 18, "6: profil lengkap", -35)

    save(svg, "uc02_lengkapi_profil.svg")

# ── UC-03: MENGAJUKAN SURAT AK006 ────────────────────────────────────────────
def uc03():
    W, H = 1050, 440
    svg = svg_root(W, H)
    title_text(svg, 20, 35, "UC-03: MENGAJUKAN SURAT AK006")

    actor_x, actor_y = 70, 210
    form_x, form_y = 230, 160
    upload_x, upload_y = 230, 310
    letter_ctrl_x, letter_ctrl_y = 450, 210
    notif_ctrl_x, notif_ctrl_y = 650, 340
    li_x, li_y = 680, 150
    lt_x, lt_y = 830, 150
    att_x, att_y = 830, 260
    notif_x, notif_y = 950, 340

    draw_actor(svg, actor_x, actor_y, "Mahasiswa")
    draw_boundary(svg, form_x, form_y, 120, 55, ["Form Pengajuan", "AK006"])
    draw_boundary(svg, upload_x, upload_y, 120, 50, ["Upload", "Lampiran"])
    draw_control(svg, letter_ctrl_x, letter_ctrl_y, 50, ["Letter", "Submission", "Controller"])
    draw_control(svg, notif_ctrl_x, notif_ctrl_y, 42, ["Notification", "Controller"])
    draw_entity(svg, li_x, li_y, 38, ["Letter", "Instance"])
    draw_entity(svg, lt_x, lt_y, 38, ["Letter", "Type"])
    draw_entity(svg, att_x, att_y, 38, ["Attachment"])
    draw_entity(svg, notif_x, notif_y, 38, ["Notification"])

    arrow(svg, actor_x + 22, actor_y - 10, form_x - 61, form_y + 5, "1: isi form surat")
    arrow(svg, actor_x + 22, actor_y + 15, upload_x - 61, upload_y + 5, "2: upload lampiran")
    arrow(svg, form_x + 61, form_y + 5, letter_ctrl_x - 51, letter_ctrl_y - 10, "3: submitSurat(data)")
    arrow(svg, upload_x + 61, upload_y + 5, letter_ctrl_x - 20, letter_ctrl_y + 30, "3.1: addAttachment(file)")
    arrow(svg, letter_ctrl_x + 30, letter_ctrl_y - 30, li_x - 39, li_y + 5, "4: <<create>>")
    arrow(svg, letter_ctrl_x + 45, letter_ctrl_y - 15, lt_x - 39, lt_y + 8, "4.1: findLetterType()")
    arrow(svg, letter_ctrl_x + 45, letter_ctrl_y + 15, att_x - 39, att_y - 5, "5: <<create>>\nAttachment")
    arrow(svg, letter_ctrl_x + 10, letter_ctrl_y + 50, notif_ctrl_x - 43, notif_ctrl_y, "6: sendNotif(SA)")
    arrow(svg, notif_ctrl_x + 43, notif_ctrl_y, notif_x - 39, notif_y, "6.1: <<create>>")

    save(svg, "uc03_ajukan_ak006.svg")

# ── UC-04: VERIFIKASI SURAT ───────────────────────────────────────────────────
def uc04():
    W, H = 1000, 420
    svg = svg_root(W, H)
    title_text(svg, 20, 35, "UC-04: VERIFIKASI SURAT")

    actor_x, actor_y = 65, 200
    list_x, list_y = 220, 165
    form_x, form_y = 220, 300
    verif_ctrl_x, verif_ctrl_y = 430, 200
    notif_ctrl_x, notif_ctrl_y = 630, 340
    li_x, li_y = 640, 145
    step_x, step_y = 800, 145
    notif_x, notif_y = 900, 340

    draw_actor(svg, actor_x, actor_y, "Supervisor\nAkademik (SA)")
    draw_boundary(svg, list_x, list_y, 120, 50, ["Daftar Surat", "Pending"])
    draw_boundary(svg, form_x, form_y, 120, 50, ["Form", "Verifikasi"])
    draw_control(svg, verif_ctrl_x, verif_ctrl_y, 50, ["Verification", "Controller"])
    draw_control(svg, notif_ctrl_x, notif_ctrl_y, 45, ["Notification", "Controller"])
    draw_entity(svg, li_x, li_y, 38, ["Letter", "Instance"])
    draw_entity(svg, step_x, step_y, 38, ["Letter", "Approval", "Step"])
    draw_entity(svg, notif_x, notif_y, 38, ["Notification"])

    arrow(svg, actor_x + 22, actor_y - 15, list_x - 61, list_y + 5, "1: lihat pending")
    arrow(svg, actor_x + 22, actor_y + 15, form_x - 61, form_y, "2: pilih keputusan\n(approve/reject)")
    arrow(svg, list_x + 61, list_y, verif_ctrl_x - 51, verif_ctrl_y - 15, "3: getSuratPending()")
    arrow(svg, form_x + 61, form_y, verif_ctrl_x - 20, verif_ctrl_y + 30, "4: verifikasiSurat(id, status)")
    arrow(svg, verif_ctrl_x + 30, verif_ctrl_y - 25, li_x - 39, li_y + 5, "5: updateStatus()")
    arrow(svg, verif_ctrl_x + 45, verif_ctrl_y - 10, step_x - 39, step_y + 8, "5.1: updateStep()")
    arrow(svg, verif_ctrl_x + 15, verif_ctrl_y + 50, notif_ctrl_x - 46, notif_ctrl_y, "6: sendNotif(MTU, Mhs)")
    arrow(svg, notif_ctrl_x + 46, notif_ctrl_y, notif_x - 39, notif_y, "6.1: <<create>>")
    curved_arrow(svg, list_x - 10, list_y + 26, actor_x + 22, actor_y - 5, "3.1: return list", -35)

    save(svg, "uc04_verifikasi_surat.svg")

# ── UC-05: PENANDATANGANAN SURAT ─────────────────────────────────────────────
def uc05():
    W, H = 1080, 440
    svg = svg_root(W, H)
    title_text(svg, 20, 35, "UC-05: PENANDATANGANAN SURAT")

    actor_x, actor_y = 65, 210
    list_x, list_y = 220, 165
    form_x, form_y = 220, 310
    sign_ctrl_x, sign_ctrl_y = 440, 210
    fwd_ctrl_x, fwd_ctrl_y = 630, 155
    notif_ctrl_x, notif_ctrl_y = 630, 330
    li_x, li_y = 800, 140
    sig_x, sig_y = 920, 140
    step_x, step_y = 800, 270
    notif_x, notif_y = 970, 330

    draw_actor(svg, actor_x, actor_y, "Manajer TU\n(MTU)")
    draw_boundary(svg, list_x, list_y, 120, 50, ["Daftar Surat", "MTU"])
    draw_boundary(svg, form_x, form_y, 120, 50, ["Form Tanda", "Tangan"])
    draw_control(svg, sign_ctrl_x, sign_ctrl_y, 50, ["Signing", "Controller"])
    draw_control(svg, fwd_ctrl_x, fwd_ctrl_y, 42, ["Forward", "Controller"])
    draw_control(svg, notif_ctrl_x, notif_ctrl_y, 45, ["Notification", "Controller"])
    draw_entity(svg, li_x, li_y, 36, ["Letter", "Instance"])
    draw_entity(svg, sig_x, sig_y, 36, ["Signature"])
    draw_entity(svg, step_x, step_y, 36, ["Letter", "Approval", "Step"])
    draw_entity(svg, notif_x, notif_y, 36, ["Notification"])

    arrow(svg, actor_x + 22, actor_y - 15, list_x - 61, list_y + 5, "1: lihat daftar surat")
    arrow(svg, actor_x + 22, actor_y + 15, form_x - 61, form_y, "2: tanda tangani")
    arrow(svg, list_x + 61, list_y, sign_ctrl_x - 51, sign_ctrl_y - 15, "3: getSuratMTU()")
    arrow(svg, form_x + 61, form_y, sign_ctrl_x - 20, sign_ctrl_y + 30, "4: signSurat(id)")
    arrow(svg, sign_ctrl_x + 35, sign_ctrl_y - 25, li_x - 37, li_y + 5, "5: updateStatus(SIGNED)")
    arrow(svg, sign_ctrl_x + 45, sign_ctrl_y - 10, sig_x - 37, sig_y + 5, "5.1: <<create>>\nSignature")
    arrow(svg, sign_ctrl_x + 46, sign_ctrl_y, fwd_ctrl_x - 43, fwd_ctrl_y + 10, "6: forwardToUPA(id)")
    arrow(svg, fwd_ctrl_x + 10, fwd_ctrl_y + 43, step_x - 37, step_y - 10, "6.1: updateStep(UPA)")
    arrow(svg, sign_ctrl_x + 15, sign_ctrl_y + 50, notif_ctrl_x - 46, notif_ctrl_y, "7: sendNotif(UPA, Mhs)")
    arrow(svg, notif_ctrl_x + 46, notif_ctrl_y, notif_x - 37, notif_y, "7.1: <<create>>")

    save(svg, "uc05_penandatanganan.svg")

# ── UC-06: PENOMORAN & PENGARSIPAN ───────────────────────────────────────────
def uc06():
    W, H = 950, 380
    svg = svg_root(W, H)
    title_text(svg, 20, 35, "UC-06: PENOMORAN & PENGARSIPAN")

    actor_x, actor_y = 65, 195
    list_x, list_y = 220, 160
    form_x, form_y = 220, 290
    fin_ctrl_x, fin_ctrl_y = 440, 195
    notif_ctrl_x, notif_ctrl_y = 640, 310
    li_x, li_y = 640, 140
    step_x, step_y = 800, 140
    notif_x, notif_y = 880, 310

    draw_actor(svg, actor_x, actor_y, "UPA")
    draw_boundary(svg, list_x, list_y, 120, 50, ["Daftar Surat", "UPA"])
    draw_boundary(svg, form_x, form_y, 120, 50, ["Form", "Penomoran"])
    draw_control(svg, fin_ctrl_x, fin_ctrl_y, 50, ["Finalize", "Controller"])
    draw_control(svg, notif_ctrl_x, notif_ctrl_y, 45, ["Notification", "Controller"])
    draw_entity(svg, li_x, li_y, 36, ["Letter", "Instance"])
    draw_entity(svg, step_x, step_y, 36, ["Letter", "Approval", "Step"])
    draw_entity(svg, notif_x, notif_y, 36, ["Notification"])

    arrow(svg, actor_x + 22, actor_y - 15, list_x - 61, list_y + 5, "1: lihat daftar surat")
    arrow(svg, actor_x + 22, actor_y + 15, form_x - 61, form_y, "2: input nomor\n& tanggal")
    arrow(svg, list_x + 61, list_y, fin_ctrl_x - 51, fin_ctrl_y - 15, "3: getSuratUPA()")
    arrow(svg, form_x + 61, form_y, fin_ctrl_x - 20, fin_ctrl_y + 35, "4: finalisasiSurat(no, tgl)")
    arrow(svg, fin_ctrl_x + 30, fin_ctrl_y - 25, li_x - 37, li_y + 5, "5: updateStatus(COMPLETED)\nupdateNomor(no)")
    arrow(svg, fin_ctrl_x + 45, fin_ctrl_y - 10, step_x - 37, step_y + 8, "5.1: updateStep(DONE)")
    arrow(svg, fin_ctrl_x + 15, fin_ctrl_y + 50, notif_ctrl_x - 46, notif_ctrl_y, "6: sendNotif(Mahasiswa)")
    arrow(svg, notif_ctrl_x + 46, notif_ctrl_y, notif_x - 37, notif_y, "6.1: <<create>>")
    curved_arrow(svg, list_x - 10, list_y + 26, actor_x + 22, actor_y - 8, "3.1: return list", -35)

    save(svg, "uc06_penomoran.svg")

# ── UC-07: MANAJEMEN PENGGUNA & ROLE ─────────────────────────────────────────
def uc07():
    W, H = 1100, 480
    svg = svg_root(W, H)
    title_text(svg, 20, 35, "UC-07: MANAJEMEN PENGGUNA & ROLE")

    actor_x, actor_y = 65, 230
    list_x, list_y = 225, 160
    form_user_x, form_user_y = 225, 270
    form_role_x, form_role_y = 225, 380
    user_ctrl_x, user_ctrl_y = 450, 200
    role_ctrl_x, role_ctrl_y = 450, 350
    email_ctrl_x, email_ctrl_y = 650, 430
    user_x, user_y = 700, 140
    emp_x, emp_y = 860, 140
    role_x, role_y = 700, 280
    userrole_x, userrole_y = 860, 280
    notif_x, notif_y = 950, 430

    draw_actor(svg, actor_x, actor_y, "Super Admin")
    draw_boundary(svg, list_x, list_y, 130, 50, ["Daftar", "Pengguna"])
    draw_boundary(svg, form_user_x, form_user_y, 130, 50, ["Form Buat", "Pengguna"])
    draw_boundary(svg, form_role_x, form_role_y, 130, 50, ["Form Assign", "Role"])
    draw_control(svg, user_ctrl_x, user_ctrl_y, 50, ["User Mgmt", "Controller"])
    draw_control(svg, role_ctrl_x, role_ctrl_y, 50, ["Role Assign", "Controller"])
    draw_control(svg, email_ctrl_x, email_ctrl_y, 45, ["Email Notif", "Controller"])
    draw_entity(svg, user_x, user_y, 34, ["User"])
    draw_entity(svg, emp_x, emp_y, 34, ["Pegawai/", "Mahasiswa"])
    draw_entity(svg, role_x, role_y, 34, ["Role"])
    draw_entity(svg, userrole_x, userrole_y, 34, ["UserRole"])
    draw_entity(svg, notif_x, notif_y, 34, ["Notification"])

    arrow(svg, actor_x + 22, actor_y - 25, list_x - 66, list_y + 5, "1: lihat pengguna")
    arrow(svg, actor_x + 22, actor_y, form_user_x - 66, form_user_y + 5, "2: buat pengguna")
    arrow(svg, actor_x + 22, actor_y + 25, form_role_x - 66, form_role_y + 5, "3: assign role")
    arrow(svg, list_x + 66, list_y + 5, user_ctrl_x - 51, user_ctrl_y - 15, "4: getAllUsers()")
    arrow(svg, form_user_x + 66, form_user_y, user_ctrl_x - 20, user_ctrl_y + 20, "5: createUser(data)")
    arrow(svg, user_ctrl_x + 30, user_ctrl_y - 25, user_x - 35, user_y + 5, "5.1: <<create>> User")
    arrow(svg, user_ctrl_x + 45, user_ctrl_y - 10, emp_x - 35, emp_y + 5, "5.2: <<create>>\nPegawai/Mhs")
    arrow(svg, form_role_x + 66, form_role_y, role_ctrl_x - 51, role_ctrl_y + 10, "6: assignRole(uid, role)")
    arrow(svg, role_ctrl_x + 30, role_ctrl_y - 30, role_x - 35, role_y + 5, "6.1: findRole(name)")
    arrow(svg, role_ctrl_x + 45, role_ctrl_y - 15, userrole_x - 35, userrole_y + 5, "6.2: <<create>>\nUserRole")
    arrow(svg, role_ctrl_x + 15, role_ctrl_y + 50, email_ctrl_x - 46, email_ctrl_y, "7: sendWelcomeEmail()")
    arrow(svg, email_ctrl_x + 46, email_ctrl_y, notif_x - 35, notif_y, "7.1: <<create>>")

    save(svg, "uc07_manajemen_user.svg")

# ── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uc01()
    uc02()
    uc03()
    uc04()
    uc05()
    uc06()
    uc07()
    print("\nDone! All 7 robustness diagrams generated.")
