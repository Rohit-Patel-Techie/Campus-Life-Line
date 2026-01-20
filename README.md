# CampusLifeLine

CampusLifeLine is a web platform designed to connect students and campus communities with life‑saving resources like blood donors, urgent requests, and emergency support services. It provides a fast and reliable way to search for donors and coordinate help in critical moments.

## 🌐 Live Demo
- Frontend: https://campus-life-line.netlify.app/

---

## 📸 Screenshot

<p align="center">
  <img src="frontend\Project-img-overview\image-01.png" width="45%">
  <img src="frontend\Project-img-overview\image-02.png" width="45%">
</p>

<p align="center">
  <img src="frontend\Project-img-overview\image-03.png" width="45%">
  <img src="frontend\Project-img-overview\image-04.png" width="45%">
</p>

---

## ⚙️ Tech Stack
**Frontend**
- HTML, CSS, JavaScript  
- Deployed on Netlify  

---

**Backend**
- Django (Python)
- Firebase Admin SDK (Firestore)
- Gemini API Key For Guidance

---


## 📁 Project Structure
```
Campus-Life-Line/
├── frontend/   # HTML/CSS/JS files
└── backend/    # Django project
```

---

## 🚀 Local Setup

### 1) Clone the repository
```bash
git clone https://github.com/Rohit-Patel-Techie/Campus-Life-Line.git
cd Campus-Life-Line

```

---

### 2) Frontend (Static)
```bash
cd frontend
# Open index.html directly in browser
```

---

### 3) Backend (Django)

```bash
cd ../backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Add Firebase Service Account
Place your Firebase service account JSON file in:

```
backend/campuslifeline/serviceAccountKey.json
```

#### Run server
```bash
python manage.py migrate
python manage.py runserver
```

---

## 🔗 API Base URL
During development, update API base in JS:

```
http://127.0.0.1:8000
---

## ✅ Features
- Search donors by location/blood group
- Public donor listing API
- Firebase integration
- Simple frontend UI

---

## 📬 Contact
For questions or support, contact the project maintainer.