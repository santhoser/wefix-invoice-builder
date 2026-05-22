#!/usr/bin/env python3
import os
import shutil

os.chdir(r'c:\Everi\Application\demos\WeFixInvoiceBuilder')

directories = [
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
]

print('Creating directories...')

for dir_name in directories:
    try:
        os.makedirs(dir_name, exist_ok=True)
        print(f'✓ Created: {dir_name}')
    except Exception as e:
        print(f'✗ Error creating {dir_name}: {str(e)}')

# Copy logo file if it exists
source_file = r'Requirements\wefix_logo.png'
dest_file = r'public\wefix_logo.png'

try:
    if os.path.exists(source_file):
        shutil.copy2(source_file, dest_file)
        print(f'\n✓ Copied wefix_logo.png to public folder')
    else:
        print(f'\n✗ Source file not found: {source_file}')
except Exception as e:
    print(f'✗ Error copying file: {str(e)}')

print('\n✓ Directory structure setup complete!')
