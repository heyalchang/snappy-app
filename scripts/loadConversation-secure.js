#!/usr/bin/env node

/**
 * Secure Load Conversation Utility
 * 
 * Usage: node scripts/loadConversation-secure.js <input-file>
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { z } = require('zod');

// Load environment variables
require('dotenv').config();

// Configuration
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES = 10000;
const VALID_MESSAGE_TYPES = ['text', 'photo', 'video', 'snap'];

// Validation schemas
const UsernameSchema = z.string().regex(/^[a-zA-Z0-9]{3,20}$/, 'Username must be 3-20 alphanumeric characters');
const MessageTypeSchema = z.enum(['text', 'snap', 'photo', 'video']);
const MessageContentSchema = z.string().min(1).max(MAX_MESSAGE_LENGTH);

const MessageSchema = z.object({
  sender: UsernameSchema,
  recipient: UsernameSchema,
  content: MessageContentSchema,
  type: MessageTypeSchema,
  timeOffset: z.number().min(0).max(86400 * 30) // Max 30 days
});

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Note: This script requires service role key for proper permissions');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Validate file size
function validateFileSize(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${stats.size} bytes (max ${MAX_FILE_SIZE} bytes)`);
  }
}

// Parse time expressions safely
function parseTimeGap(timeStr) {
  const match = timeStr.match(/^(\d{1,3})\s*(second|minute|hour|day)s?\s*(?:later)?$/i);
  if (!match) return 0;
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  const multipliers = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400
  };
  
  const seconds = amount * multipliers[unit];
  
  // Validate reasonable time gaps
  if (seconds > 86400 * 30) { // 30 days max
    throw new Error(`Time gap too large: ${timeStr}`);
  }
  
  return seconds;
}

// Parse and validate conversation file
async function parseConversationFile(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) {
    throw new Error('Empty file');
  }
  
  // Parse header
  const headerMatch = lines[0].match(/^@([a-zA-Z0-9]{3,20})\s+@([a-zA-Z0-9]{3,20})$/);
  if (!headerMatch) {
    throw new Error('First line must contain two valid usernames like: @username1 @username2');
  }
  
  const [, username1, username2] = headerMatch;
  
  // Validate usernames are different
  if (username1.toLowerCase() === username2.toLowerCase()) {
    throw new Error('Cannot create conversation between same user');
  }
  
  const messages = [];
  let currentTimeOffset = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line) continue;
    
    // Check for time gap markers
    if (line.startsWith('--') && line.endsWith('--')) {
      try {
        const timeGap = parseTimeGap(line.slice(2, -2).trim());
        currentTimeOffset += timeGap;
      } catch (error) {
        console.warn(`Warning: Invalid time gap on line ${i + 1}: ${line}`);
      }
      continue;
    }
    
    // Parse message lines
    const messageMatch = line.match(/^([a-zA-Z0-9]{3,20})(?:\s*\(([^)]+)\))?\s*:\s*(.+)$/);
    if (!messageMatch) {
      console.warn(`Warning: Invalid message format on line ${i + 1}: ${line}`);
      continue;
    }
    
    const [, sender, type, content] = messageMatch;
    
    // Validate sender
    if (sender !== username1 && sender !== username2) {
      console.warn(`Warning: Unknown sender "${sender}" on line ${i + 1}`);
      continue;
    }
    
    // Determine message type
    let messageType = 'text';
    if (type) {
      const normalizedType = type.toLowerCase();
      if (VALID_MESSAGE_TYPES.includes(normalizedType)) {
        messageType = normalizedType;
      }
    }
    
    try {
      const validatedMessage = MessageSchema.parse({
        sender,
        recipient: sender === username1 ? username2 : username1,
        content: content.substring(0, MAX_MESSAGE_LENGTH), // Truncate if needed
        type: messageType,
        timeOffset: currentTimeOffset
      });
      
      messages.push(validatedMessage);
      
      // Add realistic time gap (30-120 seconds)
      currentTimeOffset += 30 + Math.floor(Math.random() * 90);
      
    } catch (error) {
      console.warn(`Warning: Invalid message on line ${i + 1}:`, error.message);
    }
    
    // Limit total messages
    if (messages.length >= MAX_MESSAGES) {
      console.warn(`Warning: Reached maximum message limit (${MAX_MESSAGES})`);
      break;
    }
  }
  
  return { username1, username2, messages };
}

// Verify users exist and get their IDs
async function verifyAndGetUserIds(username1, username2) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', [username1.toLowerCase(), username2.toLowerCase()]);
  
  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  
  if (!data || data.length !== 2) {
    const found = data ? data.map(u => u.username) : [];
    const missing = [username1, username2].filter(u => 
      !found.includes(u.toLowerCase())
    );
    throw new Error(`Users not found: ${missing.join(', ')}`);
  }
  
  // Validate UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const user of data) {
    if (!uuidRegex.test(user.id)) {
      throw new Error(`Invalid user ID format for ${user.username}`);
    }
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

// Check if users are friends
async function verifyFriendship(userId1, userId2) {
  const { data, error } = await supabase
    .from('friendships')
    .select('status')
    .or(`and(user_id.eq.${userId1},friend_id.eq.${userId2}),and(user_id.eq.${userId2},friend_id.eq.${userId1})`)
    .eq('status', 'accepted')
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    throw new Error(`Error checking friendship: ${error.message}`);
  }
  
  return !!data;
}

// Generate room ID
function getRoomId(userId1, userId2) {
  return `dm_${[userId1, userId2].sort().join('_')}`;
}

// Main load function
async function loadConversation(filePath) {
  let success = false;
  
  try {
    console.log('Validating file...');
    validateFileSize(filePath);
    
    // Read and parse file
    const content = fs.readFileSync(filePath, 'utf8');
    const { username1, username2, messages } = await parseConversationFile(content);
    
    console.log(`\nParsed conversation:`);
    console.log(`- Users: @${username1} and @${username2}`);
    console.log(`- Messages: ${messages.length}`);
    
    if (messages.length === 0) {
      throw new Error('No valid messages found in file');
    }
    
    // Verify users exist
    console.log('\nVerifying users...');
    const userIds = await verifyAndGetUserIds(username1, username2);
    const userId1 = userIds[username1.toLowerCase()];
    const userId2 = userIds[username2.toLowerCase()];
    
    console.log(`✓ User IDs verified`);
    
    // Check friendship (warning only)
    const areFriends = await verifyFriendship(userId1, userId2);
    if (!areFriends) {
      console.warn('⚠️  Warning: Users are not friends. Messages will be created anyway.');
    }
    
    // Generate room ID
    const roomId = getRoomId(userId1, userId2);
    console.log(`\nRoom ID: ${roomId}`);
    
    // Ask for confirmation before deleting
    console.log('\n⚠️  This will DELETE all existing messages in this conversation.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Start transaction-like operation
    console.log('\nClearing existing messages...');
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('room_id', roomId);
    
    if (deleteError) {
      throw new Error(`Failed to clear messages: ${deleteError.message}`);
    }
    
    // Prepare messages with proper timestamps
    const now = new Date();
    const messagesToInsert = messages.map((msg, index) => {
      const createdAt = new Date(now.getTime() - ((messages.length - index) * 60000) - (msg.timeOffset * 1000));
      
      // Ensure timestamp is not in future
      if (createdAt > now) {
        createdAt.setTime(now.getTime() - ((messages.length - index) * 60000));
      }
      
      return {
        room_id: roomId,
        sender_id: userIds[msg.sender.toLowerCase()],
        recipient_id: userIds[msg.recipient.toLowerCase()],
        content: msg.content,
        type: msg.type,
        created_at: createdAt.toISOString()
      };
    });
    
    // Insert in batches with progress
    console.log('\nInserting messages...');
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < messagesToInsert.length; i += batchSize) {
      const batch = messagesToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('messages')
        .insert(batch);
      
      if (insertError) {
        throw new Error(`Failed to insert batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
      }
      
      inserted += batch.length;
      const progress = Math.round((inserted / messagesToInsert.length) * 100);
      process.stdout.write(`\rProgress: ${progress}% (${inserted}/${messagesToInsert.length})`);
    }
    
    console.log('\n\n✅ Successfully loaded conversation!');
    console.log(`- Total messages: ${messagesToInsert.length}`);
    console.log(`- Between: @${username1} and @${username2}`);
    console.log(`- Room ID: ${roomId}`);
    
    success = true;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.error('\nThis script requires SUPABASE_SERVICE_ROLE_KEY for full access.');
      console.error('Make sure you have the service role key in your .env file.');
    }
    
    process.exit(1);
  }
}

// Show usage
function showUsage() {
  console.log(`
Secure Load Conversation Utility

This utility loads test conversations into the database with proper validation.

Usage: node scripts/loadConversation-secure.js <input-file>

Input File Format:
------------------
@alice @bob

alice: Hey! How's it going?
bob: Great! Just finished my project
alice (snap): [Celebrating] We did it!
bob: Awesome work!

-- 30 minutes later --

alice: Want to grab coffee?
bob: Sure, see you in 10!

Validation Rules:
- Usernames: 3-20 alphanumeric characters only
- Messages: Max ${MAX_MESSAGE_LENGTH} characters
- File size: Max ${MAX_FILE_SIZE / 1024 / 1024}MB
- Message types: text, snap, photo, video
- Time gaps: Max 30 days

Security Features:
- Input validation with Zod schemas
- SQL injection prevention
- File size limits
- User existence verification
- UUID validation
- Proper error handling

Note: Requires SUPABASE_SERVICE_ROLE_KEY for permissions.
`);
}

// Main
const filePath = process.argv[2];

if (!filePath || filePath === '--help' || filePath === '-h') {
  showUsage();
  process.exit(0);
}

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

// Check for required dependencies
try {
  require('zod');
} catch (error) {
  console.error('Error: Missing required dependency "zod"');
  console.error('Run: npm install zod');
  process.exit(1);
}

loadConversation(filePath);