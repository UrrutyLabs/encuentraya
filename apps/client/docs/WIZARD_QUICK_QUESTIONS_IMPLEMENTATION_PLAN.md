# Wizard Quick Questions - Phased Implementation Plan

## Components Overview

### New Components to Create

1. **`QuickQuestionsSection.tsx`** (Wizard-specific)
   - **Location:** `apps/client/src/components/wizard/steps/QuickQuestionsSection.tsx`
   - **Purpose:** Container component that renders all quick questions for the wizard
   - **Reusability:** Wizard-specific (handles wizard state, validation, styling)
   - **Props:**
     ```typescript
     interface QuickQuestionsSectionProps {
       questions: QuickQuestion[];
       answers: Record<string, unknown>;
       onChange: (key: string, value: unknown) => void;
       errors?: Record<string, string>;
     }
     ```

2. **`QuestionInput.tsx`** (Reusable wrapper)
   - **Location:** `apps/client/src/components/wizard/steps/QuestionInput.tsx`
   - **Purpose:** Wrapper around filter components with wizard-specific styling and required field handling
   - **Reusability:** ✅ **REUSABLE** - Can be used in other forms/wizards
   - **Props:**
     ```typescript
     interface QuestionInputProps {
       question: QuickQuestion;
       value: unknown;
       onChange: (value: unknown) => void;
       error?: string;
       required?: boolean;
     }
     ```
   - **Note:** Reuses existing filter components (`BooleanFilter`, `SelectFilter`, `TextFilter`, `NumberFilter`)

3. **`StepProgressIndicator.tsx`** (Reusable)
   - **Location:** `apps/client/src/components/wizard/StepProgressIndicator.tsx`
   - **Purpose:** Small progress indicator showing current sub-step (e.g., "1/2" or dots)
   - **Reusability:** ✅ **REUSABLE** - Can be used in any multi-step flow
   - **Props:**
     ```typescript
     interface StepProgressIndicatorProps {
       current: number;
       total: number;
       variant?: "dots" | "fraction";
     }
     ```

### Components to Reuse

1. **Filter Components** (from `apps/client/src/components/search/filters/`)
   - ✅ `BooleanFilter` - Reuse as-is
   - ✅ `SelectFilter` - Reuse as-is
   - ✅ `TextFilter` - Reuse as-is
   - ✅ `NumberFilter` - Reuse as-is
   - **Note:** These are generic enough and don't have filter-specific logic

2. **`DynamicFilterSection`** - **NOT reused**
   - Has URL-specific serialization logic
   - We'll create wizard-specific `QuestionInput` instead

### Components to Modify

1. **`ServiceDetailsStep.tsx`**
   - Add sub-step state management
   - Integrate `QuickQuestionsSection`
   - Add progress indicator
   - Update navigation logic

2. **`useWizardState.ts`**
   - Add `quickQuestionAnswers` to state
   - Add serialization/deserialization helpers
   - Update URL param handling

3. **`ReviewStep.tsx`**
   - Display question answers in summary
   - Include answers in order creation

---

## Phase Breakdown

### Phase 1: State Management & Utilities

**Goal:** Extend wizard state to handle quick question answers

**Files to Modify:**

- `apps/client/src/lib/wizard/useWizardState.ts`

**Tasks:**

1. Add `quickQuestionAnswers` to `WizardState` interface
2. Add helper functions:
   - `serializeQuestionAnswers(answers: Record<string, unknown>): Record<string, string>`
   - `deserializeQuestionAnswers(params: URLSearchParams): Record<string, unknown>`
3. Update `state` memo to parse question answers from URL (`question_<key>` params)
4. Update `updateState` to handle question answers serialization
5. Update `navigateToStep` to preserve question answers

**Deliverables:**

- State management supports question answers
- URL params format: `question_<key>=<serialized_value>`
- Backward compatible (no breaking changes)

**Testing:**

- Test serialization/deserialization of all question types
- Test URL param preservation during navigation
- Test backward compatibility (existing flows still work)

