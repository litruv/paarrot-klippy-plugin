/**
 * Klipy GIF Plugin - Floating Picker Overlay
 */

module.exports = {
  name: "Klipy GIF",
  version: "5.0.0",
  dependencies: {},
  
  onLoad: async (ctx) => {
    const API_KEY = 'Qn0Whvr0vXSySgxfQRr28Vnlv0hQVvMEfXL1hiBvCV7demCrrCdALvnI1aUU4QO4';
    const BASE_URL = 'https://api.klipy.com';
    
    let currentRoomId = null;
    let pickerContainer = null;
    
    ctx.settings.define({
      apiKey: {
        type: "string",
        label: "Klipy API Key",
        description: "Your Klipy API key from partner.klipy.com",
        default: API_KEY
      },
      limit: {
        type: "number",
        label: "Results Limit",
        description: "Number of GIFs to show in picker",
        default: 12
      },
      gifSize: {
        type: "select",
        label: "GIF Size",
        description: "Preferred GIF size to send",
        options: [
          { value: "gif", label: "Original (Large)" },
          { value: "mediumgif", label: "Medium (Balanced)" },
          { value: "tinygif", label: "Small (Fast)" }
        ],
        default: "mediumgif"
      }
    });
    
    function createPickerOverlay() {
      if (!pickerContainer) {
        pickerContainer = document.createElement('div');
        pickerContainer.id = 'klipy-gif-picker';
        pickerContainer.style.cssText = `
          position: fixed;
          bottom: 80px;
          right: 20px;
          width: 500px;
          max-height: 400px;
          background: #1e1e1e;
          border: 1px solid #444;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 9999;
          display: none;
          overflow: hidden;
        `;
        document.body.appendChild(pickerContainer);
      }
      return pickerContainer;
    }
    
    function showPicker(gifResults, query) {
      const container = createPickerOverlay();
      container.style.display = 'block';
      
      const html = `
        <div style="padding: 12px; background: #2a2a2a; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 600; color: #fff;">🎬 ${gifResults.length} GIFs for "${query}"</div>
          <button onclick="document.getElementById('klipy-gif-picker').style.display='none'" style="background: transparent; border: none; color: #aaa; cursor: pointer; font-size: 20px;">&times;</button>
        </div>
        <div style="padding: 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-height: 340px; overflow-y: auto;">
          ${gifResults.slice(0, 12).map((gif, index) => {
            const animatedUrl = gif.media_formats?.tinygif?.url || 
                              gif.media_formats?.nanogif?.url || 
                              gif.media_formats?.mediumgif?.url ||
                              gif.media_formats?.gif?.url;
            
            return `
              <div class="gif-item" data-gif-index="${index}" style="
                cursor: pointer;
                border: 2px solid transparent;
                border-radius: 4px;
                overflow: hidden;
                background: #333;
                transition: all 0.2s;
              " onmouseover="this.style.borderColor='#6366f1'; this.style.transform='scale(1.05)'" onmouseout="this.style.borderColor='transparent'; this.style.transform='scale(1)'">
                <img src="${animatedUrl}" alt="${gif.title}" style="width: 100%; height: 120px; object-fit: cover; display: block;" />
                <div style="padding: 4px; font-size: 10px; color: #aaa; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${gif.title}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      container.innerHTML = html;
      
      container.querySelectorAll('.gif-item').forEach((item, index) => {
        item.addEventListener('click', async () => {
          const gifData = gifResults[index];
          await sendGifToRoom(currentRoomId, gifData);
          container.style.display = 'none';
        });
      });
    }
    
    
    async function searchGifs(query) {
      try {
        const apiKey = ctx.settings.get('apiKey') || API_KEY;
        const limit = ctx.settings.get('limit') || 10;
        
        if (!query || query.trim() === '') {
          throw new Error('Search query cannot be empty');
        }
        
        const params = new URLSearchParams({
          key: apiKey,
          q: query.trim(),
          limit: limit.toString()
        });
        
        const url = `${BASE_URL}/v2/search?${params.toString()}`;
        
        ctx.log(`Searching Klipy: "${query}" - URL: ${url.replace(apiKey, 'API_KEY')}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          ctx.error(`Klipy API error ${response.status}:`, errorText);
          throw new Error(`Klipy API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        ctx.log(`Klipy response:`, data);
        
        if (!data.results || data.results.length === 0) {
          return null;
        }
        
        return data.results;
        
      } catch (error) {
        ctx.error('Klipy search error:', error);
        throw error;
      }
    }
    
    async function sendGifToRoom(roomId, gifData) {
      try {
        const sizePreference = ctx.settings.get('gifSize') || 'mediumgif';
        const formats = gifData.media_formats;
        
        let gifUrl = formats[sizePreference]?.url || formats.mediumgif?.url || formats.gif?.url || formats.tinygif?.url;
        let dims = formats[sizePreference]?.dims || formats.mediumgif?.dims || formats.gif?.dims || [498, 498];
        
        if (!gifUrl) {
          throw new Error('No valid GIF URL found');
        }
        
        if (!ctx.matrixClient) {
          ctx.error('Matrix client not available');
          throw new Error('Matrix client not initialized');
        }
        
        ctx.log(`Fetching GIF from: ${gifUrl}`);
        const gifResponse = await fetch(gifUrl);
        
        if (!gifResponse.ok) {
          throw new Error(`Failed to fetch GIF: ${gifResponse.status}`);
        }
        
        const gifBlob = await gifResponse.blob();
        ctx.log(`Uploading GIF to Matrix (${gifBlob.size} bytes)`);
        
        const uploadResponse = await ctx.matrixClient.uploadContent(gifBlob, {
          name: gifData.title || 'gif.gif',
          type: 'image/gif',
          onlyContentUri: false
        });
        
        const mxcUrl = uploadResponse.content_uri || uploadResponse;
        ctx.log(`Upload complete: ${mxcUrl}`);
        
        const content = {
          msgtype: 'm.image',
          body: gifData.title || 'GIF from Klipy',
          url: mxcUrl,
          info: {
            mimetype: 'image/gif',
            size: gifBlob.size,
            w: dims[0],
            h: dims[1]
          }
        };
        
        ctx.log(`Sending GIF to room ${roomId}`);
        await ctx.matrixClient.sendEvent(roomId, 'm.room.message', content);
        
        return true;
      } catch (error) {
        ctx.error('Error sending GIF:', error);
        ctx.error('Matrix client status:', ctx.matrixClient ? 'Available' : 'Unavailable');
        throw error;
      }
    }
    
    ctx.messages.onBeforeSend((msg) => {
      if (msg.roomId) {
        currentRoomId = msg.roomId;
      }
    });
    
    ctx.matrix.on("Room.timeline", (event) => {
      const room = event.getRoomId?.() || event.event?.room_id;
      if (room) {
        currentRoomId = room;
      }
    });
    
    ctx.commands.register({
      name: "gif",
      description: "Search GIFs - shows floating picker above textbox",
      args: ["query"],
      run: async ({ query, roomId }) => {
        if (!query) {
          return "Usage: /gif [search]\nExample: /gif happy cat";
        }
        
        try {
          const results = await searchGifs(query);
          
          if (!results) {
            return `No GIFs for "${query}"`;
          }
          
          if (!roomId) {
            roomId = currentRoomId;
            if (!roomId && ctx.matrixClient) {
              const rooms = ctx.matrixClient.getRooms();
              if (rooms && rooms.length > 0) {
                roomId = rooms[rooms.length - 1].roomId;
                currentRoomId = roomId;
              }
            }
            if (!roomId) {
              return "Cannot determine room. Send a message first.";
            }
          }
          
          currentRoomId = roomId;
          showPicker(results, query);
          
          return null;
          
        } catch (error) {
          ctx.error('GIF search error:', error);
          return `Error: ${error.message}`;
        }
      }
    });
    
    ctx.log('✅ Klipy GIF Plugin loaded - Floating picker mode');
    ctx.log('Command: /gif (floating picker)');
  },
  
  onUnload: async () => {
    const container = document.getElementById('klipy-gif-picker');
    if (container) {
      container.remove();
    }
  }
};
