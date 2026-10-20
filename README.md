# 🟣 Concentric Notes Converter

### Smarter notes. Less unnecessary ink. More affordable studying.

**Concentric Notes Converter** is a PDF processing tool designed for students who want to turn lecture slides into printer-friendly study notes.

Convert colourful slides into black-and-white output, experiment with ink-saving processing, choose which slides to print, fit multiple slides on a single sheet, and merge lecture PDFs into organised study material.

Built with Python and a browser-based interface, Concentric Notes Converter aims to make everyday study preparation practical, lightweight, and accessible, even on older computers.

<p align="center">
  <a href="https://github.com/avadhesh0003/concentric-notes-converter">
    <img src="https://img.shields.io/badge/Platform-Linux%20tested-6C5CE7?style=for-the-badge" alt="Linux tested">
  </a>
  <img src="https://img.shields.io/badge/Interface-Browser--based-00A896?style=for-the-badge" alt="Browser-based interface">
  <img src="https://img.shields.io/badge/License-See%20LICENSE-64748B?style=for-the-badge" alt="License">
</p>

---

## ✨ Why Concentric Notes Converter?

Lecture PDFs are often designed for presentation screens, not printing. Large coloured backgrounds, decorative graphics, and full-page designs can make printed notes expensive or inconvenient.

Concentric Notes Converter gives you more control over how your lecture material looks on paper.

- 🖨️ **Printer-friendly output:** Convert slides into black-and-white or grayscale versions.
- 🖋️ **Smart Ink Saver:** Reduce unnecessary background coverage in suitable slides.
- 📄 **Save paper:** Arrange up to eight slides on a single sheet.
- 🎯 **Print what matters:** Select individual slides instead of processing everything.
- 📚 **Organise lectures:** Merge multiple PDFs into one document.
- 🥔 **Designed for modest hardware:** No dedicated graphics card is required for ordinary PDF processing.

---

## 🖼️ See the Difference

### Before and After

The following example shows an original coloured lecture slide and its processed black-and-white version.

<table>
  <tr>
    <th align="center">Before · Original Slide</th>
    <th align="center">After · Processed Slide</th>
  </tr>
  <tr>
    <td width="50%">
      <img src="screenshots/before.png" alt="Original coloured lecture slide" width="100%">
    </td>
    <td width="50%">
      <img src="screenshots/after.png" alt="Processed black-and-white lecture slide" width="100%">
    </td>
  </tr>
</table>

The aim is to make lecture slides more convenient to print while keeping their educational content readable. Results depend on the original slide and the selected processing mode.

### Application Workspace

![Concentric Notes Converter workspace](screenshots/workspace.png)

### Select the Slides You Need

![Slide selection interface](screenshots/slide-selection.png)

### Customise Your Output

![Conversion settings](<screenshots/Screenshot from 2026-10-20 11-56-36.png>)

### Merge Lecture PDFs

![Merge lectures interface](screenshots/merge-lectures.png)

---

## 🚀 Features

### 🖋️ Smart Ink Saver

Presentation slides can contain large areas of dark or saturated backgrounds that are unnecessary for many printed study notes.

Smart Ink Saver is designed to make suitable slides more printer-friendly by reducing unnecessary background coverage while retaining useful content.

- Intended for lecture slides and educational PDFs.
- Can help reduce large background areas in suitable images.
- Useful when preparing notes for physical revision.
- Results vary with slide design, colours, contrast, and content.

**Important:** Ink savings depend on the printer, print settings, paper, and source document. No fixed percentage of savings is guaranteed.

### 🎨 Multiple Processing Modes

Choose how your slides should be processed.

| Mode | Purpose |
|---|---|
| **Smart Ink Saver** | Makes suitable slides more printer-friendly by reducing unnecessary background coverage. |
| **Invert + B&W** | Inverts image tones and creates black-and-white output, useful for experimenting with dark-background slides. |
| **Grayscale** | Converts slide images into shades of grey. |
| **Original** | Keeps the original image appearance as much as the processing pipeline allows. |

### 🎯 Individual Slide Selection

Take control of your notes instead of printing an entire lecture.

- Preview PDF slides before processing.
- Select individual slides.
- Select all slides at once.
- Clear your current selection.
- Generate output from the slides you actually need.

### 📄 Multiple Slides Per Sheet

Fit more lecture content onto fewer printed pages.

Supported layouts:

`1 · 2 · 3 · 4 · 6 · 8 slides per page`

Choose portrait or landscape orientation to suit your content and preferred printing layout.

### ✏️ Adjustable Outline Strength

Use the outline-strength control to adjust the outline effect where supported by the processing pipeline. This can help you experiment with the appearance of processed slides before generating the final PDF.

### 📚 Merge Lectures

Keep related study material together.

- Upload multiple lecture PDFs.
- Arrange them in your preferred order.
- Combine them into a single PDF.
- Prepare one organised document for a chapter or topic.

### 🌐 Browser-Based Workspace

The interface runs in a web browser while the Python application handles processing.

- No dedicated GPU is needed for normal PDF tasks.
- Works locally on a supported Python environment.
- Uses common Python PDF and image-processing libraries.
- Can process files offline after setup, provided all required dependencies are already installed and the application does not rely on external services.

