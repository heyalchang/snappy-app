#!/usr/bin/env node

/**
 * Load Conversation Utility
 * 
 * Usage: node scripts/loadConversation.js <input-file>
 * 
 * Input file format:
 * ```
 * @user1 @user2
 * 
 * user1: message text
 * user2: reply text
 * user1 (Snap): [Photo description] caption text
 * user2: another message
 * 
 * -- 30 minutes later --
 * 
 * user1: message after time gap
 * ```
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse time expressions like "30 minutes later", "2 hours later", etc.
function parseTimeGap(timeStr) {
  const match = timeStr.match(/(\d+)\s*(second|minute|hour|day)s?\s*(?:later)?/i);
  if (!match) return 0;
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  const multipliers = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400
  };
  
  return amount * multipliers[unit];
}

// Parse a conversation file
function parseConversationFile(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) {
    throw new Error('Empty file');
  }
  
  // First line should contain @username1 @username2
  const headerMatch = lines[0].match(/@(\w+)\s+@(\w+)/);
  if (!headerMatch) {
    throw new Error('First line must contain two usernames like: @username1 @username2');
  }
  
  const [, username1, username2] = headerMatch;
  const messages = [];
  let currentTimeOffset = 0; // in seconds
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for time gap markers
    if (line.startsWith('--') && line.endsWith('--')) {
      const timeGap = parseTimeGap(line);
      currentTimeOffset += timeGap;
      continue;
    }
    
    // Parse message lines
    // Format: username: message text
    // or: username (Type): message text
    const messageMatch = line.match(/^(\w+)(?:\s*\(([^)]+)\))?\s*:\s*(.+)$/);
    if (messageMatch) {
      const [, sender, type, content] = messageMatch;
      
      // Validate sender is one of our users
      if (sender !== username1 && sender !== username2) {
        console.warn(`Warning: Unknown sender "${sender}" on line ${i + 1}`);
        continue;
      }
      
      messages.push({
        sender,
        recipient: sender === username1 ? username2 : username1,
        content,
        type: type ? type.toLowerCase() : 'text',
        timeOffset: currentTimeOffset
      });
      
      // Add small time gaps between messages (30-90 seconds)
      currentTimeOffset += 30 + Math.random() * 60;
    }
  }
  
  return { username1, username2, messages };
}

// Get user IDs from usernames
async function getUserIds(username1, username2) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', [username1.toLowerCase(), username2.toLowerCase()]);
  
  if (error) {
    throw error;
  }
  
  if (!data || data.length !== 2) {
    throw new Error(`Could not find both users: ${username1}, ${username2}`);
  }
  
  const userMap = {};
  data.forEach(user => {
    userMap[user.username] = user.id;
  });
  
  return {
    [username1.toLowerCase()]: userMap[username1.toLowerCase()],
    [username2.toLowerCase()]: userMap[username2.toLowerCase()]
  };
}

// Generate room ID for direct messages
function getRoomId(userId1, userId2) {
  return `dm_${[userId1, userId2].sort().join('_')}`;
}

// Load conversation into database
async function loadConversation(filePath) {
  try {
    // Read and parse file
    const content = fs.readFileSync(filePath, 'utf8');
    const { username1, username2, messages } = parseConversationFile(content);
    
    console.log(`Loading conversation between @${username1} and @${username2}`);
    console.log(`Found ${messages.length} messages`);
    
    // Get user IDs
    const userIds = await getUserIds(username1, username2);
    const userId1 = userIds[username1.toLowerCase()];
    const userId2 = userIds[username2.toLowerCase()];
    
    if (!userId1 || !userId2) {
      throw new Error('Could not find user IDs');
    }
    
    // Generate room ID
    const roomId = getRoomId(userId1, userId2);
    console.log(`Room ID: ${roomId}`);
    
    // Clear existing messages in this room (optional)
    // Note: This requires either service role key or DELETE RLS policy
    if (supabaseServiceKey && supabaseServiceKey !== process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Clearing existing messages...');
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomId);
      
      if (deleteError) {
        console.warn('Warning: Could not clear existing messages:', deleteError.message);
        console.warn('Continuing with insertion (may create duplicates)...');
      }
    } else {
      console.log('Using anon key - skipping message deletion to avoid permission errors');
      console.log('Note: This may create duplicate messages if conversation already exists');
    }
    
    // Prepare messages for insertion
    const now = new Date();
    const messagesToInsert = messages.map(msg => {
      const senderId = userIds[msg.sender.toLowerCase()];
      const recipientId = userIds[msg.recipient.toLowerCase()];
      const createdAt = new Date(now.getTime() - (msg.timeOffset * 1000));
      
      return {
        room_id: roomId,
        sender_id: senderId,
        recipient_id: recipientId,
        content: msg.content,
        type: msg.type === 'snap' || msg.type === 'photo' || msg.type === 'video' ? 'text' : msg.type,
        created_at: createdAt.toISOString()
      };
    });
    
    // Insert messages in batches of 50
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < messagesToInsert.length; i += batchSize) {
      const batch = messagesToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('messages')
        .insert(batch);
      
      if (insertError) {
        throw insertError;
      }
      
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${messagesToInsert.length} messages...`);
    }
    
    console.log(`✅ Successfully loaded ${messagesToInsert.length} messages!`);
    console.log(`\nConversation loaded between @${username1} and @${username2}`);
    
  } catch (error) {
    console.error('Error loading conversation:', error.message);
    process.exit(1);
  }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.log(`
Usage: node scripts/loadConversation.js <input-file>

Example input file format:

@username1 @username2

username1: Hey, how's it going?
username2: Pretty good! Just working on some code.
username1 (Snap): [Photo of coffee] Need caffeine!
username2: Haha I feel that

-- 30 minutes later --

username1: Want to grab lunch?
username2: Sure! Where were you thinking?
`);
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

// Load the conversation
loadConversation(filePath);