# 🛠️ ENHANCE_ROOM Feature Specification & Architecture Documentation

A comprehensive technical reference document detailing the architectural changes, pipeline integrations, and AI directives introduced to support the **`ENHANCE_ROOM`** mode in **SmartSpaceAI**.

---

## 📌 1. Overview

Previously, the room enhancement feature (`ENHANCE_ROOM`) shared the same pipeline and generation assumptions as `CREATE_FROM_SCRATCH`. The system architecture has been updated to decouple `ENHANCE_ROOM` into a dedicated workflow that accounts for pre-existing furniture, leveraging **Inpainting & Restyling** techniques alongside granular per-category intent extraction (`REPLACE`, `ADD`, `KEEP`, `REMOVE`).

---

## 🏗️ 2. Database Schema & Validator Modifications

### A. Generation Model ([`generation.model.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/models/generation.model.js))
- **Unified `generationType` Enum**: Updated the enum definition to `['CREATE_FROM_SCRATCH', 'ENHANCE_ROOM']`.
- **Added `action` Field**: Added an `action` property to the `categoryPreferences` array to support intent categorization:
  ```javascript
  categoryPreferences: [{
    category: { type: String, required: true },
    included: { type: Boolean, default: null },
    excluded: { type: Boolean, default: null },
    quantity: { type: Number, default: null },
    preferredMaterial: { type: String, default: null },
    preferredColor: { type: String, default: null },
    preferredStyle: { type: String, default: null },
    preferredShape: { type: String, default: null },
    preferredSize: { type: String, default: null },
    budgetAdjustment: { type: String, default: null },
    importance: { type: String, default: null },
    action: { 
      type: String, 
      enum: ['REPLACE', 'ADD', 'KEEP', 'REMOVE', null], 
      default: null 
    }
  }]
  ```

### B. Payload Validation ([`generation.validator.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/validators/generation.validator.js))
- Updated Joi schema rules in `createGenerationSchema` and `extractPreferencesSchema` to validate `ENHANCE_ROOM` as an official generation mode.

---

## 🤖 3. AI Services & Prompt Pipeline Updates

### A. NLU Preference Extraction ([`promptBuilder.service.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/services/promptBuilder.service.js))
- **`buildSystemPrompt(availableCategories, generationType)`**:
  - Accepts `generationType`. When set to `ENHANCE_ROOM`, injects dedicated instructions informing Google Gemini that the room is **already furnished** and guides it to extract per-category actions:
    * `REPLACE`: Swap out an existing item for a new catalog product.
    * `ADD`: Introduce a new product into an available empty space.
    * `KEEP`: Explicitly retain an existing room item as-is.
    * `REMOVE`: Discard an existing room item.
- **`buildUserPrompt(roomDetails, userPrompt, availableCategories, generationType)`**:
  - Contextualizes prompt extraction with `Generation Mode: ENHANCE_ROOM`.

### B. Structured Schema Config ([`aiService.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/services/aiService.js))
- Updated `buildResponseSchema` in `aiService.js` to include the `action` property inside `categoryPreferences` objects for structured Gemini output.

### C. Qwen Multimodal Composite Engine ([`aiService.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/services/aiService.js))
- **Updated `generateRoomCompositeImage`**:
  - Accepts `generationType` in parameters.
  - Constructs tailored Qwen System Prompt directives for `ENHANCE_ROOM`:
    * **EXISTING FURNITURE DIRECTIVE**: Preserves existing furniture in `<|image_1|>` except items targeted for replacement/removal.
    * **INPAINTING & RESTYLING**: Performs smooth inpainting and visual integration of newly selected products while maintaining natural perspective and contact shadows.
    * **RESTYLING & CLEAN INTEGRATION**: Seamlessly composites replacement products without unrequested clutter.
  - **Fixed `ReferenceError`**: Resolved fallback return bug where an undeclared `systemPrompt` variable caused 500 runtime errors.

---

## 📡 4. Pipeline & Frontend Integration

### A. Generation Service ([`generation.service.js`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/back-end/src/services/generation.service.js))
- Passes `generationType` from user request payloads through `promptBuilder.buildSystemPrompt` and `promptBuilder.buildUserPrompt`.
- Passes `generation.generationType` to `aiService.generateRoomCompositeImage`.

### B. Frontend Stepper Flow ([`RoomGeneration.jsx`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/front-end/src/Pages/Dashboard/RoomGeneration.jsx))
- Includes `generationType: form.generationType` in `extractPreferences` API calls.
- Updated error banner visibility logic to render inline API and validation errors across steps 3 and 4 instead of swallowing them.

---

## 📑 5. Project Documentation Synchronization ([`project.md`](file:///d:/iti/SmartSpaceAi/SmartSpaceAI/project.md))

Updated the authoritative system context document (`project.md`) under Section **3.D (AI Room Generation & Prompt Pipeline)** to reflect the dual-mode rendering architecture (`CREATE_FROM_SCRATCH` vs `ENHANCE_ROOM`).

---
