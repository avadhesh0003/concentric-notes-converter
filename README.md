# Concentric Notes Converter

**Turn lecture slides into printer-friendly notes. Save ink, save paper, and keep studying.**

Concentric Notes Converter is a PDF utility designed for students who want to transform colourful lecture slides into more convenient study material. Process individual slides, reduce unnecessary ink usage, arrange multiple slides on a single page, and merge lecture PDFs into one organised document.

It is built with Python and a browser-based interface, so you can use its workspace locally without needing a complicated desktop application.

---

## Screenshots

### Notes Workspace

![Concentric Notes Converter workspace](screenshots/workspace.png)

### Before and After: Ink-Saving Conversion

Convert colourful lecture slides into black-and-white pages that are easier to print economically.

**Before: Original coloured slide**

![Original lecture slide](screenshots/before.png)

**After: Processed black-and-white slide**

![Processed lecture slide](screenshots/after.png)

### Slide Selection

![Slide selection interface](screenshots/slide-selection.png)

### Conversion Settings

![Conversion settings](<screenshots/Screenshot from 2026-10-20 11-56-36.png>)

### Merge Lectures

![Merge lectures interface](screenshots/merge-lectures.png)

---

## Features

### 1. Smart Ink Saver

Lecture slides often contain large coloured backgrounds, decorative elements, and dark areas that consume unnecessary printer ink.

Smart Ink Saver is designed to produce more printer-friendly output from such slides. It helps reduce unnecessary background coverage while preserving useful slide content as much as possible.

- Designed for colourful lecture presentations.
- Helps make slides more suitable for printing.
- Useful for students who prefer physical notes.
- Results can vary depending on the original slide's colours, contrast, and layout.

**Note:** Smart Ink Saver is an image-processing feature, not a guarantee of a particular percentage of ink savings. Check the generated PDF before printing.

### 2. Multiple Image-Processing Modes

Choose the output style that suits your lecture material:

- **Smart Ink Saver:** Reduces unnecessary background coverage.
- **Invert + B&W:** Inverts image tones and produces black-and-white output, useful for experimenting with dark-background slides.
- **Grayscale:** Converts slides to shades of grey.
- **Original:** Preserves the original image appearance as much as the conversion pipeline allows.

### 3. Select Individual Slides

You don't always need to print an entire lecture.

- Preview the slides in a PDF.
- Select the slides you need.
- Select all slides or clear the selection.
- Generate notes using your chosen settings.

### 4. Multiple Slides Per Page

Arrange multiple lecture slides on a single sheet to reduce paper usage.

Available layouts:

- 1 slide per page
- 2 slides per page
- 3 slides per page
- 4 slides per page
- 6 slides per page
- 8 slides per page

Choose portrait or landscape orientation according to your preferred layout.

### 5. Outline Strength

Adjust the outline-strength setting to control the outline effect where supported by the processing pipeline. This can be useful when preparing slides with light text or illustrations for printing.

### 6. Merge Lecture PDFs

Combine multiple lecture PDFs into one chapter document.

- Upload multiple PDFs.
- Arrange the files in your preferred order.
- Merge them into a single PDF.
- Keep related lectures together for easier revision.

### 7. Local Browser-Based Interface

The application runs locally and opens in your web browser.

- No separate desktop GUI framework is required.
- The browser provides the user interface.
- PDF processing is handled by the Python application.
- Internet access is not required for ordinary local processing once the application and its dependencies are installed, provided no external service is added to your setup.

---

## System Requirements

Concentric Notes Converter is intended to be usable on modest computers, including older laptops. PDF processing performance depends on the size, resolution, and number of pages being processed.

The following specifications are **initial estimates, not independently benchmarked guarantees**.

| Component | Proposed minimum | Recommended |
|---|---|---|
| Processor | 64-bit, dual-core CPU | Modern dual-core or better |
| RAM | 2 GB for light workloads | 4 GB or more |
| Storage | 500 MB free for the application and dependencies, plus working space | 1 GB or more free, plus PDF storage |
| Architecture | 64-bit x86 processor | 64-bit x86 processor |
| Display | Any display capable of running a supported browser | 1366 × 768 or higher |
| Browser | Recent Chromium, Chrome, Firefox, or another compatible browser | Updated browser |
| Internet | Needed for initial setup and dependency downloads | Not normally needed for local processing after setup |

