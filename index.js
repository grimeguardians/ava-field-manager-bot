const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Fixed webhook URL
const N8N_WEBHOOK_URL = 'https://grimeguardians.app.n8n.cloud/webhook/job-status-updates';

client.once('ready', () => {
  console.log(`✅ Ava is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const content = message.content;
  const channelName = message.channel.name;
  
  console.log(`📝 Message received in #${channelName}: "${content}"`); // Debug log
  
  // Only process messages in job-check-ins channel
  if (channelName !== 'job-check-ins') return;
  
  console.log(`✅ Processing message in job-check-ins channel`); // Debug log
  
  // Helper function to send data to n8n (using https module instead of fetch)
  async function sendToN8N(messageData) {
    try {
      const https = require('https');
      const url = require('url');
      
      const parsedUrl = url.parse(N8N_WEBHOOK_URL);
      const postData = JSON.stringify(messageData);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = https.request(options, (res) => {
        console.log(`✅ n8n responded with status: ${res.statusCode}`);
      });
      
      req.on('error', (error) => {
        console.error('❌ Error sending to n8n:', error);
      });
      
      req.write(postData);
      req.end();
      
    } catch (error) {
      console.error('❌ Error in sendToN8N:', error);
    }
  }
  
  // Check for ARRIVED emoji (🚗)
  if (content.includes('🚗')) {
    console.log(`🛬 ${message.author.username} has ARRIVED at job`);
    
    try {
      await message.channel.send(`✅ Got it, ${message.author.username} — you're checked in! 🚗`);
      
      // Send to n8n webhook
      await sendToN8N({
        username: message.author.username,
        message: content,
        timestamp: message.createdAt.toISOString(),
        channel: channelName,
        action: 'arrived'
      });
      
    } catch (err) {
      console.error('❌ Failed to send ARRIVED message:', err);
    }
  }
  
  // Check for FINISHED emoji (🏁)
  if (content.includes('🏁')) {
    console.log(`✅ ${message.author.username} has FINISHED the job`);
    
    try {
      await message.channel.send(`🎉 Great work, ${message.author.username}! Job marked as finished. 🏁`);
      
      // Send to n8n webhook
      await sendToN8N({
        username: message.author.username,
        message: content,
        timestamp: message.createdAt.toISOString(),
        channel: channelName,
        action: 'finished'
      });
      
    } catch (err) {
      console.error('❌ Failed to send FINISHED message:', err);
    }
  }
});

// Add error handling
client.on('error', (error) => {
  console.error('❌ Discord client error:', error);
});

client.login(process.env.DISCORD_BOT_TOKEN);
