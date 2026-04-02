import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OcrResult {
  text: string;
  confidence: number;
  lines: string[];
}

export interface MenuOcrResult {
  rawText: string;
  items: MenuItemCandidate[];
}

export interface MenuItemCandidate {
  name: string;
  price?: string;
  description?: string;
}

/**
 * OCR service for menu and label scanning.
 *
 * Uses Google Cloud Vision API for text extraction from photos.
 * Inspired by mise's ocr2txt tool pattern: image → text → structured parse.
 *
 * Environment:
 *   GOOGLE_CLOUD_VISION_KEY — API key for Cloud Vision (or use service account)
 */
@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_CLOUD_VISION_KEY');
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_CLOUD_VISION_KEY not set — OCR disabled');
    }
  }

  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Extract text from an image URL (e.g., R2 presigned URL).
   */
  async extractText(imageUrl: string): Promise<OcrResult> {
    if (!this.apiKey) {
      throw new Error('OCR not configured: GOOGLE_CLOUD_VISION_KEY missing');
    }

    const body = {
      requests: [
        {
          image: { source: { imageUri: imageUrl } },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        },
      ],
    };

    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Vision API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const annotation = data.responses?.[0]?.fullTextAnnotation;

    if (!annotation) {
      return { text: '', confidence: 0, lines: [] };
    }

    const text = annotation.text || '';
    const lines = text.split('\n').filter((l: string) => l.trim());
    const pages = annotation.pages || [];
    const confidence =
      pages.length > 0 ? pages[0].confidence ?? 0.9 : 0.9;

    return { text, confidence, lines };
  }

  /**
   * Extract text from a base64-encoded image (for direct mobile uploads).
   */
  async extractTextFromBase64(
    base64Content: string,
    mimeType = 'image/jpeg',
  ): Promise<OcrResult> {
    if (!this.apiKey) {
      throw new Error('OCR not configured: GOOGLE_CLOUD_VISION_KEY missing');
    }

    const body = {
      requests: [
        {
          image: { content: base64Content },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        },
      ],
    };

    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Vision API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const annotation = data.responses?.[0]?.fullTextAnnotation;

    if (!annotation) {
      return { text: '', confidence: 0, lines: [] };
    }

    const text = annotation.text || '';
    const lines = text.split('\n').filter((l: string) => l.trim());

    return { text, confidence: 0.9, lines };
  }

  /**
   * Parse OCR output into menu item candidates.
   *
   * Heuristic: lines with a price pattern (e.g., $12.99, ₩15,000) are menu items.
   * The line before a price line (if it doesn't contain a price) is the item name.
   */
  parseMenuItems(ocrResult: OcrResult): MenuOcrResult {
    const pricePattern = /[$€£¥₩]\s*[\d,.]+|[\d,.]+\s*(?:원|won|usd|eur)/i;
    const items: MenuItemCandidate[] = [];
    const { lines } = ocrResult;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const priceMatch = line.match(pricePattern);

      if (priceMatch) {
        const price = priceMatch[0].trim();
        // Name is either on the same line before the price, or the previous line
        const beforePrice = line.slice(0, priceMatch.index).trim();
        const name = beforePrice || (i > 0 ? lines[i - 1].trim() : '');

        if (name && !pricePattern.test(name)) {
          items.push({ name, price });
        }
      }
    }

    // If no prices found, treat each non-empty line as a potential item name
    if (items.length === 0) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length >= 2 && trimmed.length <= 80) {
          items.push({ name: trimmed });
        }
      }
    }

    return { rawText: ocrResult.text, items };
  }
}
