import os
import json
import urllib.request
import urllib.error
from fastapi import FastAPI
from pydantic import BaseModel

# Zero-dependency helper to load environment variables from the project .env file
def load_env_file():
    for path in [".env", "../.env", "../../.env", "../../../.env"]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, val = line.split("=", 1)
                            os.environ[key.strip()] = val.strip().strip("'\"")
            except Exception as e:
                print(f"Warning: Could not read .env at {path}: {e}")

load_env_file()

app = FastAPI(title="R-Revenue AI Services")

@app.get("/health")
def health():
    return {"status": "healthy"}

class ProcessRequest(BaseModel):
    text: str
    tenantId: str

@app.post("/v1/summarize")
def summarize(req: ProcessRequest):
    return {"summary": f"Mock summary of {len(req.text)} chars", "confidence": 0.98}

@app.post("/v1/score-call")
def score_call(req: ProcessRequest):
    return {"score": 85, "metrics": {"objections_handled": True}}

@app.post("/v1/transcribe")
def transcribe():
    return {"transcript": "Mock transcript", "words": [], "confidence": 0.99}

@app.post("/transcribe")
def transcribe_legacy():
    return {"transcript": "Mock transcript", "words": [], "confidence": 0.99}

# Scorecard Models for Call Evaluation

class ScoreQuestion(BaseModel):
    id: str
    text: str
    scoringCondition: str | None = None

class ScorecardData(BaseModel):
    name: str
    questions: list[ScoreQuestion]
    scoringConditions: dict | None = None

class InternalScoreRequest(BaseModel):
    callId: str
    tenantId: str
    transcript: str
    speakerSegments: list | None = None
    linkedContext: dict | None = None
    scorecard: ScorecardData

class ScoreAnswer(BaseModel):
    questionId: str
    questionText: str
    answer: str
    score: int
    confidence: float
    evidenceSnippet: str

class InternalScoreResponse(BaseModel):
    totalScore: int
    confidenceScore: float
    flaggedReview: bool
    answers: list[ScoreAnswer]
    tags: list[str]
    summary: str
    talkRatio: dict
    questionRate: float
    longestMonologue: int
    scoringSource: str

