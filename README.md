# FindMyID

A Next.js application for reporting found identity documents (IDs, passports, licenses) to help reunite them with their owners. Features ONNX-based OCR for automatic field extraction.

## Features

- **Document Upload**: Report found documents with image upload
- **OCR Auto-fill**: Automatic extraction of ID fields using RapidOCR ONNX
- **Search & Claim**: Search for documents and submit ownership claims
- **Admin Dashboard**: Review and manage submitted documents

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **OCR Service**: Python FastAPI with RapidOCR ONNX

## First-Time Setup

### 1. Install Node Dependencies

```bash
npm install
```

### 2. Setup Python OCR Environment (One-Time)

```bash
npm run setup:ocr
```

This creates a Python virtual environment and installs all required packages for the OCR service.

### 3. Configure Environment Variables

Copy `.env` and configure your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

### 4. Setup Supabase Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# Execute supabase-schema.sql in Supabase dashboard
```

## Running the Project

Simply run:

```bash
npm run dev
```

This command starts both services concurrently:
- **[NEXT]** Next.js application on port 3000
- **[OCR]** OCR microservice on port 3030

You do not need to open separate terminals.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both Next.js and OCR service |
| `npm run dev:next` | Start only Next.js (port 3000) |
| `npm run dev:ocr` | Start only OCR service (port 3030) |
| `npm run setup:ocr` | Setup Python virtual environment |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

## OCR Service Details

The OCR microservice (`mini-services/ocr-service/`) provides:

- **POST /ocr** - Multipart file upload for image processing
- **POST /ocr/base64** - Base64-encoded image processing
- **GET /** - Health check endpoint

### Extracted Fields

The OCR engine extracts the following from ID documents:

| Field | Description |
|-------|-------------|
| `surname` | Last name |
| `given_name` | First name(s) |
| `date_of_birth` | Birth date (DD.MM.YYYY) |
| `nin` | National ID number |
| `card_no` | Card number (9 digits) |
| `sex` | Gender (M/F) |
| `nationality` | Citizenship |
| `date_of_expiry` | Expiration date |

## Testing

1. Run `npm run dev`
2. Verify both services start (labeled `[NEXT]` and `[OCR]`)
3. Navigate to the upload document page
4. Upload an ID card image
5. Verify OCR automatically scans and fills form fields

## Project Structure

```
findmyid-project/
├── mini-services/
│   └── ocr-service/
│       ├── main.py           # FastAPI server
│       ├── ocr_engine.py     # OCR processing logic
│       └── requirements.txt  # Python dependencies
├── src/
│   ├── app/
│   │   └── api/ocr/route.ts  # Next.js OCR API route
│   ├── components/
│   │   └── findmyid/
│   │       └── upload-page.tsx
│   └── lib/
│       └── supabase.ts
├── supabase-schema.sql
└── package.json
```

## License

Private project
