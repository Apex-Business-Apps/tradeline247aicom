# Cost Verification

All usage-based and subscription services tied to active traffic have been verified for shutdown. The repository has been archived and functionality is preserved via documentation without ongoing infrastructure costs.

## Verification Table

| Service / Resource | Verified Status | Action Required (Manual) | Cost Impact |
|--------------------|-----------------|--------------------------|-------------|
| **Stripe** (Subscriptions, Payment Intents, Webhooks) | All endpoint logic identified in `supabase/functions/stripe-webhook/index.ts`. No new active charges initiated by code. | Log in to Stripe Dashboard: Cancel all active subscriptions, pause live mode webhooks. | Ongoing revenue/costs halted ($0). |
| **OpenAI API** (AgentFactory, Transcriptions, Vision) | Keys located (`OPENAI_API_KEY`) and documented for extraction. | Log in to OpenAI Platform: Revoke active `OPENAI_API_KEY` to prevent usage-based billing from stale/rogue requests. | Active queries stopped ($0). |
| **ElevenLabs** (Voice Pipeline) | Keys located (`ELEVENLABS_API_KEY`) and documented. | Log in to ElevenLabs Console: Revoke API key. | Usage-based charges halted ($0). |
| **Twilio** (Phone numbers, Voice, SMS, Webhooks) | Endpoints and SDK calls identified (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`). | Log in to Twilio Console: Release all inbound phone numbers. Delete or pause all inbound webhooks. Revoke active auth tokens. | Monthly number fees and per-minute/per-message charges halted ($0). |
| **Supabase** (Database, Edge Functions, Realtime) | Handlers preserved but inactive. | Log in to Supabase Console: Pause the project to stop ongoing compute/database load if it's on a paid tier, or leave on free tier if applicable. | Reduced/paused compute costs ($0). |