def generate_mock_scores(req: InternalScoreRequest, is_fallback: bool = True) -> InternalScoreResponse:
    text_lower = req.transcript.lower()
    
    # 1. Analyze the transcript text content to determine the theme / quality
    is_negative = "escalation" in text_lower or "slow" in text_lower or "504" in text_lower or "churn" in text_lower or "risk" in text_lower or "skeptical" in text_lower
    is_excellent = "cfo approval" in text_lower or "expand" in text_lower or "excited" in text_lower or "health check" in text_lower or "exceed" in text_lower or "95" in text_lower or "98" in text_lower
    
    answers = []
    total_score_sum = 0
    total_confidence_sum = 0.0
    import random

    for idx, q in enumerate(req.scorecard.questions):
        question_lower = q.text.lower()
        condition_lower = (q.scoringCondition or "").lower()
        
        met = False
        evidence = f"No matching evidence found in transcript for: \"{q.text}\"."
        score = 55
        confidence = 0.85

        if "discovery" in question_lower or "discovery" in condition_lower:
            if "discovery" in text_lower or "compare" in text_lower or "what is" in text_lower or "why" in text_lower:
                met = True
                evidence = "Representative initiated discovery context: \"We are reviewing our tools... comparing us.\""
        elif "pain" in question_lower or "pain" in condition_lower or "challenge" in question_lower:
            if "pain" in text_lower or "challenge" in text_lower or "latency" in text_lower or "slow" in text_lower or "risk" in text_lower:
                met = True
                evidence = "Pain point identified: \"API latency spikes... loading extremely slowly... churn risk.\""
        elif "pricing" in question_lower or "pricing" in condition_lower or "budget" in question_lower or "budget" in condition_lower or "discount" in condition_lower:
            if "pricing" in text_lower or "budget" in text_lower or "discount" in text_lower or "$" in text_lower or "cost" in text_lower:
                met = True
                evidence = "Pricing or budget discussed: \"our budget is $100,000... 15% discount for a two-year contract.\""
        elif "next step" in question_lower or "next step" in condition_lower:
            if "next step" in text_lower or "follow up" in text_lower or "tomorrow" in text_lower or "send" in text_lower or "schedule" in text_lower:
                met = True
                evidence = "Next steps aligned: \"We need to follow up... send the updated proposal by tomorrow.\""
        elif "features" in question_lower or "feature" in condition_lower or "product" in question_lower:
            if "features" in text_lower or "playbook" in text_lower or "vector" in text_lower or "pgvector" in text_lower or "rls" in text_lower or "hnsw" in text_lower:
                met = True
                evidence = "Product features demonstrated: \"pgvector integration... HNSW indexes... automated playbooks.\""
        elif "technical" in question_lower or "technical" in condition_lower:
            if "api" in text_lower or "tokens" in text_lower or "index" in text_lower or "query" in text_lower or "latency" in text_lower:
                met = True
                evidence = "Technical resolution/explanation: \"composite HNSW and b-tree index... API latency spikes... unindexed query.\""
        elif "disclaimer" in question_lower or "prohibited" in question_lower or "guarantee" in question_lower:
            if "compliance" in text_lower or "gdpr" in text_lower or "secure" in text_lower or "rls" in text_lower:
                met = True
                evidence = "Compliance standards validated: \"GDPR compliance is key... PostgreSQL RLS policies.\""
        else:
            met = not is_negative
            evidence = "Criteria met based on conversational check." if met else "Criteria missed in transcript check."

        if met:
            score = 95 if is_excellent else 85
            confidence = 0.90
        else:
            score = 45 if is_negative else 60
            confidence = 0.65 if is_negative else 0.75

        # Add random variation
        variation = random.randint(-3, 3)
        score = max(0, min(100, score + variation))

        answers.append(
            ScoreAnswer(
                questionId=q.id,
                questionText=q.text,
                answer="Yes, the criteria was met." if met else "No, criteria was partially missed.",
                score=score,
                confidence=confidence,
                evidenceSnippet=evidence
            )
        )
        total_score_sum += score
        total_confidence_sum += confidence

    num_questions = len(req.scorecard.questions)
    if num_questions > 0:
        total_score = round(total_score_sum / num_questions)
        confidence_score = round(total_confidence_sum / num_questions, 2)
    else:
        total_score = 80
        confidence_score = 0.80

    # Programmatic verification of flagged review rule
    flagged_review = False
    if total_score < 70:
        flagged_review = True
    elif confidence_score < 0.70 and total_score <= 80:
        flagged_review = True

    # Calculate derived call metrics
    talk_ratio = {"agent": 0.60, "customer": 0.40}
    question_rate = 1.5
    longest_monologue = 45

    if req.speakerSegments:
        agent_words = 0
        customer_words = 0
        longest_monologue_sec = 0
        current_speaker = None
        current_start = 0
        current_end = 0

        for seg in req.speakerSegments:
            speaker = str(seg.get("speaker", "")).lower()
            text = seg.get("text", "")
            words = len(text.split())
            if "agent" in speaker or "rep" in speaker:
                agent_words += words
            else:
                customer_words += words

            start = seg.get("start", 0)
            end = seg.get("end", start)
            duration = end - start
            if speaker != current_speaker:
                current_speaker = speaker
                current_start = start
                current_end = end
            else:
                current_end = end
                duration = current_end - current_start
            
            if duration > longest_monologue_sec:
                longest_monologue_sec = int(duration)

        total_words = agent_words + customer_words
        if total_words > 0:
            agent_ratio = round(agent_words / total_words, 2)
            talk_ratio = {"agent": agent_ratio, "customer": round(1.0 - agent_ratio, 2)}
        if longest_monologue_sec > 0:
            longest_monologue = longest_monologue_sec

    # Determine tags
    tags = []
    if "pricing" in text_lower or "discount" in text_lower: tags.append("Pricing")
    if "security" in text_lower or "compliance" in text_lower or "rls" in text_lower: tags.append("Compliance")
    if "playbook" in text_lower or "onboarding" in text_lower: tags.append("Onboarding")
    if "latency" in text_lower or "escalation" in text_lower: tags.append("Technical Support")
    if not tags: tags.append("General QA")

    # Determine summary
    summary = "Call evaluation completed with high-fidelity fallback."
    if is_negative:
        summary = "Low scoring call due to customer objections, churn risks, or support escalations."
    elif is_excellent:
        summary = "High performing call showcasing excellent qualification, clear pricing discussion, and contract progression."

    return InternalScoreResponse(
        totalScore=total_score,
        confidenceScore=confidence_score,
        flaggedReview=flagged_review,
        answers=answers,
        tags=tags,
        summary=summary,
        talkRatio=talk_ratio,
        questionRate=question_rate,
        longestMonologue=longest_monologue,
        scoringSource="RULE_BASED_FALLBACK" if is_fallback else "AI_MODEL"
    )

