# Invoice Generation Web Application Requirements

## 1. Project Overview
This document defines the functional, technical, data, and non-functional requirements for a mobile-friendly invoice generation web application for WEFIX HANDYMAN. The application will be built using Next.js and Node.js, hosted on Vercel, and will use Supabase as the primary persistence layer for structured invoice data and file storage because Vercel serverless environments do not provide reliable persistent local file storage. [file:9]

The application will support authenticated access, invoice creation through a guided multi-step workflow, invoice PDF generation aligned to the supplied invoice format, email delivery of generated invoices, and download of generated PDFs. The WEFIX HANDYMAN logo and invoice sample are treated as supplied visual assets that drive the PDF layout and branding requirements. [file:8][file:9]

## 2. Objectives
The primary objective is to provide a simple, mobile-friendly application that allows a user to create professional invoices that visually match the supplied WEFIX HANDYMAN invoice format. The solution must support invoice capture, PDF generation, storage of structured invoice data, JSON snapshot retention, and email delivery with minimal operational complexity in Phase 1. [file:9]

A secondary objective is to ensure the design is cloud-compatible for Vercel deployment while remaining developer-friendly for local development using PostgreSQL or SQL Server. The requirements therefore define a PostgreSQL-first storage design for Supabase and identify local SQL Server compatibility considerations where relevant. [file:9]

## 3. In Scope
Phase 1 is in scope for the following capabilities:
- Hardcoded-credential login.
- Authenticated access to the application home page.
- Home page actions for Generate New Invoice, Regenerate Old Invoice, and Settings, with only Generate New Invoice active in Phase 1.
- Multi-step invoice creation wizard.
- Invoice PDF generation matching the supplied invoice sample as closely as practical.
- JSON snapshot storage of invoice payloads.
- Structured invoice data storage in Supabase.
- Emailing generated invoices with PDF attachment using Gmail SMTP.
- Downloading generated PDF files.
- Cloud-compatible file storage design for JSON and optionally PDF artifacts. [file:9]

## 4. Out of Scope
The following are out of scope for Phase 1:
- Full user administration and self-service user management.
- Regenerate Old Invoice implementation.
- Settings implementation.
- Backend relational database engines other than Supabase PostgreSQL for the hosted production environment.
- ERP/accounting integration.
- Payment gateway integration.
- Multi-tenant billing or role-based access control.
- Automated tax configuration management beyond the explicitly configured invoice behavior. [file:9]

## 5. Users and Usage Context
The primary user is an internal business operator creating invoices for WEFIX HANDYMAN customers. The typical usage context includes mobile phone, tablet, and desktop access, with emphasis on quick form entry and a low-friction invoice workflow suitable for field or office use. [file:9]

The system is intended for a low-volume to moderate-volume Phase 1 business workflow where reliability, clarity, and speed of invoice generation are more important than advanced administrative features. The UI must therefore prioritize fast data entry, obvious action states, and clear save/email/download outcomes. [file:9]

## 6. Assumptions and Constraints
### Assumptions
- The supplied invoice PDF is the canonical visual reference for the Phase 1 PDF layout. [file:9]
- The supplied WEFIX HANDYMAN logo is the canonical branding asset for the generated invoice header. [file:8]
- Company details such as company name, address, phone, email, ABN, and account details are configurable and not hardcoded in UI components.
- Supabase is available for hosted storage and authentication-adjacent infrastructure needs, although login credentials remain hardcoded in Phase 1.
- SMTP credentials will be externally configured through environment variables or equivalent secure configuration.
- Only one organization profile is required in Phase 1.

### Constraints
- Vercel-hosted serverless functions cannot be treated as a reliable persistent local file store, so invoice JSON and file artifacts must use cloud-compatible persistence. [file:9]
- The application must be deployable on Vercel using Next.js and Node.js.
- Phase 1 credentials are hardcoded, which limits security maturity.
- The PDF should closely resemble the supplied layout, including company header, bill-to area, invoice/date area, large item section, totals area, and footer account/contact details. [file:9]

