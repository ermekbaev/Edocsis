import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export interface StampData {
  approverName: string;  // ФИО согласующего
  position: string;      // Должность из справочника или роль
  date: Date;            // Дата согласования
  documentTitle: string;
  documentNumber: string;
}

/** Пытается загрузить шрифт с поддержкой кириллицы из системных шрифтов */
async function loadFont(pdfDoc: PDFDocument) {
  const systemFontPaths = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
  ];

  pdfDoc.registerFontkit(fontkit);

  for (const fontPath of systemFontPaths) {
    try {
      const fontBytes = await readFile(fontPath);
      return await pdfDoc.embedFont(fontBytes);
    } catch {
      // Пробуем следующий
    }
  }

  // Резервный шрифт без кириллицы
  return await pdfDoc.embedFont(StandardFonts.Helvetica);
}

/** Генерирует PDF со штампом согласования */
export async function generateApprovalStamp(data: StampData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // Размер страницы — горизонтальный A6 (~штамп)
  const pageWidth = 440;
  const pageHeight = 170;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const font = await loadFont(pdfDoc);

  const darkBlue = rgb(0.08, 0.18, 0.45);
  const white    = rgb(1, 1, 1);
  const black    = rgb(0, 0, 0);
  const gray     = rgb(0.4, 0.4, 0.4);
  const bgColor  = rgb(0.97, 0.97, 0.98);

  const m = 8; // margin

  // Фон
  page.drawRectangle({ x: m, y: m, width: pageWidth - 2 * m, height: pageHeight - 2 * m, color: bgColor });

  // Внешняя рамка
  page.drawRectangle({ x: m, y: m, width: pageWidth - 2 * m, height: pageHeight - 2 * m, borderColor: darkBlue, borderWidth: 2 });

  // Заголовок — синяя полоса
  const headerH = 32;
  page.drawRectangle({ x: m, y: pageHeight - m - headerH, width: pageWidth - 2 * m, height: headerH, color: darkBlue });

  // Текст заголовка "СОГЛАСОВАНО"
  const headerText = "СОГЛАСОВАНО";
  const headerSize = 15;
  const headerW = font.widthOfTextAtSize(headerText, headerSize);
  page.drawText(headerText, {
    x: (pageWidth - headerW) / 2,
    y: pageHeight - m - headerH + 9,
    size: headerSize,
    font,
    color: white,
  });

  // Тонкая линия под заголовком (уже нарисована рамкой)

  // Контент — три строки
  const labelSize = 9;
  const valueSize = 10.5;
  const labelX = m + 14;
  const valueX = m + 110;
  const lineGap = 26;

  let y = pageHeight - m - headerH - 28;

  // Владелец
  page.drawText("Владелец:", { x: labelX, y, size: labelSize, font, color: gray });
  page.drawText(data.approverName, { x: valueX, y, size: valueSize, font, color: black });

  y -= lineGap;

  // Должность
  page.drawText("Должность:", { x: labelX, y, size: labelSize, font, color: gray });
  const posText = data.position.length > 42 ? data.position.slice(0, 42) + "…" : data.position;
  page.drawText(posText, { x: valueX, y, size: valueSize, font, color: black });

  y -= lineGap;

  // Дата
  const dateStr = data.date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  page.drawText("Дата:", { x: labelX, y, size: labelSize, font, color: gray });
  page.drawText(dateStr, { x: valueX, y, size: valueSize, font, color: black });

  y -= lineGap;

  // Документ (маленький шрифт)
  const docLabel = "Документ:";
  const docValue = `${data.documentNumber}`;
  page.drawText(docLabel, { x: labelX, y, size: labelSize, font, color: gray });
  page.drawText(docValue, { x: valueX, y, size: 9, font, color: gray });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/** Сохраняет буфер штампа на диск и возвращает путь */
export async function saveStampToDisk(
  documentId: string,
  buffer: Buffer
): Promise<{ webPath: string; fileName: string }> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const timestamp = Date.now();
  const fileName = `stamp-${documentId}-${timestamp}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  await writeFile(filePath, buffer);

  return { webPath: `/uploads/${fileName}`, fileName };
}
