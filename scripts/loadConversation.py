#!/usr/bin/env python3

"""
Load Conversation Utility

Usage: python scripts/loadConversation.py <input-file>

Input file format:
```
@user1 @user2

user1: message text
user2: reply text
user1 (Snap): [Photo description] caption text
user2: another message

-- 30 minutes later --

user1: message after time gap
```
"""

import os
import sys
import re
import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

# Supabase API headers
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def parse_time_gap(time_str: str) -> int:
    """Parse time expressions like '30 minutes later', '2 hours later', etc."""
    match = re.search(r'(\d+)\s*(second|minute|hour|day)s?\s*(?:later)?', time_str, re.IGNORECASE)
    if not match:
        return 0
    
    amount = int(match.group(1))
    unit = match.group(2).lower()
    
    multipliers = {
        'second': 1,
        'minute': 60,
        'hour': 3600,
        'day': 86400
    }
    
    return amount * multipliers.get(unit, 0)

def parse_conversation_file(content: str) -> Dict:
    """Parse a conversation file and return structured data."""
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    if not lines:
        raise ValueError("Empty file")
    
    # First line should contain @username1 @username2
    header_match = re.match(r'@(\w+)\s+@(\w+)', lines[0])
    if not header_match:
        raise ValueError("First line must contain two usernames like: @username1 @username2")
    
    username1, username2 = header_match.groups()
    messages = []
    current_time_offset = 0  # in seconds
    
    for i, line in enumerate(lines[1:], 1):
        # Check for time gap markers
        if line.startswith('--') and line.endswith('--'):
            time_gap = parse_time_gap(line)
            current_time_offset += time_gap
            continue
        
        # Parse message lines
        # Format: username: message text
        # or: username (Type): message text
        message_match = re.match(r'^(\w+)(?:\s*\(([^)]+)\))?\s*:\s*(.+)$', line)
        if message_match:
            sender, msg_type, content = message_match.groups()
            
            # Validate sender is one of our users
            if sender not in [username1, username2]:
                print(f"Warning: Unknown sender '{sender}' on line {i + 1}")
                continue
            
            recipient = username2 if sender == username1 else username1
            
            messages.append({
                'sender': sender,
                'recipient': recipient,
                'content': content,
                'type': msg_type.lower() if msg_type else 'text',
                'timeOffset': current_time_offset
            })
            
            # Add small time gaps between messages (30-90 seconds)
            import random
            current_time_offset += random.randint(30, 90)
    
    return {
        'username1': username1,
        'username2': username2,
        'messages': messages
    }

def get_user_ids(username1: str, username2: str) -> Dict[str, str]:
    """Get user IDs from usernames."""
    url = f"{SUPABASE_URL}/rest/v1/profiles"
    params = {
        'select': 'id,username',
        'username': f'in.({username1.lower()},{username2.lower()})'
    }
    
    response = requests.get(url, headers=HEADERS, params=params)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch users: {response.text}")
    
    data = response.json()
    if len(data) != 2:
        raise Exception(f"Could not find both users: {username1}, {username2}")
    
    user_map = {user['username']: user['id'] for user in data}
    return {
        username1.lower(): user_map.get(username1.lower()),
        username2.lower(): user_map.get(username2.lower())
    }

def get_room_id(user_id1: str, user_id2: str) -> str:
    """Generate room ID for direct messages."""
    return f"dm_{sorted([user_id1, user_id2])[0]}_{sorted([user_id1, user_id2])[1]}"

