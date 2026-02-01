/**
 * Expression Parser for Survey Logic
 * 
 * Supports SurveyJS-compatible expression syntax:
 * - Variable access: {questionName}, {questionName.property}
 * - Comparison: =, <>, <, >, <=, >=, contains, notcontains
 * - Logical: and, or, not, empty, notempty
 * - Math: +, -, *, /, %, ^
 * - Functions: iif, age, today, currentDate, sum, avg, min, max, count, etc.
 */

export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'VARIABLE'
  | 'FUNCTION'
  | 'OPERATOR'
  | 'COMPARISON'
  | 'LOGICAL'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'DOT'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: any;
  position: number;
}

export interface ASTNode {
  type: string;
  [key: string]: any;
}

// Operator precedence (higher = evaluated first)
const PRECEDENCE: Record<string, number> = {
  'or': 1,
  'and': 2,
  '=': 3, '==': 3, '<>': 3, '!=': 3, '<': 3, '>': 3, '<=': 3, '>=': 3,
  'contains': 3, 'notcontains': 3, 'anyof': 3, 'allof': 3,
  '+': 4, '-': 4,
  '*': 5, '/': 5, '%': 5,
  '^': 6,
  'not': 7, 'negate': 7,
};

/**
 * Lexer: Tokenize expression string
 */
export class ExpressionLexer {
  private input: string;
  private position: number = 0;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input.trim();
  }

  tokenize(): Token[] {
    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const char = this.input[this.position];

      // Variable reference: {name} or {name.property}
      if (char === '{') {
        this.readVariable();
        continue;
      }

      // String literal
      if (char === "'" || char === '"') {
        this.readString(char);
        continue;
      }

      // Number
      if (this.isDigit(char) || (char === '-' && this.isDigit(this.peek(1)))) {
        this.readNumber();
        continue;
      }

      // Parentheses
      if (char === '(') {
        this.tokens.push({ type: 'LPAREN', value: '(', position: this.position });
        this.position++;
        continue;
      }
      if (char === ')') {
        this.tokens.push({ type: 'RPAREN', value: ')', position: this.position });
        this.position++;
        continue;
      }

      // Brackets for array access
      if (char === '[') {
        this.tokens.push({ type: 'LBRACKET', value: '[', position: this.position });
        this.position++;
        continue;
      }
      if (char === ']') {
        this.tokens.push({ type: 'RBRACKET', value: ']', position: this.position });
        this.position++;
        continue;
      }

      // Comma
      if (char === ',') {
        this.tokens.push({ type: 'COMMA', value: ',', position: this.position });
        this.position++;
        continue;
      }

      // Dot
      if (char === '.') {
        this.tokens.push({ type: 'DOT', value: '.', position: this.position });
        this.position++;
        continue;
      }

      // Comparison operators
      if (this.tryReadOperator(['<>', '<=', '>=', '!=', '==', '=', '<', '>'])) {
        continue;
      }

      // Math operators
      if ('+-*/%^'.includes(char)) {
        this.tokens.push({ type: 'OPERATOR', value: char, position: this.position });
        this.position++;
        continue;
      }

      // Keywords and identifiers
      if (this.isAlpha(char)) {
        this.readIdentifier();
        continue;
      }

      throw new Error(`Unexpected character '${char}' at position ${this.position}`);
    }

    this.tokens.push({ type: 'EOF', value: null, position: this.position });
    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
      this.position++;
    }
  }

  private peek(offset: number = 0): string {
    return this.input[this.position + offset] || '';
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }

  private readVariable(): void {
    const start = this.position;
    this.position++; // skip {
    let name = '';
    while (this.position < this.input.length && this.input[this.position] !== '}') {
      name += this.input[this.position];
      this.position++;
    }
    if (this.input[this.position] !== '}') {
      throw new Error(`Unclosed variable reference at position ${start}`);
    }
    this.position++; // skip }
    this.tokens.push({ type: 'VARIABLE', value: name.trim(), position: start });
  }

  private readString(quote: string): void {
    const start = this.position;
    this.position++; // skip opening quote
    let value = '';
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char === quote) {
        this.position++; // skip closing quote
        this.tokens.push({ type: 'STRING', value, position: start });
        return;
      }
      if (char === '\\' && this.position + 1 < this.input.length) {
        this.position++;
        value += this.input[this.position];
      } else {
        value += char;
      }
      this.position++;
    }
    throw new Error(`Unclosed string at position ${start}`);
  }

  private readNumber(): void {
    const start = this.position;
    let value = '';
    if (this.input[this.position] === '-') {
      value += '-';
      this.position++;
    }
    while (this.position < this.input.length && (this.isDigit(this.input[this.position]) || this.input[this.position] === '.')) {
      value += this.input[this.position];
      this.position++;
    }
    this.tokens.push({ type: 'NUMBER', value: parseFloat(value), position: start });
  }

  private tryReadOperator(operators: string[]): boolean {
    for (const op of operators) {
      if (this.input.substring(this.position, this.position + op.length) === op) {
        this.tokens.push({ type: 'COMPARISON', value: op, position: this.position });
        this.position += op.length;
        return true;
      }
    }
    return false;
  }

  private readIdentifier(): void {
    const start = this.position;
    let value = '';
    while (this.position < this.input.length && this.isAlphaNumeric(this.input[this.position])) {
      value += this.input[this.position];
      this.position++;
    }

    const lower = value.toLowerCase();

    // Boolean literals
    if (lower === 'true' || lower === 'false') {
      this.tokens.push({ type: 'BOOLEAN', value: lower === 'true', position: start });
      return;
    }

    // Null
    if (lower === 'null' || lower === 'undefined') {
      this.tokens.push({ type: 'BOOLEAN', value: null, position: start });
      return;
    }

    // Logical operators
    if (['and', 'or', 'not'].includes(lower)) {
      this.tokens.push({ type: 'LOGICAL', value: lower, position: start });
      return;
    }

    // Comparison operators as words
    if (['contains', 'notcontains', 'anyof', 'allof', 'empty', 'notempty'].includes(lower)) {
      this.tokens.push({ type: 'COMPARISON', value: lower, position: start });
      return;
    }

    // Function or identifier
    this.skipWhitespace();
    if (this.input[this.position] === '(') {
      this.tokens.push({ type: 'FUNCTION', value: lower, position: start });
    } else {
      // Treat as variable without braces (legacy support)
      this.tokens.push({ type: 'VARIABLE', value: value, position: start });
    }
  }
}

