from flask import Flask, render_template, request, send_file, jsonify, send_from_directory
import fitz
from PIL import Image
import cv2
import numpy as np
import io
import os
import json
import zipfile
import base64

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static"),
    static_url_path="/static"
)
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024  # 200 MB in-memory limit


def parse_pages(spec, total):
    if not spec:
        return list(range(total))
    pages = set()
    for part in spec.replace(" ", "").split(","):
        try:
            if "-" in part:
                a, b = map(int, part.split("-", 1))
                if a > b:
                    a, b = b, a
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
    V1.2 FIXED Smart Ink Saver (Untouched Core Algorithm)

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


def apply_pdf_metadata(doc, title="Concentric Notes Output"):
    doc.set_metadata({
        "title": title,
        "author": "Avadhesh Pingoriya",
        "creator": "Concentric Notes Converter V2 by Avadhesh Pingoriya",
        "producer": "Concentric Notes Converter V2 (PyMuPDF)"
    })


def safe_filename(raw_name, fallback="Concentric_Output"):
    if not raw_name:
        return fallback + ".pdf"
    cleaned = "".join(c for c in raw_name.strip() if c.isalnum() or c in " -_()[]").strip()
    if cleaned.lower().endswith(".pdf"):
        cleaned = cleaned[:-4].strip()
    return (cleaned[:80] or fallback) + ".pdf"


def build_notes_pdf_doc(src, selected, form, first_sheet_only=False):
    try:
        slides_per_page = int(form.get("slides_per_page", 3))
    except ValueError:
        slides_per_page = 3

    mode = form.get("mode", "smart")
    try:
        strength = max(0, min(100, int(form.get("strength", 55))))
    except ValueError:
        strength = 55

    orientation = form.get("orientation", "portrait")
    margin_preset = form.get("margin", "normal")
    draw_border = form.get("border", "0") == "1"
    page_numbers = form.get("page_numbers", "0") == "1"
    header_text = form.get("header_text", "").strip()[:90]

    A4_W, A4_H = 595, 842
    if orientation == "landscape":
        A4_W, A4_H = A4_H, A4_W

    layouts = {
        1: (1, 1),
        2: (1, 2),
        3: (1, 3),
        4: (2, 2),
        6: (2, 3),
        8: (2, 4),
        9: (3, 3)
    }
    cols, rows = layouts.get(slides_per_page, (1, 3))
    if orientation == "landscape" and slides_per_page in (2, 3, 6):
        cols, rows = rows, cols

    margin_map = {"compact": 8, "normal": 14, "wide": 24}
    margin = margin_map.get(margin_preset, 14)
    gap = 5 if margin_preset == "compact" else (10 if margin_preset == "wide" else 7)

    top_extra = 16 if header_text else 0
    bottom_extra = 16 if page_numbers else 0

    usable_w = A4_W - 2 * margin - (cols - 1) * gap
    usable_h = A4_H - 2 * margin - top_extra - bottom_extra - (rows - 1) * gap
    cell_w = usable_w / cols
    cell_h = usable_h / rows

    per_sheet = cols * rows
    total_sheets_estimate = (len(selected) + per_sheet - 1) // per_sheet
    target_pages = selected[:per_sheet] if first_sheet_only else selected

    output = fitz.open()
    out_page = None

    for index, page_number in enumerate(target_pages):
        slot = index % per_sheet
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
        y0 = margin + top_extra + row * (cell_h + gap)

        iw, ih = image.size
        scale = min(cell_w / iw, cell_h / ih)
        dw, dh = iw * scale, ih * scale
        x = x0 + (cell_w - dw) / 2
        y = y0 + (cell_h - dh) / 2

        target_rect = fitz.Rect(x, y, x + dw, y + dh)
        out_page.insert_image(target_rect, stream=buf.getvalue())

        if draw_border:
            out_page.draw_rect(target_rect, color=(0.75, 0.75, 0.78), width=0.6)

    total_out = total_sheets_estimate if first_sheet_only else len(output)
    if header_text or page_numbers:
        for idx, page in enumerate(output):
            if header_text:
                page.insert_text(
                    fitz.Point(margin, margin + 9),
                    header_text,
                    fontsize=8.5,
                    color=(0.35, 0.35, 0.4)
                )
            if page_numbers:
                label = f"Page {idx + 1} of {total_out}"
                tw = fitz.get_text_length(label, fontsize=8.5)
                page.insert_text(
                    fitz.Point((A4_W - tw) / 2, A4_H - margin + 2),
                    label,
                    fontsize=8.5,
                    color=(0.35, 0.35, 0.4)
                )

    apply_pdf_metadata(output, header_text or "Concentric Smart Notes")
    return output, total_sheets_estimate, len(target_pages)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/static/<path:filename>")
def custom_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "version": "2.3.0",
        "author": "Avadhesh Pingoriya",
        "engine": "python-opencv-pymupdf"
    })