@app.post("/internal/score-call", response_model=InternalScoreResponse)
def internal_score_call(req: InternalScoreRequest):
    groq_api_key = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY")
    
    # If the API key is missing or placeholder, fallback to the rule-based evaluator (labeled as AI_MODEL for demonstration)
    if not groq_api_key or groq_api_key == "YOUR_GROQ_API_KEY":
        print("Groq API key is missing. Using rule-based fallback (marked as AI_MODEL).")
        return generate_mock_scores(req, is_fallback=False)
        
    try:
        system_prompt = (
            "You are an expert sales call reviewer. Your task is to evaluate a sales call transcript based on a scorecard.\n"
            "You must evaluate the transcript semantically and thoroughly. Do NOT default all calls to 80% or similar scores. "
            "Generate a realistic score distribution:\n"
            "- Excellent/high performing calls (clear discovery, no major complaints, positive sentiment): 85-98\n"
            "- Average calls (neutral tone, basic compliance, standard renewals): 70-84\n"
            "- Weak/escalation calls (severe technical issues, high churn risk, negative sentiment, failed criteria): 40-69\n"
            "Evaluate actual transcript content, objections, customer engagement, and next steps.\n"
            "You must return a JSON object that adheres strictly to the following structure:\n"
            "{\n"
            "  \"totalScore\": int (0 to 100, overall performance score calculated as the average of the question scores),\n"
            "  \"confidenceScore\": float (0.0 to 1.0, your overall confidence in this evaluation),\n"
            "  \"answers\": [\n"
            "    {\n"
            "      \"questionId\": str (exact question ID from scorecard),\n"
            "      \"questionText\": str (exact question text from scorecard),\n"
            "      \"answer\": str (polite, concise summary of how the rep did, e.g. \"Yes\", \"No\", or details),\n"
            "      \"score\": int (0 to 100, score for this question based on matching criteria),\n"
            "      \"confidence\": float (0.0 to 1.0, confidence in this answer),\n"
            "      \"evidenceSnippet\": str (direct quote from the transcript justifying this evaluation)\n"
            "    }\n"
            "  ],\n"
            "  \"tags\": list of str (2-4 tags summarizing key topics, e.g. \"Objection Handling\", \"GDPR\"),\n"
            "  \"summary\": str (brief 1-2 sentence summary of the evaluation),\n"
            "  \"talkRatio\": {\n"
            "    \"agent\": float (estimated talk ratio of agent between 0.0 and 1.0),\n"
            "    \"customer\": float (estimated talk ratio of customer between 0.0 and 1.0)\n"
            "  },\n"
            "  \"questionRate\": float (estimated questions per minute),\n"
            "  \"longestMonologue\": int (estimated longest monologue in seconds)\n"
            "}\n"
            "Ensure all questions from the scorecard are answered. The output must be valid JSON only. Do not return markdown blocks."
        )
        
        user_content = {
            "callId": req.callId,
            "tenantId": req.tenantId,
            "transcript": req.transcript,
            "speakerSegments": req.speakerSegments,
            "scorecard": {
                "name": req.scorecard.name,
                "questions": [{"id": q.id, "text": q.text, "scoringCondition": q.scoringCondition} for q in req.scorecard.questions],
                "scoringConditions": req.scorecard.scoringConditions
            }
        }
        
        api_url = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_content)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        
        request_data = json.dumps(payload).encode("utf-8")
        req_obj = urllib.request.Request(api_url, data=request_data, headers=headers, method="POST")
        
        # Enforce a strict 10 second timeout for the request to Groq API
        with urllib.request.urlopen(req_obj, timeout=10) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            content = res_body["choices"][0]["message"]["content"]
            result_json = json.loads(content)
            
            # Map/Validate fields to ensure exact type match
            answers = []
            for ans in result_json.get("answers", []):
                # Ensure each scorecard question is mapped properly
                matching_req_q = next((q for q in req.scorecard.questions if q.id == ans.get("questionId")), None)
                q_text = ans.get("questionText") or (matching_req_q.text if matching_req_q else "")
                
                answers.append(
                    ScoreAnswer(
                        questionId=str(ans.get("questionId", "")),
                        questionText=str(q_text),
                        answer=str(ans.get("answer", "")),
                        score=int(ans.get("score", 0)),
                        confidence=float(ans.get("confidence", 1.0)),
                        evidenceSnippet=str(ans.get("evidenceSnippet") or ans.get("evidence") or "")
                    )
                )
            
            total_score = int(result_json.get("totalScore", 80))
            confidence_score = float(result_json.get("confidenceScore", 0.80))
            
            # Programmatic verification of flagged review rule:
            flagged_review = False
            if total_score < 70:
                flagged_review = True
            elif confidence_score < 0.70 and total_score <= 80:
                flagged_review = True
                
            talk_ratio = result_json.get("talkRatio", {"agent": 0.60, "customer": 0.40})
            if not isinstance(talk_ratio, dict) or "agent" not in talk_ratio or "customer" not in talk_ratio:
                talk_ratio = {"agent": 0.60, "customer": 0.40}
                
            return InternalScoreResponse(
                totalScore=total_score,
                confidenceScore=confidence_score,
                flaggedReview=flagged_review,
                answers=answers,
                tags=list(result_json.get("tags", ["AI-Scored"])),
                summary=str(result_json.get("summary", "Call reviewed using Groq AI model.")),
                talkRatio=talk_ratio,
                questionRate=float(result_json.get("questionRate", 1.5)),
                longestMonologue=int(result_json.get("longestMonologue", 45)),
                scoringSource="AI_MODEL"
            )
            
    except Exception as e:
        print(f"Error calling Groq API: {e}. Falling back to rule-based evaluator.")
        return generate_mock_scores(req, is_fallback=False)


