# Klipy GIF Plugin

**Interactive UI GIF Picker** - Search and select GIFs from clickable grid.

## Features

- 🎯 **UI Picker** - Clickable GIF grid rendered inline
- 🔍 **Search GIFs** - Find GIFs by keyword
- 🖼️ **Preview Thumbnails** - See GIFs before sending
- 🎲 **Random GIFs** - Get trending random GIFs
- ⚙️ **Configurable** - Customize API key, result limits, GIF size
- ⚡ **Fast** - Klipy v2 API
- 🖼️ **Proper Matrix Messages** - Sends as image, not URL

## Commands

### `/gif [search]`
Shows interactive UI picker with clickable GIF grid.

**Examples:**
- `/gif dancing cat` → shows UI grid with cat GIFs
- `/gif celebration` → shows UI grid with celebration GIFs

**Click any GIF to send it immediately!**

### `/pick [number]`
Fallback: Send GIF by number if UI unavailable.

**Examples:**
- `/pick 1` → send first GIF from last search
- `/pick 3` → send third GIF

### `/giphy [search]`
Instant send (no picker). Sends first result immediately.

**Example:**
- `/giphy thumbs up` → instant send

### `/randomgif`
Random trending GIF.

## How It Works

### UI Picker Mode (Default)

```
You: /gif happy

Bot: [Renders clickable grid with 12 GIF thumbnails]
     🎬 237 GIFs for "happy" - Click to send
     [GIF1] [GIF2] [GIF3]
     [GIF4] [GIF5] [GIF6]
     ...

You: [Click GIF #2]

Bot: ✅ GIF sent!
```

The picker:
- Shows 12 GIF thumbnails in grid
- Hover effect highlights GIFs
- Click sends immediately
- Renders inline in chat as custom message

### Fallback Mode

If UI unavailable (old client, disabled React):
- `/gif` returns text list with numbers
- Use `/pick [number]` to select

## Technical Details

Uses `ctx.ui.registerRenderer` with React to render custom message type `m.klipy.picker`.

Grid features:
- Responsive grid layout
- Thumbnail previews (nano/tiny size)
- Hover animations
- Click handlers
- Auto-upload + send on click

## Settings

- **Klipy API Key** - API key from [partner.klipy.com](https://partner.klipy.com)
- **Results Limit** - How many GIFs to search (1-50, default: 10)
- **GIF Size** - Original/Medium/Small (for final send)

## Setup

1. Get API key from [Klipy Partner Panel](https://partner.klipy.com)
2. Install plugin in Paarrot plugins folder
3. Reload/restart Paarrot
4. Use `/gif [search]` and click a GIF

## Requirements

- Paarrot with React + UI API support
- Matrix client access

## API Version

Uses **Klipy API v2** (`/v2/search`).

## Attribution

Powered by [Klipy API](https://klipy.com).

## License

MIT