## 7. Technology Stack
| Layer | Technology | Requirement |
|---|---|---|
| Frontend | Next.js | Primary web application framework |
| Runtime | Node.js | Server-side execution for API routes/server actions |
| Hosting | Vercel | Primary deployment target |
| Database | Supabase PostgreSQL | Primary hosted persistence layer |
| File Storage | Supabase Storage | Recommended storage for JSON and PDF artifacts |
| UI Scripting | Native React/Next.js, jQuery only if truly needed | Prefer modern React patterns |
| PDF Generation | Open-source Node.js-compatible PDF library | Must support invoice layout fidelity |
| Email | Gmail SMTP | Send invoice PDF as email attachment |
| Local Development DB | PostgreSQL or SQL Server | Supported local development option |

The application must avoid .NET runtime assumptions because the hosting target is Vercel and the selected architecture is Node.js-based. The data and file design must align with Supabase and cloud object storage patterns. [file:9]

## 8. Deployment and Hosting Considerations
The production deployment target is Vercel, so the solution architecture must assume ephemeral server execution and avoid any design that depends on persistent local disk writes between requests. Persistent invoice data must be committed to Supabase PostgreSQL, and invoice JSON snapshots and generated PDFs should be stored in Supabase Storage or a comparable persistent object storage mechanism. [file:9]

For local development, the application should support environment-based configuration to target either a local PostgreSQL instance or a local SQL Server instance. The requirements and data model should remain logically portable, with PostgreSQL as the canonical production schema and documented mapping notes for SQL Server development. [file:9]

## 9. Application Architecture Overview
The application will use a client-server web architecture implemented within Next.js. The browser-based UI will provide the login flow, home screen, and multi-step invoice wizard, while server-side Node.js execution will handle data persistence, PDF generation, storage operations, and email delivery.

Supabase PostgreSQL will act as the system of record for invoice header and item data. Supabase Storage will retain JSON snapshots and optionally generated PDF files, with metadata stored in relational tables so invoice records can be linked to stored artifacts. [file:9]

## 10. Functional Requirements
### 10.1 Authentication
The application shall provide a login page with username and password fields. In Phase 1, credentials shall be hardcoded and compared securely within the application runtime or server-side logic.

If an already authenticated user navigates to the login page, the user shall be redirected automatically to the home page. The application should also provide a logout action that clears the authenticated session and returns the user to the login page.

#### Authentication requirements
| Requirement ID | Description |
|---|---|
| AUTH-01 | User shall enter username and password to log in. |
| AUTH-02 | Invalid credentials shall display an inline error message. |
| AUTH-03 | Authenticated users visiting login shall be redirected to home. |
| AUTH-04 | Unauthenticated users attempting to access protected pages shall be redirected to login. |
| AUTH-05 | Logout capability should be available in Phase 1. |

### 10.2 Home Page
The home page shall display three actions:
- Generate New Invoice
- Regenerate Old Invoice
- Settings

In Phase 1, only Generate New Invoice shall be enabled. Regenerate Old Invoice and Settings shall be visible but disabled or clearly labelled as Phase 2 features.

### 10.3 Generate Invoice Wizard
The invoice creation flow shall be implemented as a mobile-friendly multi-step wizard with Back and Next navigation. Entered data shall persist between steps within the active session, and the application shall validate required fields before allowing progression where appropriate.

The wizard shall include four screens:
1. Invoice Details
2. Customer Details
3. Items
4. Overview and Actions

#### General wizard requirements
| Requirement ID | Description |
|---|---|
| WIZ-01 | Back and Next navigation shall be available where appropriate. |
| WIZ-02 | Entered values shall remain available when navigating between screens. |
| WIZ-03 | Validation shall prevent incomplete critical data from moving forward when required. |
| WIZ-04 | User shall be warned before losing unsaved progress. |
| WIZ-05 | Wizard shall be usable on mobile and desktop form factors. |

### 10.4 Invoice Details Screen
#### Purpose
Capture invoice metadata and output options that affect invoice identity and PDF rendering.

#### Fields
| Field | Type | Default | Required | Notes |
|---|---|---|---|---|
| Date | Date | Today’s date | Yes | Editable |
| Invoice Number | Text | Auto-generated `yyMM/dd-[counter]` | Yes | Editable by user |
| Include ABN | Checkbox | Checked | Yes | Controls ABN visibility on PDF |

