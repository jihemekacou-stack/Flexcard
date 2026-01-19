#!/usr/bin/env python3
"""
FlexCard Backend API Testing Suite
Tests all API endpoints for the digital business card platform
"""

import requests
import sys
import json
from datetime import datetime
import uuid
import base64

class FlexCardAPITester:
    def __init__(self, base_url="https://tapcard-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()  # Use session to handle cookies
        self.user_data = None
        self.profile_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test user data
        self.test_user = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test.user.{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }

    def log_test(self, name, success, details="", endpoint=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "endpoint": endpoint
        })

    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with proper headers and cookies"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=default_headers, timeout=10)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None

    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = self.make_request('GET', '')
        if response and response.status_code == 200:
            data = response.json()
            success = "TapCard API" in data.get("message", "")
            self.log_test("Root API endpoint", success, 
                         f"Status: {response.status_code}, Message: {data.get('message', 'N/A')}", 
                         "/api/")
        else:
            self.log_test("Root API endpoint", False, 
                         f"Status: {response.status_code if response else 'No response'}", 
                         "/api/")

    def test_user_registration(self):
        """Test user registration"""
        response = self.make_request('POST', 'auth/register', self.test_user)
        
        if response and response.status_code == 200:
            try:
                self.user_data = response.json()
                # Check if session cookie is set (we can't access it directly in requests)
                success = 'user_id' in self.user_data and 'email' in self.user_data
                self.log_test("User registration", success, 
                             f"User ID: {self.user_data.get('user_id', 'N/A')}", 
                             "/api/auth/register")
                return success
            except json.JSONDecodeError:
                self.log_test("User registration", False, "Invalid JSON response", "/api/auth/register")
                return False
        else:
            error_msg = "No response"
            if response:
                try:
                    error_data = response.json()
                    error_msg = f"Status: {response.status_code}, Error: {error_data.get('detail', 'Unknown')}"
                except:
                    error_msg = f"Status: {response.status_code}"
            
            self.log_test("User registration", False, error_msg, "/api/auth/register")
            return False

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        response = self.make_request('POST', 'auth/login', login_data)
        
        if response and response.status_code == 200:
            try:
                login_result = response.json()
                success = 'user_id' in login_result
                self.log_test("User login", success, 
                             f"User ID: {login_result.get('user_id', 'N/A')}", 
                             "/api/auth/login")
                return success
            except json.JSONDecodeError:
                self.log_test("User login", False, "Invalid JSON response", "/api/auth/login")
                return False
        else:
            error_msg = "No response"
            if response:
                try:
                    error_data = response.json()
                    error_msg = f"Status: {response.status_code}, Error: {error_data.get('detail', 'Unknown')}"
                except:
                    error_msg = f"Status: {response.status_code}"
            
            self.log_test("User login", False, error_msg, "/api/auth/login")
            return False

    def test_auth_me(self):
        """Test getting current user info"""
        response = self.make_request('GET', 'auth/me')
        
        if response and response.status_code == 200:
            try:
                user_info = response.json()
                success = 'user_id' in user_info and 'email' in user_info
                self.log_test("Auth me", success, 
                             f"User: {user_info.get('email', 'N/A')}", 
                             "/api/auth/me")
                return success
            except json.JSONDecodeError:
                self.log_test("Auth me", False, "Invalid JSON response", "/api/auth/me")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response and response.status_code == 401:
                error_msg += " (Unauthorized - session issue)"
            self.log_test("Auth me", False, error_msg, "/api/auth/me")
            return False

    def test_get_profile(self):
        """Test getting user profile"""
        response = self.make_request('GET', 'profile')
        
        if response and response.status_code == 200:
            try:
                self.profile_data = response.json()
                success = 'profile_id' in self.profile_data and 'username' in self.profile_data
                self.log_test("Get profile", success, 
                             f"Username: {self.profile_data.get('username', 'N/A')}", 
                             "/api/profile")
                return success
            except json.JSONDecodeError:
                self.log_test("Get profile", False, "Invalid JSON response", "/api/profile")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Get profile", False, error_msg, "/api/profile")
            return False

    def test_update_profile(self):
        """Test updating user profile"""
        if not self.profile_data:
            self.log_test("Update profile", False, "No profile data", "/api/profile")
            return False
            
        update_data = {
            "title": "Test Product Designer",
            "company": "Test Company Inc",
            "bio": "This is a test bio for the digital business card",
            "phone": "+33612345678",
            "website": "https://test-website.com",
            "location": "Paris, France"
        }
        
        response = self.make_request('PUT', 'profile', update_data)
        
        if response and response.status_code == 200:
            try:
                updated_profile = response.json()
                success = updated_profile.get('title') == update_data['title']
                self.log_test("Update profile", success, 
                             f"Title updated to: {updated_profile.get('title', 'N/A')}", 
                             "/api/profile")
                return success
            except json.JSONDecodeError:
                self.log_test("Update profile", False, "Invalid JSON response", "/api/profile")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Update profile", False, error_msg, "/api/profile")
            return False

    def test_links_management(self):
        """Test creating, getting, and deleting links"""
        if not self.profile_data:
            self.log_test("Links management", False, "No profile data", "/api/links")
            return False
        
        # Test creating a link
        link_data = {
            "type": "social",
            "platform": "linkedin",
            "url": "https://linkedin.com/in/testuser",
            "title": "My LinkedIn Profile",
            "is_active": True
        }
        
        response = self.make_request('POST', 'links', link_data)
        
        if not response or response.status_code != 200:
            self.log_test("Create link", False, 
                         f"Status: {response.status_code if response else 'No response'}", 
                         "/api/links")
            return False
        
        try:
            created_link = response.json()
            link_id = created_link.get('link_id')
            
            if not link_id:
                self.log_test("Create link", False, "No link_id in response", "/api/links")
                return False
                
            self.log_test("Create link", True, f"Link ID: {link_id}", "/api/links")
            
            # Test getting links
            response = self.make_request('GET', 'links')
            
            if response and response.status_code == 200:
                links = response.json()
                success = isinstance(links, list) and len(links) > 0
                self.log_test("Get links", success, f"Found {len(links)} links", "/api/links")
            else:
                self.log_test("Get links", False, 
                             f"Status: {response.status_code if response else 'No response'}", 
                             "/api/links")
                return False
            
            # Test deleting the link
            response = self.make_request('DELETE', f'links/{link_id}')
            
            if response and response.status_code == 200:
                self.log_test("Delete link", True, f"Deleted link {link_id}", f"/api/links/{link_id}")
                return True
            else:
                self.log_test("Delete link", False, 
                             f"Status: {response.status_code if response else 'No response'}", 
                             f"/api/links/{link_id}")
                return False
                
        except json.JSONDecodeError:
            self.log_test("Links management", False, "Invalid JSON response", "/api/links")
            return False

    def test_public_profile(self):
        """Test public profile access"""
        if not self.profile_data:
            self.log_test("Public profile", False, "No profile data", "/api/public/{username}")
            return False
            
        username = self.profile_data.get('username')
        if not username:
            self.log_test("Public profile", False, "No username", "/api/public/{username}")
            return False
            
        response = self.make_request('GET', f'public/{username}')
        
        if response and response.status_code == 200:
            try:
                public_data = response.json()
                success = 'profile' in public_data and 'links' in public_data
                self.log_test("Public profile", success, 
                             f"Profile accessible at /u/{username}", 
                             f"/api/public/{username}")
                return success
            except json.JSONDecodeError:
                self.log_test("Public profile", False, "Invalid JSON response", f"/api/public/{username}")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Public profile", False, error_msg, f"/api/public/{username}")
            return False

    def test_contact_form(self):
        """Test contact form submission on public profile"""
        if not self.profile_data:
            self.log_test("Contact form", False, "No profile data", "/api/public/{username}/contact")
            return False
            
        username = self.profile_data.get('username')
        if not username:
            self.log_test("Contact form", False, "No username", "/api/public/{username}/contact")
            return False
            
        contact_data = {
            "name": "Test Contact",
            "email": "contact@test.com",
            "phone": "+33612345678",
            "message": "This is a test contact message",
            "source": "form"
        }
        
        response = self.make_request('POST', f'public/{username}/contact', contact_data)
        
        if response and response.status_code == 200:
            try:
                result = response.json()
                success = 'contact_id' in result
                self.log_test("Contact form", success, 
                             f"Contact ID: {result.get('contact_id', 'N/A')}", 
                             f"/api/public/{username}/contact")
                return success
            except json.JSONDecodeError:
                self.log_test("Contact form", False, "Invalid JSON response", f"/api/public/{username}/contact")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Contact form", False, error_msg, f"/api/public/{username}/contact")
            return False

    def test_analytics(self):
        """Test analytics endpoint"""
        if not self.user_data:
            self.log_test("Analytics", False, "No user session", "/api/analytics")
            return False
            
        response = self.make_request('GET', 'analytics')
        
        if response and response.status_code == 200:
            try:
                analytics = response.json()
                expected_keys = ['total_views', 'total_clicks', 'total_contacts']
                success = all(key in analytics for key in expected_keys)
                self.log_test("Analytics", success, 
                             f"Views: {analytics.get('total_views', 0)}, Clicks: {analytics.get('total_clicks', 0)}", 
                             "/api/analytics")
                return success
            except json.JSONDecodeError:
                self.log_test("Analytics", False, "Invalid JSON response", "/api/analytics")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Analytics", False, error_msg, "/api/analytics")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting TapCard Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test authentication flow
        if self.test_user_registration():
            # Test session authentication
            self.test_auth_me()
            
            # If registration successful, test other endpoints
            self.test_get_profile()
            self.test_update_profile()
            self.test_links_management()
            self.test_public_profile()
            self.test_contact_form()
            self.test_analytics()
            
            # Test login with existing user
            self.test_user_login()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

    def get_failed_tests(self):
        """Get list of failed tests"""
        return [test for test in self.test_results if not test['success']]

def main():
    tester = TapCardAPITester()
    exit_code = tester.run_all_tests()
    
    # Print failed tests for debugging
    failed_tests = tester.get_failed_tests()
    if failed_tests:
        print("\n❌ Failed Tests Details:")
        for test in failed_tests:
            print(f"  - {test['name']}: {test['details']} (Endpoint: {test['endpoint']})")
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())