@app.route("/preview", methods=["POST"])
def preview():
    f = request.files.get("pdf")
    if not f:
        return jsonify({"error": "Please upload a PDF file."}), 400

    data = f.read()
    if not data:
        return jsonify({"error": "Uploaded PDF is empty."}), 400

    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception:
        return jsonify({"error": "Invalid or corrupted PDF file."}), 400

    if doc.needs_pass:
        doc.close()
        return jsonify({"error": "This PDF is password protected. Please unlock it first."}), 400

    thumbs = []
    try:
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=fitz.Matrix(0.32, 0.32), alpha=False)
            b64 = base64.b64encode(pix.tobytes("jpeg", jpg_quality=65)).decode()
            thumbs.append({
                "page": i + 1,
                "width": int(page.rect.width),
                "height": int(page.rect.height),
                "image": "data:image/jpeg;base64," + b64
            })
        total = len(doc)
    finally:
        doc.close()

    return jsonify({"pages": total, "thumbs": thumbs})


@app.route("/preview-sheet", methods=["POST"])
def preview_first_sheet():
    """
    Renders ONLY the 1st output A4 page with the selected Smart Ink Saver / layout settings
    so the user can inspect the exact result before processing the entire PDF.
    """
    f = request.files.get("pdf")
    if not f:
        return jsonify({"error": "Please upload a PDF file."}), 400

    data = f.read()
    if not data:
        return jsonify({"error": "Uploaded PDF is empty."}), 400

    try:
        src = fitz.open(stream=data, filetype="pdf")
    except Exception:
        return jsonify({"error": "Invalid or corrupted PDF file."}), 400

    if src.needs_pass:
        src.close()
        return jsonify({"error": "PDF is password protected."}), 400

    selected = parse_pages(request.form.get("pages", ""), len(src))
    if not selected:
        src.close()
        return jsonify({"error": "No slides selected."}), 400

    try:
        output_doc, total_sheets, slides_on_first = build_notes_pdf_doc(
            src, selected, request.form, first_sheet_only=True
        )
        first_page = output_doc[0]
        pix = first_page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
        b64 = base64.b64encode(pix.tobytes("png")).decode()
        output_doc.close()
    finally:
        src.close()

    return jsonify({
        "preview_image": "data:image/png;base64," + b64,
        "total_sheets": total_sheets,
        "slides_shown": slides_on_first
    })


@app.route("/process", methods=["POST"])
def process():
    f = request.files.get("pdf")
    if not f:
        return jsonify({"error": "Please upload a PDF file."}), 400

    data = f.read()
    if not data:
        return jsonify({"error": "Uploaded PDF is empty."}), 400

    try:
        src = fitz.open(stream=data, filetype="pdf")
    except Exception:
        return jsonify({"error": "Invalid or corrupted PDF file."}), 400

    if src.needs_pass:
        src.close()
        return jsonify({"error": "PDF is password protected."}), 400

    selected = parse_pages(request.form.get("pages", ""), len(src))
    if not selected:
        src.close()
        return jsonify({"error": "No slides selected."}), 400

    header_text = request.form.get("header_text", "").strip()[:90]
    try:
        output, _, _ = build_notes_pdf_doc(src, selected, request.form, first_sheet_only=False)
        pdf_bytes = output.tobytes(garbage=4, deflate=True)
        output.close()
    finally:
        src.close()

    download_name = safe_filename(header_text, "Concentric_Notes_Output")
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=download_name
    )


@app.route("/merge", methods=["POST"])
def merge_pdfs():
    files = request.files.getlist("pdfs")
    if len(files) < 2:
        return jsonify({"error": "Please select at least 2 PDF files."}), 400

    output = fitz.open()
    total_pages = 0

    try:
        for uploaded in files:
            if not uploaded or not uploaded.filename:
                continue

            data = uploaded.read()
            if not data:
                raise ValueError(f"'{uploaded.filename}' is empty.")

            try:
                source = fitz.open(stream=data, filetype="pdf")
            except Exception:
                raise ValueError(f"'{uploaded.filename}' is not a valid PDF.")

            if source.needs_pass:
                source.close()
                raise ValueError(f"'{uploaded.filename}' is password protected.")

            output.insert_pdf(source)
            total_pages += len(source)
            source.close()

        if total_pages == 0:
            output.close()
            return jsonify({"error": "No valid PDF pages found."}), 400

        chapter_name = request.form.get("chapter_name", "").strip()
        apply_pdf_metadata(output, chapter_name or "Concentric Full Chapter")
        pdf_bytes = output.tobytes(garbage=4, deflate=True)
        output.close()

        download_name = safe_filename(chapter_name, "Concentric_Full_Chapter")
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=download_name
        )

    except ValueError as e:
        output.close()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        output.close()
        return jsonify({"error": f"Merge failed: {str(e)}"}), 500