#### Behavioral requirements
- The default invoice number format shall be `yyMM/dd-[counter]`.
- The application shall generate the next counter value in a concurrency-safe way using the database, not in-memory state.
- The user may override the auto-generated invoice number, subject to uniqueness validation.
- Because the invoice number contains `/`, the application shall derive a safe storage filename/key variant for JSON and PDF artifacts, for example by replacing unsafe characters with `-` or `_`.
- If Include ABN is unchecked, the generated PDF shall omit the company ABN line or field. [file:9]

### 10.5 Customer Details Screen
#### Purpose
Capture the bill-to recipient details for rendering in the invoice header block.

#### Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| Name | Text | Yes | Customer name shown in Bill To section |
| Address | Text | Yes | Street address |
| Suburb | Text | Yes | Suburb/locality |
| State | Text | Yes | State/territory |
| Pin | Text | Yes | Postal code |
| Email | Email | No | Used to prefill email action |
| Phone | Text | No | Optional customer phone |

#### Behavioral requirements
- Customer details shall populate the Bill To section in the generated invoice PDF.
- Email, when provided, shall be used as the default recipient for the Email action.
- Phone and email may be omitted from the PDF if not provided, subject to layout rules aligned with the sample format. [file:9]

### 10.6 Items Screen
#### Purpose
Capture one or more invoice line items and derived totals.

#### Fields per item
| Field | Type | Default | Required | Notes |
|---|---|---|---|---|
| Description | Text | Blank | Yes | Item description |
| Quantity | Decimal/number | 1 | Yes | Minimum 1 |
| Price | Decimal/currency | Blank | Yes | Unit price or amount input |
| Total | Decimal/currency | Derived | Yes | Read-only, calculated as quantity × price |

#### Behavioral requirements
- The screen shall allow one or more items.
- Add Items shall append a new item row or form section.
- Edit shall allow updating an existing item.
- Remove item should be supported as a recommended usability feature.
- Totals shall recalculate automatically when quantity or price changes.
- Quantity and price shall accept positive numeric values; decimals shall be allowed where appropriate.
- Blank, invalid, or zero-value items shall trigger validation feedback before save.

### 10.7 Overview and Actions Screen
#### Purpose
Display the complete invoice preview and expose final actions.

#### Buttons
- Close
- Save
- Print
- Download
- Email

#### Behavioral requirements
- On initial entry to the overview screen, only Close and Save shall be enabled.
- Print, Download, and Email shall remain disabled until Save succeeds.
- If the user clicks Close before Save, the application shall warn that unsaved data will be lost.
- Save shall persist invoice header data, line items, and associated metadata in Supabase and store the JSON representation as a file artifact.
- On successful Save, the application shall enable Print, Download, and Email.
- Email shall prefill the customer email if available and allow additional recipients to be added manually.
- If no customer email is present, the Email action shall require manual entry of at least one valid recipient before sending.

#### Save outcome requirements
| Requirement ID | Description |
|---|---|
| SAVE-01 | Save shall create or update database records according to uniqueness rules. |
| SAVE-02 | Save shall store a JSON snapshot file for the invoice. |
| SAVE-03 | Save success shall display visible confirmation. |
| SAVE-04 | Save failure shall display clear error feedback. |
| SAVE-05 | If database write succeeds but file storage fails, the system shall surface a partial failure state and record the error. |
| SAVE-06 | If file storage succeeds but database write fails, the system shall not mark the invoice as successfully saved. |

### 10.8 PDF Generation
The application shall generate a PDF invoice whose layout closely matches the supplied invoice sample. The PDF shall include, at minimum, the following sections aligned to the supplied design:
- Company logo and company header block.
- Company address, phone, ABN, and email block.
- Bill To block.
- Invoice number and invoice date block.
- Main description/amount table.
- Summary/totals area with subtotal, tax rate, tax, and total.
- Footer section with thank-you note, account details, and contact details. [file:8][file:9]

The sample invoice shows WEFIX HANDYMAN branding, company address, phone, ABN, email, BILL TO section, invoice number and date columns, description grid, subtotal/tax/total section, thank-you message, account details, and contact line, and the generated document should follow this structural arrangement as closely as practical. [file:9]

### 10.9 Data Persistence
The application shall use Supabase PostgreSQL as the primary source of truth for invoice data. Invoice header records, item records, and file metadata records shall be persisted in relational tables.

The invoice number shall be unique at the database level. The application shall support lookup and relationship traversal between invoice headers, line items, and file artifacts.

