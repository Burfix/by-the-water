import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    // Use pdf-parse via the lib path to avoid Next.js test-file issue
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const data = await pdfParse(buffer);
    const text: string = data.text;

    // ── Parse sections & questions from raw text ───────────────────────────
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    type ParsedSection = { title: string; questions: { text: string; riskLevel: string }[] };
    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection | null = null;

    // Patterns that indicate section headers (lines ending with % score or all caps-ish)
    const sectionPattern = /^(.+?)(?:\s*:\s*[\d,]+%.*)?$/;
    const resultPattern = /\s+(Yes|No|N\/A|See Notes)\s*$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip page header lines
      if (/^\d{2}\/\d{2}\/\d{4}/.test(line)) continue;
      if (/^Page \d+ of \d+/.test(line)) continue;
      if (/^(Checklist Name|Location|Checklist Ref|Start Date|Completed|Score|Questions|Details|Result)/.test(line)) continue;

      // Detect section headings — they contain a % score breakdown
      if (/:\s*[\d,]+%\s*\(\d+\/\d+/.test(line)) {
        const title = line.replace(/\s*:\s*[\d,]+%.*$/, '').trim();
        currentSection = { title, questions: [] };
        sections.push(currentSection);
        continue;
      }

      // First section header if no % yet
      if (!currentSection && line.length > 5 && line.length < 80 && !/Notes:/.test(line) && !resultPattern.test(line)) {
        currentSection = { title: line, questions: [] };
        sections.push(currentSection);
        continue;
      }

      // Lines ending with Yes/No/N/A are questions
      if (currentSection && resultPattern.test(line)) {
        const qText = line.replace(resultPattern, '').trim();
        if (qText.length > 5) {
          // Assign risk level heuristically
          let risk = 'MEDIUM';
          const lower = qText.toLowerCase();
          if (/fire|gas|emergency|explosion|extinguisher|suppress|sprinkler|smoke|detector/.test(lower)) risk = 'CRITICAL';
          else if (/electrical|wiring|fridge|hazard|safety|first aid|door/.test(lower)) risk = 'HIGH';
          else if (/light|bulb|clean|tidy|label|sign/.test(lower)) risk = 'LOW';
          currentSection.questions.push({ text: qText, riskLevel: risk });
        }
      }
    }

    const filtered = sections.filter((s) => s.questions.length > 0);
    return NextResponse.json({ success: true, data: { sections: filtered, pageCount: data.numpages } });
  } catch (err) {
    console.error('PDF parse error:', err);
    return NextResponse.json({ success: false, message: 'Failed to parse PDF. Make sure it is a text-based PDF.' }, { status: 500 });
  }
}
