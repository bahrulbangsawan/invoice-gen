## 1. Dependencies & Setup
- [ ] 1.1 Install `@tanstack/react-ai` (TanStack AI for streaming chat hooks)
- [ ] 1.2 Install `openai` SDK (OpenRouter uses OpenAI-compatible API)
- [ ] 1.3 Install `@assistant-ui/react` and required peer dependencies
- [ ] 1.4 Verify all dependencies work with React 19 and TanStack Start

## 2. BYOK API Key Management
- [ ] 2.1 Create `src/components/ai/use-api-key.ts` — custom hook for localStorage read/write/clear of OpenRouter API key
- [ ] 2.2 Create `src/components/ai/api-key-dialog.tsx` — settings dialog with masked key display, input field, clear button, and link to openrouter.ai/keys
- [ ] 2.3 Add key validation on first use (lightweight OpenRouter API call to verify key)

## 3. AI Chat Core
- [ ] 3.1 Create `src/components/ai/use-cv-chat.ts` — wrapper around TanStack AI `useChat` configured with OpenRouter endpoint, user's API key, and CV system prompt
- [ ] 3.2 Create `src/components/ai/cv-system-prompt.ts` — function that serializes CVData into a system prompt for the AI (role definition + full CV context)
- [ ] 3.3 Wire up streaming responses so tokens render incrementally in the chat

## 4. Chat Modal UI
- [ ] 4.1 Create `src/components/ai/assistant-modal.tsx` — assistant-ui `AssistantModal` configured with the CV chat runtime
- [ ] 4.2 Integrate the floating chat button in `src/routes/index.tsx` (bottom-right, above existing layout)
- [ ] 4.3 Handle the "no API key" state — open settings dialog instead of sending message

## 5. Mention System
- [ ] 5.1 Define mention items mapping CVData sections to mention tokens (`@summary`, `@experience`, etc.)
- [ ] 5.2 Configure assistant-ui composer with mention suggestions (dropdown on `@` trigger)
- [ ] 5.3 Enhance the system prompt to highlight the mentioned section when a mention is present in the user's message

## 6. Apply Mechanism
- [ ] 6.1 Create `src/components/ai/apply-suggestion.tsx` — component/hook that parses AI response and renders "Apply to [section]" action buttons
- [ ] 6.2 Wire apply actions to `setData` in `index.tsx` so clicking "Apply" updates the CVData and triggers preview re-render
- [ ] 6.3 Handle edge cases: applying to array fields (experience entries), applying to nested fields (personalInfo)

## 7. Integration & Polish
- [ ] 7.1 Pass CVData and setData from index.tsx to the assistant modal
- [ ] 7.2 Ensure the chat modal doesn't interfere with the form/preview split layout on all breakpoints
- [ ] 7.3 Add loading/error states for API calls (invalid key, network failure, rate limit)
- [ ] 7.4 Test full flow: enter key → open chat → mention section → get AI response → apply to CV
