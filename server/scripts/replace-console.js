/**
 * Script to replace console.log/console.error with logger calls
 * Run with: node scripts/replace-console.js
 */

const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '../src/controllers');

// Get all .ts files in controllers directory
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));

let totalReplacements = 0;

for (const file of files) {
    const filePath = path.join(controllersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let replacements = 0;

    // Replace console.error('...', error); -> logger.error('...', { error });
    content = content.replace(
        /console\.error\(['"]([^'"]+)['"]\s*,\s*error\)/g,
        (match, message) => {
            replacements++;
            return `logger.error('${message}', { error })`;
        }
    );

    // Replace console.error(`...`, error); -> logger.error('...', { error });
    content = content.replace(
        /console\.error\(`([^`]+)`\s*,\s*error\)/g,
        (match, message) => {
            replacements++;
            return `logger.error(\`${message}\`, { error })`;
        }
    );

    // Replace console.error('...') -> logger.error('...');
    content = content.replace(
        /console\.error\(['"]([^'"]+)['"]\)/g,
        (match, message) => {
            replacements++;
            return `logger.error('${message}')`;
        }
    );

    // Replace console.log('...', ...) -> logger.debug('...', {...});
    content = content.replace(
        /console\.log\(['"]([^'"]+)['"]\s*,\s*\{([^}]+)\}\)/g,
        (match, message, vars) => {
            replacements++;
            return `logger.debug('${message}', {${vars}})`;
        }
    );

    // Replace console.log('...', variable) -> logger.debug('...', { data: variable });
    content = content.replace(
        /console\.log\(['"]([^'"]+)['"]\s*,\s*([a-zA-Z_]+)\)/g,
        (match, message, varName) => {
            if (varName !== 'error') {
                replacements++;
                return `logger.debug('${message}', { ${varName} })`;
            }
            return match;
        }
    );

    if (replacements > 0) {
        fs.writeFileSync(filePath, content);
        console.log(`${file}: ${replacements} replacements`);
        totalReplacements += replacements;
    }
}

// Also process auth.middleware.ts
const authMiddleware = path.join(__dirname, '../src/middlewares/auth.middleware.ts');
if (fs.existsSync(authMiddleware)) {
    let content = fs.readFileSync(authMiddleware, 'utf8');
    let replacements = 0;

    content = content.replace(
        /console\.error\(['"]([^'"]+)['"]\s*,\s*error\)/g,
        (match, message) => {
            replacements++;
            return `logger.error('${message}', { error })`;
        }
    );

    if (replacements > 0) {
        fs.writeFileSync(authMiddleware, content);
        console.log(`auth.middleware.ts: ${replacements} replacements`);
        totalReplacements += replacements;
    }
}

console.log(`\nTotal: ${totalReplacements} replacements`);