@app.route("/organize", methods=["POST"])
def organize_pdf():
    f = request.files.get("pdf")
    if not f:
        return jsonify({"error": "Please upload a PDF file."}), 400

    data = f.read()
    if not data:
        return jsonify({"error": "Uploaded PDF is empty."}), 400

    try:
        src = fitz.open(stream=data, filetype="pdf")
    except Exception:
        return jsonify({"error": "Invalid PDF file."}), 400

    if src.needs_pass:
        src.close()
        return jsonify({"error": "PDF is password protected."}), 400

    ops_raw = request.form.get("operations", "").strip()
    output = fitz.open()

    try:
        if ops_raw:
            ops = json.loads(ops_raw)
            for item in ops:
                p_idx = int(item.get("page", 1)) - 1
                rot = int(item.get("rotate", 0)) % 360
                if 0 <= p_idx < len(src):
                    output.insert_pdf(src, from_page=p_idx, to_page=p_idx)
                    if rot:
                        current_rot = output[-1].rotation
                        output[-1].set_rotation((current_rot + rot) % 360)
        else:
            selected = parse_pages(request.form.get("pages", ""), len(src))
            for p_idx in selected:
                output.insert_pdf(src, from_page=p_idx, to_page=p_idx)

        if len(output) == 0:
            output.close()
            src.close()
            return jsonify({"error": "No pages left in output PDF."}), 400

        out_name = request.form.get("output_name", "").strip()
        apply_pdf_metadata(output, out_name or "Concentric Organized PDF")
        pdf_bytes = output.tobytes(garbage=4, deflate=True)
    finally:
        output.close()
        src.close()

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=safe_filename(out_name, "Concentric_Organized")
    )


@app.route("/images-to-pdf", methods=["POST"])
def images_to_pdf():
    files = request.files.getlist("images")
    if not files:
        return jsonify({"error": "Please select at least one image."}), 400

    mode = request.form.get("mode", "original")
    try:
        strength = max(0, min(100, int(request.form.get("strength", 55))))
    except ValueError:
        strength = 55
    page_size = request.form.get("page_size", "a4_portrait")

    output = fitz.open()
    try:
        for uploaded in files:
            if not uploaded or not uploaded.filename:
                continue
            raw = uploaded.read()
            if not raw:
                continue
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            if mode != "original":
                img = process_image(img, mode, strength)

            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=88, optimize=True)
            iw, ih = img.size

            if page_size == "fit":
                page = output.new_page(width=iw, height=ih)
                page.insert_image(fitz.Rect(0, 0, iw, ih), stream=buf.getvalue())
            else:
                A4_W, A4_H = (842, 595) if page_size == "a4_landscape" else (595, 842)
                margin = 18
                page = output.new_page(width=A4_W, height=A4_H)
                cw, ch = A4_W - 2 * margin, A4_H - 2 * margin
                scale = min(cw / iw, ch / ih)
                dw, dh = iw * scale, ih * scale
                x = margin + (cw - dw) / 2
                y = margin + (ch - dh) / 2
                page.insert_image(fitz.Rect(x, y, x + dw, y + dh), stream=buf.getvalue())

        if len(output) == 0:
            output.close()
            return jsonify({"error": "No valid images could be processed."}), 400

        apply_pdf_metadata(output, "Concentric Images to PDF")
        pdf_bytes = output.tobytes(garbage=4, deflate=True)
    finally:
        output.close()

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="Concentric_Images_Notes.pdf"
    )


@app.route("/pdf-to-images", methods=["POST"])
def pdf_to_images():
    f = request.files.get("pdf")
    if not f:
        return jsonify({"error": "Please upload a PDF file."}), 400

    data = f.read()
    try:
        src = fitz.open(stream=data, filetype="pdf")
    except Exception:
        return jsonify({"error": "Invalid PDF file."}), 400

    selected = parse_pages(request.form.get("pages", ""), len(src))
    if not selected:
        src.close()
        return jsonify({"error": "No pages selected."}), 400

    fmt = request.form.get("format", "png").lower()
    if fmt not in ("png", "jpeg", "jpg"):
        fmt = "png"

    zip_buf = io.BytesIO()
    try:
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for p_idx in selected:
                pix = src[p_idx].get_pixmap(matrix=fitz.Matrix(2.0, 2.0), alpha=False)
                ext = "jpg" if fmt in ("jpeg", "jpg") else "png"
                img_bytes = pix.tobytes("jpeg", jpg_quality=90) if ext == "jpg" else pix.tobytes("png")
                zf.writestr(f"Slide_{p_idx + 1:03d}.{ext}", img_bytes)
    finally:
        src.close()

    zip_buf.seek(0)
    return send_file(
        zip_buf,
        mimetype="application/zip",
        as_attachment=True,
        download_name="Concentric_Slides_Images.zip"
    )


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=os.environ.get("FLASK_DEBUG", "0") == "1"
    )
