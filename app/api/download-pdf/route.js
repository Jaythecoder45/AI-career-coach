import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req) {
  try {
    const { title, notes } = await req.json();

    if (!notes) {
      return NextResponse.json(
        { error: "Notes content required" },
        { status: 400 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 Size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSize = 12;
    const maxWidth = 540;
    let y = 800;

    const formattedTitle = title || "Notes";
    page.drawText(formattedTitle, {
      x: 30,
      y,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 30;

    const lines = notes.split("\n");
    lines.forEach((line) => {
      const wrapped = font.splitTextIntoLines(line, maxWidth);
      wrapped.forEach((txt) => {
        if (y < 40) {
          page = pdfDoc.addPage([595, 842]);
          y = 800;
        }
        page.drawText(txt, { x: 30, y, size: fontSize, font });
        y -= 18;
      });
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = Buffer.from(pdfBytes).buffer;

    return new Response(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${formattedTitle}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
