# read.sh

> A sci-fi terminal-styled PWA reader that renders articles and books like syntax-highlighted code.

**read.sh** is a hardcore, terminal-aesthetic web reader designed for developers and geeks. It strips away standard UI elements in favor of a Delos-inspired monochromatic command-line interface. 

Read text like code.

## 🚀 Features

- **Terminal Aesthetic**: Deep black background, muted cyan typography, and zero rounded corners.
- **"Syntax Highlighting" for Plain Text**: Custom regex engine parses text into tokens (tags, numbers, proper nouns, quotes) to simulate code reading.
- **Offline First**: Fully functional PWA that works entirely offline once loaded.
- **Dual Source**: 
  - `🎲 random --wiki`: Fetch random Wikipedia articles (English & Chinese support).
  - `📚 load ./book.epub`: Parse and read local EPUB files natively in-browser.
- **Code-style Annotations**: Tap the line number gutter to add inline `// comments` to any line.
- **Geek Sync**: Sync your annotations to a private GitHub Gist via Personal Access Token. No proprietary backend required.

## 🛠️ Tech Stack

- Vanilla HTML / CSS / JavaScript
- [JSZip](https://stuk.github.io/jszip/) for EPUB parsing
- IndexedDB for local caching and offline storage
- Service Workers for PWA capabilities
- GitHub Gists API for cloud sync

## 📦 Usage

To run the project locally, you just need a basic HTTP server.

```bash
# Clone the repository
git clone https://github.com/fukkix/read.sh.git
cd read.sh

# Run a local server (Python example)
python -m http.server 8080

# Or using Node.js (npx)
npx http-server -p 8080
```

Then visit `http://localhost:8080` in your browser. You can also install it as a PWA on your mobile device.

## ☁️ GitHub Sync Setup

1. Go to your [GitHub Developer Settings](https://github.com/settings/tokens) and generate a new Personal Access Token (classic) with the `gist` scope.
2. In the app, click the `⚙️` settings icon.
3. Paste your Token. Leave the Gist ID blank for the first sync (it will create one automatically).
4. Click Save, write some annotations, and click `☁️ push` in the status bar!

---
*Created by Antigravity*
