from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ats_engine import analyze_resume
from config import settings
from interview_engine import feedback_offline, feedback_with_openai, questions_for_role
from resume_parser import extract_text

app = FastAPI(title="CareerPrep API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ATSAnalyzeBody(BaseModel):
    resume_text: str = Field(default="", description="Raw resume text if no file upload")
    job_description: str = Field(default="", description="Target job description for keyword match")


class ATSResponse(BaseModel):
    overall_score: int
    keyword_match_pct: float
    structure_score: int
    readability_notes: list[str]
    strengths: list[str]
    improvements: list[str]
    missing_from_jd: list[str]
    matched_from_jd: list[str]


@app.get("/api/health")
def health():
    return {"status": "ok", "openai_configured": bool(settings.openai_api_key)}


@app.post("/api/ats/analyze-text", response_model=ATSResponse)
def ats_analyze_text(body: ATSAnalyzeBody):
    text = (body.resume_text or "").strip()
    if len(text) < 80:
        raise HTTPException(status_code=400, detail="Resume text is too short. Paste at least ~80 characters.")
    result = analyze_resume(text, body.job_description or None)
    return ATSResponse(
        overall_score=result.overall_score,
        keyword_match_pct=result.keyword_match_pct,
        structure_score=result.structure_score,
        readability_notes=result.readability_notes,
        strengths=result.strengths,
        improvements=result.improvements,
        missing_from_jd=result.missing_from_jd,
        matched_from_jd=result.matched_from_jd,
    )


@app.post("/api/ats/analyze-file", response_model=ATSResponse)
async def ats_analyze_file(
    file: UploadFile = File(...),
    job_description: str = Form(""),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    try:
        data = await file.read()
        text = extract_text(file.filename, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if len(text.strip()) < 80:
        raise HTTPException(
            status_code=400,
            detail="Could not extract enough text. Try another PDF/DOCX or paste text manually.",
        )
    result = analyze_resume(text, job_description or None)
    return ATSResponse(
        overall_score=result.overall_score,
        keyword_match_pct=result.keyword_match_pct,
        structure_score=result.structure_score,
        readability_notes=result.readability_notes,
        strengths=result.strengths,
        improvements=result.improvements,
        missing_from_jd=result.missing_from_jd,
        matched_from_jd=result.matched_from_jd,
    )


class QuestionsBody(BaseModel):
    role: str = Field(..., min_length=1, max_length=200)


class QuestionsResponse(BaseModel):
    role: str
    questions: list[str]


@app.post("/api/interview/questions", response_model=QuestionsResponse)
def interview_questions(body: QuestionsBody):
    qs = questions_for_role(body.role)
    return QuestionsResponse(role=body.role.strip(), questions=qs)


class FeedbackBody(BaseModel):
    role: str
    question: str
    answer: str
    job_context: str = ""


class FeedbackResponse(BaseModel):
    feedback_markdown: str
    used_ai: bool


@app.post("/api/interview/feedback", response_model=FeedbackResponse)
async def interview_feedback(body: FeedbackBody):
    answer = (body.answer or "").strip()
    if len(answer) < 10:
        raise HTTPException(status_code=400, detail="Answer is too short.")

    ai_text = await feedback_with_openai(
        body.role,
        body.question,
        answer,
        body.job_context or None,
    )
    if ai_text:
        return FeedbackResponse(feedback_markdown=ai_text, used_ai=True)
    return FeedbackResponse(feedback_markdown=feedback_offline(answer), used_ai=False)
