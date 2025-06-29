> **Product Overview**
> *Reply Suggestions* (internally "The Long Game") gives users three ready-to-send replies aligned with their conversational goal (confident, compatibility-seeking, or casual). Tapping ✨ surfaces a bottom sheet with the options, reducing typing friction and keeping the chat’s momentum.

# ✨ Reply Suggestions – "The Long Game"

## 1 — Purpose
Provide the user with three concise, context-aware reply options that align with
their conversational *strategy* (goal). Suggestions are delivered when the user
taps the ✨ icon next to the send button.

## 2 — Strategies (v0.1 hard-coded)
| Enum                             | Chat Behaviour (index 0 suggestion)              |
|----------------------------------|-------------------------------------------------|
| STRATEGY_PROJECT_CONFIDENCE      | Confident, playful, leading                     |
| STRATEGY_ASSESS_COMPATIBILITY    | Deeper questions, seeks shared values           |
| STRATEGY_KEEP_CASUAL             | Light-hearted, logistical, no pressure          |

Index 1 is always Neutral / Flirty, index 2 is Practical / Low-effort.

## 3 — User Flow
1. User taps ✨ inside the input bar.
2. Bottom sheet appears:
   * ActivityIndicator + *Crafting replies…* while loading.
   * After response, shows three buttons:
     ```
     Project confidence
     I've got more tasty spots 💪
     Neutral / flirty
     Haha told you 😄
     Practical / low-effort
     Nice, glad you liked it
     ```
   * Tap a button → text is inserted into the draft; sheet closes.
   * Tap outside / Cancel → sheet closes and preserves any existing draft.

## 4 — Client → Edge Function Payload
```jsonc
{
  "strategy"       : "STRATEGY_PROJECT_CONFIDENCE",  // primary
  "strategy_pool"  : [
    "STRATEGY_PROJECT_CONFIDENCE",
    "STRATEGY_ASSESS_COMPATIBILITY",
    "STRATEGY_KEEP_CASUAL"
  ],
  "draft_text"     : "current draft here",
  "conversation_history": [
    { "sender": "ME", "text": "Cool cool" },
    { "sender": "FRIEND", "text": "Nothing beats a good laugh 😂" }
  ],
  "self_profile":   { "username": "me",   "age": 22, "persona": "..." },
  "friend_profile": { "username": "them", "age": 23, "persona": "..." }
}
```

## 5 — Edge Function `generate-reply-options`
* Validates payload; if `strategy_pool` missing, falls back to full list.
* **System prompt** (excerpt):
  ```
  Return ONLY valid JSON {"suggestions":[…]} —
  length exactly 3, each ≤ 10 words, no instructions.
  Index 0 must fulfil strategy «STRATEGY_PROJECT_CONFIDENCE».
  Index 1 neutral/flirty, index 2 practical/low-effort.
  ```
* Uses `gpt-4.1-mini`, temperature 0.7, max tokens 120.
* Sanitises assistant reply; if JSON invalid → returns 500.

### Response
```json
{
  "suggestions": [
    "I've got a few more spots.",
    "Haha told you 😄",
    "Nice, glad you liked it."
  ]
}
```

## 6 — UI Components
* **SparkleButton** – part of ChatScreen input bar.
* **SuggestionsSheet** – `react-native-modal` bottom sheet with:
  * Title: *Suggested replies*
  * Small left-aligned label for each suggestion type.
  * Cancel row at bottom.

<h2> 7 — Error Handling
* Network / OpenAI failure → sheet shows *No suggestions right now*.
* Suggestions > 10 words are truncated client-side (log warning).

## 8 — Performance Notes
* Suggestions fetched **on demand**; not pre-loaded to save tokens.
* Debounce multiple taps (disabled while loading).

## 9 — Future Work
* Add per-contact strategy selector UI.
* Pop-over variant (feature-flag `replySuggestions.usePopover`).
* Rate-limit heavy users to manage token costs.