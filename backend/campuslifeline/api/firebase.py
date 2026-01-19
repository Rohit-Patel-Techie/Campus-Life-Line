import os
import firebase_admin
from firebase_admin import credentials, firestore

_db = None

def get_firestore():
    global _db
    if _db:
        return _db

    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if not cred_path:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT env is not set.")

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db