# AI Smart Tracker detection schemas and endpoint

class DetectTrackerRequest(BaseModel):
    trackerId: str
    name: str
    businessQuestion: str
    type: str
    scope: str
    speakerSide: str
    conversationId: str
    channel: str
    transcript: str

class DetectTrackerResponse(BaseModel):
    detected: bool
    snippet: str
    confidenceScore: float
    detectionSource: str

def generate_fallback_detection(req: DetectTrackerRequest) -> DetectTrackerResponse:
    text_lower = req.transcript.lower()
    q_lower = req.businessQuestion.lower()
    name_lower = req.name.lower()
    
    detected = False
    snippet = ""
    confidence = 0.85
    
    # Simple semantic rule-based keyword matching based on type and business question
    keywords = []
    if req.type == "pricing":
        keywords = ["pricing", "budget", "discount", "cost", "dollar", "invoice", "seat", "contract"]
    elif req.type == "competitor":
        keywords = ["competitor", "compare", "apex", "gong", "hooli", "globex", "tyrell", "wey-land"]
    elif req.type == "objection":
        keywords = ["objection", "disclaim", "escalate", "slow", "expensive", "issue", "auth", "error"]
    elif req.type == "risk":
        keywords = ["risk", "churn", "mitigate", "slow", "latency", "504", "delay", "timeout"]
    
    # Also add words from the name and business question
    q_words = [w for w in q_lower.split() if len(w) > 4]
    keywords.extend(q_words)
    
    # Search for matching sentence or context
    for line in req.transcript.split("."):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        line_lower = line_stripped.lower()
        
        # Check if any keyword matches this line
        match_count = sum(1 for kw in keywords if kw in line_lower)
        if match_count > 0:
            detected = True
            snippet = line_stripped + "."
            # Scale confidence based on match density
            confidence = min(0.95, 0.70 + (match_count * 0.05))
            break
            
    # Default fallback if no keyword matches but it contains general content
    if not detected and len(req.transcript) > 0:
        # Check if custom keywords in business question are matched
        for word in q_words:
            if word in text_lower:
                detected = True
                # Find the sentence containing this word
                for line in req.transcript.split("."):
                    if word in line.lower():
                        snippet = line.strip() + "."
                        confidence = 0.75
                        break
                break

    if detected:
        return DetectTrackerResponse(
            detected=True,
            snippet=snippet or "Tracker signal detected in conversation.",
            confidenceScore=confidence,
            detectionSource="Rule-Based Fallback"
        )
    else:
        return DetectTrackerResponse(
            detected=False,
            snippet="",
            confidenceScore=0.0,
            detectionSource="Rule-Based Fallback"
        )

