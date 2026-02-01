/**
 * Expression Evaluator for Survey Logic
 * 
 * Evaluates AST nodes with context containing survey values and variables
 */

import { ASTNode } from './expression-parser';

export interface EvaluationContext {
  values: Record<string, any>;      // Question values by name
  variables?: Record<string, any>;   // Custom variables
  properties?: Record<string, any>;  // Survey/question properties
  row?: Record<string, any>;         // Current row context (for matrix questions)
  panel?: Record<string, any>;       // Current panel context (for dynamic panels)
}

/**
 * Built-in functions available in expressions
 */
const FUNCTIONS: Record<string, (args: any[], context: EvaluationContext) => any> = {
  // Conditional
  iif: (args) => args[0] ? args[1] : args[2],
  
  // Type checking
  isempty: (args) => args[0] === null || args[0] === undefined || args[0] === '' || (Array.isArray(args[0]) && args[0].length === 0),
  isnotempty: (args, ctx) => !FUNCTIONS.isempty(args, ctx),
  isnumber: (args) => typeof args[0] === 'number' && !isNaN(args[0]),
  isstring: (args) => typeof args[0] === 'string',
  isarray: (args) => Array.isArray(args[0]),
  
  // Type conversion
  int: (args) => parseInt(args[0], 10) || 0,
  float: (args) => parseFloat(args[0]) || 0,
  str: (args) => String(args[0] ?? ''),
  bool: (args) => Boolean(args[0]),
  
  // Math functions
  abs: (args) => Math.abs(args[0]),
  ceil: (args) => Math.ceil(args[0]),
  floor: (args) => Math.floor(args[0]),
  round: (args) => Math.round(args[0] * Math.pow(10, args[1] || 0)) / Math.pow(10, args[1] || 0),
  pow: (args) => Math.pow(args[0], args[1]),
  sqrt: (args) => Math.sqrt(args[0]),
  log: (args) => Math.log(args[0]),
  exp: (args) => Math.exp(args[0]),
  
  // Aggregation functions
  sum: (args) => {
    const arr = Array.isArray(args[0]) ? args[0] : args;
    return arr.reduce((acc: number, val: any) => acc + (parseFloat(val) || 0), 0);
  },
  avg: (args, context) => {
    const arr = Array.isArray(args[0]) ? args[0] : args;
    const validValues = arr.filter((v: any) => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v))));
    if (validValues.length === 0) return 0;
    return FUNCTIONS.sum([validValues], context) / validValues.length;
  },
  min: (args) => {
    const arr = Array.isArray(args[0]) ? args[0] : args;
    const numbers = arr.map((v: any) => parseFloat(v)).filter((n: number) => !isNaN(n));
    return numbers.length > 0 ? Math.min(...numbers) : 0;
  },
  max: (args) => {
    const arr = Array.isArray(args[0]) ? args[0] : args;
    const numbers = arr.map((v: any) => parseFloat(v)).filter((n: number) => !isNaN(n));
    return numbers.length > 0 ? Math.max(...numbers) : 0;
  },
  count: (args) => {
    const arr = Array.isArray(args[0]) ? args[0] : args;
    return arr.length;
  },
  
  // String functions
  lower: (args) => String(args[0] ?? '').toLowerCase(),
  upper: (args) => String(args[0] ?? '').toUpperCase(),
  trim: (args) => String(args[0] ?? '').trim(),
  length: (args) => {
    const val = args[0];
    if (typeof val === 'string') return val.length;
    if (Array.isArray(val)) return val.length;
    return 0;
  },
  substring: (args) => String(args[0] ?? '').substring(args[1] || 0, args[2]),
  concat: (args) => args.map((a: any) => String(a ?? '')).join(''),
  replace: (args) => String(args[0] ?? '').replace(new RegExp(args[1], 'g'), args[2] || ''),
  indexof: (args) => String(args[0] ?? '').indexOf(args[1] ?? ''),
  
  // Array functions
  join: (args) => Array.isArray(args[0]) ? args[0].join(args[1] || ', ') : String(args[0] ?? ''),
  split: (args) => String(args[0] ?? '').split(args[1] || ','),
  first: (args) => Array.isArray(args[0]) ? args[0][0] : args[0],
  last: (args) => Array.isArray(args[0]) ? args[0][args[0].length - 1] : args[0],
  contains: (args) => {
    const arr = args[0];
    const val = args[1];
    if (Array.isArray(arr)) return arr.includes(val);
    if (typeof arr === 'string') return arr.includes(String(val));
    return false;
  },
  
  // Date functions
  today: () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
  },
  currentdate: () => new Date().toISOString(),
  now: () => new Date().toISOString(),
  year: (args) => new Date(args[0]).getFullYear(),
  month: (args) => new Date(args[0]).getMonth() + 1,
  day: (args) => new Date(args[0]).getDate(),
  age: (args) => {
    const birthDate = new Date(args[0]);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  },
  datediff: (args) => {
    const d1 = new Date(args[0]);
    const d2 = new Date(args[1]);
    const unit = (args[2] || 'days').toLowerCase();
    const diffMs = d2.getTime() - d1.getTime();
    switch (unit) {
      case 'days': return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'hours': return Math.floor(diffMs / (1000 * 60 * 60));
      case 'minutes': return Math.floor(diffMs / (1000 * 60));
      case 'seconds': return Math.floor(diffMs / 1000);
      case 'years': return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
      default: return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  },
  
  // NPS calculation
  nps: (args, context) => {
    // Calculate NPS from an array of scores (0-10)
    const scores = Array.isArray(args[0]) ? args[0] : [args[0]];
    const validScores = scores.filter((s: any) => typeof s === 'number' && s >= 0 && s <= 10);
    if (validScores.length === 0) return null;
    
    let promoters = 0;
    let detractors = 0;
    
    validScores.forEach((score: number) => {
      if (score >= 9) promoters++;
      else if (score <= 6) detractors++;
    });
    
    return Math.round(((promoters - detractors) / validScores.length) * 100);
  },
  
  // Question value access (with property)
  getvalue: (args, context) => {
    const name = args[0];
    const prop = args[1];
    const value = context.values[name];
    if (prop && typeof value === 'object' && value !== null) {
      return value[prop];
    }
    return value;
  },
  
  // Row context access (for matrix)
  rowvalue: (args, context) => {
    if (!context.row) return undefined;
    return context.row[args[0]];
  },
  
  // Panel context access (for dynamic panels)
  panelvalue: (args, context) => {
    if (!context.panel) return undefined;
    return context.panel[args[0]];
  },
  
  // Property access
  propertyvalue: (args, context) => {
    if (!context.properties) return undefined;
    return context.properties[args[0]];
  },
  
  // Variable access
  getvar: (args, context) => {
    if (!context.variables) return undefined;
    return context.variables[args[0]];
  },
};

