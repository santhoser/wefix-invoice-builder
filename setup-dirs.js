const fs = require('fs');
const path = require('path');

const directories = [
    'types',
    'lib',
    'app',
    'app/login',
    'app/home',
    'app/invoice',
    'app/invoice/new',
    'app/api',
    'app/api/auth',
    'app/api/auth/login',
    'app/api/auth/logout',
    'app/api/auth/me',
    'app/api/invoices',
    'app/api/invoices/counter',
    'app/api/invoices/[id]',
    'app/api/pdf',
    'app/api/pdf/generate',
    'app/api/email',
    'app/api/email/send',
    'components',
    'components/ui',
    'components/wizard',
    'public',
    'supabase'
];

const basePath = process.cwd();

console.log('Creating directories in:', basePath);

directories.forEach(dir => {
    const fullPath = path.join(basePath, dir);
    try {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log('✓ Created: ' + dir);
    } catch (err) {
        console.error('✗ Error creating ' + dir + ':', err.message);
    }
});

// Copy logo file if it exists
const sourceFile = path.join(basePath, 'Requirements', 'wefix_logo.png');
const destFile = path.join(basePath, 'public', 'wefix_logo.png');

try {
    if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
        console.log('\n✓ Copied wefix_logo.png to public folder');
    } else {
        console.log('\n✗ Source file not found: ' + sourceFile);
    }
} catch (err) {
    console.error('✗ Error copying file:', err.message);
}

console.log('\n✓ Directory structure setup complete!');
