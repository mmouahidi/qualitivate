export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'company_admin' | 'site_admin' | 'department_admin' | 'user';
  companyId?: string;
  siteId?: string;
  departmentId?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  activity?: string;
  address?: string;
  city?: string;
  sitesCount?: number;
  employeesCount?: number;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  companyId: string;
  name: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  siteId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: string;
  companyId: string;
  createdBy: string;
  title: string;
  description?: string;
  type: 'nps' | 'custom';
  status: 'draft' | 'active' | 'closed';
  isPublic: boolean;
  isAnonymous: boolean;
  defaultLanguage: string;
  settings: Record<string, any>;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'nps' | 'multiple_choice' | 'text_short' | 'text_long' | 'rating_scale' | 'matrix';

// Logic Rule types for question branching
export type LogicOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'greater_than' 
  | 'less_than' 
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_answered' 
  | 'is_not_answered'
  | 'is_any_of'
  | 'is_none_of';

export type LogicActionType = 'skip_to' | 'end_survey' | 'show' | 'hide';

export interface LogicCondition {
  operator: LogicOperator;
  value?: any; // The value to compare against
}

export interface LogicAction {
  type: LogicActionType;
  targetQuestionId?: string; // For skip_to action
}

export interface LogicRule {
  id: string;
  condition: LogicCondition;
  action: LogicAction;
}

export interface QuestionOptions {
  choices?: string[];
  min?: number;
  max?: number;
  rows?: string[];
  columns?: string[];
  logicRules?: LogicRule[];
}

