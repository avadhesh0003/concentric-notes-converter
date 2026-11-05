<div align="center">

<img src="static/concentric-mark.svg" alt="Concentric Notes Converter logo" width="76" />

# Concentric Notes Converter

### Turn lecture PDFs into cleaner, print-friendly study notes.

A student-focused PDF toolkit featuring **Smart Ink Saver**, slide selection, PDF organization, and image conversion.

[![Live Web App](https://img.shields.io/badge/Live%20App-Open%20Converter-6C5CE7?style=for-the-badge)](https://concentric-notes-converter.vercel.app/)
[![Version](https://img.shields.io/badge/version-v2.3-2026?style=for-the-badge&color=2D9CDB)](#)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

**[Open the web app](https://concentric-notes-converter.vercel.app/) · [View screenshots](#screenshots) · [Run locally](#run-locally)**

</div>

---

## What is it?

Concentric Notes Converter helps students prepare study material from lecture PDFs. Its main workflow lets you choose the slides you need, apply Smart Ink Saver, arrange the output for paper, preview the result, and export a new PDF.

It also includes everyday PDF utilities for combining, extracting, rotating, and converting documents.

## Screenshots

<p align="center">
  <img src="screenshots/01-upload-pdf.png" alt="Upload a lecture PDF" width="88%" />
  <br />
  <sub><strong>01 · Upload</strong> · Start with a lecture or notes PDF.</sub>
</p>

<p align="center">
  <img src="screenshots/02-select-slides.png" alt="Select pages or slides" width="88%" />
  <br />
  <sub><strong>02 · Select slides</strong> · Choose the pages you want to keep.</sub>
</p>

<p align="center">
  <img src="screenshots/03-ink-saver-settings.png" alt="Configure Smart Ink Saver" width="88%" />
  <br />
  <sub><strong>03 · Tune the output</strong> · Configure Smart Ink Saver and page layout.</sub>
</p>

<p align="center">
  <img src="screenshots/04-preview-and-export.png" alt="Preview and export the finished PDF" width="88%" />
  <br />
  <sub><strong>04 · Preview and export</strong> · Check the result before saving.</sub>
</p>

## Features

| Tool | What it does |
|---|---|
| **Process Notes** | Select PDF pages, apply Smart Ink Saver, arrange pages, preview, and export. |
| **Smart Ink Saver** | Detects dark slide content and processes it into a more print-friendly result. |
| **Merge Lectures** | Combine multiple PDF files into one document. |
| **Split & Extract** | Extract selected pages into a separate PDF. |
| **Organize & Rotate** | Reorder pages and rotate them. |
| **Images to PDF** | Combine image files into a PDF. |
| **PDF to Images** | Convert PDF pages into image files. |

> **Note:** Smart Ink Saver changes the appearance of processed pages. Always preview the output and keep your original PDF, especially when slides contain fine diagrams, coloured annotations, or small text.

## Tech stack

- **Backend:** Python, Flask
- **PDF processing:** PyMuPDF
- **Image processing:** Pillow, OpenCV, NumPy
- **Frontend:** HTML, CSS, JavaScript
- **Browser PDF tools:** PDF.js, PDF-lib, JSZip

## Run locally

### 1. Requirements

- Python 3.12 or newer
- pip
- Internet access to install Python packages

### 2. Get the source

```bash
git clone https://github.com/<your-username>/<your-repository>.git
cd <your-repository>
```

Or download and extract the repository ZIP from GitHub.

### 3. Create a virtual environment

**Windows (Command Prompt):**

```bat
py -3.12 -m venv .venv
.venv\Scripts\activate
```

**Linux / macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 4. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Start the app

```bash
python app.py
```

Open the local address shown in the terminal, usually:

```text
http://127.0.0.1:5000
```

Stop the server with `Ctrl+C` in the terminal.

## Project structure

```text
concentric-notes-converter/
├── app.py                      # Flask app and PDF-processing routes
├── requirements.txt            # Python dependencies
├── runtime.txt                 # Deployment Python runtime
├── Procfile                    # Web process entry point
├── vercel.json                 # Vercel deployment configuration
├── templates/
│   └── index.html              # Main web interface
├── static/
│   ├── app.js                  # Frontend interactions
│   ├── style.css               # Interface styling
│   └── concentric-mark.svg     # App logo
└── screenshots/                # README screenshots
```

## How the app fits together

1. The browser loads the interface from `templates/index.html` and its assets from `static/`.
2. JavaScript handles the interactive workflow and sends PDF tasks to Flask endpoints.
3. Flask uses PyMuPDF and the image-processing libraries to create or transform PDF files.
4. The processed file is returned to the browser for preview or download.

## Deployment

The project includes Vercel configuration files. The hosted version is available here:

**https://concentric-notes-converter.vercel.app/**

For changes to the source code to appear on the hosted app, deploy the updated project through the configured hosting workflow.

## Privacy and file handling

- The hosted version processes files through its application backend. Avoid uploading documents containing sensitive personal information.
- When running locally, the app runs on your own computer. Keep your original files and review exported PDFs before printing or sharing.
- The project has a configured upload-size limit. Very large PDFs may take longer to process or exceed the limit.

## License

**No open-source license has been selected yet.** Until a license is added to this repository, all rights remain with the copyright holder. Please do not assume the code is public domain or freely reusable.

## Author

**Avadhesh Pingoriya**

<div align="center">

Made for more practical, print-friendly study notes.

[**Launch Concentric Notes Converter ↗**](https://concentric-notes-converter.vercel.app/)

</div>
