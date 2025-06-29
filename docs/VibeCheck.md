> **Product Overview**
> *Vibe Check* lets users get a quick, private read on the *sub-text* of any message during early-stage dating conversations. By long-pressing a friend’s bubble, the user sees a 3-second sticky-note that summarises tone, intent and key phrase—helping them decide how to respond without cluttering the chat.

# ✨ Vibe Check – Sub-text analyser

## Purpose
Long-press any chat message to get a quick AI-generated read on its *vibe* – tone + likely meaning – shown as an ephemeral sticky-note. No data is stored; everything happens in memory.

## User flow
1. User long-presses a bubble.
2. Reaction bar pops up; far-right icon is ✨ "Vibe Check".
3. Tap ✨ → client sends last 10 messages + pressed message + basic profile data to the `vibe-check` edge function.
4. AI returns JSON `{tone, inferred_meaning, key_phrase}`.
5. Overlay floats above the bubble for ~12 s or until dismissed.

## Payload sent
```json
{
  "focalMessage": {"id":17,"sender":"ME","text":"we can even do earlier..."},
  "history":[{"sender":"FRIEND","text":"cool, 7:30 then?"}, ...],
  "senderProfile":{"username":"alice","age":22,"persona":"..."},
  "recipientProfile":{"username":"bob","age":23,"persona":"..."}
}
```

## Edge function contract
Returns **only**:

```json
{
  "tone": "Accommodating & Interested",
  "inferred_meaning": "This person is flexible because they want to see you.",
  "key_phrase": "we can even do"
}
```

## 🛠️ Implementation Details
### Trigger
Long-press on a *friend’s* chat bubble fires an immediate client call to the edge
function—no intermediate menu. The overlay auto-dismisses after 3 s.

### Client Payload
```json
{
  "focalMessage": { "id": 123, "sender": "FRIEND", "text": "Sure, 7 works!" },
  "history": [
    { "sender": "ME",     "text": "See you at 7?" },
    { "sender": "FRIEND", "text": "Sure, 7 works!" }
  ],
  "senderProfile":   { "username": "me",   "age": 22, "persona": "..." },
  "recipientProfile":{ "username": "them", "age": 23, "persona": "..." }
}
```

### Edge Function
Name: `vibe-check`
1. Builds an LLM prompt that includes the conversation history and focal message.
2. Uses `gpt-4.1-mini` with temperature 0.7.
3. Sanitises the assistant reply, guaranteeing **strict JSON**:

```json
{ "tone": "Casual & Flirty",
  "inferred_meaning": "They are flexible because they want to see you.",
  "key_phrase": "we can even do" }
```

### Overlay Rendering
Positioning algorithm:
* Prefer 40 px **above** the finger.
* If not enough room, render below while staying inside safe areas.
* Sticky-note style: rgba(0,0,0,0.85) background, light `#666` border, quoted
  text in italics, larger font for tone/meaning.

### Error & Edge-cases
* If the user lifts their finger before the response returns, the overlay still
  appears (3 s) then fades—avoids "ghost" cancellations.
* Any parsing error → toast "Vibe Check unavailable".

## Privacy
• No writes to DB
• Not cached server-side
• Users may call unlimited times; Supabase rate-limits still apply.