def clear_existing_messages(room_id: str) -> bool:
    """Clear existing messages in a room. Returns True if successful."""
    # Check if we're using service role key (it's longer than anon key)
    is_service_role = SUPABASE_KEY and len(SUPABASE_KEY) > 40 and not SUPABASE_KEY.startswith('eyJ')
    
    if not is_service_role:
        print("Using anon key - skipping message deletion to avoid permission errors")
        print("Note: This may create duplicate messages if conversation already exists")
        return False
    
    url = f"{SUPABASE_URL}/rest/v1/messages"
    params = {'room_id': f'eq.{room_id}'}
    
    response = requests.delete(url, headers=HEADERS, params=params)
    if response.status_code not in [200, 204]:
        print(f"Warning: Could not clear existing messages: {response.text}")
        print("Continuing with insertion (may create duplicates)...")
        return False
    return True

def insert_messages(messages: List[Dict]):
    """Insert messages in batches."""
    url = f"{SUPABASE_URL}/rest/v1/messages"
    batch_size = 50
    inserted = 0
    
    for i in range(0, len(messages), batch_size):
        batch = messages[i:i + batch_size]
        
        response = requests.post(url, headers=HEADERS, json=batch)
        if response.status_code not in [200, 201]:
            raise Exception(f"Failed to insert messages: {response.text}")
        
        inserted += len(batch)
        print(f"Inserted {inserted}/{len(messages)} messages...")

def load_conversation(file_path: str):
    """Main function to load a conversation from a file."""
    try:
        # Read and parse file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        parsed = parse_conversation_file(content)
        username1 = parsed['username1']
        username2 = parsed['username2']
        messages = parsed['messages']
        
        print(f"Loading conversation between @{username1} and @{username2}")
        print(f"Found {len(messages)} messages")
        
        # Get user IDs
        user_ids = get_user_ids(username1, username2)
        user_id1 = user_ids[username1.lower()]
        user_id2 = user_ids[username2.lower()]
        
        if not user_id1 or not user_id2:
            raise Exception("Could not find user IDs")
        
        # Generate room ID
        room_id = get_room_id(user_id1, user_id2)
        print(f"Room ID: {room_id}")
        
        # Clear existing messages
        print("Clearing existing messages...")
        clear_existing_messages(room_id)
        
        # Prepare messages for insertion
        now = datetime.now()
        messages_to_insert = []
        
        for msg in messages:
            sender_id = user_ids[msg['sender'].lower()]
            recipient_id = user_ids[msg['recipient'].lower()]
            created_at = now - timedelta(seconds=msg['timeOffset'])
            
            # Handle different message types
            msg_type = 'text'
            if msg['type'] in ['snap', 'photo', 'video']:
                # For now, we'll represent media as text descriptions
                msg_type = 'text'
            
            messages_to_insert.append({
                'room_id': room_id,
                'sender_id': sender_id,
                'recipient_id': recipient_id,
                'content': msg['content'],
                'type': msg_type,
                'created_at': created_at.isoformat()
            })
        
        # Insert messages
        insert_messages(messages_to_insert)
        
        print(f"✅ Successfully loaded {len(messages_to_insert)} messages!")
        print(f"\nConversation loaded between @{username1} and @{username2}")
        
    except Exception as e:
        print(f"Error loading conversation: {e}")
        sys.exit(1)

def show_help():
    """Show usage help."""
    print("""
Load Conversation Utility

Usage: python scripts/loadConversation.py <input-file>

Example input file (save as conversation.txt):

@alice @bob

alice: Hey! How's your day going?
bob: Pretty good! Just finished a big project
alice: Nice! Want to celebrate?
bob: Absolutely! What did you have in mind?

-- 20 minutes later --

alice: How about that new sushi place?
bob: Perfect! I've been wanting to try it
alice (Snap): [Photo of menu] The menu looks amazing!
bob: Wow, those rolls look incredible

-- 1 hour later --

alice: That was delicious!
bob: Best sushi I've had in ages
alice: We should do this more often
bob: Definitely! Same time next week?
alice: It's a date!

Special formats:
- Time gaps: -- X minutes/hours/days later --
- Media messages: username (Snap): [description] caption
- Or: username (Photo): [description]
- Or: username (Video): [description]
""")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        show_help()
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    load_conversation(file_path)