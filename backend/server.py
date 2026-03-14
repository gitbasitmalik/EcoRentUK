from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Response, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Literal
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import asyncio
import time
import cloudinary
import cloudinary.uploader
import cloudinary.utils
import resend
import httpx
import pyotp
import secrets
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.environ.get("CLOUDINARY_API_KEY", ""),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET", ""),
    secure=True
)

# Configure Resend
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")

# JWT Secret
JWT_SECRET = os.environ.get("JWT_SECRET", "ecorent-uk-secret-key-2024")

# Create the main app
app = FastAPI(title="EcoRent UK API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["landlord", "tenant"] = "landlord"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: Optional[str] = None
    needs_role_selection: bool = False
    picture: Optional[str] = None
    created_at: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    two_factor_enabled: Optional[bool] = False
    token: Optional[str] = None

class SetRoleRequest(BaseModel):
    role: Literal["landlord", "tenant"]

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserSettingsUpdate(BaseModel):
    notifications: Optional[Dict[str, bool]] = None
    theme: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_uri: str
    backup_codes: List[str]

class TwoFactorVerifyRequest(BaseModel):
    code: str

class PropertyCreate(BaseModel):
    title: str
    address: str
    city: str
    postcode: str
    price: float
    bedrooms: int
    bathrooms: int
    property_type: str
    description: str
    epc_rating: str = "D"
    hem_score: Optional[float] = None
    has_solar_panels: bool = False
    has_heat_pump: bool = False
    insulation_type: str = "Standard"
    images: List[str] = []
    tenant_id: Optional[str] = None

class PropertyResponse(BaseModel):
    property_id: str
    user_id: str
    title: str
    address: str
    city: str
    postcode: str
    price: float
    bedrooms: int
    bathrooms: int
    property_type: str
    description: str
    epc_rating: str
    hem_score: Optional[float] = None
    has_solar_panels: bool
    has_heat_pump: bool
    insulation_type: str
    images: List[str]
    created_at: str
    updated_at: str
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_email: Optional[str] = None

class AssignTenantRequest(BaseModel):
    tenant_email: str

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    property_interest: Optional[str] = None

class LeadResponse(BaseModel):
    lead_id: str
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    property_interest: Optional[str] = None
    created_at: str

class ChatMessageCreate(BaseModel):
    conversation_id: Optional[str] = None
    property_id: Optional[str] = None
    message: str
    attachments: List[str] = []

class ChatMessageResponse(BaseModel):
    message_id: str
    conversation_id: str
    sender_id: str
    sender_role: str
    sender_name: str
    property_id: Optional[str] = None
    message: str
    attachments: List[str] = []
    is_auto_reply: bool = False
    created_at: str

class ConversationResponse(BaseModel):
    conversation_id: str
    landlord_id: str
    tenant_id: str
    tenant_name: str
    tenant_email: str
    property_id: Optional[str] = None
    property_address: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[str] = None
    unread_count: int = 0

class HEMCalculatorInput(BaseModel):
    current_epc: str
    property_type: str
    floor_area_sqm: float
    has_gas_heating: bool = True
    current_insulation: str = "Standard"
    region: str = "England"

class HEMCalculatorResponse(BaseModel):
    current_hem_score: float
    projected_hem_score: float
    heat_pump_roi_years: float
    insulation_roi_years: float
    annual_energy_savings_gbp: float
    carbon_reduction_kg: float
    recommendations: List[str]

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def generate_token() -> str:
    return f"token_{uuid.uuid4().hex}"

def generate_totp_secret() -> str:
    return pyotp.random_base32()

def generate_backup_codes(count: int = 8) -> List[str]:
    return [secrets.token_hex(4).upper() for _ in range(count)]

async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def require_landlord(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "landlord":
        raise HTTPException(status_code=403, detail="Landlord access required")
    return user

async def require_tenant(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "tenant":
        raise HTTPException(status_code=403, detail="Tenant access required")
    return user

async def require_role_set(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("role"):
        raise HTTPException(status_code=403, detail="Role not set", headers={"X-Needs-Role": "true"})
    return user

# ==================== INIT TEST ACCOUNTS ====================

async def init_test_accounts():
    """Create test accounts if they don't exist"""
    test_accounts = [
        {"email": "admin@test.com", "name": "Admin Landlord", "role": "landlord", "password": "admin123"},
        {"email": "tenant@test.com", "name": "Test Tenant", "role": "tenant", "password": "tenant123"}
    ]
    
    for account in test_accounts:
        existing = await db.users.find_one({"email": account["email"]})
        if not existing:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user_doc = {
                "user_id": user_id,
                "email": account["email"],
                "name": account["name"],
                "role": account["role"],
                "password_hash": hash_password(account["password"]),
                "picture": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "settings": {
                    "notifications": {"new_leads": True, "urgent_messages": True, "epc_reminders": True, "marketing": False},
                    "theme": "dark",
                    "preferences": {}
                },
                "two_factor_enabled": False
            }
            await db.users.insert_one(user_doc)
            logger.info(f"Created test account: {account['email']}")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, response: Response):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "settings": {
            "notifications": {"new_leads": True, "urgent_messages": True, "epc_reminders": True, "marketing": False},
            "theme": "dark",
            "preferences": {}
        },
        "two_factor_enabled": False
    }
    await db.users.insert_one(user_doc)
    
    session_token = generate_token()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=False, samesite="lax", path="/", max_age=7*24*60*60)
    
    return UserResponse(
        user_id=user_id, email=user_data.email, name=user_data.name, role=user_data.role,
        needs_role_selection=False, created_at=user_doc["created_at"], settings=user_doc["settings"], two_factor_enabled=False,
        token=session_token
    )

@api_router.post("/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_token = generate_token()
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=False, samesite="lax", path="/", max_age=7*24*60*60)
    
    return UserResponse(
        user_id=user["user_id"], email=user["email"], name=user["name"], role=user.get("role"),
        needs_role_selection=not user.get("role"), picture=user.get("picture"),
        created_at=user.get("created_at"), settings=user.get("settings"), two_factor_enabled=user.get("two_factor_enabled", False),
        token=session_token
    )

class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token

@api_router.post("/auth/google", response_model=UserResponse)
async def google_auth(data: GoogleAuthRequest, response: Response):
    """Verify Google ID token and sign in / register user"""
    google_client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    if not google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    try:
        id_info = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            google_client_id
        )
    except Exception as e:
        logger.error(f"Google token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = id_info.get("email")
    name = id_info.get("name", email)
    picture = id_info.get("picture")

    user = await db.users.find_one({"email": email}, {"_id": 0})

    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": None,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "settings": {
                "notifications": {"new_leads": True, "urgent_messages": True, "epc_reminders": True, "marketing": False},
                "theme": "dark",
                "preferences": {}
            },
            "two_factor_enabled": False
        }
        await db.users.insert_one(user)
        needs_role = True
    else:
        user_id = user["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": name, "picture": picture}})
        user["name"] = name
        user["picture"] = picture
        needs_role = not user.get("role")

    session_token = generate_token()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=False, samesite="lax", path="/", max_age=7*24*60*60)

    return UserResponse(
        user_id=user_id, email=email, name=name, role=user.get("role"),
        needs_role_selection=needs_role, picture=picture,
        created_at=user.get("created_at"), settings=user.get("settings"),
        two_factor_enabled=user.get("two_factor_enabled", False),
        token=session_token
    )

