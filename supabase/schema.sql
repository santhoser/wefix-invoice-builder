-- WeFix Invoice Builder - Supabase PostgreSQL schema
-- Regenerated from local .env company settings on 2026-05-22.
-- Run this in the Supabase SQL Editor to set up or refresh the database objects.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Company profile
CREATE TABLE IF NOT EXISTS company_profile (
    id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name     varchar(200) NOT NULL,
    address_line_1   varchar(250) NOT NULL,
    address_line_2   varchar(250),
    suburb           varchar(150),
    state            varchar(50),
    pin              varchar(20),
    phone            varchar(50),
    email            varchar(254),
    abn              varchar(50),
    account_name     varchar(200),
    bsb              varchar(20),
    account_number   varchar(50),
    pay_id           varchar(50),
    contact_name     varchar(150),
    contact_phone    varchar(50),
    logo_storage_key varchar(500),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Invoice counters
-- Used for concurrency-safe invoice number generation.
CREATE TABLE IF NOT EXISTS invoice_counters (
    date_prefix varchar(10) PRIMARY KEY, -- format: YYMM/DD
    counter     integer NOT NULL DEFAULT 1
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number   varchar(50)     NOT NULL UNIQUE,
    invoice_date     date            NOT NULL,
    include_abn      boolean         NOT NULL DEFAULT true,
    customer_name    varchar(200)    NOT NULL,
    customer_address varchar(250)    NOT NULL,
    customer_suburb  varchar(150)    NOT NULL,
    customer_state   varchar(50)     NOT NULL,
    customer_pin     varchar(20)     NOT NULL,
    customer_email   varchar(254),
    customer_phone   varchar(50),
    subtotal_amount  numeric(12, 2)  NOT NULL,
    tax_rate         numeric(5, 2)   NOT NULL DEFAULT 10.00,
    tax_amount       numeric(12, 2)  NOT NULL,
    total_amount     numeric(12, 2)  NOT NULL,
    amount_paid      numeric(12, 2)  DEFAULT 0,
    balance_amount   numeric(12, 2)  DEFAULT 0,
    status           varchar(30)     NOT NULL DEFAULT 'Saved',
    json_file_id     uuid,
    pdf_file_id      uuid,
    created_at       timestamptz     NOT NULL DEFAULT now(),
    updated_at       timestamptz     NOT NULL DEFAULT now(),
    created_by       varchar(100),
    updated_by       varchar(100)
);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date  ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoices_status        ON invoices(status);

-- Invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id  uuid            NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_no     integer         NOT NULL,
    description text            NOT NULL,
    quantity    numeric(12, 2)  NOT NULL DEFAULT 1,
    unit_price  numeric(12, 2)  NOT NULL,
    line_total  numeric(12, 2)  NOT NULL,
    created_at  timestamptz     NOT NULL DEFAULT now(),
    updated_at  timestamptz     NOT NULL DEFAULT now(),
    UNIQUE (invoice_id, line_no)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Invoice files
CREATE TABLE IF NOT EXISTS invoice_files (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          uuid            NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    file_type           varchar(20)     NOT NULL CHECK (file_type IN ('JSON', 'PDF')),
    storage_provider    varchar(50)     NOT NULL DEFAULT 'SupabaseStorage',
    bucket_name         varchar(100)    NOT NULL,
    storage_key         varchar(500)    NOT NULL,
    original_file_name  varchar(255)    NOT NULL,
    mime_type           varchar(100)    NOT NULL,
    file_size_bytes     bigint,
    checksum            varchar(128),
    created_at          timestamptz     NOT NULL DEFAULT now(),
    created_by          varchar(100)
);

CREATE INDEX IF NOT EXISTS idx_invoice_files_invoice_id   ON invoice_files(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_files_invoice_type ON invoice_files(invoice_id, file_type);

-- Email log
CREATE TABLE IF NOT EXISTS email_log (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      uuid         NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    recipient_list  text         NOT NULL,
    subject         varchar(250) NOT NULL,
    status          varchar(30)  NOT NULL DEFAULT 'Pending',
    error_message   text,
    sent_at         timestamptz,
    created_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_invoice_id ON email_log(invoice_id);

-- Function: get_next_invoice_counter
-- Atomic counter increment for concurrency-safe invoice numbering.
CREATE OR REPLACE FUNCTION get_next_invoice_counter(p_date_prefix varchar)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_counter integer;
BEGIN
    INSERT INTO invoice_counters (date_prefix, counter)
    VALUES (p_date_prefix, 1)
    ON CONFLICT (date_prefix)
    DO UPDATE SET counter = invoice_counters.counter + 1
    RETURNING counter INTO v_counter;

    RETURN v_counter;
END;
$$;

-- Seed: default company profile from .env
-- Runtime Supabase keys, SMTP credentials, and app login secrets are intentionally
-- not stored in SQL.
WITH existing_profile AS (
    SELECT id
    FROM company_profile
    ORDER BY created_at ASC, id ASC
    LIMIT 1
),
updated_profile AS (
    UPDATE company_profile
    SET
        company_name = 'WEFIX HANDYMAN',
        address_line_1 = '35 Traeger Street',
        address_line_2 = NULL,
        suburb = 'Dunlop',
        state = 'ACT',
        pin = '2615',
        phone = '0424 825 551',
        email = 'wefixhandyman@yahoo.com',
        abn = '41335134334',
        account_name = 'WEFIXHANDYMAN',
        bsb = '062 907',
        account_number = '10366427',
        pay_id = '0424825551',
        contact_name = 'WeFix Support',
        contact_phone = '0424825551',
        updated_at = now()
    WHERE id = (SELECT id FROM existing_profile)
    RETURNING id
)
INSERT INTO company_profile (
    company_name,
    address_line_1,
    address_line_2,
    suburb,
    state,
    pin,
    phone,
    email,
    abn,
    account_name,
    bsb,
    account_number,
    pay_id,
    contact_name,
    contact_phone
)
SELECT
    'WEFIX HANDYMAN',
    '35 Traeger Street',
    NULL,
    'Dunlop',
    'ACT',
    '2615',
    '0424 825 551',
    'wefixhandyman@yahoo.com',
    '41335134334',
    'WEFIXHANDYMAN',
    '062 907',
    '10366427',
    '0424825551',
    'WeFix Support',
    '0424825551'
WHERE NOT EXISTS (SELECT 1 FROM updated_profile);

-- Storage bucket setup
-- The app currently writes JSON and PDF files to the private bucket below.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.schemata
        WHERE schema_name = 'storage'
    ) THEN
        INSERT INTO storage.buckets (
            id,
            name,
            public,
            file_size_limit,
            allowed_mime_types
        )
        VALUES (
            'invoice-files',
            'invoice-files',
            false,
            NULL,
            ARRAY['application/json', 'application/pdf']
        )
        ON CONFLICT (id) DO UPDATE
        SET
            name = EXCLUDED.name,
            public = EXCLUDED.public,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
    END IF;
END;
$$;

-- Row Level Security
-- The app uses SUPABASE_SECRET_KEY server-side, which bypasses RLS. Enable and
-- add policies here only if direct client-side database access is introduced.
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_files ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
