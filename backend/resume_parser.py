"""Extract plain text from PDF and DOCX uploads."""

from io import BytesIO

from docx import Document
from pypdf import PdfReader


def text_from_pdf(data: bytes) -> str:
    reader = PdfReader(BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            parts.append(t)
    return "\n".join(parts).strip()


def text_from_docx(data: bytes) -> str:
    doc = Document(BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()


def extract_text(filename: str, data: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return text_from_pdf(data)
    if lower.endswith(".docx"):
        return text_from_docx(data)
    raise ValueError("Supported formats: PDF, DOCX")