/**
 * Parser: Build AST from tokens
 */
export class ExpressionParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const result = this.parseExpression();
    if (this.current().type !== 'EOF') {
      throw new Error(`Unexpected token: ${this.current().value}`);
    }
    return result;
  }

  private current(): Token {
    return this.tokens[this.position] || { type: 'EOF', value: null, position: -1 };
  }

  private consume(type?: TokenType): Token {
    const token = this.current();
    if (type && token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type} at position ${token.position}`);
    }
    this.position++;
    return token;
  }

  private parseExpression(minPrecedence: number = 0): ASTNode {
    let left = this.parsePrimary();

    while (true) {
      const token = this.current();
      const operator = token.value?.toString().toLowerCase();
      const precedence = PRECEDENCE[operator];

      if (precedence === undefined || precedence < minPrecedence) {
        break;
      }

      this.consume();

      // Handle unary operators
      if (token.type === 'COMPARISON' && ['empty', 'notempty'].includes(operator)) {
        left = {
          type: 'UnaryExpression',
          operator,
          argument: left,
        };
        continue;
      }

      const right = this.parseExpression(precedence + 1);
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private parsePrimary(): ASTNode {
    const token = this.current();

    // Unary NOT
    if (token.type === 'LOGICAL' && token.value === 'not') {
      this.consume();
      const argument = this.parsePrimary();
      return { type: 'UnaryExpression', operator: 'not', argument };
    }

    // Unary minus
    if (token.type === 'OPERATOR' && token.value === '-') {
      this.consume();
      const argument = this.parsePrimary();
      return { type: 'UnaryExpression', operator: 'negate', argument };
    }

    // Parenthesized expression
    if (token.type === 'LPAREN') {
      this.consume();
      const expr = this.parseExpression();
      this.consume('RPAREN');
      return expr;
    }

    // Function call
    if (token.type === 'FUNCTION') {
      return this.parseFunctionCall();
    }

    // Variable
    if (token.type === 'VARIABLE') {
      this.consume();
      return { type: 'Variable', name: token.value };
    }

    // Literals
    if (token.type === 'NUMBER') {
      this.consume();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'STRING') {
      this.consume();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'BOOLEAN') {
      this.consume();
      return { type: 'Literal', value: token.value };
    }

    throw new Error(`Unexpected token: ${token.type} (${token.value}) at position ${token.position}`);
  }

  private parseFunctionCall(): ASTNode {
    const name = this.consume('FUNCTION').value;
    this.consume('LPAREN');
    
    const args: ASTNode[] = [];
    while (this.current().type !== 'RPAREN') {
      args.push(this.parseExpression());
      if (this.current().type === 'COMMA') {
        this.consume();
      }
    }
    
    this.consume('RPAREN');
    return { type: 'FunctionCall', name, arguments: args };
  }
}

/**
 * Parse an expression string into an AST
 */
export function parseExpression(expression: string): ASTNode {
  const lexer = new ExpressionLexer(expression);
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  return parser.parse();
}