@api_router.post("/auth/set-role", response_model=UserResponse)
async def set_user_role(data: SetRoleRequest, user: dict = Depends(get_current_user)):
    """Set role for OAuth users who haven't selected one"""
    if user.get("role"):
        raise HTTPException(status_code=400, detail="Role already set")
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": data.role}})
    user["role"] = data.role
    
    return UserResponse(
        user_id=user["user_id"], email=user["email"], name=user["name"], role=data.role,
        needs_role_selection=False, picture=user.get("picture"),
        created_at=user.get("created_at"), settings=user.get("settings"), two_factor_enabled=user.get("two_factor_enabled", False)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        user_id=user["user_id"], email=user["email"], name=user["name"], role=user.get("role"),
        needs_role_selection=not user.get("role"), picture=user.get("picture"),
        created_at=user.get("created_at"), settings=user.get("settings"), two_factor_enabled=user.get("two_factor_enabled", False)
    )

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== PASSWORD & 2FA ====================

@api_router.post("/auth/change-password")
async def change_password(data: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    if not user.get("password_hash"):
        raise HTTPException(status_code=400, detail="Password change not available for OAuth accounts")
    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"password_hash": hash_password(data.new_password), "password_changed_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Password changed successfully"}

@api_router.post("/auth/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(user: dict = Depends(get_current_user)):
    if user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    secret = generate_totp_secret()
    backup_codes = generate_backup_codes()
    totp = pyotp.TOTP(secret)
    qr_uri = totp.provisioning_uri(name=user["email"], issuer_name="EcoRent UK")
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"two_factor_secret_pending": secret, "backup_codes_pending": [hash_password(c) for c in backup_codes]}})
    
    return TwoFactorSetupResponse(secret=secret, qr_uri=qr_uri, backup_codes=backup_codes)