### 10.10 JSON File Storage
A JSON snapshot of each saved invoice shall be generated and stored as a file artifact. The file shall represent the invoice payload at save time and should include header, customer, item, totals, rendering flags such as Include ABN, and metadata sufficient to reconstruct or inspect the invoice state.

The JSON file shall not depend on local server disk persistence in production. Instead, it should be stored using Supabase Storage or equivalent cloud-compatible storage, with file metadata recorded in the database. [file:9]

### 10.11 Email Sending
The application shall email the generated PDF as an attachment using Gmail SMTP. Recipient email shall default from the customer email field when available, with support for additional recipients.

Email sending shall provide visible success or failure feedback. SMTP configuration shall come from environment variables or equivalent secure configuration, not hardcoded source values.

## 11. Business Rules
| Rule ID | Rule |
|---|---|
| BR-01 | Only authenticated users may access invoice functions. |
| BR-02 | Only Generate New Invoice is active in Phase 1 home page actions. |
| BR-03 | Invoice numbers must be unique. |
| BR-04 | Invoice number display format defaults to `yyMM/dd-[counter]`. |
| BR-05 | Artifact storage keys must use a filename-safe transformed version of the invoice number. |
| BR-06 | Include ABN checkbox controls whether ABN is shown on the generated invoice. |
| BR-07 | Print, Download, and Email are enabled only after successful save. |
| BR-08 | Save must persist both relational invoice data and JSON snapshot intent, even if a partial-failure state requires retry or remediation. |
| BR-09 | Customer email is optional during data entry but mandatory for email sending unless manually entered later. |

## 12. Data Requirements
The system shall store invoice data at both structured and artifact levels.

### Required invoice data domains
- Invoice header metadata.
- Customer/bill-to details.
- Invoice line items.
- Totals and tax summary.
- Output/rendering flags, such as Include ABN.
- Artifact metadata for JSON snapshots and optionally PDFs.
- Email activity metadata if implemented.

### High-level JSON snapshot structure
The JSON snapshot should include:
- Invoice ID / external invoice number.
- Date.
- Company profile snapshot used at generation time.
- Customer details.
- Line items.
- Summary totals.
- Tax details.
- Include ABN flag.
- File metadata if available.
- Audit timestamps.

## 13. Data Models and Table Structures
### 13.1 Logical model overview
The minimum logical entities are:
- invoices
- invoice_items
- invoice_files
- company_profile or application_settings
- optional email_log

### 13.2 Recommended PostgreSQL / Supabase physical schema
#### Table: invoices
| Column | Suggested Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary key |
| invoice_number | varchar(50) | Yes | Unique business invoice number |
| invoice_date | date | Yes | Invoice date |
| include_abn | boolean | Yes | Default true |
| customer_name | varchar(200) | Yes | Bill-to name |
| customer_address | varchar(250) | Yes | Street address |
| customer_suburb | varchar(150) | Yes | Suburb |
| customer_state | varchar(50) | Yes | State |
| customer_pin | varchar(20) | Yes | Postal code |
| customer_email | varchar(254) | No | Optional |
| customer_phone | varchar(50) | No | Optional |
| subtotal_amount | numeric(12,2) | Yes | Subtotal |
| tax_rate | numeric(5,2) | Yes | Example 10.00 |
| tax_amount | numeric(12,2) | Yes | Tax amount |
| total_amount | numeric(12,2) | Yes | Final total |
| amount_paid | numeric(12,2) | No | Optional if supported from sample-driven layout |
| balance_amount | numeric(12,2) | No | Optional if supported |
| status | varchar(30) | Yes | Draft, Saved, Emailed, etc. |
| json_file_id | uuid | No | Optional link to invoice_files |
| pdf_file_id | uuid | No | Optional link to invoice_files |
| created_at | timestamptz | Yes | Audit |
| updated_at | timestamptz | Yes | Audit |
| created_by | varchar(100) | No | Optional audit |
| updated_by | varchar(100) | No | Optional audit |

Indexes and constraints:
- Primary key on `id`.
- Unique index on `invoice_number`.
- Index on `invoice_date`.
- Index on `customer_name` if future lookup is needed.

