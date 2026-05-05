# OmniHub Skill Extraction

This document outlines the core reusable IP extracted from the TradeLine 24/7 project. These components are designed to be migrated into OmniHub.

## Component: Call Classification Logic & Compliance
- **Location:** `supabase/functions/_shared/compliance.ts` and `supabase/functions/_shared/omniport.ts`
- **Purpose:** Classifies inbound calls based on intent, sentiment, urgency, risk score, and enforces compliance rules (e.g., quiet hours, recording consent, suppression list).
- **OmniHub Module:** OmniHub Routing / Triage Module
- **Estimated Migration Effort:** 10 hours
- **Core Snippet:**
  ```typescript
  // From compliance.ts
  export function categorizeCall(
    text: string,
    sentimentScore: number,
    intentSignals: { text?: string; keywords?: string[] } | null
  ): 'support' | 'sales' | 'emergency' | 'billing' | 'lead_capture' {
    const isEmergency = /\b(emergency|water everywhere|no heat|leaking|flooded|broken pipe|urgent)\b/i;
    if (isEmergency.test(text)) return 'emergency';

    const isSales = /\b(quote|price|estimate|new system|install|buy|purchase)\b/i;
    const isBilling = /\b(bill|invoice|charge|pay|cancel)\b/i;
    const isSupport = /\b(fix|broken|not working|repair|maintenance)\b/i;

    if (isSales.test(text)) return 'sales';
    if (isBilling.test(text)) return 'billing';
    if (sentimentScore <= -0.5 || isSupport.test(text)) return 'support';

    if (!intentSignals) return 'lead_capture';

    const intentText = (intentSignals.text || '').toLowerCase();
    const keywords = intentSignals.keywords || [];

    if (keywords.some(k => ['buy', 'pricing', 'quote'].includes(k)) || intentText.includes('sale')) return 'sales';
    if (keywords.some(k => ['broken', 'help', 'fix'].includes(k)) || intentText.includes('support')) return 'support';

    return 'lead_capture';
  }

  // From omniport.ts
  export function classifyRisk(content: string, deviceScore: number): { score: number; lane: RiskLane; flags: string[] } {
    let score = Math.max(0, 50 - (deviceScore / 2));
    const flags: string[] = [];

    for (const rule of RISK_RULES) {
      if (rule.pattern.test(content)) {
        score += rule.severity;
        flags.push(rule.flag);
      }
    }

    let lane: RiskLane = 'GREEN';
    if (score >= 90) lane = 'BLOCKED';
    else if (score >= 70) lane = 'RED';
    else if (score >= 40) lane = 'YELLOW';

    return { score: Math.min(100, score), lane, flags };
  }
  ```

## Component: Multi-Agent Conversational Dispatch (AgentFactory & Personas)
- **Location:** `supabase/functions/_shared/agentFactory.ts`, `supabase/functions/_shared/personas.ts`
- **Purpose:** Context-aware routing and handling of conversations via defined personas (Adeline, Lisa, Christy) with built-in hallucination prevention, SMS anchoring, and dynamic tool assignment.
- **OmniHub Module:** OmniHub AI Agents / Persona Engine
- **Estimated Migration Effort:** 15 hours
- **Core Snippet:**
  ```typescript
  // From agentFactory.ts
  export class AgentFactory {
    static async createAgent(agentName: "Adeline" | "Lisa" | "Christy", context: AgentContext) {
      const systemPrompt = await getSystemPrompt(agentName);
      const tools = AgentFactory.getToolsForAgent(agentName);

      return {
        processInput: async (input: string): Promise<AgentResponse> => {
          const messages = [
            { role: "system", content: systemPrompt },
            ...context.history,
            { role: "user", content: input }
          ];

          const completionOptions: any = {
            model: "gpt-4-turbo-preview",
            messages: messages,
            temperature: 0.3,
          };

          if (tools.length > 0) {
              completionOptions.tools = tools;
              completionOptions.tool_choice = "auto";
          }

          const completion = await openai.chat.completions.create(completionOptions);
          // ... handle tool call or standard response
        }
      };
    }
  }

  // From personas.ts (Adeline Prompt Snippet)
  export const ADELINE_PROMPT = `
  You are Adeline, the Senior Dispatcher for TradeLine 24/7.
  Your Goal: Triage calls, assess urgency, and book appointments.

  ## CORE PROTOCOLS (NON-NEGOTIABLE)
  1. **The "Triage First" Rule:** Your FIRST mental step is to classify Urgency.
     - If User says "Water everywhere" or "No heat" -> Urgency: CRITICAL.
  2. **The "No Hallucination" Rule:**
     - You CANNOT book an appointment by yourself. You MUST use the 'create_booking' tool.
  3. **The "SMS Anchor" Rule:**
     - As soon as intent is established, trigger the 'send_sms' tool to anchor the conversation to text.
  `;
  ```

## Component: Empathetic Voice Pipeline
- **Location:** `src/services/voicePipeline.ts`, `src/services/sentimentService.ts`, `src/services/voiceService.ts`
- **Purpose:** Evaluates text sentiment in real-time, injects contextually appropriate empathetic cues (e.g., "I'm so sorry to hear that..."), and synthesizes speech via ElevenLabs.
- **OmniHub Module:** OmniHub Media / Communications Synthesis
- **Estimated Migration Effort:** 8 hours
- **Core Snippet:**
  ```typescript
  // From voicePipeline.ts
  export function buildEmpatheticText(transcript: string, baseResponse: string): EmpatheticResponse {
    const sentiment = getSentimentScore(transcript || '');
    const cue = getEmpathyCue(sentiment.category);
    const empatheticText = `${cue}${baseResponse}`.trim();
    return { sentiment, empatheticText };
  }

  export async function synthesizeEmpatheticSpeech(
    transcript: string,
    baseResponse: string,
    options?: VoiceOptions
  ): Promise<{ voice: VoiceResponse; sentiment: SentimentResult; text: string }> {
    const { sentiment, empatheticText } = buildEmpatheticText(transcript, baseResponse);
    const voice = await generateSpeech(empatheticText, options);
    return { voice, sentiment, text: empatheticText };
  }
  ```