---

### Phase 2: Reusable Components

**Goal:** Create reusable components for question inputs and progress indicator

**Files to Create:**

- `apps/client/src/components/wizard/StepProgressIndicator.tsx`
- `apps/client/src/components/wizard/steps/QuestionInput.tsx`

**Tasks:**

**2.1 StepProgressIndicator Component:**

- Create component with two variants: "dots" and "fraction" (e.g., "1/2")
- Support custom styling via className prop
- Accessible (ARIA labels)
- Responsive design

**2.2 QuestionInput Component:**

- Create wrapper component that:
  - Accepts `question`, `value`, `onChange`, `error`, `required` props
  - Renders appropriate filter component based on `question.type`
  - Shows required indicator (\*) if `required={true}`
  - Shows error message if `error` is provided
  - Handles value parsing (similar to `DynamicFilterSection` but wizard-specific)
  - Uses wizard-appropriate styling (matches wizard card style)
- Reuse existing filter components:
  - `BooleanFilter` for boolean questions
  - `SelectFilter` for select questions
  - `TextFilter` for text questions
  - `NumberFilter` for number questions
- Handle required field validation (don't allow clearing if required)

**Deliverables:**

- Reusable `StepProgressIndicator` component
- Reusable `QuestionInput` component
- Both components follow FE_BEST_PRACTICES.md (presentational, props-based)

**Testing:**

- Test all question types render correctly
- Test required field behavior
- Test error display
- Test progress indicator variants

---

### Phase 3: Quick Questions Section Component

**Goal:** Create wizard-specific container for quick questions

**Files to Create:**

- `apps/client/src/components/wizard/steps/QuickQuestionsSection.tsx`

**Tasks:**

1. Create component that:
   - Accepts `questions`, `answers`, `onChange`, `errors` props
   - Renders list of `QuestionInput` components
   - Handles validation (required questions)
   - Shows section header/title
   - Matches wizard card styling
2. Integrate with `useCategoryConfig` hook to fetch questions (if needed, or pass from parent)
3. Handle empty state (no questions)
4. Handle loading state (if fetching config)

**Deliverables:**

- `QuickQuestionsSection` component
- Proper error handling
- Loading/empty states

**Testing:**

- Test with various question combinations
- Test empty state
- Test validation
- Test error display

---

### Phase 4: ServiceDetailsStep Integration

**Goal:** Integrate quick questions sub-step into ServiceDetailsStep

**Files to Modify:**

- `apps/client/src/components/wizard/steps/ServiceDetailsStep.tsx`

**Tasks:**

1. Add sub-step state: `const [subStep, setSubStep] = useState<"basic" | "questions">("basic")`
2. Fetch category config using `useCategoryConfig(categoryId, subcategoryId)`
3. Determine if questions exist: `const hasQuestions = quickQuestions.length > 0`
4. Add question answers state: `const [questionAnswers, setQuestionAnswers] = useState<Record<string, unknown>>({})`
5. Load answers from wizard state on mount
6. Add `StepProgressIndicator` below title (show only if hasQuestions)
7. Conditional rendering:
   - If `subStep === "basic"`: Show basic form (Category, Date, Time)
   - If `subStep === "questions"`: Show `QuickQuestionsSection`
8. Update "Continuar" button logic:
   - Basic step: Validate basic fields → If hasQuestions, go to questions; else go to location
   - Questions step: Validate required answers → Save to state → Go to location step
9. Add "Atrás" button when on questions step
10. Handle category change: Reset to basic step, clear answers
11. Save answers to wizard state when navigating

**Deliverables:**

- ServiceDetailsStep supports sub-steps
- Smooth navigation between basic and questions
- Answers persist in URL state
- Proper validation

**Testing:**

- Test flow: Basic → Questions → Location
- Test flow: Basic → Location (no questions)
- Test back navigation
- Test category change resets sub-step
- Test answer persistence

---

### Phase 5: Review Step Integration

**Goal:** Display question answers in review step and include in order creation

**Files to Modify:**

- `apps/client/src/components/wizard/steps/ReviewStep.tsx`

**Tasks:**

1. Read `quickQuestionAnswers` from wizard state
2. Display answers in review summary (if any)
3. Include answers in `categoryMetadataJson` when creating order
4. Format answers appropriately for display

**Deliverables:**

- Question answers shown in review
- Answers included in order creation
- Proper formatting

**Testing:**

- Test answers display correctly
- Test order creation includes answers
- Test with no questions (backward compatibility)

---

### Phase 6: Polish & Edge Cases

**Goal:** Handle edge cases and polish UX

**Tasks:**

1. **Subcategory Handling:**
   - Decide: Use category-level questions only (simpler) OR add subcategory selection
   - **Recommendation:** Start with category-level only
2. **Required vs Optional:**
   - Support `required` field in `QuickQuestion` type
   - Only validate required questions
   - Show optional indicator for non-required

3. **Answer Format:**
   - Ensure answers are properly formatted for `categoryMetadataJson`
   - Format: `{ questionKey: answerValue }`

4. **Visual Polish:**
   - Smooth transitions between sub-steps
   - Loading states
   - Error states
   - Empty states

5. **Accessibility:**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

**Deliverables:**

- All edge cases handled
- Polished UX
- Accessible implementation

**Testing:**

- Test all edge cases
- Test accessibility
- Test on mobile/tablet/desktop

---

## File Structure

```
apps/client/src/
  components/
    wizard/
      StepProgressIndicator.tsx (new - Phase 2)
      steps/
        ServiceDetailsStep.tsx (modify - Phase 4)
        QuickQuestionsSection.tsx (new - Phase 3)
        QuestionInput.tsx (new - Phase 2)
        LocationStep.tsx (no changes)
        ReviewStep.tsx (modify - Phase 5)
  lib/
    wizard/
      useWizardState.ts (modify - Phase 1)
  hooks/
    category/
      useCategoryConfig.ts (already exists - reuse)
```

---

## Dependencies Between Phases

- **Phase 1** → **Phase 2**: State management needed for QuestionInput value handling
- **Phase 2** → **Phase 3**: QuestionInput needed for QuickQuestionsSection
- **Phase 3** → **Phase 4**: QuickQuestionsSection needed for ServiceDetailsStep
- **Phase 4** → **Phase 5**: Answers need to be in state for ReviewStep
- **Phase 6**: Can be done in parallel with other phases

---

## Testing Strategy

### Unit Tests

- `StepProgressIndicator` component
- `QuestionInput` component (all question types)
- `QuickQuestionsSection` component
- State serialization/deserialization helpers

### Integration Tests

- Full wizard flow with questions
- Navigation between sub-steps
- Answer persistence
- Category change behavior

### E2E Considerations

- Test complete booking flow with questions
- Test backward navigation
- Test with various question combinations

---

## Migration Notes

- **Backward Compatibility:** Existing wizard flows continue to work (no questions = no change)
- **URL Params:** Questions are optional, so existing URLs still work
- **Order Creation:** May need to verify backend accepts `categoryMetadataJson` with question answers

---

## Open Questions (To Resolve)

1. **Subcategory Selection:**
   - ✅ **Decision:** Start with category-level questions only
   - Can add subcategory selection later if needed

2. **Required Questions:**
   - ✅ **Decision:** Support `required` field, validate only required questions

3. **Answer Storage Format:**
   - ✅ **Decision:** Store as `{ questionKey: answerValue }` in `categoryMetadataJson`

4. **Question Persistence:**
   - ✅ **Decision:** Preserve answers when navigating back/forward

---

## Next Steps

1. ✅ **Approved:** Option 1 (Sequential Sub-Steps)
2. ⏭️ **Next:** Review this implementation plan
3. ⏭️ **Then:** Start Phase 1 (State Management)