#### Table: invoice_items
| Column | Suggested Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary key |
| invoice_id | uuid | Yes | Foreign key to invoices.id |
| line_no | integer | Yes | Sequence number |
| description | text | Yes | Line description |
| quantity | numeric(12,2) | Yes | Default 1.00 |
| unit_price | numeric(12,2) | Yes | Unit value |
| line_total | numeric(12,2) | Yes | Derived amount |
| created_at | timestamptz | Yes | Audit |
| updated_at | timestamptz | Yes | Audit |

Indexes and constraints:
- Primary key on `id`.
- Foreign key on `invoice_id` referencing invoices.id.
- Unique constraint on `(invoice_id, line_no)`.
- Index on `invoice_id`.

#### Table: invoice_files
| Column | Suggested Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary key |
| invoice_id | uuid | Yes | Foreign key to invoices.id |
| file_type | varchar(20) | Yes | JSON or PDF |
| storage_provider | varchar(50) | Yes | e.g. SupabaseStorage |
| bucket_name | varchar(100) | Yes | Storage bucket |
| storage_key | varchar(500) | Yes | Path/key |
| original_file_name | varchar(255) | Yes | Logical filename |
| mime_type | varchar(100) | Yes | MIME type |
| file_size_bytes | bigint | No | Optional |
| checksum | varchar(128) | No | Optional integrity field |
| created_at | timestamptz | Yes | Audit |
| created_by | varchar(100) | No | Optional audit |

Indexes and constraints:
- Primary key on `id`.
- Foreign key on `invoice_id`.
- Index on `invoice_id`.
- Index on `(invoice_id, file_type)`.

#### Table: company_profile
| Column | Suggested Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary key |
| company_name | varchar(200) | Yes | Example: WEFIX HANDYMAN |
| address_line_1 | varchar(250) | Yes | Example from supplied invoice |
| address_line_2 | varchar(250) | No | Optional |
| suburb | varchar(150) | No | Optional |
| state | varchar(50) | No | Optional |
| pin | varchar(20) | No | Optional |
| phone | varchar(50) | No | Company phone |
| email | varchar(254) | No | Company email |
| abn | varchar(50) | No | Company ABN |
| account_name | varchar(200) | No | Bank account name |
| bsb | varchar(20) | No | Bank BSB |
| account_number | varchar(50) | No | Account number |
| pay_id | varchar(50) | No | PayID |
| contact_name | varchar(150) | No | Contact person |
| contact_phone | varchar(50) | No | Contact number |
| logo_storage_key | varchar(500) | No | Logo asset path |
| created_at | timestamptz | Yes | Audit |
| updated_at | timestamptz | Yes | Audit |

#### Optional table: email_log
| Column | Suggested Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary key |
| invoice_id | uuid | Yes | Foreign key |
| recipient_list | text | Yes | Stored recipient list |
| subject | varchar(250) | Yes | Email subject |
| status | varchar(30) | Yes | Pending, Sent, Failed |
| error_message | text | No | Failure details |
| sent_at | timestamptz | No | Success timestamp |
| created_at | timestamptz | Yes | Audit |

### 13.3 SQL Server local development mapping notes
For local SQL Server development:
- `uuid` may map to `uniqueidentifier`.
- `timestamptz` may map to `datetimeoffset` or `datetime2` based on implementation preference.
- `numeric(12,2)` remains compatible.
- `boolean` may map to `bit`.
- PostgreSQL JSON/JSONB-specific design should be avoided for core mandatory fields unless abstraction is added.
- Storage metadata should remain relational so the schema remains portable across PostgreSQL and SQL Server.

## 14. Validation Rules
| Field/Rule | Validation |
|---|---|
| Username | Required |
| Password | Required |
| Invoice Date | Required, valid date |
| Invoice Number | Required, unique, max length defined by implementation |
| Customer Name | Required |
| Address | Required |
| Suburb | Required |
| State | Required |
| Pin | Required, format configurable by business rule |
| Customer Email | Optional, but if entered must be valid email format |
| Customer Phone | Optional, but if entered should allow valid phone characters |
| Item Description | Required |
| Quantity | Required, numeric, greater than 0 |
| Price | Required, numeric, greater than or equal to 0 |
| Total | Derived, read-only |
| Email recipients | Required for send action, all must be valid email addresses |

The application should also validate that at least one invoice item exists before save, and that the totals stored match the sum of item lines and tax calculation rules in use. [file:9]

