# Wizard Quick Questions Sub-Step - Implementation Plan

## Overview

Add a sub-step within Step 1 (Service Details) where users confirm/answer "quick questions" from the category/subcategory config. This should **NOT** appear as a separate step in the top stepper, but rather as a sub-progression within Step 1.

## Current State

- **Step 1 (Service Details)**: Category selection, Date, Time
- **Step 2 (Location)**: Address, Estimated hours
- **Step 3 (Review)**: Summary and confirmation

Quick questions come from `configJson` at category/subcategory level and can be:

- `boolean` (yes/no)
- `select` (multi-select dropdown)
- `text` (text input)
- `number` (number input)

## UX Options

### Option 1: Sequential Sub-Steps (Recommended) ⭐

**Flow:**

1. User fills: Category, Date, Time
2. Clicks "Continuar" → Shows quick questions in same step
3. Visual indicator: "Parte 1 de 2" / "Parte 2 de 2" or progress dots
4. After answering questions, "Continuar" proceeds to Location step

**Visual Design:**

- Small progress indicator below main title (e.g., "● ○" or "1/2")
- Same card container, but content swaps
- "Atrás" button appears when on questions part
- Smooth transition animation

**Pros:**

- Clear progression without cluttering main stepper
- Ensures questions are answered before proceeding
- Feels natural and integrated
- Mobile-friendly

**Cons:**

- Requires state management for sub-step
- Slightly more complex logic

**Implementation:**

- Add `subStep` state: `"basic" | "questions"`
- Conditionally render form sections
- Store answers in wizard state (URL params)

---

### Option 2: Modal/Dialog

**Flow:**

1. User fills: Category, Date, Time
2. Clicks "Continuar" → Modal appears with quick questions
3. User answers questions in modal
4. Clicks "Confirmar" → Modal closes, proceeds to Location step

**Visual Design:**

- Full-screen modal on mobile
- Centered dialog on desktop
- Cannot proceed without answering required questions
- "Cancelar" returns to basic form

**Pros:**

- Clear separation of concerns
- Forces attention to questions
- Simple to implement

**Cons:**

- Modal can feel intrusive
- Less integrated feel
- Mobile UX can be cramped

**Implementation:**

- Modal component with question forms
- State managed in parent component
- Block navigation until modal is completed

---

### Option 3: Inline Expandable Section

**Flow:**

1. User fills: Category, Date, Time
2. Quick questions section appears below (expandable/collapsible)
3. User expands and answers questions
4. "Continuar" validates both sections before proceeding

**Visual Design:**

- Collapsible card below main form
- "Preguntas adicionales" header with expand/collapse icon
- Shows count: "3 preguntas" or "Opcional"
- Can be expanded by default if questions exist

**Pros:**

- Everything visible in one scroll
- User controls when to answer
- Simple, no extra navigation

**Cons:**

- Questions might be missed if collapsed
- Less emphasis on importance
- Can make form feel long

**Implementation:**

- Conditional rendering based on `hasQuestions`
- Collapsible state management
- Validation checks both sections

---

### Option 4: Two-Panel Split View

**Flow:**

1. User sees two panels side-by-side (desktop) or stacked (mobile)
2. Left: Basic details (Category, Date, Time)
3. Right: Quick questions
4. Both must be completed before "Continuar" enables

**Visual Design:**

- Desktop: `grid grid-cols-2` layout
- Mobile: Stacked vertically
- Visual connection between panels
- Both sections scroll independently

**Pros:**

- Everything visible at once
- Clear separation
- Efficient use of space (desktop)

**Cons:**

- Overwhelming on mobile
- Questions might feel secondary
- Complex responsive layout

**Implementation:**

- Grid layout with responsive breakpoints
- Independent scroll containers
- Combined validation logic

---

### Option 5: Progressive Disclosure (Accordion)

**Flow:**

1. User fills: Category, Date, Time
2. After category selection, quick questions accordion appears
3. Each question in its own accordion item (or all in one)
4. User expands and answers
5. "Continuar" validates all before proceeding

**Visual Design:**

- Accordion component below main form
- "Preguntas sobre el servicio" header
- Individual items or grouped
- Shows completion status

**Pros:**

- Organized, scannable
- User controls pace
- Good for many questions

**Cons:**

- Can be missed if collapsed
- Extra clicks required
- Less streamlined

**Implementation:**

- Accordion component
- Per-question or grouped state
- Validation on expand/change

---

## Recommendation: **Option 1 - Sequential Sub-Steps**

**Rationale:**

- Best balance of clarity and integration
- Ensures questions are answered
- Doesn't clutter main stepper
- Mobile-friendly
- Feels like natural progression

---

## Implementation Plan (Option 1)

### Phase 1: State Management

**Files to Modify:**

- `apps/client/src/lib/wizard/useWizardState.ts`

**Changes:**

1. Add `quickQuestionAnswers` to `WizardState` interface:
   ```typescript
   quickQuestionAnswers?: Record<string, string | boolean | number | string[]>;
   ```
2. Store answers in URL params as `question_<key>=<value>`
3. Parse answers from URL on load
4. Helper functions to serialize/deserialize answers

**Considerations:**

- URL param format: `question_<key>=<value>`
- For arrays: `question_<key>=value1,value2`
- For booleans: `question_<key>=true|false`
- Preserve existing params when navigating

---

### Phase 2: Component Structure

**New Component:**

- `apps/client/src/components/wizard/steps/QuickQuestionsSection.tsx`

**Props:**

