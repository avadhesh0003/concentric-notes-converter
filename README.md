# Concentric Notes Converter

**A free, open-source PDF tool by Avadhesh Pingoriya.**

Concentric Notes Converter helps turn lecture PDFs into printer-friendly study notes. It combines a modern, responsive interface with the original Smart Ink Saver processing pipeline.

## Features

- **Process notes:** preview PDF pages and select individual slides.
- **Smart Ink Saver:** clean slide backgrounds and strengthen outlines.
- **Multiple layouts:** fit 1, 2, 3, 4, 6, or 8 slides on an A4 sheet.
- **Page controls:** portrait or landscape output.
- **Alternative modes:** Invert + B&W, grayscale, or original.
- **Merge lectures:** combine PDFs, reorder them, remove files, and set a chapter filename.
- **Responsive UI:** works in modern desktop and mobile browsers.
- **Open source:** free to use, modify, and redistribute under The Unlicense.

## Requirements

- Python 3.10 or newer recommended
- pip
- A modern browser

## Run locally

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

### Windows (Command Prompt)

```bat
py -m venv .venv
.venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5000**.

## Run with Gunicorn

```bash
gunicorn --bind 0.0.0.0:8000 app:app
```

Set `PORT` if your hosting platform provides one. The app reads `PORT` automatically.

## Deploying

This is a Flask application, not a static-only website. GitHub Pages cannot run the Python PDF-processing backend. Deploy it to a Python-capable host or run it on your own device. For public hosting, configure upload limits, temporary-file cleanup, request timeouts, and resource limits to suit your environment.

## Privacy and file handling

PDFs are uploaded to the server running the app for processing. Do not upload sensitive documents to a public instance you do not control. Generated PDFs are written to the local `work/` directory. Clean up this directory periodically on a long-running deployment.

## Credit

Created by **Avadhesh Pingoriya**. Please keep the creator credit visible when sharing modified versions.

## License

Released under **The Unlicense**. See [`LICENSE`](LICENSE). It dedicates this work to the public domain to the extent permitted by law and allows broad reuse, modification, and redistribution without requiring attribution. The creator credit above is a requested courtesy.