export interface Question {
  id: string;
  surveyId: string;
  type: QuestionType;
  content: string;
  options: QuestionOptions;
  isRequired: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionTranslation {
  id: string;
  questionId: string;
  languageCode: string;
  content: string;
  options: Record<string, any>;
}

export interface SurveyTranslation {
  id: string;
  surveyId: string;
  languageCode: string;
  title: string;
  description?: string;
}

export interface Response {
  id: string;
  surveyId: string;
  respondentId?: string;
  anonymousToken?: string;
  ipAddress?: string;
  languageUsed?: string;
  status: 'started' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface Answer {
  id: string;
  responseId: string;
  questionId: string;
  value: any;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SurveyJS-Like Schema Types (JSON-Driven Form Definition)
// ============================================================================

/**
 * Extended question types following SurveyJS patterns
 */
export type ExtendedQuestionType = 
  | QuestionType  // Original types
  | 'dropdown'
  | 'checkbox'
  | 'boolean'
  | 'file_upload'
  | 'ranking'
  | 'image_picker'
  | 'signature_pad'
  | 'html'
  | 'expression'
  | 'comment'
  | 'panel_dynamic'
  | 'matrix_dropdown'
  | 'matrix_dynamic';

/**
 * Validator types for client/server-side validation
 */
export type ValidatorType = 
  | 'required'
  | 'numeric'
  | 'text'
  | 'email'
  | 'regex'
  | 'expression'
  | 'answercount';

export interface Validator {
  type: ValidatorType;
  text?: string;  // Error message
  // Numeric validator
  minValue?: number;
  maxValue?: number;
  // Text validator
  minLength?: number;
  maxLength?: number;
  allowDigits?: boolean;
  // Regex validator
  regex?: string;
  // Expression validator
  expression?: string;
  // Answer count validator (for checkboxes/ranking)
  minCount?: number;
  maxCount?: number;
}

/**
 * Choice item for dropdown, checkbox, radiogroup, etc.
 */
export interface ChoiceItem {
  value: string | number;
  text?: string;
  imageLink?: string;
  visibleIf?: string;
  enableIf?: string;
}

/**
 * Matrix column definition
 */
export interface MatrixColumn {
  name: string;
  title?: string;
  cellType?: 'dropdown' | 'checkbox' | 'radiogroup' | 'text' | 'comment' | 'boolean' | 'expression' | 'rating';
  choices?: (string | ChoiceItem)[];
  visibleIf?: string;
  enableIf?: string;
  requiredIf?: string;
  defaultValue?: any;
  validators?: Validator[];
}

/**
 * Matrix row definition
 */
export interface MatrixRow {
  value: string;
  text?: string;
  visibleIf?: string;
}

/**
 * Base element properties shared by questions and panels
 */
export interface BaseElement {
  name: string;  // Unique identifier within the survey
  title?: string;
  description?: string;
  visibleIf?: string;  // Expression to control visibility
  enableIf?: string;   // Expression to control enabled state
  requiredIf?: string; // Expression to make conditionally required
  readOnly?: boolean;
  visible?: boolean;
  startWithNewLine?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  renderAs?: string;
  state?: 'default' | 'expanded' | 'collapsed';
}

/**
 * Survey element (question) definition
 */
export interface SurveyElement extends BaseElement {
  type: ExtendedQuestionType;
  isRequired?: boolean;
  defaultValue?: any;
  correctAnswer?: any;  // For quiz mode
  validators?: Validator[];
  
  // Text input options
  inputType?: 'text' | 'number' | 'email' | 'tel' | 'url' | 'password' | 'date' | 'datetime-local' | 'time' | 'color';
  placeholder?: string;
  maxLength?: number;
  rows?: number;  // For text_long/comment
  autoGrow?: boolean;
  
  // Choice-based options
  choices?: (string | ChoiceItem)[];
  choicesOrder?: 'none' | 'asc' | 'desc' | 'random';
  choicesFromQuestion?: string;  // Carry forward
  choicesFromQuestionMode?: 'all' | 'selected' | 'unselected';
  hasOther?: boolean;
  hasNone?: boolean;
  hasSelectAll?: boolean;  // For checkbox
  otherText?: string;
  noneText?: string;
  selectAllText?: string;
  otherPlaceholder?: string;
  colCount?: number;  // Number of columns for choices
  
  // Rating scale options
  rateMin?: number;
  rateMax?: number;
  rateStep?: number;
  minRateDescription?: string;
  maxRateDescription?: string;
  rateType?: 'labels' | 'stars' | 'smileys';
  
  // Matrix options
  columns?: (string | MatrixColumn)[];
  rowsOrder?: 'initial' | 'random';
  columnsVisibleIf?: string;
  rowsVisibleIf?: string;
  isAllRowRequired?: boolean;
  eachRowUnique?: boolean;
  
  // NPS specific
  npsMin?: number;
  npsMax?: number;
  
  // Boolean options
  labelTrue?: string;
  labelFalse?: string;
  valueTrue?: any;
  valueFalse?: any;
  
  // File upload options
  allowMultiple?: boolean;
  allowImagesPreview?: boolean;
  acceptedTypes?: string;  // e.g., "image/*,.pdf"
  maxSize?: number;  // in bytes
  
  // Image picker options
  imageHeight?: string;
  imageWidth?: string;
  imageFit?: 'contain' | 'cover' | 'fill' | 'none';
  showLabel?: boolean;
  multiSelect?: boolean;
  
  // Ranking options
  selectToRankEnabled?: boolean;
  selectToRankAreasLayout?: 'horizontal' | 'vertical';
  
  // Signature pad options
  signatureWidth?: number;
  signatureHeight?: number;
  penColor?: string;
  backgroundColor?: string;
  
  // HTML content (for html type)
  html?: string;
  
  // Expression/Calculated value
  expression?: string;
  format?: string;
  displayStyle?: 'none' | 'decimal' | 'currency' | 'percent';
  currency?: string;
  
  // Panel dynamic options
  templateElements?: SurveyElement[];
  panelCount?: number;
  minPanelCount?: number;
  maxPanelCount?: number;
  panelAddText?: string;
  panelRemoveText?: string;
  confirmDelete?: boolean;
  confirmDeleteText?: string;
  
  // Legacy support - for migration
  content?: string;  // Maps to title
  options?: QuestionOptions;  // Legacy options
}

/**
 * Panel (container) definition - groups questions together
 */
export interface SurveyPanel extends BaseElement {
  type: 'panel';
  elements: (SurveyElement | SurveyPanel)[];
  innerIndent?: number;
  showNumber?: boolean;
  showQuestionNumbers?: 'off' | 'onpanel' | 'default';
  questionTitleLocation?: 'top' | 'bottom' | 'left';
}

/**
 * Page definition - contains elements and panels
 */
export interface SurveyPage {
  name: string;
  title?: string;
  description?: string;
  elements: (SurveyElement | SurveyPanel)[];
  visibleIf?: string;
  enableIf?: string;
  requiredIf?: string;
  readOnly?: boolean;
  visible?: boolean;
  navigationTitle?: string;
  navigationDescription?: string;
  maxTimeToFinish?: number;  // seconds
  questionsOrder?: 'initial' | 'random';
}

/**
 * Trigger definitions for survey automation
 */
export type TriggerType = 
  | 'complete'      // Complete the survey
  | 'setvalue'      // Set a value
  | 'copyvalue'     // Copy value from one question to another
  | 'skip'          // Skip to a question/page
  | 'runexpression' // Run an expression
  | 'visible';      // Change visibility

export interface SurveyTrigger {
  type: TriggerType;
  expression: string;  // When to trigger
  // setvalue/copyvalue
  setToName?: string;
  setValue?: any;
  fromName?: string;
  // skip
  gotoName?: string;
  // runexpression
  runExpression?: string;
}

/**
 * Calculated value definition
 */
export interface CalculatedValue {
  name: string;
  expression: string;
  includeIntoResult?: boolean;
}

/**
 * Complete survey JSON schema definition
 */
export interface SurveySchema {
  // Identification
  surveyId?: string;
  title?: string;
  description?: string;
  logoPosition?: 'none' | 'left' | 'right' | 'top' | 'bottom';
  logo?: string;
  
  // Pages and elements
  pages: SurveyPage[];
  
  // Automation
  triggers?: SurveyTrigger[];
  calculatedValues?: CalculatedValue[];
  
  // Navigation
  showNavigationButtons?: boolean | 'none' | 'top' | 'bottom' | 'both';
  showPrevButton?: boolean;
  showProgressBar?: 'off' | 'top' | 'bottom' | 'both' | 'auto';
  progressBarType?: 'pages' | 'questions' | 'requiredQuestions' | 'correctQuestions';
  goNextPageAutomatic?: boolean;
  allowCompleteSurveyAutomatic?: boolean;
  
  // Question behavior
  questionsOnPageMode?: 'standard' | 'singlePage' | 'questionPerPage';
  showQuestionNumbers?: 'on' | 'off' | 'onPage';
  questionTitleLocation?: 'top' | 'bottom' | 'left';
  questionDescriptionLocation?: 'underTitle' | 'underInput';
  questionErrorLocation?: 'top' | 'bottom';
  
  // Completion
  showCompletedPage?: boolean;
  completedHtml?: string;
  completedBeforeHtml?: string;
  completedHtmlOnCondition?: Array<{ expression: string; html: string }>;
  loadingHtml?: string;
  
  // Timer/Quiz
  maxTimeToFinish?: number;
  maxTimeToFinishPage?: number;
  showTimerPanel?: 'none' | 'top' | 'bottom';
  showTimerPanelMode?: 'all' | 'page' | 'survey';
  
  // Data
  sendResultOnPageNext?: boolean;
  storeOthersAsComment?: boolean;
  clearInvisibleValues?: 'none' | 'onHidden' | 'onHiddenContainer' | 'onComplete';
  textUpdateMode?: 'onBlur' | 'onTyping';
  
  // Validation
  checkErrorsMode?: 'onNextPage' | 'onValueChanged' | 'onValueChanging' | 'onComplete';
  focusFirstQuestionAutomatic?: boolean;
  focusOnFirstError?: boolean;
  
  // Localization
  locale?: string;
  
  // Appearance
  widthMode?: 'static' | 'responsive' | 'auto';
  width?: string;
  fitToContainer?: boolean;
  
  // Legacy/compatibility
  version?: string;
}

/**
 * Survey with schema - combines metadata with JSON schema
 */
export interface SurveyWithSchema extends Omit<Survey, 'settings'> {
  schema: SurveySchema;
  settings: {
    theme?: string;
    customCss?: string;
    [key: string]: any;
  };
}

/**
 * Survey result/response data
 */
export interface SurveyResultData {
  [questionName: string]: any;
}

/**
 * Expression context for evaluation
 */
export interface ExpressionContext {
  survey: SurveySchema;
  values: SurveyResultData;
  variables?: Record<string, any>;
  properties?: Record<string, any>;
}

/**
 * Template with schema
 */
export interface SurveyTemplate {
  id: string;
  companyId?: string;
  name: string;
  description?: string;
  category?: string;
  type: 'nps' | 'custom';
  isGlobal: boolean;
  isAnonymous: boolean;
  schema: SurveySchema;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}