@api_router.post("/auth/2fa/verify")
async def verify_2fa_setup(data: TwoFactorVerifyRequest, user: dict = Depends(get_current_user)):
    pending_secret = user.get("two_factor_secret_pending")
    if not pending_secret:
        raise HTTPException(status_code=400, detail="No pending 2FA setup found")
    
    if not pyotp.TOTP(pending_secret).verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    await db.users.update_one({"user_id": user["user_id"]}, {
        "$set": {"two_factor_enabled": True, "two_factor_secret": pending_secret, "backup_codes": user.get("backup_codes_pending", [])},
        "$unset": {"two_factor_secret_pending": "", "backup_codes_pending": ""}
    })
    return {"message": "Two-factor authentication enabled successfully"}

@api_router.post("/auth/2fa/disable")
async def disable_2fa(data: TwoFactorVerifyRequest, user: dict = Depends(get_current_user)):
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    secret = user.get("two_factor_secret")
    if not secret or not pyotp.TOTP(secret).verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"two_factor_enabled": False}, "$unset": {"two_factor_secret": "", "backup_codes": ""}})
    return {"message": "Two-factor authentication disabled"}

# ==================== USER SETTINGS ====================

@api_router.get("/user/settings")
async def get_user_settings(user: dict = Depends(get_current_user)):
    settings = user.get("settings", {"notifications": {"new_leads": True, "urgent_messages": True, "epc_reminders": True, "marketing": False}, "theme": "dark", "preferences": {}})
    return {"settings": settings, "two_factor_enabled": user.get("two_factor_enabled", False), "password_set": bool(user.get("password_hash"))}

@api_router.put("/user/settings")
async def update_user_settings(settings_update: UserSettingsUpdate, user: dict = Depends(get_current_user)):
    update_doc = {}
    if settings_update.notifications is not None:
        update_doc["settings.notifications"] = settings_update.notifications
    if settings_update.theme is not None:
        update_doc["settings.theme"] = settings_update.theme
    if settings_update.preferences is not None:
        update_doc["settings.preferences"] = settings_update.preferences
    
    if update_doc:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_doc})
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"settings": updated_user.get("settings"), "message": "Settings updated successfully"}