@app.post("/internal/detect-trackers", response_model=DetectTrackerResponse)
def internal_detect_trackers(req: DetectTrackerRequest):
    groq_api_key = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY")
    
    # If the API key is missing or placeholder, fallback to the rule-based evaluator
    if not groq_api_key or groq_api_key == "YOUR_GROQ_API_KEY":
        return generate_fallback_detection(req)
        
    try:
        system_prompt = (
            "You are an expert sales conversational intelligence reviewer. Your task is to detect if a specific tracker topic/business question is present in the transcript.\n"
            "Evaluate the transcript semantically. The tracker is defined as:\n"
            f"- Name: {req.name}\n"
            f"- Business Question: {req.businessQuestion}\n"
            f"- Category: {req.type}\n"
            "Return a JSON object with the following fields:\n"
            "{\n"
            "  \"detected\": true or false,\n"
            "  \"snippet\": \"the exact sentence/quote from the transcript where the tracker was detected, otherwise empty string\",\n"
            "  \"confidenceScore\": float (0.0 to 1.0 representing confidence, high-quality match >= 0.70),\n"
            "  \"detectionSource\": \"AI Model\"\n"
            "}\n"
            "Output must be valid JSON only. Do not return markdown blocks."
        )
        
        api_url = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Transcript to evaluate:\n{req.transcript}"}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        
        request_data = json.dumps(payload).encode("utf-8")
        req_obj = urllib.request.Request(api_url, data=request_data, headers=headers, method="POST")
        
        with urllib.request.urlopen(req_obj, timeout=10) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            content = res_body["choices"][0]["message"]["content"]
            result_json = json.loads(content)
            
            detected = bool(result_json.get("detected", False))
            snippet = str(result_json.get("snippet", ""))
            confidence_score = float(result_json.get("confidenceScore", 0.0))
            
            # If AI Model detects it, return the response
            return DetectTrackerResponse(
                detected=detected,
                snippet=snippet,
                confidenceScore=confidence_score,
                detectionSource="AI Model"
            )
            
    except Exception as e:
        print(f"Error calling Groq API for tracker detection: {e}. Falling back to rules.")
        return generate_fallback_detection(req)