---

## 💻 System Requirements

Concentric Notes Converter is intended to be practical on low-end computers. The figures below are **initial targets**, not results from comprehensive hardware benchmarking.

| Component | Recommended minimum | Tested development laptop |
|---|---|---|
| **Processor** | 64-bit dual-core CPU | Intel Core i3-6006U |
| **Memory** | 2 GB RAM for light workloads | 8 GB RAM |
| **Architecture** | 64-bit x86 | 64-bit x86 |
| **Graphics** | Integrated graphics; no dedicated GPU required | Intel HD Graphics 520 |
| **Storage** | 500 MB free for application and dependencies, plus temporary working space | 128 GB SSD and 1 TB HDD |
| **Operating system** | A compatible 64-bit Linux environment with Python support | Zorin OS 18.1 Core |
| **Browser** | A recent compatible browser | Brave on Linux |

### 🥔 What about an old or low-end PC?

You do not need a gaming computer to process ordinary lecture PDFs.

- **2 GB RAM:** A reasonable target for light workloads, but larger PDFs may struggle.
- **4 GB RAM:** A more comfortable starting point for everyday use.
- **8 GB RAM:** Provides additional headroom for large documents and multitasking.
- **Dedicated graphics card:** Not required for the application's normal PDF and image-processing workflow.

The actual minimum depends on PDF size, page resolution, the processing mode, and available memory. Large files may need significantly more RAM and temporary storage.

**The tested configuration above is the laptop used during development.** It is not a claim that every operating system or every feature has been tested on all listed hardware configurations.

---

## 🛠️ Technology

Concentric Notes Converter uses the following technologies:

- **Python** for application logic.
- **Flask** for web routing and the local application server.
- **PyMuPDF** for PDF operations.
- **Pillow** for image manipulation.
- **OpenCV** for image processing.
- **NumPy** for numerical image operations.
- **HTML, CSS and JavaScript** for the browser interface.
- **Gunicorn** for WSGI server support.

---

## 📥 Installation

### Linux · Source Installation

The application has been tested locally on Zorin OS 18.1 Core.

#### 1. Install prerequisites

Install Python 3, `pip`, and the virtual-environment package using your distribution's package manager.

On Debian-based systems:

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv git
```

#### 2. Download the project

```bash
git clone https://github.com/avadhesh0003/concentric-notes-converter.git
cd concentric-notes-converter
```

#### 3. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### 4. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### 5. Start the application

```bash
python app.py
```

Open the local address printed by the application. If it uses Flask's default local address, visit:

`http://127.0.0.1:5000`

Keep the terminal running while you use the application.

#### Existing Linux launcher

If you have installed the standalone Linux launcher using the project's setup instructions, you can start it with:

```bash
~/.local/bin/concentric-notes-converter
```

### Windows

The project is written in Python, but a Windows installer and native Windows packaging have not yet been verified. Running from source would require a compatible Python environment and the project's dependencies.

### macOS

macOS support has not yet been verified. Compatibility should be tested before being advertised as supported.

---

## 📖 How to Use

### Process Notes

1. Open the Notes workspace.
2. Upload a lecture PDF.
3. Preview the slides.
4. Select the pages you need.
5. Choose the number of slides per sheet.
6. Select portrait or landscape orientation.
7. Choose the image-processing mode.
8. Adjust outline strength if needed.
9. Generate the notes PDF.
10. Review the result before printing.

### Merge Lectures

1. Open Merge Lectures.
2. Upload the PDFs you want to combine.
3. Arrange the files in the required order.
4. Start the merge.
5. Save the combined PDF for revision.

---

## 🔒 Privacy and File Handling

When running locally, PDF processing takes place through your local application rather than automatically requiring a third-party conversion service.

Keep in mind:

- Processing may create temporary files.
- Temporary-file cleanup depends on the implementation.
- A remotely hosted deployment has different privacy considerations from a local installation.
- Avoid uploading confidential documents to an untrusted server.

---

## 🗺️ Roadmap

Potential improvements include:

- [ ] More ink-saving controls.
- [ ] Additional page-layout options.
- [ ] Better handling of large PDFs.
- [ ] Improved batch processing.
- [ ] More output previews.
- [ ] Improved Linux packaging.
- [ ] Windows desktop packaging.
- [ ] Broader operating-system compatibility testing.

---

## 🤝 Contributing

Bug reports, suggestions, and contributions are welcome.

When reporting an issue, please include:

- Your operating system.
- Your Python version.
- The steps needed to reproduce the issue.
- The approximate PDF size and page count.
- Any relevant error messages.

Do not share copyrighted or private lecture PDFs unless you have permission.

---

## 📜 License

Please see the [LICENSE](LICENSE) file for the project's licensing terms.

---

## 👨‍💻 Author

**Avadhesh Pingoriya**

- GitHub: [@avadhesh0003](https://github.com/avadhesh0003)
- Repository: [Concentric Notes Converter](https://github.com/avadhesh0003/concentric-notes-converter)

---

<p align="center">
  <strong>Made for students. Designed for practical, printer-friendly notes.</strong>
  <br>
  Less unnecessary ink. Fewer printed sheets. More focused revision.
</p>