## 15. UI/UX Requirements
- The application shall be mobile-first and fully usable on common mobile and desktop screen sizes.
- Forms shall present labels clearly and use accessible input states.
- Validation messages shall appear near relevant fields.
- Buttons shall clearly indicate enabled, disabled, loading, success, and error states.
- The wizard shall provide obvious step progression and navigation.
- Destructive or data-loss actions shall require confirmation.
- Save, PDF generation, file upload, and email actions shall provide loading/progress feedback.
- Overview page layout should give the user confidence before save by clearly summarizing invoice content.

## 16. Non-Functional Requirements
### Security
- Protected routes must require authenticated access.
- Credentials must not be exposed in client-side source in an insecure manner.
- SMTP credentials and Supabase secrets must be stored in environment variables.
- Phase 1 hardcoded credentials are a temporary limitation and should be documented as a risk.

### Performance
- Standard invoice save and PDF generation should complete within an acceptable user-facing response window for low-volume operational use.
- Common user actions should avoid unnecessary reloads and support responsive interaction.

### Reliability
- Invoice save operations must be designed to handle partial failures across database and file storage.
- Errors must be logged with sufficient diagnostic context.
- Database uniqueness rules must prevent duplicate invoice numbers.

### Maintainability
- Data access and file storage logic should be modular.
- The application should be configurable by environment.
- The schema should support later implementation of Regenerate Old Invoice and Settings.

### Compatibility
- Production target: Vercel + Supabase.
- Local development target: PostgreSQL or SQL Server.
- UI should support modern evergreen browsers and mobile devices.

## 17. Phase Breakdown
| Phase | Scope |
|---|---|
| Phase 1 | Login, home page, generate invoice wizard, save invoice to Supabase, store JSON snapshot file, generate PDF, email PDF, download PDF, branding/config support |
| Phase 2 | Regenerate Old Invoice, Settings, enhanced history/search, broader administration |

## 18. Acceptance Criteria
| ID | Acceptance Criteria |
|---|---|
| AC-01 | User can log in using valid hardcoded credentials and access the home page. |
| AC-02 | Authenticated user navigating to login is redirected to home. |
| AC-03 | Home page shows all three actions, with only Generate New Invoice enabled in Phase 1. |
| AC-04 | User can complete the four-step invoice wizard on mobile and desktop. |
| AC-05 | Default invoice date is today. |
| AC-06 | Default invoice number is generated in `yyMM/dd-[counter]` format. |
| AC-07 | User can edit invoice number, and duplicate invoice numbers are rejected. |
| AC-08 | Unchecking Include ABN removes ABN from the generated PDF. |
| AC-09 | User can add one or more invoice items and totals calculate correctly. |
| AC-10 | Save persists invoice data to Supabase and stores a JSON snapshot artifact. |
| AC-11 | Print, Download, and Email remain disabled until Save succeeds. |
| AC-12 | Generated PDF visually reflects the supplied WEFIX HANDYMAN invoice structure including logo, bill-to section, invoice/date block, item area, totals, and footer details. [file:8][file:9] |
| AC-13 | Email action attaches the generated PDF and supports default + additional recipients. |
| AC-14 | Download action downloads the generated PDF successfully. |
| AC-15 | System shows clear user feedback on success and failure for save, email, and PDF operations. |

## 19. Risks and Open Questions
### Risks
- Hardcoded credentials are not suitable for long-term production security.
- PDF layout fidelity may vary depending on the chosen PDF generation library and rendering strategy.
- Partial failure between relational save and file storage requires explicit compensating behavior.
- Tax handling in the sample invoice includes subtotal, tax rate, tax, total, and also shows paid/balance values, but the user input screens do not currently include separate fields for paid amount and balance management. [file:9]
- The sample invoice visually represents detailed footer banking and contact details that must be sourced from configuration and kept editable for future change. [file:9]

### Open Questions
- Should paid amount and balance be part of Phase 1 input fields, since they appear in the supplied invoice sample? [file:9]
- Should generated PDFs be stored permanently in Supabase Storage, or generated on demand after save?
- Should Save overwrite an existing invoice with the same invoice number, or always block duplicates?
- Should invoice JSON snapshots be versioned on each save or replaced with the latest version only?
- Should tax rate be fixed at 10% by default, configurable globally, or editable per invoice? [file:9]
- Should company profile data stay only in configuration in Phase 1, or also be stored in the `company_profile` table for easier future Settings implementation?