/**
 * Evaluate an AST node
 */
export function evaluate(node: ASTNode, context: EvaluationContext): any {
  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Variable':
      return resolveVariable(node.name, context);

    case 'UnaryExpression':
      return evaluateUnary(node.operator, evaluate(node.argument, context));

    case 'BinaryExpression':
      return evaluateBinary(
        node.operator,
        evaluate(node.left, context),
        evaluate(node.right, context)
      );

    case 'FunctionCall':
      return evaluateFunction(node.name, node.arguments, context);

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

/**
 * Resolve a variable reference
 */
function resolveVariable(name: string, context: EvaluationContext): any {
  // Handle property access (e.g., "question.length" or "question.0")
  const parts = name.split('.');
  let value: any = context.values[parts[0]];
  
  // If not in values, check variables
  if (value === undefined && context.variables) {
    value = context.variables[parts[0]];
  }
  
  // If not in variables, check properties
  if (value === undefined && context.properties) {
    value = context.properties[parts[0]];
  }
  
  // Navigate nested properties
  for (let i = 1; i < parts.length && value !== undefined && value !== null; i++) {
    const prop = parts[i];
    // Handle array index access
    if (!isNaN(parseInt(prop, 10))) {
      value = value[parseInt(prop, 10)];
    } else {
      value = value[prop];
    }
  }
  
  return value;
}

/**
 * Evaluate unary operators
 */
function evaluateUnary(operator: string, value: any): any {
  switch (operator) {
    case 'not':
      return !value;
    case 'negate':
      return -value;
    case 'empty':
      return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    case 'notempty':
      return !(value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0));
    default:
      throw new Error(`Unknown unary operator: ${operator}`);
  }
}

/**
 * Evaluate binary operators
 */
function evaluateBinary(operator: string, left: any, right: any): any {
  switch (operator) {
    // Comparison
    case '=':
    case '==':
      return left == right;
    case '<>':
    case '!=':
      return left != right;
    case '<':
      return left < right;
    case '>':
      return left > right;
    case '<=':
      return left <= right;
    case '>=':
      return left >= right;
      
    // String/Array contains
    case 'contains':
      if (Array.isArray(left)) return left.includes(right);
      if (typeof left === 'string') return left.toLowerCase().includes(String(right).toLowerCase());
      return false;
    case 'notcontains':
      if (Array.isArray(left)) return !left.includes(right);
      if (typeof left === 'string') return !left.toLowerCase().includes(String(right).toLowerCase());
      return true;
      
    // Array membership
    case 'anyof':
      if (!Array.isArray(right)) return false;
      if (Array.isArray(left)) return left.some(v => right.includes(v));
      return right.includes(left);
    case 'allof':
      if (!Array.isArray(right)) return false;
      if (Array.isArray(left)) return left.every(v => right.includes(v));
      return right.includes(left);
      
    // Logical
    case 'and':
      return Boolean(left) && Boolean(right);
    case 'or':
      return Boolean(left) || Boolean(right);
      
    // Math
    case '+':
      if (typeof left === 'string' || typeof right === 'string') {
        return String(left ?? '') + String(right ?? '');
      }
      return (Number(left) || 0) + (Number(right) || 0);
    case '-':
      return (Number(left) || 0) - (Number(right) || 0);
    case '*':
      return (Number(left) || 0) * (Number(right) || 0);
    case '/':
      const divisor = Number(right) || 0;
      return divisor === 0 ? 0 : (Number(left) || 0) / divisor;
    case '%':
      const mod = Number(right) || 0;
      return mod === 0 ? 0 : (Number(left) || 0) % mod;
    case '^':
      return Math.pow(Number(left) || 0, Number(right) || 0);
      
    default:
      throw new Error(`Unknown binary operator: ${operator}`);
  }
}

/**
 * Evaluate a function call
 */
function evaluateFunction(name: string, args: ASTNode[], context: EvaluationContext): any {
  const fn = FUNCTIONS[name.toLowerCase()];
  if (!fn) {
    throw new Error(`Unknown function: ${name}`);
  }
  
  const evaluatedArgs = args.map(arg => evaluate(arg, context));
  return fn(evaluatedArgs, context);
}

/**
 * Get list of available functions
 */
export function getAvailableFunctions(): string[] {
  return Object.keys(FUNCTIONS).sort();
}

/**
 * Register a custom function
 */
export function registerFunction(
  name: string, 
  fn: (args: any[], context: EvaluationContext) => any
): void {
  FUNCTIONS[name.toLowerCase()] = fn;
}
