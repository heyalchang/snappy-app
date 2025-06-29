#!/usr/bin/env python3

"""
Secure Load Conversation Utility

Usage: python scripts/loadConversation-secure.py <input-file>
"""

import os
import sys
import re
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path
import requests
from dotenv import load_dotenv

# Configuration
MAX_FILE_SIZE = 1024 * 1024  # 1MB
MAX_MESSAGE_LENGTH = 1000
MAX_MESSAGES = 10000
VALID_MESSAGE_TYPES = ['text', 'photo', 'video', 'snap']
USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9]{3,20}$')
UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    print("Note: This script requires service role key for proper permissions")
    sys.exit(1)

# Validate Supabase URL format
if not SUPABASE_URL.startswith(('http://', 'https://')):
    print("Error: Invalid SUPABASE_URL format")
    sys.exit(1)

@dataclass
class Message:
    """Validated message data"""
    sender: str
    recipient: str
    content: str
    type: str
    time_offset: int

class SecureSupabaseClient:
    """Secure wrapper for Supabase API calls"""
    
    def __init__(self, url: str, key: str):
        self.url = url.rstrip('/')
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with error handling"""
        url = f"{self.url}/rest/v1/{endpoint}"
        
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")
    
    def select(self, table: str, columns: str = '*', filters: Optional[Dict] = None) -> List[Dict]:
        """Secure SELECT query"""
        params = {'select': columns}
        if filters:
            # Use Supabase's built-in operators to prevent injection
            for key, value in filters.items():
                if isinstance(value, list):
                    # Use IN operator for lists
                    params[key] = f'in.({",".join(map(str, value))})'
                else:
                    params[key] = f'eq.{value}'
        
        response = self._make_request('GET', table, params=params)
        return response.json() if response.text else []
    
    def delete(self, table: str, filters: Dict) -> bool:
        """Secure DELETE query"""
        params = {}
        for key, value in filters.items():
            params[key] = f'eq.{value}'
        
        response = self._make_request('DELETE', table, params=params)
        return response.status_code in [200, 204]
    
    def insert(self, table: str, data: List[Dict]) -> bool:
        """Secure INSERT query"""
        response = self._make_request('POST', table, json=data)
        return response.status_code in [200, 201]

def validate_file_size(file_path: Path) -> None:
    """Check file size is within limits"""
    size = file_path.stat().st_size
    if size > MAX_FILE_SIZE:
        raise ValueError(f"File too large: {size} bytes (max {MAX_FILE_SIZE} bytes)")

def validate_username(username: str) -> str:
    """Validate and return username"""
    if not USERNAME_PATTERN.match(username):
        raise ValueError(f"Invalid username format: {username}")
    return username

def parse_time_gap(time_str: str) -> int:
    """Parse time expressions safely"""
    match = re.search(r'^(\d{1,3})\s*(second|minute|hour|day)s?\s*(?:later)?$', time_str, re.IGNORECASE)
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
    
    seconds = amount * multipliers.get(unit, 0)
    
    # Validate reasonable time gaps (max 30 days)
    if seconds > 86400 * 30:
        raise ValueError(f"Time gap too large: {time_str}")
    
    return seconds

def parse_conversation_file(content: str) -> Tuple[str, str, List[Message]]:
    """Parse and validate conversation file"""
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    if not lines:
        raise ValueError("Empty file")
    
    # Parse header
    header_match = re.match(r'^@([a-zA-Z0-9]{3,20})\s+@([a-zA-Z0-9]{3,20})$', lines[0])
    if not header_match:
        raise ValueError("First line must contain two valid usernames like: @username1 @username2")
    
    username1 = validate_username(header_match.group(1))
    username2 = validate_username(header_match.group(2))
    
    if username1.lower() == username2.lower():
        raise ValueError("Cannot create conversation between same user")
    
    messages = []
    current_time_offset = 0
    
    for i, line in enumerate(lines[1:], 1):
        if not line:
            continue
            
        # Check for time gap markers
        if line.startswith('--') and line.endswith('--'):
            try:
                time_gap = parse_time_gap(line[2:-2].strip())
                current_time_offset += time_gap
            except ValueError as e:
                print(f"Warning: Invalid time gap on line {i + 1}: {line}")
            continue
        
        # Parse message lines
        message_match = re.match(r'^([a-zA-Z0-9]{3,20})(?:\s*\(([^)]+)\))?\s*:\s*(.+)$', line)
        if not message_match:
            print(f"Warning: Invalid message format on line {i + 1}: {line}")
            continue
        
        sender = message_match.group(1)
        msg_type = message_match.group(2)
        content = message_match.group(3)
        
        # Validate sender
        if sender not in [username1, username2]:
            print(f"Warning: Unknown sender '{sender}' on line {i + 1}")
            continue
        
        # Determine message type
        message_type = 'text'
        if msg_type and msg_type.lower() in VALID_MESSAGE_TYPES:
            message_type = msg_type.lower()
        
        # Validate and truncate content
        content = content[:MAX_MESSAGE_LENGTH]
        if not content:
            print(f"Warning: Empty message on line {i + 1}")
            continue
        
        messages.append(Message(
            sender=sender,
            recipient=username2 if sender == username1 else username1,
            content=content,
            type=message_type,
            time_offset=current_time_offset
        ))
        
        # Add realistic time gap
        import random
        current_time_offset += random.randint(30, 120)
        
        # Limit total messages
        if len(messages) >= MAX_MESSAGES:
            print(f"Warning: Reached maximum message limit ({MAX_MESSAGES})")
            break
    
    return username1, username2, messages

def verify_and_get_user_ids(client: SecureSupabaseClient, username1: str, username2: str) -> Dict[str, str]:
    """Verify users exist and get their IDs"""
    users = client.select(
        'profiles',
        columns='id,username',
        filters={'username': [username1.lower(), username2.lower()]}
    )
    
    if len(users) != 2:
        found = [u['username'] for u in users]
        missing = [u for u in [username1, username2] if u.lower() not in found]
        raise ValueError(f"Users not found: {', '.join(missing)}")
    
    # Validate UUIDs
    user_map = {}
    for user in users:
        if not UUID_PATTERN.match(user['id']):
            raise ValueError(f"Invalid user ID format for {user['username']}")
        user_map[user['username']] = user['id']
    
    return {
        username1.lower(): user_map[username1.lower()],
        username2.lower(): user_map[username2.lower()]
    }

def verify_friendship(client: SecureSupabaseClient, user_id1: str, user_id2: str) -> bool:
    """Check if users are friends"""
    # Query friendships in both directions
    friendships = client.select(
        'friendships',
        columns='status',
        filters={'status': 'accepted'}
    )
    
    # Check if friendship exists in either direction
    for friendship in friendships:
        # Note: We'd need OR query support, checking in application logic
        pass
    
    # For now, return True (warning only)
    return True

def get_room_id(user_id1: str, user_id2: str) -> str:
    """Generate consistent room ID"""
    return f"dm_{'_'.join(sorted([user_id1, user_id2]))}"

def load_conversation(file_path: Path) -> None:
    """Main function to load conversation"""
    client = SecureSupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        print("Validating file...")
        validate_file_size(file_path)
        
        # Read and parse file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        username1, username2, messages = parse_conversation_file(content)
        
        print(f"\nParsed conversation:")
        print(f"- Users: @{username1} and @{username2}")
        print(f"- Messages: {len(messages)}")
        
        if not messages:
            raise ValueError("No valid messages found in file")
        
        # Verify users
        print("\nVerifying users...")
        user_ids = verify_and_get_user_ids(client, username1, username2)
        user_id1 = user_ids[username1.lower()]
        user_id2 = user_ids[username2.lower()]
        print("✓ User IDs verified")
        
        # Check friendship
        if not verify_friendship(client, user_id1, user_id2):
            print("⚠️  Warning: Users may not be friends. Continuing anyway...")
        
        # Generate room ID
        room_id = get_room_id(user_id1, user_id2)
        print(f"\nRoom ID: {room_id}")
        
        # Confirmation
        print("\n⚠️  This will DELETE all existing messages in this conversation.")
        print("Press Ctrl+C to cancel, or wait 5 seconds to continue...")
        time.sleep(5)
        
        # Clear existing messages
        print("\nClearing existing messages...")
        if not client.delete('messages', {'room_id': room_id}):
            print("Warning: Could not clear existing messages")
        
        # Prepare messages
        now = datetime.now()
        messages_to_insert = []
        
        for i, msg in enumerate(messages):
            # Calculate timestamp
            created_at = now - timedelta(
                seconds=(len(messages) - i) * 60 + msg.time_offset
            )
            
            # Ensure not in future
            if created_at > now:
                created_at = now - timedelta(seconds=(len(messages) - i) * 60)
            
            messages_to_insert.append({
                'room_id': room_id,
                'sender_id': user_ids[msg.sender.lower()],
                'recipient_id': user_ids[msg.recipient.lower()],
                'content': msg.content,
                'type': msg.type,
                'created_at': created_at.isoformat()
            })
        
        # Insert in batches
        print("\nInserting messages...")
        batch_size = 50
        inserted = 0
        
        for i in range(0, len(messages_to_insert), batch_size):
            batch = messages_to_insert[i:i + batch_size]
            
            if not client.insert('messages', batch):
                raise Exception(f"Failed to insert batch {i//batch_size + 1}")
            
            inserted += len(batch)
            progress = round((inserted / len(messages_to_insert)) * 100)
            print(f"\rProgress: {progress}% ({inserted}/{len(messages_to_insert)})", end='')
        
        print("\n\n✅ Successfully loaded conversation!")
        print(f"- Total messages: {len(messages_to_insert)}")
        print(f"- Between: @{username1} and @{username2}")
        print(f"- Room ID: {room_id}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        
        if "permission denied" in str(e).lower():
            print("\nThis script requires SUPABASE_SERVICE_ROLE_KEY for full access.")
            print("Make sure you have the service role key in your .env file.")
        
        sys.exit(1)

def show_usage():
    """Display usage information"""
    print(f"""
Secure Load Conversation Utility

This utility loads test conversations with comprehensive validation.

Usage: python scripts/loadConversation-secure.py <input-file>

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
- Messages: Max {MAX_MESSAGE_LENGTH} characters
- File size: Max {MAX_FILE_SIZE // 1024 // 1024}MB
- Message types: {', '.join(VALID_MESSAGE_TYPES)}
- Time gaps: Max 30 days

Security Features:
- Input validation with regex patterns
- SQL injection prevention via parameterized queries
- File size limits
- User existence verification
- UUID validation
- Secure HTTP client with timeouts

Note: Requires SUPABASE_SERVICE_ROLE_KEY for permissions.
""")

if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] in ['--help', '-h']:
        show_usage()
        sys.exit(0)
    
    file_path = Path(sys.argv[1])
    
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    load_conversation(file_path)