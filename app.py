from flask import Flask, render_template, request, send_file, jsonify
import fitz
from PIL import Image
import cv2
import numpy as np
import io, os, uuid, base64

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024

WORK = os.path.join(os.path.dirname(__file__), "work")
os.makedirs(WORK, exist_ok=True)


def parse_pages(spec, total):
    if not spec:
        return list(range(total))
    pages = set()
    for part in spec.replace(" ", "").split(","):
        try:
            if "-" in part:
                a, b = map(int, part.split("-", 1))
                pages.update(range(max(1, a) - 1, min(total, b)))
            else:
                p = int(part)
                if 1 <= p <= total:
                    pages.add(p - 1)
        except ValueError:
            pass
    return sorted(pages)


def is_dark_slide(gray):
    h, w = gray.shape
    band = max(1, min(h, w) // 18)
    border = np.concatenate([
        gray[:band, :].ravel(), gray[-band:, :].ravel(),
        gray[:, :band].ravel(), gray[:, -band:].ravel()
    ])
    return np.mean(border) < 135 or np.mean(gray) < 115


def smart_ink_saver(pil_image, strength=55):
    """
    V1.2 FIXED Smart Ink Saver

    Restored from the successful V4 method.
    V1.1's extra global/Otsu ink mask caused large dark filled areas.
    That mask is completely removed.
    """
    rgb = np.array(pil_image.convert("RGB"))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

    # Only invert predominantly dark slides.
    if is_dark_slide(gray):
        gray = 255 - gray

    # Gentle local contrast improvement.
    clahe = cv2.createCLAHE(clipLimit=1.25, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Very light smoothing removes compression noise.
    smooth = cv2.GaussianBlur(enhanced, (3, 3), 0)

    # V4-style adaptive threshold.
    # Lower C makes output slightly darker, useful for faint outlines.
    # Default strength 55 gives approximately the successful V4 setting.
    c_value = int(round(20 - strength * 0.127))
    c_value = max(6, min(20, c_value))

    result = cv2.adaptiveThreshold(
        smooth,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        41,
        c_value
    )

    # Remove only microscopic isolated noise.
    inv = 255 - result
    count, labels, stats, _ = cv2.connectedComponentsWithStats(inv, 8)
    min_area = max(3, int(gray.shape[0] * gray.shape[1] * 0.000002))

    for label in range(1, count):
        if stats[label, cv2.CC_STAT_AREA] < min_area:
            result[labels == label] = 255

    return Image.fromarray(result).convert("RGB")


def process_image(image, mode, strength):
    if mode == "smart":
        return smart_ink_saver(image, strength)
    rgb = np.array(image.convert("RGB"))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

    if mode == "invert_bw":
        inv = 255 - gray
        _, bw = cv2.threshold(inv, 150, 255, cv2.THRESH_BINARY)
        return Image.fromarray(bw).convert("RGB")
    if mode == "gray":
        return Image.fromarray(gray).convert("RGB")
    return image.convert("RGB")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/preview", methods=["POST"])
def preview():
    f = request.files.get("pdf")
    if not f:
        return jsonify({"error": "Please upload a PDF"}), 400

    doc = fitz.open(stream=f.read(), filetype="pdf")
    thumbs = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(0.32, 0.32), alpha=False)
        data = base64.b64encode(
            pix.tobytes("jpeg", jpg_quality=62)
        ).decode()
        thumbs.append({
            "page": i + 1,
            "image": "data:image/jpeg;base64," + data
        })
    total = len(doc)
    doc.close()
    return jsonify({"pages": total, "thumbs": thumbs})


@app.route("/merge", methods=["POST"])
def merge_pdfs():
    files = request.files.getlist("pdfs")

    if len(files) < 2:
        return jsonify({"error": "Please select at least 2 PDF files"}), 400

    output = fitz.open()
    total_pages = 0

    try:
        for uploaded in files:
            if not uploaded or not uploaded.filename:
                continue

            data = uploaded.read()
            if not data:
                raise ValueError(f"{uploaded.filename} is empty")

            try:
                source = fitz.open(stream=data, filetype="pdf")
            except Exception:
                raise ValueError(f"'{uploaded.filename}' is not a valid PDF")

            if source.needs_pass:
                source.close()
                raise ValueError(f"'{uploaded.filename}' is password protected")

            output.insert_pdf(source)
            total_pages += len(source)
            source.close()

        if total_pages == 0:
            output.close()
            return jsonify({"error": "No valid PDF pages found"}), 400

        filename = f"concentric_chapter_{uuid.uuid4().hex[:8]}.pdf"
        path = os.path.join(WORK, filename)
        output.save(path, garbage=4, deflate=True)
        output.close()

        chapter_name = request.form.get("chapter_name", "").strip()
        if chapter_name:
            safe = "".join(c for c in chapter_name if c.isalnum() or c in " -_()[]").strip()
            download_name = (safe[:80] or "Full_Chapter") + ".pdf"
        else:
            download_name = "Concentric_Full_Chapter.pdf"

        return send_file(
            path,
            as_attachment=True,
            download_name=download_name
        )

    except ValueError as e:
        output.close()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        output.close()
        return jsonify({"error": f"Merge failed: {str(e)}"}), 500


@app.route("/process", methods=["POST"])
def process():
    f = request.files.get("pdf")
    if not f:
        return "Please upload a PDF", 400

    src = fitz.open(stream=f.read(), filetype="pdf")
    selected = parse_pages(request.form.get("pages", ""), len(src))

    if not selected:
        src.close()
        return "No slides selected", 400

    slides_per_page = int(request.form.get("slides_per_page", 3))
    mode = request.form.get("mode", "smart")
    strength = max(0, min(100, int(request.form.get("strength", 55))))
    orientation = request.form.get("orientation", "portrait")

    A4_W, A4_H = 595, 842
    if orientation == "landscape":
        A4_W, A4_H = A4_H, A4_W

    layouts = {
        1: (1, 1), 2: (1, 2), 3: (1, 3),
        4: (2, 2), 6: (2, 3), 8: (2, 4)
    }
    cols, rows = layouts.get(slides_per_page, (1, 3))
    if orientation == "landscape" and slides_per_page in (2, 3):
        cols, rows = rows, cols

    margin = 14
    gap = 7
    cell_w = (A4_W - 2 * margin - (cols - 1) * gap) / cols
    cell_h = (A4_H - 2 * margin - (rows - 1) * gap) / rows

    output = fitz.open()
    out_page = None

    for index, page_number in enumerate(selected):
        slot = index % (cols * rows)
        if slot == 0:
            out_page = output.new_page(width=A4_W, height=A4_H)

        pix = src[page_number].get_pixmap(
            matrix=fitz.Matrix(1.7, 1.7), alpha=False
        )
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        image = process_image(image, mode, strength)

        buf = io.BytesIO()
        image.save(buf, format="PNG", optimize=True)

        row, col = divmod(slot, cols)
        x0 = margin + col * (cell_w + gap)
        y0 = margin + row * (cell_h + gap)

        iw, ih = image.size
        scale = min(cell_w / iw, cell_h / ih)
        dw, dh = iw * scale, ih * scale
        x = x0 + (cell_w - dw) / 2
        y = y0 + (cell_h - dh) / 2

        # V1.1: No extra outline/frame around slides.
        out_page.insert_image(
            fitz.Rect(x, y, x + dw, y + dh),
            stream=buf.getvalue()
        )

    filename = f"Concentric_Notes_{uuid.uuid4().hex[:8]}.pdf"
    path = os.path.join(WORK, filename)
    output.save(path, garbage=4, deflate=True)
    output.close()
    src.close()

    return send_file(
        path, as_attachment=True,
        download_name="Concentric_Notes_Output.pdf"
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=os.environ.get("FLASK_DEBUG", "0") == "1")