### Can it run on a potato PC? 🥔

**Quite possibly, yes!**

You don't need a gaming laptop or a powerful graphics card. The main work is PDF and image processing, so a dedicated GPU is not required.

- An older dual-core processor can be sufficient for small PDFs.
- 2 GB RAM may work for light tasks, but larger PDFs can struggle.
- 4 GB RAM is a more practical starting point.
- 8 GB RAM provides more headroom for large files and multitasking.
- Large, high-resolution PDFs may take longer and require more memory.

These are estimates. Actual performance must be tested on the target computer.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Application logic |
| Flask | Local web server and application routes |
| PyMuPDF | PDF reading and manipulation |
| Pillow | Image processing |
| OpenCV | Image-processing operations |
| NumPy | Numerical image operations |
| HTML, CSS and JavaScript | User interface and browser interactions |
| Gunicorn | WSGI server support |

---

## Installation

### Linux

The project has been tested locally on **Zorin OS 18.1, 64-bit**.

For a development/source installation, install Python 3 and `pip`, then clone the repository:

```bash
git clone https://github.com/avadhesh0003/concentric-notes-converter.git
cd concentric-notes-converter
```

Create a virtual environment and install the dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Start the application:

```bash
python app.py
```

Open the local address shown in the terminal. If the application uses Flask's default local address, it will typically be:

`http://127.0.0.1:5000`

If you installed the Linux launcher, you can also start it using:

```bash
~/.local/bin/concentric-notes-converter
```

### Windows

The source code is Python-based, but a Windows installer has not yet been verified. A compatible Python installation and the project's dependencies will be required.

### macOS

The source code may be adaptable to macOS, but macOS compatibility has not yet been verified.

---

## How to Use

### Process Notes

1. Open the application.
2. Upload your lecture PDF.
3. Preview the slides and select the pages you want.
4. Choose the number of slides per sheet.
5. Select portrait or landscape orientation.
6. Choose Smart Ink Saver, Invert + B&W, Grayscale, or Original.
7. Adjust outline strength if required.
8. Generate and review the resulting notes PDF.
9. Print the PDF using your preferred printer settings.

### Merge Lectures

1. Open the Merge Lectures workspace.
2. Upload the lecture PDFs.
3. Arrange them in the desired order.
4. Start the merge operation.
5. Save the combined PDF for revision.

---

## Project Structure

```text
concentric-notes-converter/
├── app.py
├── requirements.txt
├── runtime.txt
├── Procfile
├── LICENSE
├── README.md
├── templates/
├── static/
└── screenshots/
    ├── README.md
    ├── workspace.png
    ├── before.png
    ├── after.png
    ├── slide-selection.png
    ├── merge-lectures.png
    └── Screenshot from 2026-10-20 11-56-36.png
```

---

## Privacy and File Handling

Concentric Notes Converter is designed around local PDF processing.

When running the application locally, uploaded PDFs are handled by your own running application rather than automatically being sent to a third-party conversion service.

Keep in mind:

- Temporary files may be created during processing.
- Do not assume temporary files are automatically deleted unless the implementation confirms it.
- Be cautious when using any publicly exposed or remotely hosted deployment.
- Do not upload confidential documents to an untrusted deployment.

---

## Roadmap

Possible future improvements include:

- [ ] Windows desktop installer
- [ ] Linux packaging improvements
- [ ] More ink-saving controls
- [ ] Additional page-layout options
- [ ] Improved batch processing
- [ ] Better handling of large PDFs
- [ ] More output previews and processing controls

---

## Contributing

Contributions, bug reports, and suggestions are welcome.

If you find an issue:

1. Check whether it has already been reported.
2. Describe the steps needed to reproduce it.
3. Include your operating system and Python version.
4. Share a small sample PDF only if you have permission to share its contents.

---

## License

See the [LICENSE](LICENSE) file for the terms governing the use, modification, and distribution of this project.

---

## Author

**Avadhesh Pingoriya**

GitHub: [@avadhesh0003](https://github.com/avadhesh0003)

Project repository: [concentric-notes-converter](https://github.com/avadhesh0003/concentric-notes-converter)

*Made for students who want more useful notes and less unnecessary printing.*
