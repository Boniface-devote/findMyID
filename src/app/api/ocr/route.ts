import { NextRequest, NextResponse } from 'next/server';

const OCR_SERVICE_URL = 'http://localhost:3030';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json(
        { success: false, message: 'No image provided' },
        { status: 400 }
      );
    }

    const ocrFormData = new FormData();
    ocrFormData.append('file', image);

    const response = await fetch(`${OCR_SERVICE_URL}/ocr`, {
      method: 'POST',
      body: ocrFormData,
    });

    if (!response.ok) {
      throw new Error(`OCR service returned ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'OCR processing failed',
        fields: null,
      },
      { status: 500 }
    );
  }
}