@api_router.delete("/auth/delete-account")
async def delete_account(request: Request, response: Response, user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    await db.properties.update_many({"tenant_id": user_id}, {"$set": {"tenant_id": None}})
    await db.properties.delete_many({"user_id": user_id})
    await db.conversations.delete_many({"$or": [{"landlord_id": user_id}, {"tenant_id": user_id}]})
    await db.chat_messages.delete_many({"sender_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.users.delete_one({"user_id": user_id})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Account deleted successfully"}

# ==================== PROPERTY ENDPOINTS ====================

@api_router.post("/properties", response_model=PropertyResponse)
async def create_property(property_data: PropertyCreate, user: dict = Depends(require_landlord)):
    property_id = f"prop_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    property_doc = {"property_id": property_id, "user_id": user["user_id"], **property_data.model_dump(), "created_at": now, "updated_at": now}
    await db.properties.insert_one(property_doc)
    
    return PropertyResponse(**{k: v for k, v in property_doc.items() if k != "_id"})

@api_router.get("/properties", response_model=List[PropertyResponse])
async def get_properties(user: dict = Depends(require_landlord)):
    properties = await db.properties.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Enrich with tenant info
    result = []
    for p in properties:
        if p.get("tenant_id"):
            tenant = await db.users.find_one({"user_id": p["tenant_id"]}, {"_id": 0})
            if tenant:
                p["tenant_name"] = tenant.get("name")
                p["tenant_email"] = tenant.get("email")
        result.append(PropertyResponse(**p))
    
    return result

@api_router.get("/properties/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") == "landlord":
        prop = await db.properties.find_one({"property_id": property_id, "user_id": user["user_id"]}, {"_id": 0})
    else:
        prop = await db.properties.find_one({"property_id": property_id, "tenant_id": user["user_id"]}, {"_id": 0})
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if prop.get("tenant_id"):
        tenant = await db.users.find_one({"user_id": prop["tenant_id"]}, {"_id": 0})
        if tenant:
            prop["tenant_name"] = tenant.get("name")
            prop["tenant_email"] = tenant.get("email")
    
    return PropertyResponse(**prop)

@api_router.put("/properties/{property_id}", response_model=PropertyResponse)
async def update_property(property_id: str, property_data: PropertyCreate, user: dict = Depends(require_landlord)):
    existing = await db.properties.find_one({"property_id": property_id, "user_id": user["user_id"]}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    
    update_data = property_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.properties.update_one({"property_id": property_id}, {"$set": update_data})
    
    updated = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    return PropertyResponse(**updated)

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, user: dict = Depends(require_landlord)):
    result = await db.properties.delete_one({"property_id": property_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted"}

@api_router.post("/properties/{property_id}/assign-tenant")
async def assign_tenant(property_id: str, data: AssignTenantRequest, user: dict = Depends(require_landlord)):
    prop = await db.properties.find_one({"property_id": property_id, "user_id": user["user_id"]})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    tenant = await db.users.find_one({"email": data.tenant_email, "role": "tenant"}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found. Ensure they have registered as a tenant.")
    
    # Check if tenant is already assigned to another property
    existing_assignment = await db.properties.find_one({"tenant_id": tenant["user_id"], "property_id": {"$ne": property_id}})
    if existing_assignment:
        raise HTTPException(status_code=400, detail="Tenant is already assigned to another property")
    
    await db.properties.update_one({"property_id": property_id}, {"$set": {"tenant_id": tenant["user_id"]}})
    
    # Create conversation if doesn't exist
    existing_conv = await db.conversations.find_one({"landlord_id": user["user_id"], "tenant_id": tenant["user_id"]})
    if not existing_conv:
        await db.conversations.insert_one({
            "conversation_id": f"conv_{uuid.uuid4().hex[:12]}",
            "landlord_id": user["user_id"],
            "tenant_id": tenant["user_id"],
            "property_id": property_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_message_at": None,
            "message_count": 0
        })
    
    return {"message": f"Tenant {tenant['name']} ({data.tenant_email}) assigned to property", "tenant_id": tenant["user_id"], "tenant_name": tenant["name"]}

@api_router.post("/properties/{property_id}/unassign-tenant")
async def unassign_tenant(property_id: str, user: dict = Depends(require_landlord)):
    prop = await db.properties.find_one({"property_id": property_id, "user_id": user["user_id"]})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    await db.properties.update_one({"property_id": property_id}, {"$set": {"tenant_id": None}})
    return {"message": "Tenant unassigned from property"}

@api_router.get("/tenants/search")
async def search_tenants(email: str, user: dict = Depends(require_landlord)):
    """Search for tenants by email"""
    tenants = await db.users.find({"email": {"$regex": email, "$options": "i"}, "role": "tenant"}, {"_id": 0, "password_hash": 0}).to_list(10)
    return [{"user_id": t["user_id"], "name": t["name"], "email": t["email"]} for t in tenants]

# ==================== TENANT PORTAL ====================

@api_router.get("/tenant/my-home")
async def get_tenant_home(user: dict = Depends(require_tenant)):
    prop = await db.properties.find_one({"tenant_id": user["user_id"]}, {"_id": 0})
    
    if not prop:
        return {"has_property": False, "property": None, "landlord": None}
    
    landlord = await db.users.find_one({"user_id": prop["user_id"]}, {"_id": 0, "password_hash": 0})
    
    return {
        "has_property": True,
        "property": {
            "property_id": prop["property_id"],
            "title": prop.get("title"),
            "address": prop["address"],
            "city": prop["city"],
            "postcode": prop["postcode"],
            "epc_rating": prop["epc_rating"],
            "bedrooms": prop["bedrooms"],
            "bathrooms": prop["bathrooms"],
            "property_type": prop["property_type"],
            "has_solar_panels": prop.get("has_solar_panels", False),
            "has_heat_pump": prop.get("has_heat_pump", False),
            "images": prop.get("images", [])
        },
        "landlord": {"name": landlord["name"], "email": landlord["email"], "user_id": landlord["user_id"]} if landlord else None
    }

@api_router.get("/tenant/documents")
async def get_tenant_documents(user: dict = Depends(require_tenant)):
    prop = await db.properties.find_one({"tenant_id": user["user_id"]}, {"_id": 0})
    
    # Placeholder documents
    return {
        "documents": [
            {"id": "doc_1", "name": "Tenancy Agreement", "type": "pdf", "uploaded_at": "2026-01-15"},
            {"id": "doc_2", "name": "EPC Certificate", "type": "pdf", "uploaded_at": "2026-01-15"},
            {"id": "doc_3", "name": "Gas Safety Certificate", "type": "pdf", "uploaded_at": "2026-01-10"}
        ] if prop else []
    }

# ==================== THREADED CHAT SYSTEM ====================

@api_router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(user: dict = Depends(get_current_user)):
    """Get all conversations for current user"""
    role = user.get("role")
    
    if role == "landlord":
        convs = await db.conversations.find({"landlord_id": user["user_id"]}, {"_id": 0}).to_list(100)
    else:
        convs = await db.conversations.find({"tenant_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for conv in convs:
        # Get other party info
        if role == "landlord":
            other = await db.users.find_one({"user_id": conv["tenant_id"]}, {"_id": 0})
            tenant_name = other["name"] if other else "Unknown"
            tenant_email = other["email"] if other else ""
        else:
            other = await db.users.find_one({"user_id": conv["landlord_id"]}, {"_id": 0})
            tenant_name = user["name"]
            tenant_email = user["email"]
        
        # Get property info
        prop = await db.properties.find_one({"property_id": conv.get("property_id")}, {"_id": 0}) if conv.get("property_id") else None
        
        # Get last message
        last_msg = await db.chat_messages.find_one({"conversation_id": conv["conversation_id"]}, {"_id": 0}, sort=[("created_at", -1)])
        
        # Count unread (messages from other party)
        unread_query = {"conversation_id": conv["conversation_id"], "sender_id": {"$ne": user["user_id"]}, "read": {"$ne": True}}
        unread = await db.chat_messages.count_documents(unread_query)
        
        result.append(ConversationResponse(
            conversation_id=conv["conversation_id"],
            landlord_id=conv["landlord_id"],
            tenant_id=conv["tenant_id"],
            tenant_name=tenant_name,
            tenant_email=tenant_email,
            property_id=conv.get("property_id"),
            property_address=f"{prop['address']}, {prop['city']}" if prop else None,
            last_message=last_msg["message"][:50] + "..." if last_msg and len(last_msg["message"]) > 50 else (last_msg["message"] if last_msg else None),
            last_message_at=last_msg["created_at"] if last_msg else None,
            unread_count=unread
        ))
    
    # Sort by last message
    result.sort(key=lambda x: x.last_message_at or "", reverse=True)
    return result

@api_router.get("/conversations/{conversation_id}/messages", response_model=List[ChatMessageResponse])
async def get_conversation_messages(conversation_id: str, user: dict = Depends(get_current_user)):
    """Get messages in a conversation"""
    conv = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if user["user_id"] not in [conv["landlord_id"], conv["tenant_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mark messages as read
    await db.chat_messages.update_many(
        {"conversation_id": conversation_id, "sender_id": {"$ne": user["user_id"]}},
        {"$set": {"read": True}}
    )
    
    messages = await db.chat_messages.find({"conversation_id": conversation_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [ChatMessageResponse(**m) for m in messages]

@api_router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageResponse)
async def send_message(conversation_id: str, data: ChatMessageCreate, user: dict = Depends(get_current_user)):
    """Send a message in a conversation"""
    conv = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if user["user_id"] not in [conv["landlord_id"], conv["tenant_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    msg_doc = {
        "message_id": message_id,
        "conversation_id": conversation_id,
        "sender_id": user["user_id"],
        "sender_role": user.get("role"),
        "sender_name": user["name"],
        "property_id": conv.get("property_id"),
        "message": data.message,
        "attachments": data.attachments,
        "is_auto_reply": False,
        "read": False,
        "created_at": now
    }
    await db.chat_messages.insert_one(msg_doc)
    
    # Update conversation
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"last_message_at": now}, "$inc": {"message_count": 1}}
    )
    
    # Auto-reply only on FIRST message in thread from tenant
    if user.get("role") == "tenant":
        existing_count = await db.chat_messages.count_documents({"conversation_id": conversation_id, "sender_role": "tenant", "is_auto_reply": False})
        if existing_count == 1:  # This is the first tenant message
            auto_reply_id = f"msg_{uuid.uuid4().hex[:12]}"
            auto_reply = {
                "message_id": auto_reply_id,
                "conversation_id": conversation_id,
                "sender_id": "system",
                "sender_role": "system",
                "sender_name": "EcoRent Support",
                "property_id": conv.get("property_id"),
                "message": "Message received. We will reach you shortly.",
                "attachments": [],
                "is_auto_reply": True,
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.chat_messages.insert_one(auto_reply)
    
    return ChatMessageResponse(**{k: v for k, v in msg_doc.items() if k != "_id"})

@api_router.post("/chat/start", response_model=ConversationResponse)
async def start_conversation(user: dict = Depends(require_tenant)):
    """Tenant starts a new conversation with their landlord"""
    prop = await db.properties.find_one({"tenant_id": user["user_id"]}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=400, detail="No property assigned")
    
    landlord_id = prop["user_id"]
    
    # Check for existing conversation
    existing = await db.conversations.find_one({"landlord_id": landlord_id, "tenant_id": user["user_id"]})
    if existing:
        landlord = await db.users.find_one({"user_id": landlord_id}, {"_id": 0})
        return ConversationResponse(
            conversation_id=existing["conversation_id"],
            landlord_id=landlord_id,
            tenant_id=user["user_id"],
            tenant_name=user["name"],
            tenant_email=user["email"],
            property_id=prop["property_id"],
            property_address=f"{prop['address']}, {prop['city']}",
            last_message=None,
            last_message_at=None,
            unread_count=0
        )
    
    conv_id = f"conv_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    conv_doc = {
        "conversation_id": conv_id,
        "landlord_id": landlord_id,
        "tenant_id": user["user_id"],
        "property_id": prop["property_id"],
        "created_at": now,
        "last_message_at": None,
        "message_count": 0
    }
    await db.conversations.insert_one(conv_doc)
    
    landlord = await db.users.find_one({"user_id": landlord_id}, {"_id": 0})
    
    return ConversationResponse(
        conversation_id=conv_id,
        landlord_id=landlord_id,
        tenant_id=user["user_id"],
        tenant_name=user["name"],
        tenant_email=user["email"],
        property_id=prop["property_id"],
        property_address=f"{prop['address']}, {prop['city']}",
        last_message=None,
        last_message_at=None,
        unread_count=0
    )

@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"conversation_id": conversation_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if user["user_id"] not in [conv["landlord_id"], conv["tenant_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.chat_messages.delete_many({"conversation_id": conversation_id})
    await db.conversations.delete_one({"conversation_id": conversation_id})
    return {"message": "Conversation deleted"}

# ==================== FILE UPLOAD ====================

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload file to Cloudinary"""
    if not os.environ.get("CLOUDINARY_CLOUD_NAME") or not os.environ.get("CLOUDINARY_API_KEY") or not os.environ.get("CLOUDINARY_API_SECRET"):
        return {"url": f"https://via.placeholder.com/400x300?text={file.filename}", "demo_mode": True}
    
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(
            contents,
            folder=f"ecorent/{user['user_id']}",
            resource_type="auto"
        )
        return {"url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return {"url": f"https://via.placeholder.com/400x300?text={file.filename}", "demo_mode": True}

# ==================== LEAD CAPTURE ====================

@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(lead_data: LeadCreate):
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    lead_doc = {"lead_id": lead_id, **lead_data.model_dump(), "created_at": now}
    await db.leads.insert_one(lead_doc)
    
    if ADMIN_EMAIL and resend.api_key:
        try:
            params = {
                "from": SENDER_EMAIL,
                "to": [ADMIN_EMAIL],
                "subject": f"New Lead: {lead_data.name} - EcoRent UK",
                "html": f"<h2>New Lead</h2><p>Name: {lead_data.name}</p><p>Email: {lead_data.email}</p><p>Message: {lead_data.message}</p>"
            }
            await asyncio.to_thread(resend.Emails.send, params)
        except Exception as e:
            logger.error(f"Lead notification error: {e}")
    
    return LeadResponse(**{k: v for k, v in lead_doc.items() if k != "_id"})

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(user: dict = Depends(require_landlord)):
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [LeadResponse(**l) for l in leads]

# ==================== NOTIFICATIONS ====================

@api_router.post("/notifications/test")
async def send_test_notification(user: dict = Depends(get_current_user)):
    """Send test notification - demo mode if no API key"""
    if not resend.api_key:
        return {"message": "DEMO MODE: Notification simulated successfully", "demo_mode": True}
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [user["email"]],
            "subject": "Test Notification - EcoRent UK",
            "html": f"<h1>EcoRent UK</h1><p>Hello {user['name']}! This is a test notification.</p>"
        }
        await asyncio.to_thread(resend.Emails.send, params)
        return {"message": f"Test notification sent to {user['email']}", "demo_mode": False}
    except Exception as e:
        logger.error(f"Notification error: {e}")
        return {"message": "DEMO MODE: Notification simulated successfully", "demo_mode": True}

# ==================== HEM CALCULATOR ====================

@api_router.post("/sustainability/hem-calculator", response_model=HEMCalculatorResponse)
async def calculate_hem(data: HEMCalculatorInput, user: dict = Depends(get_current_user)):
    epc_scores = {"A": 92, "B": 81, "C": 69, "D": 55, "E": 39, "F": 21, "G": 1}
    current_score = epc_scores.get(data.current_epc.upper(), 55)
    
    base_energy_cost = 25
    insulation_savings = {"None": 0, "Standard": 0.15, "Good": 0.25, "Excellent": 0.35}
    current_annual_cost = data.floor_area_sqm * base_energy_cost * (1 - insulation_savings.get(data.current_insulation, 0))
    
    heat_pump_cost = 12000
    insulation_upgrade_cost = data.floor_area_sqm * 45
    annual_savings_heat_pump = current_annual_cost * 0.6
    annual_savings_insulation = current_annual_cost * 0.30
    
    heat_pump_roi = heat_pump_cost / max(annual_savings_heat_pump, 1)
    insulation_roi = insulation_upgrade_cost / max(annual_savings_insulation, 1)
    projected_score = min(current_score + 25, 100)
    carbon_reduction = data.floor_area_sqm * 15
    
    recommendations = []
    if data.has_gas_heating:
        recommendations.append(f"Consider an air source heat pump - ROI of {heat_pump_roi:.1f} years")
    if data.current_insulation in ["None", "Standard"]:
        recommendations.append(f"Upgrade insulation - save £{annual_savings_insulation:.0f}/year")
    if current_score < 69:
        recommendations.append("Improvements needed for 2028 EPC C minimum")
    recommendations.append("Solar PV could reduce costs by 30-50%")
    
    return HEMCalculatorResponse(
        current_hem_score=float(current_score), projected_hem_score=float(projected_score),
        heat_pump_roi_years=round(heat_pump_roi, 1), insulation_roi_years=round(insulation_roi, 1),
        annual_energy_savings_gbp=round(annual_savings_heat_pump + annual_savings_insulation, 2),
        carbon_reduction_kg=round(carbon_reduction, 2), recommendations=recommendations
    )

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(require_landlord)):
    properties = await db.properties.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    property_count = len(properties)
    
    epc_scores = {"A": 92, "B": 81, "C": 69, "D": 55, "E": 39, "F": 21, "G": 1}
    avg_epc = sum(epc_scores.get(p.get("epc_rating", "D"), 55) for p in properties) / max(len(properties), 1)
    
    # Count unread messages
    unread = await db.chat_messages.count_documents({"conversation_id": {"$in": [c["conversation_id"] for c in await db.conversations.find({"landlord_id": user["user_id"]}).to_list(100)]}, "sender_role": "tenant", "read": {"$ne": True}})
    
    total_value = sum(p.get("price", 0) for p in properties)
    green_count = sum(1 for p in properties if p.get("has_solar_panels") or p.get("has_heat_pump"))
    compliant_count = sum(1 for p in properties if epc_scores.get(p.get("epc_rating", "D"), 55) >= 69)
    
    return {
        "property_count": property_count,
        "average_epc_score": round(avg_epc, 1),
        "urgent_messages": unread,
        "total_portfolio_value": total_value,
        "green_properties": green_count,
        "compliance_status": "Good" if avg_epc >= 69 or property_count == 0 else "Action Required",
        "compliant_properties": compliant_count,
        "non_compliant_properties": property_count - compliant_count,
        "compliance_percentage": round((compliant_count / property_count * 100) if property_count > 0 else 100, 1)
    }

# ==================== STATUS ====================

@api_router.get("/")
async def root():
    return {"message": "EcoRent UK API v1.0", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

_cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000')
_allow_origins = ["*"] if _cors_origins == "*" else _cors_origins.split(',')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_test_accounts()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
