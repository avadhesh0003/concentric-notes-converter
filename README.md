# 🪐 Concentric Notes Converter

### Make notes smarter. Save ink. Study better.

**Concentric Notes Converter** is an open-source Python application that helps you turn lecture PDFs into cleaner, printer-friendly study notes. Select the slides you need, customize their layout and appearance, and combine multiple lecture PDFs into a single chapter file.

Built with Python and Flask, it features a modern web interface that can run locally on your computer.

<p align="center">
  <img src="screenshots/workspace.png" alt="Concentric Notes Converter workspace" width="850">
</p>

<p align="center">
  <strong>Clean up lecture slides. Organize your chapters. Make every page count.</strong>
</p>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [📸 Screenshots](#-screenshots)
- [🚀 Getting Started](#-getting-started)
- [💻 Installation](#-installation)
- [📖 How to Use](#-how-to-use)
- [⚙️ Technologies](#️-technologies)
- [📂 Project Structure](#-project-structure)
- [🔒 Privacy and File Handling](#-privacy-and-file-handling)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [👨‍💻 Author](#-author)

---

## ✨ Features

### 📝 Process Notes

Transform lecture PDFs into a more convenient format for studying and printing.

- **📄 Select individual slides:** Preview PDF pages and choose exactly which slides to include.
- **📐 Multiple pages per sheet:** Choose from 1, 2, 3, 4, 6, or 8 slides per A4 sheet.
- **🖨️ Smart Ink Saver:** Enhance slide outlines and backgrounds for more printer-friendly output.
- **⚫ Image processing options:** Choose Smart Ink Saver, Invert + B&W, Grayscale, or Original.
- **🎚️ Adjustable outline strength:** Fine-tune the outline effect using the available slider.
- **📃 Page orientation:** Choose portrait or landscape output.
- **⬇️ PDF output:** Generate a new PDF containing your selected slides and chosen layout.

### 📚 Merge Lectures

Organize multiple lecture PDFs into one chapter file.

- Upload multiple PDF files.
- Arrange lecture files in the order you want.
- Combine related lectures into a single PDF.
- Keep your original files unchanged.

### 🎨 Modern Interface

- Clean, responsive workspace.
- Separate sections for processing notes and merging lectures.
- Drag-and-drop PDF upload interface.
- Slide previews with selection controls.
- Organized conversion settings.
- A consistent Concentric visual identity.

---

## 📸 Screenshots

### 🏠 Notes Workspace

Upload a lecture PDF and prepare it for processing.

![Notes Workspace](screenshots/workspace.png)

### 🎯 Slide Selection

Preview the pages and select only the slides you need.

![Slide Selection](screenshots/slide-selection.png)

### ⚙️ Conversion Settings

Customize the page layout, image treatment, outline strength, and orientation.

![Conversion Settings](<screenshots/Screenshot from 2026-10-20 11-56-36.png>)

### 📚 Merge Lectures

Combine multiple lecture PDFs into one organized chapter file.

![Merge Lectures](screenshots/merge-lectures.png)

---

## 🚀 Getting Started

The simplest way to use Concentric Notes Converter is to run it locally on a computer with Python installed.

### Prerequisites

- Python 3.12 or another Python version compatible with the project's dependencies.
- `pip`, the Python package installer.
- A modern web browser.
- PDF files you want to process.

An internet connection is needed to install dependencies during the initial setup.

### Quick Start

Clone the repository:

```bash
git clone https://github.com/avadhesh0003/concentric-notes-converter.git
cd concentric-notes-converter
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it on Linux or macOS:

```bash
source .venv/bin/activate
```

On Windows Command Prompt:

```cmd
.venv\Scripts\activate.bat
```

Install the dependencies:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Start the application:

```bash
python app.py
```

Open the local address shown in the terminal. With the default Flask configuration, this is typically:

```text
http://127.0.0.1:5000
```

To stop the development server, press `Ctrl + C` in the terminal.

---

## 💻 Installation

### 🐧 Linux

The project can be run from source on Linux distributions with a compatible Python environment.

For Zorin OS, Ubuntu, and similar distributions, follow the [Quick Start](#-quick-start) instructions above.

If your Python virtual environment module is missing on Ubuntu-based systems, install it with:

```bash
sudo apt update
sudo apt install python3-venv python3-pip
```

Then create the virtual environment and install the requirements.

**Installed launcher:** If you have already installed the local Linux version using the project's installer, launch it with:

```bash
~/.local/bin/concentric-notes-converter
```

The local installer runs the application using a Python virtual environment and opens its interface in your browser.

### 🪟 Windows

Windows packaging is part of the planned cross-platform work. To run from source, install a compatible version of Python, clone the repository, create a virtual environment, and install `requirements.txt`.

Activate the environment in Command Prompt:

```cmd
.venv\Scripts\activate.bat
```

Then run:

```cmd
python -m pip install -r requirements.txt
python app.py
```

### 🍎 macOS

macOS support requires testing the Python dependencies and application behavior on macOS. The general source setup is similar to the Linux instructions, using a compatible Python installation and virtual environment.

Standalone Windows and macOS installers are not currently promised by this README.

---

## 📖 How to Use

### 1. Process Notes

1. Launch Concentric Notes Converter.
2. Open **Process notes** from the workspace sidebar.
3. Upload a lecture PDF by dropping it into the upload area or browsing for a file.
4. Preview the pages and select the slides you want to keep.
5. Choose the number of pages per sheet.
6. Select an image-processing option.
7. Adjust outline strength if using Smart Ink Saver.
8. Choose portrait or landscape orientation.
9. Click **Generate notes PDF**.
10. Save the generated PDF and check the result before printing.

### 2. Merge Lectures

1. Open **Merge lectures**.
2. Add at least two lecture PDFs.
3. Arrange the files in the desired order.
4. Review the file list.
5. Start the merge operation and save the resulting PDF.

The exact output behavior depends on the current application implementation.

---

## ⚙️ Technologies

| Technology | Purpose |
|---|---|
| Python | Application logic and PDF processing |
| Flask | Web application and local server |
| PyMuPDF | PDF reading and manipulation |
| Pillow | Image processing |
| OpenCV | Image enhancement operations |
| NumPy | Numerical and image-processing operations |
| HTML, CSS and JavaScript | User interface |
| Gunicorn | Production WSGI server support |

Dependencies are listed in [`requirements.txt`](requirements.txt).

---

## 📂 Project Structure

```text
concentric-notes-converter/
├── app.py
├── requirements.txt
├── runtime.txt
├── LICENSE
├── README.md
├── Procfile
├── templates/
│   └── ...
├── static/
│   ├── css/
│   ├── js/
│   └── ...
└── screenshots/
    ├── workspace.png
    ├── slide-selection.png
    ├── merge-lectures.png
    └── Screenshot from 2026-10-20 11-56-36.png
```

The `templates/` and `static/` directories contain the web interface resources. `app.py` is the main Flask application, and `requirements.txt` lists its Python dependencies.

*Note: The directory listing above is a guide to the main project files; individual asset filenames may vary.*

---

## 🔒 Privacy and File Handling

When running locally, the application processes files through the instance running on your computer.

- Keep your original PDFs as backups.
- Review the generated output before printing or sharing it.
- Avoid uploading confidential documents to public or third-party deployments.
- A hosted version processes files on its server, so its operator must provide appropriate upload limits, temporary-file cleanup, and privacy protections.
- Do not expose a local development server directly to the public internet.

The current interface indicates an upload limit of up to 500 MB. Actual limits may also depend on the server configuration and available memory.

---

## 🗺️ Roadmap

The following are future goals, not claims that these features are already available.

- [x] Flask-based application
- [x] PDF note-processing interface
- [x] Slide preview and selection
- [x] Multiple pages per sheet
- [x] Image-processing options
- [x] Lecture PDF merging
- [x] Local Linux installer
- [ ] Publicly hosted website
- [ ] Tested standalone Linux AppImage
- [ ] Windows desktop package
- [ ] macOS desktop package
- [ ] Improved automated testing and release workflow

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

To suggest an improvement:

1. Check the existing [Issues](https://github.com/avadhesh0003/concentric-notes-converter/issues).
2. Open an issue describing the bug or proposed feature.
3. For code contributions, fork the repository and create a separate branch.
4. Test your changes before opening a pull request.

Please include steps to reproduce bugs and, where useful, a sample PDF that can be shared safely.

---

## 📜 License

Concentric Notes Converter is an open-source project. See the [`LICENSE`](LICENSE) file in this repository for the applicable license and its terms.

---

## 👨‍💻 Author

**Avadhesh Pingoriya**

Created to make lecture notes easier to organize, customize, and print.

- **Repository:** [avadhesh0003/concentric-notes-converter](https://github.com/avadhesh0003/concentric-notes-converter)
- **Issues and feedback:** [GitHub Issues](https://github.com/avadhesh0003/concentric-notes-converter/issues)

---

<p align="center">
  🪐 <strong>Concentric Notes Converter</strong><br>
  <em>Make notes work smarter.</em>
</p>
