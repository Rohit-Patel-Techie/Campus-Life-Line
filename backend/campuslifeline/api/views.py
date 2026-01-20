import os 
import json
import requests
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from .firebase import get_firestore

def _normalize(s):
    return (s or "").strip().lower()


def _find_matching_donors(db, blood_group, area):
    donors = []
    query = db.collection("donors").where("blood_group", "==", blood_group).stream()
    for doc in query:
        d = doc.to_dict()
        donors.append({"id": doc.id, **d})

    area_key = _normalize(area)
    donors.sort(key=lambda d: (0 if _normalize(d.get("area")) == area_key else 1, _normalize(d.get("area"))))
    return donors


@csrf_exempt
def create_donor(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = json.loads(request.body or "{}")
    db = get_firestore()
    doc_ref = db.collection("donors").add(data)
    return JsonResponse({"status": "saved", "id": doc_ref[1].id})


def list_donors(request):
    db = get_firestore()
    donors = []
    for doc in db.collection("donors").stream():
        donors.append({"id": doc.id, **doc.to_dict()})
    return JsonResponse({"data": donors})


@csrf_exempt
def create_request(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = json.loads(request.body or "{}")
    db = get_firestore()

    request_data = {
        **data,
        "status": "open",
        "accepted_by": None,
        "accepted_at": None,
        "donor_contact": None,   # ✅ will be filled on accept
        "created_at": datetime.utcnow().isoformat()
    }

    doc_ref = db.collection("requests").add(request_data)
    request_id = doc_ref[1].id

    matching = _find_matching_donors(db, data.get("blood_group"), data.get("area"))

    return JsonResponse({
        "status": "saved",
        "id": request_id,
        "matching_count": len(matching)
    })


def get_request(request, request_id):
    db = get_firestore()
    doc = db.collection("requests").document(request_id).get()
    if not doc.exists:
        return JsonResponse({"error": "Request not found"}, status=404)
    return JsonResponse({"id": doc.id, **doc.to_dict()})


def list_matching_donors(request, request_id):
    db = get_firestore()
    req_doc = db.collection("requests").document(request_id).get()
    if not req_doc.exists:
        return JsonResponse({"error": "Request not found"}, status=404)

    req = req_doc.to_dict()
    matching = _find_matching_donors(db, req.get("blood_group"), req.get("area"))

    return JsonResponse({
        "request": {"id": req_doc.id, **req},
        "matching_donors": matching
    })


@csrf_exempt
def send_alerts(request, request_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    db = get_firestore()
    req_doc = db.collection("requests").document(request_id).get()
    if not req_doc.exists:
        return JsonResponse({"error": "Request not found"}, status=404)

    req = req_doc.to_dict()
    matching = _find_matching_donors(db, req.get("blood_group"), req.get("area"))

    sent = 0
    for d in matching:
        email = d.get("email")
        if not email:
            continue

        approve_link = f"{settings.SITE_URL}/accept-request.html?request_id={request_id}&donor_id={d['id']}&action=accept"
        reject_link = f"{settings.SITE_URL}/accept-request.html?request_id={request_id}&donor_id={d['id']}&action=reject"

        subject = f"Emergency Blood Request: {req.get('blood_group')}"
        message = (
            f"Hello {d.get('name','Donor')},\n\n"
            f"Emergency blood request for {req.get('blood_group')}.\n"
            f"Hospital: {req.get('hospital_name')}\n"
            f"Area: {req.get('area')}\n"
            f"Patient: {req.get('name')}\n\n"
            f"Approve: {approve_link}\n"
            f"Reject: {reject_link}\n"
        )

        html_message = f"""
        <div style="font-family:Arial,sans-serif;line-height:1.6;">
          <h2>Emergency Blood Request</h2>
          <p>Hello <b>{d.get('name','Donor')}</b>,</p>
          <p>A patient needs blood group <b>{req.get('blood_group')}</b>.</p>
          <p><b>Hospital:</b> {req.get('hospital_name')}<br/>
             <b>Area:</b> {req.get('area')}<br/>
             <b>Patient:</b> {req.get('name')}</p>
          <p>Please respond:</p>
          <a href="{approve_link}" style="background:#28a745;color:white;padding:10px 16px;text-decoration:none;border-radius:6px;margin-right:8px;">Approve</a>
          <a href="{reject_link}" style="background:#dc3545;color:white;padding:10px 16px;text-decoration:none;border-radius:6px;">Reject</a>
          <p style="margin-top:16px;color:#666;">If buttons do not work, open your CampusLifeLine website.</p>
        </div>
        """

        send_mail(subject, message, settings.EMAIL_HOST_USER, [email], fail_silently=True, html_message=html_message)
        sent += 1

    return JsonResponse({"status": "alerts_sent", "count": sent})

@csrf_exempt
def respond_request(request, request_id):
    db = get_firestore()
    action = request.GET.get("action") or (json.loads(request.body or "{}").get("action") if request.body else None)
    donor_id = request.GET.get("donor_id") or (json.loads(request.body or "{}").get("donor_id") if request.body else None)

    if not donor_id:
        return JsonResponse({"error": "donor_id required"}, status=400)

    req_ref = db.collection("requests").document(request_id)
    req_doc = req_ref.get()

    if not req_doc.exists:
        return JsonResponse({"error": "Request not found"}, status=404)

    req = req_doc.to_dict()

    if action == "reject":
        req_ref.update({
            "rejected_by": (req.get("rejected_by") or []) + [donor_id]
        })
        return JsonResponse({"status": "rejected"})

    if req.get("status") == "accepted":
        return JsonResponse({
            "status": "already_accepted",
            "accepted_by": req.get("accepted_by")
        }, status=409)

    donor_doc = db.collection("donors").document(donor_id).get()
    if not donor_doc.exists:
        return JsonResponse({"error": "Donor not found"}, status=404)

    donor = donor_doc.to_dict()

    donor_contact = {
        "name": donor.get("name"),
        "contact_number": donor.get("contact_number"),
        "area": donor.get("area"),
        "email": donor.get("email")
    }

    patient_contact = {
        "name": req.get("name"),
        "contact_number": req.get("contact_number"),
        "area": req.get("area"),
        "hospital_name": req.get("hospital_name"),
        "email": req.get("email")
    }

    # ✅ store donor details in request
    req_ref.update({
        "status": "accepted",
        "accepted_by": donor_id,
        "accepted_at": datetime.utcnow().isoformat(),
        "donor_contact": donor_contact
    })

    # ✅ send donor details to patient (email)
    if patient_contact.get("email"):
        send_mail(
            subject="CampusLifeLine: Donor Found",
            message=(
                f"Donor Details:\n"
                f"Name: {donor_contact['name']}\n"
                f"Phone: {donor_contact['contact_number']}\n"
                f"Area: {donor_contact['area']}\n"
                f"Email: {donor_contact['email']}\n\n"
                f"Request ID: {request_id}"
            ),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[patient_contact["email"]],
            fail_silently=True
        )

    # ✅ send patient details to donor (email)
    if donor_contact.get("email"):
        send_mail(
            subject="CampusLifeLine: Patient Details",
            message=(
                f"Patient Details:\n"
                f"Name: {patient_contact['name']}\n"
                f"Phone: {patient_contact['contact_number']}\n"
                f"Hospital: {patient_contact['hospital_name']}\n"
                f"Area: {patient_contact['area']}\n\n"
                f"Request ID: {request_id}"
            ),
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[donor_contact["email"]],
            fail_silently=True
        )

    return JsonResponse({
        "status": "accepted",
        "patient_contact": patient_contact,
        "donor_contact": donor_contact
    })


def request_status(request, request_id):
    db = get_firestore()
    req_doc = db.collection("requests").document(request_id).get()
    if not req_doc.exists:
        return JsonResponse({"error": "Request not found"}, status=404)

    req = req_doc.to_dict()

    return JsonResponse({
        "status": req.get("status", "open"),
        "donor_contact": req.get("donor_contact")
    })


def status_lookup(request):
    # ✅ use GET so CSRF is not required
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    request_id = request.GET.get("request_id")
    contact_number = request.GET.get("contact_number")

    db = get_firestore()

    if request_id:
        req_doc = db.collection("requests").document(request_id).get()
        if not req_doc.exists:
            return JsonResponse({"requests": []})
        return JsonResponse({"requests": [{"id": req_doc.id, **req_doc.to_dict()}]})

    if contact_number:
        results = []
        query = db.collection("requests").where("contact_number", "==", contact_number).stream()
        for doc in query:
            results.append({"id": doc.id, **doc.to_dict()})
        return JsonResponse({"requests": results})

    return JsonResponse({"error": "request_id or contact_number required"}, status=400)


def _extract_json(text: str) -> str:
    if not text:
        return text
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return text.strip()
    return text[start:end + 1].strip()

def _build_gemini_prompt(payload):
    role = payload.get("role", "patient")
    blood_group = payload.get("blood_group", "Unknown")
    location = payload.get("location", "Unknown")
    situation = payload.get("situation", "Urgent blood requirement")
    tone = payload.get("tone", "calm, reassuring")
    last_donation_date = payload.get("last_donation_date")
    documents = payload.get("documents")

    return f"""
You are CampusLifeLine AI guidance assistant.

Role: {role}
Blood Group: {blood_group}
Location: {location}
Situation: {situation}
Last Donation Date: {last_donation_date}
Extra Documents Info: {documents}
Tone: {tone}

Return STRICT JSON only. No markdown, no code fences.

Format:
{{
  "steps": [
    {{"number": 1, "text": "short actionable step"}}
  ],
  "documents_required": {{
    "patient": ["item 1", "item 2"],
    "donor": ["item 1", "item 2"]
  }},
  "precautions": ["precaution 1", "precaution 2"]
}}
""".strip()

@csrf_exempt
def gemini_guidance(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = json.loads(request.body or "{}")
    if not body.get("role"):
        return JsonResponse({"error": "role required"}, status=400)

    model = settings.GEMINI_MODEL
    base = settings.GEMINI_API_BASE
    key = settings.GEMINI_API_KEY

    prompt = _build_gemini_prompt(body)
    url = f"{base}/models/{model}:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    resp = requests.post(url, json=payload, timeout=20)
    data = resp.json()

    try:
        raw = data["candidates"][0]["content"]["parts"][0]["text"]
        extracted = _extract_json(raw)
        parsed = json.loads(extracted)
        return JsonResponse(parsed)
    except Exception:
        return JsonResponse({"error": "Gemini failed", "raw": data}, status=500)