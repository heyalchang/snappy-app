# AI Model Reference

This document lists all available AI models used in the SnapClone project.

## Image Generation Models (Google Imagen)

- `imagen-3.0-generate-002` (default) - Cost-effective Imagen 3.0
- `imagen-4.0-generate-preview-06-06` - Higher quality Imagen 4.0
- `imagen-4.0-ultra-generate-preview-06-06` - Premium Imagen 4.0 Ultra

## Text Generation Models (OpenAI)

- `gpt-4.1` - Latest GPT-4.1
- `gpt-4.1-mini` (default) - Faster, cost-effective GPT-4.1
- `gpt-4.1-nano` - Lightweight GPT-4.1
- `o3` - Advanced reasoning model
- `o3-mini` - Compact reasoning model

## Current Defaults

- **Image Generation**: `imagen-3.0-generate-002` (for cost-effective testing)
- **Text Generation**: `gpt-4o-mini` (set in all edge functions)

## Edge Functions and Their Models

### Active Edge Functions
1. **generate-chat-response**: Uses `gpt-4o-mini` for AI persona chat responses
2. **vibe-check**: Uses `gpt-4o-mini` for social dynamics analysis
3. **generate-reply-options**: Uses `gpt-4o-mini` for reply suggestions
4. **generate-story-post**: Uses `gpt-4o-mini` for Instagram story prompts
5. **generate_magic_snap**: Uses `imagen-3.0-generate-002` for image generation

## Usage Notes

- These model names can be used in API requests to specify which model to use
- All text generation edge functions currently use `gpt-4o-mini` for consistency
- Image generation defaults to `imagen-3.0-generate-002` for cost efficiency
- Model selection can be updated in the edge function code as needed

## Cost Considerations

- `gpt-4o-mini` is the most cost-effective text model
- `imagen-3.0-generate-002` is the most cost-effective image model
- Premium models (GPT-4.1, Imagen 4.0 Ultra) provide higher quality but at increased cost

Last updated: 2025-06-29