```typescript
interface QuickQuestionsSectionProps {
  questions: QuickQuestion[];
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  required?: boolean;
}
```

**Features:**

- Reuse `DynamicFilterSection` logic (or create wizard-specific version)
- Handle all question types (boolean, select, text, number)
- Show validation errors
- Required field indicators

**Reuse Existing:**

- `DynamicFilterSection` component (or adapt it)
- Filter components: `BooleanFilter`, `SelectFilter`, `TextFilter`, `NumberFilter`

---

### Phase 3: ServiceDetailsStep Refactor

**File:**

- `apps/client/src/components/wizard/steps/ServiceDetailsStep.tsx`

**Changes:**

1. Add sub-step state: `const [subStep, setSubStep] = useState<"basic" | "questions">("basic")`
2. Fetch category config using `useCategoryConfig(categoryId, subcategoryId)`
3. Determine if questions exist: `const hasQuestions = quickQuestions.length > 0`
4. Conditional rendering:
   - If `subStep === "basic"`: Show basic form (Category, Date, Time)
   - If `subStep === "questions"`: Show quick questions
5. Update "Continuar" button logic:
   - Basic step: Validate basic fields → If hasQuestions, go to questions; else go to location
   - Questions step: Validate answers → Go to location step
6. Add "Atrás" button when on questions step
7. Add progress indicator (e.g., "1/2" or dots)

**Subcategory Handling:**

- Check if subcategory is selected (may need to add subcategory selection to basic form)
- Or use category-level questions only (simpler for MVP)
- Config merges: category config + subcategory config

---

### Phase 4: Data Flow

**Question Source:**

- Fetch config: `useCategoryConfig(categoryId, subcategoryId)`
- Get questions: `config?.quick_questions || []`
- Filter required vs optional

**Answer Storage:**

- Store in wizard state (URL params)
- Format: `question_<key>=<serialized_value>`
- Preserve when navigating between steps

**Answer Usage:**

- Pass to order creation in ReviewStep
- Include in `categoryMetadataJson` when creating order
- Format as expected by backend

---

### Phase 5: Validation

**Basic Step Validation:**

- Category selected
- Date selected
- Time selected
- Pro available

**Questions Step Validation:**

- Required questions answered
- Type-specific validation (number ranges, text length, etc.)
- Show inline errors

**Navigation Logic:**

```typescript
const handleNext = () => {
  if (subStep === "basic") {
    if (!canProceedBasic) return;

    // Save basic fields to state
    updateState({ categoryId, date, time });

    if (hasQuestions) {
      setSubStep("questions");
    } else {
      navigateToStep("location");
    }
  } else {
    // Questions step
    if (!canProceedQuestions) return;

    // Save answers to state
    updateState({ quickQuestionAnswers });

    navigateToStep("location");
  }
};
```

---

### Phase 6: Visual Indicators

**Progress Indicator:**

- Small dots or "1/2" text below main title
- Active state highlighting
- Smooth transition animation

**Button States:**

- "Continuar" disabled until validation passes
- "Atrás" only visible on questions step
- Loading states if needed

**Question Display:**

- Card layout matching existing wizard style
- Required field indicators (\*)
- Helpful labels and placeholders

---

## Edge Cases

1. **No Questions:**
   - Skip questions step entirely
   - Go directly to location after basic step

2. **Category Change:**
   - Reset questions step if on questions
   - Clear previous answers
   - Fetch new config

3. **Back Navigation:**
   - From Location → Questions (if has questions)
   - From Questions → Basic
   - Preserve answers when going back

4. **Required vs Optional:**
   - Only validate required questions
   - Show optional indicator
   - Allow proceeding with optional unanswered

5. **Subcategory Selection:**
   - May need to add subcategory picker to basic form
   - Or use category-level questions only (simpler)

---

## Testing Considerations

1. **Unit Tests:**
   - QuickQuestionsSection component
   - Validation logic
   - State serialization/deserialization

2. **Integration Tests:**
   - Full wizard flow with questions
   - Navigation between sub-steps
   - Answer persistence

3. **Edge Cases:**
   - No questions
   - All question types
   - Required vs optional
   - Category changes

---

## File Structure

```
apps/client/src/
  components/
    wizard/
      steps/
        ServiceDetailsStep.tsx (modify)
        QuickQuestionsSection.tsx (new)
        LocationStep.tsx (no changes)
        ReviewStep.tsx (modify - include answers in order)
  lib/
    wizard/
      useWizardState.ts (modify - add quickQuestionAnswers)
  hooks/
    category/
      useCategoryConfig.ts (already exists)
```

---

## Migration Notes

- Existing wizard flows continue to work (no questions = no change)
- URL params are backward compatible (questions are optional)
- Order creation API may need to accept `categoryMetadataJson` with question answers

---

## Open Questions

1. **Subcategory Selection:**
   - Should users select subcategory in wizard?
   - Or use category-level questions only?
   - **Recommendation:** Start with category-level only, add subcategory later if needed

2. **Question Persistence:**
   - Should answers persist if user goes back?
   - **Recommendation:** Yes, preserve answers

3. **Required Questions:**
   - Are all questions required or some optional?
   - **Recommendation:** Support both, validate only required

4. **Answer Format:**
   - How to store in `categoryMetadataJson`?
   - **Recommendation:** `{ questionKey: answerValue }` object

---

## Next Steps

1. **Choose UX Option** (recommended: Option 1)
2. **Review and approve plan**
3. **Implement Phase 1** (State Management)
4. **Implement Phase 2** (Component)
5. **Implement Phase 3** (Integration)
6. **Test and iterate**
