#!/usr/bin/env python3
"""
EcoRent UK Backend API Testing Suite - Multi-Role Architecture Testing
Tests role-based authentication, access control, and tenant/landlord specific endpoints
"""
import requests
import sys
import json
from datetime import datetime, timezone
import uuid
import time

class EcoRentAPITester:
    def __init__(self):
        self.base_url = base_url.rstrip('/')
        self.landlord_session = requests.Session()
        self.tenant_session = requests.Session()
        self.landlord_session.headers.update({'Content-Type': 'application/json'})
        self.tenant_session.headers.update({'Content-Type': 'application/json'})
        
        self.landlord_data = None
        self.tenant_data = None
        self.property_data = None
        self.chat_data = None
        
        self.tests_run = 0
        self.tests_passed = 0
        self.errors = []
        
        # Test account credentials
        self.landlord_creds = {"email": "admin@test.com", "password": "admin123"}
        self.tenant_creds = {"email": "tenant@test.com", "password": "tenant123"}

    def log_test(self, name, passed, message="", response_data=None):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}")
        
        if message:
            print(f"     {message}")
        
        if passed:
            self.tests_passed += 1
        else:
            self.errors.append(f"{name}: {message}")
            if response_data:
                print(f"     Response: {json.dumps(response_data, indent=2)}")

    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/api/")
            passed = response.status_code == 200
            data = response.json() if passed else {}
            self.log_test("API Health Check", passed, 
                         f"Status: {response.status_code}, Message: {data.get('message', 'No message')}", data)
            return passed
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_health_endpoint(self):
        """Test health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/health")
            passed = response.status_code == 200
            data = response.json() if passed else {}
            self.log_test("Health Endpoint", passed, 
                         f"Status: {response.status_code}, Timestamp: {data.get('timestamp', 'N/A')}", data)
            return passed
        except Exception as e:
            self.log_test("Health Endpoint", False, f"Error: {str(e)}")
            return False

    def test_landlord_login(self):
        """Test landlord login with test account"""
        try:
            response = self.landlord_session.post(f"{self.base_url}/api/auth/login", json=self.landlord_creds)
            passed = response.status_code == 200
            
            if passed:
                self.landlord_data = response.json()
                expected_role = "landlord"
                actual_role = self.landlord_data.get('role')
                role_match = actual_role == expected_role
                
                if role_match:
                    self.log_test("Landlord Login", True, 
                                 f"Login successful: {self.landlord_data.get('email')}, Role: {actual_role}")
                else:
                    self.log_test("Landlord Login", False, 
                                 f"Role mismatch - Expected: {expected_role}, Got: {actual_role}")
                    passed = False
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Landlord Login", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Landlord Login", False, f"Error: {str(e)}")
            return False
    
    def test_tenant_login(self):
        """Test tenant login with test account"""
        try:
            response = self.tenant_session.post(f"{self.base_url}/api/auth/login", json=self.tenant_creds)
            passed = response.status_code == 200
            
            if passed:
                self.tenant_data = response.json()
                expected_role = "tenant"
                actual_role = self.tenant_data.get('role')
                role_match = actual_role == expected_role
                
                if role_match:
                    self.log_test("Tenant Login", True, 
                                 f"Login successful: {self.tenant_data.get('email')}, Role: {actual_role}")
                else:
                    self.log_test("Tenant Login", False, 
                                 f"Role mismatch - Expected: {expected_role}, Got: {actual_role}")
                    passed = False
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Tenant Login", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Tenant Login", False, f"Error: {str(e)}")
            return False

    def test_role_based_access_control(self):
        """Test that landlords can't access tenant endpoints and vice versa"""
        tests_passed = 0
        total_tests = 4
        
        try:
            # Test 1: Tenant trying to access landlord dashboard stats
            response = self.tenant_session.get(f"{self.base_url}/api/dashboard/stats")
            if response.status_code == 403:
                self.log_test("Tenant Access to Dashboard Stats (403)", True, "Correctly blocked tenant access")
                tests_passed += 1
            else:
                self.log_test("Tenant Access to Dashboard Stats (403)", False, 
                             f"Expected 403, got {response.status_code}")
            
            # Test 2: Tenant trying to access landlord properties endpoint  
            response = self.tenant_session.get(f"{self.base_url}/api/properties")
            if response.status_code == 403:
                self.log_test("Tenant Access to Properties (403)", True, "Correctly blocked tenant access")
                tests_passed += 1
            else:
                self.log_test("Tenant Access to Properties (403)", False, 
                             f"Expected 403, got {response.status_code}")
                             
            # Test 3: Landlord trying to access tenant-specific endpoints
            response = self.landlord_session.get(f"{self.base_url}/api/tenant/my-home")
            if response.status_code == 403:
                self.log_test("Landlord Access to Tenant Home (403)", True, "Correctly blocked landlord access")
                tests_passed += 1
            else:
                self.log_test("Landlord Access to Tenant Home (403)", False, 
                             f"Expected 403, got {response.status_code}")
                             
            # Test 4: Landlord trying to access tenant documents
            response = self.landlord_session.get(f"{self.base_url}/api/tenant/documents")
            if response.status_code == 403:
                self.log_test("Landlord Access to Tenant Documents (403)", True, "Correctly blocked landlord access")
                tests_passed += 1
            else:
                self.log_test("Landlord Access to Tenant Documents (403)", False, 
                             f"Expected 403, got {response.status_code}")
            
            return tests_passed == total_tests
            
        except Exception as e:
            self.log_test("Role Based Access Control", False, f"Error: {str(e)}")
            return False
            
    def test_tenant_endpoints(self):
        """Test tenant-specific endpoints"""
        tests_passed = 0
        total_tests = 2
        
        try:
            # Test tenant home endpoint
            response = self.tenant_session.get(f"{self.base_url}/api/tenant/my-home")
            if response.status_code == 200:
                home_data = response.json()
                self.log_test("Tenant My Home Endpoint", True, 
                             f"Has property: {home_data.get('has_property')}")
                tests_passed += 1
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Tenant My Home Endpoint", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}")
                             
            # Test tenant documents endpoint
            response = self.tenant_session.get(f"{self.base_url}/api/tenant/documents")
            if response.status_code == 200:
                docs_data = response.json()
                self.log_test("Tenant Documents Endpoint", True, 
                             f"Documents count: {len(docs_data.get('documents', []))}")
                tests_passed += 1
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Tenant Documents Endpoint", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}")
                             
            return tests_passed == total_tests
            
        except Exception as e:
            self.log_test("Tenant Endpoints", False, f"Error: {str(e)}")
            return False

    def test_role_registration(self):
        """Test registration with role selection"""
        tests_passed = 0
        total_tests = 2
        
        try:
            # Test landlord registration
            timestamp = str(int(time.time()))
            landlord_payload = {
                "name": f"Test Landlord {timestamp}",
                "email": f"landlord{timestamp}@test.com",
                "password": "TestPassword123!",
                "role": "landlord"
            }
            
            response = self.landlord_session.post(f"{self.base_url}/api/auth/register", json=landlord_payload)
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get('role') == 'landlord':
                    self.log_test("Landlord Registration", True, 
                                 f"Landlord registered: {user_data.get('email')}")
                    tests_passed += 1
                else:
                    self.log_test("Landlord Registration", False, 
                                 f"Expected role 'landlord', got '{user_data.get('role')}'")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Landlord Registration", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}")
            
            # Test tenant registration
            tenant_payload = {
                "name": f"Test Tenant {timestamp}",
                "email": f"tenant{timestamp}@test.com",
                "password": "TestPassword123!",
                "role": "tenant"
            }
            
            response = self.tenant_session.post(f"{self.base_url}/api/auth/register", json=tenant_payload)
            if response.status_code == 200:
                user_data = response.json()
                if user_data.get('role') == 'tenant':
                    self.log_test("Tenant Registration", True, 
                                 f"Tenant registered: {user_data.get('email')}")
                    tests_passed += 1
                else:
                    self.log_test("Tenant Registration", False, 
                                 f"Expected role 'tenant', got '{user_data.get('role')}'")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Tenant Registration", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}")
            
            return tests_passed == total_tests
            
        except Exception as e:
            self.log_test("Role Registration", False, f"Error: {str(e)}")
            return False

    def test_lead_capture(self):
        """Test lead capture endpoint"""
        try:
            lead_payload = {
                "name": "Test Lead",
                "email": f"lead{int(time.time())}@test.com",
                "phone": "+44 20 1234 5678",
                "message": "I'm interested in your sustainable property management services.",
                "property_interest": "Eco-friendly properties"
            }
            
            response = self.session.post(f"{self.base_url}/api/leads", json=lead_payload)
            passed = response.status_code == 200
            
            if passed:
                lead_data = response.json()
                self.log_test("Lead Capture", True, 
                             f"Lead created: {lead_data.get('lead_id')}")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Lead Capture", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Lead Capture", False, f"Error: {str(e)}")
            return False

    def test_property_creation(self):
        """Test property creation"""
        try:
            property_payload = {
                "title": "Test Eco Property",
                "address": "123 Green Street",
                "city": "London",
                "postcode": "E1 6AN",
                "price": 450000.0,
                "bedrooms": 2,
                "bathrooms": 1,
                "property_type": "Flat",
                "description": "A beautiful eco-friendly flat with excellent energy efficiency.",
                "epc_rating": "B",
                "has_solar_panels": True,
                "has_heat_pump": False,
                "insulation_type": "Good",
                "images": []
            }
            
            response = self.session.post(f"{self.base_url}/api/properties", json=property_payload)
            passed = response.status_code in [200, 201]  # Accept both 200 and 201
            
            if passed:
                self.property_data = response.json()
                self.log_test("Property Creation", True, 
                             f"Property created: {self.property_data.get('property_id')}")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Property Creation", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Property Creation", False, f"Error: {str(e)}")
            return False

    def test_property_listing(self):
        """Test property listing"""
        try:
            response = self.session.get(f"{self.base_url}/api/properties")
            passed = response.status_code == 200
            
            if passed:
                properties = response.json()
                self.log_test("Property Listing", True, 
                             f"Retrieved {len(properties)} properties")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Property Listing", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Property Listing", False, f"Error: {str(e)}")
            return False

    def test_property_update(self):
        """Test property update"""
        if not self.property_data:
            self.log_test("Property Update", False, "No property data available")
            return False
            
        try:
            property_id = self.property_data.get('property_id')
            update_payload = {
                "title": "Updated Eco Property",
                "address": "123 Green Street",
                "city": "London", 
                "postcode": "E1 6AN",
                "price": 475000.0,
                "bedrooms": 2,
                "bathrooms": 2,
                "property_type": "Flat",
                "description": "Updated description with new bathroom.",
                "epc_rating": "A",
                "has_solar_panels": True,
                "has_heat_pump": True,
                "insulation_type": "Excellent",
                "images": []
            }
            
            response = self.session.put(f"{self.base_url}/api/properties/{property_id}", json=update_payload)
            passed = response.status_code == 200
            
            if passed:
                updated_property = response.json()
                self.log_test("Property Update", True, 
                             f"Property updated: {updated_property.get('title')}")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Property Update", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Property Update", False, f"Error: {str(e)}")
            return False

    def test_hem_calculator(self):
        """Test HEM calculator"""
        try:
            hem_payload = {
                "current_epc": "D",
                "property_type": "Semi-Detached",
                "floor_area_sqm": 85.5,
                "has_gas_heating": True,
                "current_insulation": "Standard",
                "region": "England"
            }
            
            response = self.session.post(f"{self.base_url}/api/sustainability/hem-calculator", json=hem_payload)
            passed = response.status_code == 200
            
            if passed:
                hem_data = response.json()
                self.log_test("HEM Calculator", True, 
                             f"Current HEM: {hem_data.get('current_hem_score')}, Projected: {hem_data.get('projected_hem_score')}")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("HEM Calculator", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("HEM Calculator", False, f"Error: {str(e)}")
            return False

    def test_chat_with_roles(self):
        """Test chat functionality with tenant auto-reply and landlord viewing"""
        tests_passed = 0
        total_tests = 3
        
        try:
            # Test 1: Tenant sends message and gets auto-reply
            tenant_message = {
                "message": "My heating isn't working and it's very cold. This is urgent!",
                "property_id": None
            }
            
            response = self.tenant_session.post(f"{self.base_url}/api/chat", json=tenant_message)
            if response.status_code == 200:
                chat_data = response.json()
                expected_response = "Message received. We will reach you shortly."
                actual_response = chat_data.get('response', '')
                sender_role = chat_data.get('sender_role', '')
                sender_name = chat_data.get('sender_name', '')
                
                if actual_response == expected_response and sender_role == "tenant":
                    self.log_test("Tenant Chat Auto-Reply", True, 
                                 f"Auto-reply correct, Sender: {sender_name} ({sender_role})")
                    tests_passed += 1
                else:
                    self.log_test("Tenant Chat Auto-Reply", False, 
                                 f"Expected response: '{expected_response}', Got: '{actual_response}'")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Tenant Chat Auto-Reply", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}")
            
            # Test 2: Landlord can view tenant messages
            response = self.landlord_session.get(f"{self.base_url}/api/chat")
            if response.status_code == 200:
                messages = response.json()
                tenant_messages = [m for m in messages if m.get('sender_role') == 'tenant']
                if len(tenant_messages) > 0:
                    self.log_test("Landlord View Tenant Messages", True, 
                                 f"Landlord can see {len(tenant_messages)} tenant messages")
                    tests_passed += 1
                else:
                    self.log_test("Landlord View Tenant Messages", False, 
                                 "No tenant messages visible to landlord")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Landlord View Tenant Messages", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}")
                             
            # Test 3: Check message contains sender_role and sender_name fields
            response = self.tenant_session.get(f"{self.base_url}/api/chat")
            if response.status_code == 200:
                messages = response.json()
                if len(messages) > 0:
                    latest_message = messages[0]
                    has_role_field = 'sender_role' in latest_message
                    has_name_field = 'sender_name' in latest_message
                    
                    if has_role_field and has_name_field:
                        self.log_test("Chat Message Fields", True, 
                                     f"Message has sender_role and sender_name fields")
                        tests_passed += 1
                    else:
                        self.log_test("Chat Message Fields", False, 
                                     f"Missing fields - Role: {has_role_field}, Name: {has_name_field}")
                else:
                    self.log_test("Chat Message Fields", False, "No messages to check")
            else:
                self.log_test("Chat Message Fields", False, "Failed to retrieve messages")
            
            return tests_passed == total_tests
            
        except Exception as e:
            self.log_test("Chat with Roles", False, f"Error: {str(e)}")
            return False

    def test_chat_history(self):
        """Test chat history retrieval"""
        try:
            response = self.session.get(f"{self.base_url}/api/chat")
            passed = response.status_code == 200
            
            if passed:
                chat_history = response.json()
                self.log_test("Chat History", True, 
                             f"Retrieved {len(chat_history)} chat messages")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Chat History", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Chat History", False, f"Error: {str(e)}")
            return False

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        try:
            response = self.session.get(f"{self.base_url}/api/dashboard/stats")
            passed = response.status_code == 200
            
            if passed:
                stats = response.json()
                self.log_test("Dashboard Stats", True, 
                             f"Properties: {stats.get('property_count')}, Avg EPC: {stats.get('average_epc_score')}")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Dashboard Stats", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Error: {str(e)}")
            return False

    def test_property_deletion(self):
        """Test property deletion"""
        if not self.property_data:
            self.log_test("Property Deletion", False, "No property data available")
            return False
            
        try:
            property_id = self.property_data.get('property_id')
            response = self.session.delete(f"{self.base_url}/api/properties/{property_id}")
            passed = response.status_code == 200
            
            if passed:
                self.log_test("Property Deletion", True, "Property deleted successfully")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Property Deletion", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Property Deletion", False, f"Error: {str(e)}")
            return False

    def test_change_password(self):
        """Test change password endpoint"""
        try:
            password_payload = {
                "current_password": "TestPassword123!",
                "new_password": "NewTestPassword456!"
            }
            
            response = self.session.post(f"{self.base_url}/api/auth/change-password", json=password_payload)
            passed = response.status_code == 200
            
            if passed:
                self.log_test("Change Password", True, "Password changed successfully")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Change Password", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Change Password", False, f"Error: {str(e)}")
            return False

    def test_2fa_setup(self):
        """Test 2FA setup endpoint"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/2fa/setup")
            passed = response.status_code == 200
            
            if passed:
                setup_data = response.json()
                self.log_test("2FA Setup", True, 
                             f"2FA setup successful, secret provided: {bool(setup_data.get('secret'))}")
                return setup_data
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("2FA Setup", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return False
        except Exception as e:
            self.log_test("2FA Setup", False, f"Error: {str(e)}")
            return False

    def test_settings_persistence(self):
        """Test settings persistence across both roles"""
        tests_passed = 0
        total_tests = 4
        
        try:
            # Test landlord settings update
            landlord_settings = {
                "notifications": {
                    "new_leads": False,
                    "urgent_messages": True,
                    "epc_reminders": True,
                    "marketing": False
                },
                "theme": "dark"
            }
            
            response = self.landlord_session.put(f"{self.base_url}/api/user/settings", json=landlord_settings)
            if response.status_code == 200:
                self.log_test("Landlord Settings Update", True, "Settings updated successfully")
                tests_passed += 1
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Landlord Settings Update", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}")
            
            # Test landlord settings retrieval
            response = self.landlord_session.get(f"{self.base_url}/api/user/settings")
            if response.status_code == 200:
                settings_data = response.json()
                notifications = settings_data.get('settings', {}).get('notifications', {})
                new_leads_setting = notifications.get('new_leads')
                
                if new_leads_setting == False:  # Check our updated setting persisted
                    self.log_test("Landlord Settings Persistence", True, "Settings correctly persisted")
                    tests_passed += 1
                else:
                    self.log_test("Landlord Settings Persistence", False, 
                                 f"Expected new_leads=False, got {new_leads_setting}")
            else:
                self.log_test("Landlord Settings Persistence", False, 
                             f"Failed to retrieve settings: {response.status_code}")
            
            # Test tenant settings update
            tenant_settings = {
                "notifications": {
                    "new_leads": True,
                    "urgent_messages": False,
                    "epc_reminders": False,
                    "marketing": True
                },
                "theme": "light"
            }
            
            response = self.tenant_session.put(f"{self.base_url}/api/user/settings", json=tenant_settings)
            if response.status_code == 200:
                self.log_test("Tenant Settings Update", True, "Settings updated successfully")
                tests_passed += 1
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Tenant Settings Update", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}")
            
            # Test tenant settings retrieval
            response = self.tenant_session.get(f"{self.base_url}/api/user/settings")
            if response.status_code == 200:
                settings_data = response.json()
                theme = settings_data.get('settings', {}).get('theme')
                
                if theme == "light":  # Check our updated setting persisted
                    self.log_test("Tenant Settings Persistence", True, "Settings correctly persisted")
                    tests_passed += 1
                else:
                    self.log_test("Tenant Settings Persistence", False, 
                                 f"Expected theme=light, got {theme}")
            else:
                self.log_test("Tenant Settings Persistence", False, 
                             f"Failed to retrieve settings: {response.status_code}")
            
            return tests_passed == total_tests
            
        except Exception as e:
            self.log_test("Settings Persistence", False, f"Error: {str(e)}")
            return False

    def test_test_notification(self):
        """Test notification endpoint"""
        try:
            response = self.session.post(f"{self.base_url}/api/notifications/test")
            # Accept both 200 and 400 (if email not configured)
            passed = response.status_code in [200, 400]
            
            if response.status_code == 200:
                notification_data = response.json()
                self.log_test("Test Notification", True, 
                             f"Notification sent: {notification_data.get('message')}")
            elif response.status_code == 400:
                self.log_test("Test Notification", True, 
                             "Notification endpoint working (email not configured)")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Test Notification", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Test Notification", False, f"Error: {str(e)}")
            return False

    def test_chat_management(self):
        """Test chat management endpoints"""
        try:
            # First send a chat message to have something to delete
            chat_payload = {
                "message": "Test message for deletion",
                "property_id": self.property_data.get('property_id') if self.property_data else None
            }
            
            chat_response = self.session.post(f"{self.base_url}/api/chat", json=chat_payload)
            if chat_response.status_code != 200:
                self.log_test("Chat Management Setup", False, "Failed to create test message")
                return False
            
            chat_data = chat_response.json()
            message_id = chat_data.get('message_id')
            
            # Test delete single message
            delete_response = self.session.delete(f"{self.base_url}/api/chat/{message_id}")
            delete_passed = delete_response.status_code == 200
            
            if delete_passed:
                self.log_test("Delete Chat Message", True, f"Message deleted: {message_id}")
            else:
                error_data = delete_response.json() if delete_response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Delete Chat Message", False, 
                             f"Status: {delete_response.status_code}, Error: {error_data.get('detail', delete_response.text)}", error_data)
            
            # Test clear chat history
            clear_response = self.session.delete(f"{self.base_url}/api/chat")
            clear_passed = clear_response.status_code == 200
            
            if clear_passed:
                clear_data = clear_response.json()
                self.log_test("Clear Chat History", True, 
                             f"Chat history cleared: {clear_data.get('message')}")
            else:
                error_data = clear_response.json() if clear_response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Clear Chat History", False, 
                             f"Status: {clear_response.status_code}, Error: {error_data.get('detail', clear_response.text)}", error_data)
            
            return delete_passed and clear_passed
        except Exception as e:
            self.log_test("Chat Management", False, f"Error: {str(e)}")
            return False

    def test_dashboard_stats_compliance(self):
        """Test dashboard stats with compliance data"""
        try:
            response = self.session.get(f"{self.base_url}/api/dashboard/stats")
            passed = response.status_code == 200
            
            if passed:
                stats = response.json()
                # Check for new compliance fields
                compliance_fields = ['compliant_properties', 'non_compliant_properties', 'compliance_percentage']
                has_compliance_data = all(field in stats for field in compliance_fields)
                
                self.log_test("Dashboard Stats (Compliance)", True, 
                             f"Properties: {stats.get('property_count')}, Compliant: {stats.get('compliant_properties')}, "
                             f"Compliance %: {stats.get('compliance_percentage')}%")
                
                if not has_compliance_data:
                    self.log_test("Dashboard Stats (Compliance Fields)", False, 
                                 "Missing compliance fields in response")
                    return False
                    
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Dashboard Stats (Compliance)", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Dashboard Stats (Compliance)", False, f"Error: {str(e)}")
            return False

    def test_logout(self):
        """Test user logout"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/logout")
            passed = response.status_code == 200
            
            if passed:
                self.log_test("User Logout", True, "Logout successful")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("User Logout", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("User Logout", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all multi-role architecture tests"""
        print("🚀 Starting EcoRent UK Multi-Role Architecture Tests")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_api_health():
            print("❌ Critical: API not accessible. Stopping tests.")
            return self.generate_summary()
        
        self.test_health_endpoint()
        
        # Test role-based authentication
        landlord_login_success = self.test_landlord_login()
        tenant_login_success = self.test_tenant_login()
        
        if not (landlord_login_success and tenant_login_success):
            print("❌ Critical: Login tests failed. Stopping tests.")
            return self.generate_summary()
        
        # Test role-based access control
        self.test_role_based_access_control()
        
        # Test tenant-specific endpoints
        self.test_tenant_endpoints()
        
        # Test chat functionality with roles
        self.test_chat_with_roles()
        
        # Test settings persistence
        self.test_settings_persistence()
        
        # Test registration with role selection
        self.test_role_registration()
        
        # Test landlord-specific functionality
        self.test_property_creation_landlord()
        self.test_dashboard_stats()
        
        return self.generate_summary()
        
    def test_property_creation_landlord(self):
        """Test property creation by landlord"""
        try:
            property_payload = {
                "title": "Test Eco Property",
                "address": "123 Green Street",
                "city": "London",
                "postcode": "E1 6AN",
                "price": 450000.0,
                "bedrooms": 2,
                "bathrooms": 1,
                "property_type": "Flat",
                "description": "A beautiful eco-friendly flat with excellent energy efficiency.",
                "epc_rating": "B",
                "has_solar_panels": True,
                "has_heat_pump": False,
                "insulation_type": "Good",
                "images": []
            }
            
            response = self.landlord_session.post(f"{self.base_url}/api/properties", json=property_payload)
            passed = response.status_code in [200, 201]
            
            if passed:
                self.property_data = response.json()
                self.log_test("Landlord Property Creation", True, 
                             f"Property created: {self.property_data.get('property_id')}")
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Landlord Property Creation", False, 
                             f"Status: {response.status_code}, Error: {error_data.get('detail', response.text)}", error_data)
            
            return passed
        except Exception as e:
            self.log_test("Landlord Property Creation", False, f"Error: {str(e)}")
            return False

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/max(self.tests_run, 1)*100):.1f}%")
        
        if self.errors:
            print(f"\n❌ FAILED TESTS:")
            for error in self.errors:
                print(f"  • {error}")
        
        success = self.tests_passed == self.tests_run and self.tests_run > 0
        print(f"\n{'✅ ALL TESTS PASSED!' if success else '❌ SOME TESTS FAILED!'}")
        
        return success

def main():
    """Run the test suite"""
    tester = EcoRentAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())