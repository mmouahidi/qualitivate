# Survey Builder UI Redesign
Redesign the survey builder to match a SurveyJS-inspired 3-panel layout with enhanced toolbox and property configuration panels.
## Current State
* **SurveyBuilder.tsx** - Main page with basic 3-column grid (Toolbox | Builder | Preview)
* **QuestionTypeSelector.tsx** - Simple 6 question types in a card grid
* **QuestionToolbox.tsx** - More comprehensive toolbox with categories (unused in main builder)
* **PropertyGrid.tsx** - Right-side property editor for selected questions (not integrated in main builder)
* The current layout uses toolbox on left, builder center, preview on right
## Target Layout (SurveyJS-Inspired)
```warp-runnable-command
┌────────────────────────────────────────────────────────────────┐
│  Designer  │  Preview  │  Logic  │  JSON Editor     [toolbar] │
├────────────────────────────────────────────────────────────────┤
│ [Search]   │                                │ [Collapse]       │
│ ○ Radio    │     ┌─────────────────┐        │ ▼ General        │
│ ○ Rating   │     │ Your form is    │        │   Title          │
│ ○ Slider   │     │     empty       │        │   Description    │
│ ☑ Checkbox │     │                 │        │   Name           │
│ ▼ Dropdown │     │  [Add Question] │        │ ▼ Settings       │
│ ...        │     └─────────────────┘        │   Required       │
│            │                                │   Visible        │
│ ▼ Panels   │                                │ ▼ Conditions     │
│ ▼ Matrix   │                                │   visibleIf      │
│ ▼ Media    │                                │ ▼ Validation     │
└────────────────────────────────────────────────────────────────┘
```
## Implementation Plan
### Phase 1: Create New Layout Components
**1.1 Create SurveyBuilderLayout.tsx**
* New wrapper component with Designer/Preview/Logic/JSON tabs
* Top navigation bar with tabs and global actions
* Responsive layout with collapsible sidebars
Location: `client/src/components/survey/builder/SurveyBuilderLayout.tsx`
**1.2 Create EnhancedToolbox.tsx**
Left sidebar with:
* Search input with icon
* Flat icon-list of question types (no categories by default)
* Question types to include:
    * Radio Button Group
    * Rating Scale
    * Slider
    * Checkboxes
    * Dropdown
    * Multiselect Dropdown
    * Yes/No (Boolean)
    * File Uploader
    * Image Picker
    * Ranking
    * Single Line Input
    * Long Text
    * Multiple Textboxes
    * Panel
    * Dynamic Panel
    * Single Select Matrix
    * Multi Select Matrix
    * Dynamic Matrix
    * HTML
    * Expression
    * Image
    * Signature
Location: `client/src/components/survey/builder/EnhancedToolbox.tsx`
**1.3 Create ConfigurationPanel.tsx**
Right sidebar with collapsible sections:
* Collapse/expand button for the entire panel
* **General**: Title, Description, Name, Required toggle
* **Settings**: Type-specific settings (choices, rating range, etc.)
* **Conditions**: visibleIf, enableIf, requiredIf expressions
* **Validation**: Validators list with add/remove
Location: `client/src/components/survey/builder/ConfigurationPanel.tsx`
### Phase 2: Extend Question Types
**2.1 Update types/index.ts**
Add missing types:
* `slider` (if not present)
* `multiselect_dropdown`
* `multiple_textboxes`
* `panel` (static panel/container)
* `image` (display-only image)
**2.2 Create Slider component renderer**
Location: `client/src/components/survey/renderers/SliderRenderer.tsx`
**2.3 Create Multiselect Dropdown renderer**
Location: `client/src/components/survey/renderers/MultiselectDropdownRenderer.tsx`
### Phase 3: Integrate New Layout
**3.1 Update SurveyBuilder.tsx**
* Replace current layout with SurveyBuilderLayout
* Add Designer view (current builder)
* Add Preview tab (existing LivePreview)
* Add Logic tab (wire to existing LogicRuleEditor)
* Add JSON Editor tab (raw JSON view/edit)
**3.2 Wire up EnhancedToolbox**
* Connect drag-and-drop from toolbox to canvas
* Click-to-add functionality
* Search filtering
**3.3 Wire up ConfigurationPanel**
* Show/hide based on selected question
* Real-time updates to questions
* Collapsible sections state management
### Phase 4: Polish & UX Enhancements
**4.1 Empty State**
* Centered illustration (as in screenshot)
* "Your form is empty" message
* "Add Question" button with "..." dropdown for quick add
**4.2 Drag-and-drop improvements**
* Visual drop indicators
* Drag handle icons on toolbox items
* Drop zones in canvas
**4.3 Responsive Design**
* Collapsible left toolbox on smaller screens
* Collapsible right config panel
* Mobile-friendly question editing
## Implementation Status: COMPLETED ✓
All phases have been successfully implemented:
### Files Created
1. ✓ `client/src/components/survey/builder/SurveyBuilderLayout.tsx`
2. ✓ `client/src/components/survey/builder/EnhancedToolbox.tsx`
3. ✓ `client/src/components/survey/builder/ConfigurationPanel.tsx`
4. ✓ `client/src/components/survey/builder/BuilderTabs.tsx`
5. ✓ `client/src/components/survey/builder/JsonEditorView.tsx`
### Files Modified
1. ✓ `client/src/pages/surveys/SurveyBuilder.tsx` - Integrated new layout
2. ✓ `client/src/types/index.ts` - Added new question types
3. ✓ `client/src/components/survey/QuestionRenderer.tsx` - Added support for new types
4. ✓ `client/src/components/survey/ExtendedQuestionRenderers.tsx` - Added SliderRenderer, MultiselectDropdownRenderer, ImageRenderer
### New Question Types Added
* Slider, Multiselect Dropdown, Multiple Textboxes, Panel, Image
### TypeScript Compilation: Passed ✓
