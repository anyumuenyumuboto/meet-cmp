# Voice Word Predictor - Chrome Extension

AI-powered Chrome extension that displays predicted next words in real-time as you speak. Perfect for presentations, language learning, and overcoming speech blocks.

## Features

- 🎤 **Real-time Speech Recognition**: Uses Web Speech API to capture your voice
- 🤖 **AI Word Prediction**: OpenAI integration for intelligent next-word predictions
- 💬 **Simple Fallback**: Built-in word association algorithm when API key is not provided
- 🎨 **Clean UI**: Non-intrusive overlay display with smooth animations
- ⚙️ **Easy Configuration**: Simple popup interface for enabling/disabling and API key setup

## Installation

### Development Build

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the extension:
   ```bash
   pnpm build
   ```

4. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-prod` folder

### Production Build

```bash
pnpm build --prod
```

## Usage

1. Click the extension icon in Chrome toolbar
2. Toggle "Enable Voice Prediction" ON
3. (Optional) Enter your OpenAI API key for better predictions
4. Navigate to any webpage
5. Start speaking - predictions will appear in the bottom-right corner

## How It Works

### Architecture

- **Popup (`src/popup.tsx`)**: User interface for enabling/disabling the extension and configuring API key
- **Background Script (`src/background.ts`)**: Handles speech recognition and AI API communication
- **Content Script (`src/content.tsx`)**: Displays predictions on web pages

### Speech Recognition

The extension uses the Web Speech API (`webkitSpeechRecognition`) to:
- Continuously listen to your voice
- Convert speech to text in real-time
- Send transcripts to the prediction engine

### Word Prediction

Two modes available:

1. **AI Mode** (with API key):
   - Sends transcript to OpenAI GPT-3.5
   - Receives intelligent context-aware predictions
   - Better accuracy for complex sentences

2. **Simple Mode** (without API key):
   - Uses predefined word associations
   - Fast and privacy-friendly
   - Good for common phrases

## Configuration

### OpenAI API Key

For best results, obtain an API key from [OpenAI](https://platform.openai.com/api-keys):

1. Create an OpenAI account
2. Generate a new API key
3. Enter it in the extension popup
4. The key is stored securely in Chrome's sync storage

### Permissions

The extension requires:
- `activeTab`: To inject content script
- `storage`: To save settings
- `https://*/*`: For OpenAI API calls

## Development

### Run Development Server

```bash
pnpm dev
```

This will start a development server with hot-reload enabled.

### Project Structure

```
/workspace
├── src/
│   ├── popup.tsx      # Extension popup UI
│   ├── background.ts  # Background service worker
│   └── content.tsx    # Content script for overlays
├── assets/            # Extension icons
├── build/             # Compiled extension
└── package.json       # Dependencies and scripts
```

## Privacy & Security

- Voice data is processed locally using browser APIs
- No audio is sent to external servers
- API key is stored in Chrome's encrypted storage
- OpenAI API calls only occur if you provide an API key

## Troubleshooting

### Speech Recognition Not Working

- Ensure microphone permissions are granted
- Check if your browser supports Web Speech API
- Try using Google Chrome (best support)

### Predictions Not Appearing

- Verify the extension is enabled in the popup
- Check browser console for errors
- Ensure you're on an HTTPS page (required for some features)

### API Errors

- Verify your OpenAI API key is valid
- Check your internet connection
- Ensure you have API credits available

## License

MIT License - feel free to modify and distribute!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with [Plasmo](https://plasmo.com) - The Browser Extension Framework
