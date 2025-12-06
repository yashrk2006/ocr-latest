"""
Field Extractor Module
Extracts structured data from OCR text using pattern matching and NER
"""

import re
from typing import Dict, Optional, List, Tuple
from datetime import datetime
from dateutil import parser as date_parser
import logging

# Optional phonenumbers import
try:
    import phonenumbers
    PHONENUMBERS_AVAILABLE = True
except ImportError:
    PHONENUMBERS_AVAILABLE = False
    logging.warning("phonenumbers library not installed, phone validation will be limited")

logger = logging.getLogger(__name__)


class FieldExtractor:
    """Extract structured fields from OCR text"""
    
    def __init__(self, custom_patterns_path: str = "custom_patterns.json"):
        # Common patterns for field detection
        self.patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'),
            'date': re.compile(r'\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b'),
            'id_number': re.compile(r'\b[A-Z0-9]{6,15}\b'),
            'postal_code': re.compile(r'\b\d{5,6}\b'),
            'number': re.compile(r'\b\d+\b'),
        }
        
        # Default Field keywords
        self.default_keywords = {
            'name': [
                'name', 'full name', 'nombre', 'apellido', 'student name', 'name of student', 
                'candidate name', 'name of candidate', 'holder name', 'name of holder', 
                'first name', 'given name', 'surname', 'last name',
                'applicant', 'signed by', 'attn', 'to the attention of', 'in the matter of'
            ],
            'role': [
                'job title', 'position', 'role', 'designated as', 'the parties herein'
            ],
            'organization': [
                'company', 'firm name', 'organization', 'on behalf of', 'represented by'
            ],
            'father_name': [
                'father', 'father name', 'fathers name', 'father\'s name', 's/o', 'son of', 
                'guardian', 'guardian name', 'parent'
            ],
            'mother_name': [
                'mother', 'mother name', 'mothers name', 'mother\'s name', 'd/o', 'daughter of'
            ],
            'roll_no': [
                'roll no', 'roll number', 'roll', 'enrollment', 'enrollment no', 'enrolment no',
                'reg no', 'register no', 'registration no', 'registration number', 'reg. no',
                'scholar no', 'scholar number', 'admission no', 'admn no', 'serial no', 
                'unique id', 'uid', 'student id', 'id no', 'matricule', 'hall ticket no'
            ],
            'id_number': [
                'id', 'identification', 'document number', 'license', 'license no', 'dl no',
                'passport', 'passport no', 'card no', 'identity card no', 'aadhaar', 'pan',
                'case number', 'reference no', 'policy id', 'file', 'acct', 'account'
            ],
            'class': [
                'class', 'course', 'programme', 'prog', 'stream', 'branch', 'standard', 'std',
                'year', 'semester', 'sem', 'degree', 'qualification'
            ],
            'admission_year': [
                'admn y', 'admission year', 'year of admission', 'admn year', 'date of admission',
                'joining date', 'session', 'batch'
            ],
            'dob': [
                'date of birth', 'dob', 'birth date', 'born', 'born on', 'fecha de nacimiento', 
                'd.o.b', 'd.o.birth', 'birth'
            ],
            'effective_date': [
                'dated', 'effective', 'commencement date', 'this agreement is made on', 'as of', 'signed this'
            ],
            'expiry_date': [
                'expires on', 'termination date', 'valid until', 'date due', 'date of payment', 'expiry', 'expiration'
            ],
            'document_date': [
                'date', 'submitted on', 'issued'
            ],
            'address': [
                'address', 'street', 'city', 'state', 'dirección', 'residence', 'residential address',
                'permanent address', 'correspondence address', 'place of residence', 'domicile',
                'location', 'premises', 'to', 'zip code', 'postal code'
            ],
            'phone': [
                'phone', 'telephone', 'mobile', 'cell', 'teléfono', 'contact', 'contact no', 'mob', 'tel', 'fax'
            ],
            'email': [
                'email', 'e-mail', 'correo', 'mail', 'email id'
            ],
            'amount': [
                'total', 'amount due', 'balance', 'sum of', 'consideration', 'total contract value'
            ],
            'currency': [
                'usd', 'gbp', 'eur', 'currency'
            ],
            'payment_terms': [
                'payment', 'terms', 'due within', 'net 30'
            ],
            'gender': [
                'gender', 'sex', 'sexo'
            ],
            'blood_group': [
                'blood group', 'bg', 'b.g.', 'blood'
            ]
        }
        
        self.custom_patterns_path = custom_patterns_path
        self.field_keywords = self._load_patterns()

    def _load_patterns(self) -> Dict[str, List[str]]:
        """Load patterns merging defaults with custom ones"""
        import json
        import os
        
        keywords = self.default_keywords.copy()
        
        if os.path.exists(self.custom_patterns_path):
            try:
                with open(self.custom_patterns_path, 'r') as f:
                    custom = json.load(f)
                    # Merge custom keywords
                    for field, kws in custom.items():
                        if field in keywords:
                            # Add unique new keywords
                            keywords[field].extend([k for k in kws if k not in keywords[field]])
                        else:
                            keywords[field] = kws
                logging.info(f"Loaded custom patterns from {self.custom_patterns_path}")
            except Exception as e:
                logging.error(f"Failed to load custom patterns: {e}")
        
        return keywords

    def save_custom_pattern(self, field: str, keyword: str) -> bool:
        """Add a new keyword to a field and save it"""
        import json
        import os
        
        field = field.lower()
        keyword = keyword.lower()
        
        # Update in-memory
        if field not in self.field_keywords:
            self.field_keywords[field] = []
        
        if keyword not in self.field_keywords[field]:
            self.field_keywords[field].append(keyword)
        
        # Save to file
        try:
            current_custom = {}
            if os.path.exists(self.custom_patterns_path):
                with open(self.custom_patterns_path, 'r') as f:
                    current_custom = json.load(f)
            
            if field not in current_custom:
                current_custom[field] = []
            
            if keyword not in current_custom[field]:
                current_custom[field].append(keyword)
                
            with open(self.custom_patterns_path, 'w') as f:
                json.dump(current_custom, f, indent=2)
            
            return True
        except Exception as e:
            logging.error(f"Failed to save custom pattern: {e}")
            return False
    
    def extract_all_fields(self, text: str, document_type: str = "general") -> Dict:
        """
        Extract all possible fields from text
        
        Args:
            text: OCR extracted text
            document_type: Type of document (id_card, passport, form, etc.)
        
        Returns:
            Dictionary with extracted fields and confidence scores
        """
        fields = {}
        confidence = {}
        
        # 1. Always try dynamic extraction for ALL known fields
        # This ensures we catch things like "Total Amount" even in an ID card if present
        dynamic_fields = self._extract_fields_dynamically(text)
        fields.update(dynamic_fields)

        # 2. Apply specific logic based on document type (can override or augment)
        if document_type == "id_card":
            id_fields = self._extract_id_card_fields(text)
            fields.update(id_fields)
        elif document_type == "passport":
            pass_fields = self._extract_passport_fields(text)
            fields.update(pass_fields)
        elif document_type == "form":
            form_fields = self._extract_form_fields(text)
            fields.update(form_fields)
        
        # 3. General Auto-Recognition (Fall back to finding ANY "Key: Value" pattern)
        # This helps catch sections that are not in the predefined keywords list
        general_kv = self._extract_general_key_value_pairs(text)
        for k, v in general_kv.items():
            if k not in fields:
                fields[k] = v
        
        # 3. Apply generic fallbacks (Email, Phone, Dates)
        generic_fields = self._extract_generic_fields(text)
        # Only add if not already found
        for k, v in generic_fields.items():
            if k not in fields:
                fields[k] = v
        
        # Calculate confidence for each field
        for field_name, field_value in fields.items():
            confidence[field_name] = self._calculate_field_confidence(field_name, field_value)
        fields = {}
        lines = text.split('\n')
        
        for field_name, keywords in self.field_keywords.items():
            # Skip fields that need special handling (like generic 'date' or 'email' regexes)
            # unless we want to look for labeled ones too (e.g. "Email: foo@bar.com")
            
            for keyword in keywords:
                # Create a pattern to find "Keyword[:\s]+Value"
                # Escape keyword for regex safety
                escaped_kw = re.escape(keyword)
                
                # Pattern 1: Keyword at start of line
                # e.g. "Total: 500"
                pattern = re.compile(r'(?:^|\n)\s*' + escaped_kw + r'[:\.\-]?\s+(.+)', re.IGNORECASE)
                match = pattern.search(text)
                
                if match:
                    value = match.group(1).strip()
                    # Clean up value (remove trailing noise)
                    if len(value) > 0:
                        fields[field_name] = value
                        break # Found a value for this field, stop looking at other keywords
        
        return fields
    
    def _extract_id_card_fields(self, text: str) -> Dict:
        """Extract fields specific to ID cards"""
        fields = {}
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # 1. Extract Name (Look for 'Name' keyword first)
        name = self._extract_name_specific(lines)
        if name:
            fields['full_name'] = name
        
        # 2. Extract Roll No
        roll_no = self._extract_roll_no(text)
        if roll_no:
            fields['roll_no'] = roll_no
            
        # 3. Extract Class/Course
        course_class = self._extract_class(text)
        if course_class:
            fields['class'] = course_class

        # 4. Extract Date of Birth
        dob = self._extract_date_of_birth(text)
        if dob:
            fields['date_of_birth'] = dob
            
        # 5. Extract Admission Year
        admn_year = self._extract_admission_year(text)
        if admn_year:
            fields['admission_year'] = admn_year

        # 6. Extract ID number (fallback if Roll No not found or distinct)
        if 'roll_no' not in fields:
            id_number = self._extract_id_number(text)
            if id_number:
                fields['id_number'] = id_number
        
        # 7. Extract address
        address = self._extract_address(lines)
        if address:
            fields['address'] = address
        
        # 8. Extract gender
        gender = self._extract_gender(text)
        if gender:
            fields['gender'] = gender
        
        return fields

    def _extract_name_specific(self, lines: List[str]) -> Optional[str]:
        """Extract name looking for specific 'Name' labels"""
        # Strategy 1: Look for "Name" prefix
        name_pattern = re.compile(r'^(?:Name|Student Name|Name of Student)[\s.:]+([A-Za-z\s.]+)', re.IGNORECASE)
        for line in lines:
            match = name_pattern.match(line)
            if match:
                return match.group(1).strip()
        
        # Strategy 2: Fallback to heuristic (capitalized words on early lines)
        return self._extract_name(lines)

    def _extract_roll_no(self, text: str) -> Optional[str]:
        """Extract Roll Number"""
        # Matches: Roll No 24/94076, Roll No. 12345, Roll: 123
        pattern = re.compile(r'(?:Roll\s*No|Roll\s*Number|Roll)[\s.:]+([A-Z0-9/]+)', re.IGNORECASE)
        match = pattern.search(text)
        if match:
            return match.group(1).strip()
        return None

    def _extract_class(self, text: str) -> Optional[str]:
        """Extract Class or Course"""
        # Matches: Class B.SC.(H) COMPUTER, Course: B.A.
        pattern = re.compile(r'(?:Class|Course|Prog|Programme)[\s.:]+([A-Za-z0-9.()\s]+)', re.IGNORECASE)
        match = pattern.search(text)
        if match:
            # Clean up the result (stop at newline or likely end of course name)
            course = match.group(1).strip()
            # Heuristic: stop if we hit another label like "D.O.Birth"
            course = re.split(r'\s+(?:D\.O\.B|Date|Admn)', course)[0]
            return course.strip()
        return None

    def _extract_admission_year(self, text: str) -> Optional[str]:
        """Extract Admission Year"""
        # Matches: Admn. Y 30/08/2024, Admission Year 2024
        pattern = re.compile(r'(?:Admn\.?\s*Y|Admission\s*Year|Admn)[\s.:]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4})', re.IGNORECASE)
        match = pattern.search(text)
        if match:
            return match.group(1).strip()
        return None

    def _extract_date_of_birth(self, text: str) -> Optional[str]:
        """Extract date of birth"""
        # Enhanced pattern to catch D.O.Birth, DOB, etc.
        dob_pattern = re.compile(
            r'(?:D\.O\.Birth|D\.O\.B\.?|Date of Birth|Born|Birth Date)[\s.:]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            re.IGNORECASE
        )
        
        match = dob_pattern.search(text)
        if match:
            date_str = match.group(1)
            return self._parse_date(date_str)
        
        # Fallback: Try to find dates and infer DOB (typically older date)
        dates = self.patterns['date'].findall(text)
        if dates:
            parsed_dates = []
            for date_str in dates:
                parsed = self._parse_date(date_str)
                if parsed:
                    parsed_dates.append((parsed, date_str))
            
            # DOB is typically the oldest date
            if parsed_dates:
                parsed_dates.sort(key=lambda x: x[0])
                return parsed_dates[0][1]
        
        return None

    def _extract_passport_fields(self, text: str) -> Dict:
        """Extract fields specific to passports"""
        fields = {}
        
        # Passport number (usually 8-9 alphanumeric)
        passport_pattern = re.compile(r'\b[A-Z]{1,2}\d{6,8}\b')
        match = passport_pattern.search(text)
        if match:
            fields['passport_number'] = match.group()
        
        # Surname and given names
        name = self._extract_name(text.split('\n'))
        if name:
            fields['full_name'] = name
        
        # Nationality
        nationality = self._extract_nationality(text)
        if nationality:
            fields['nationality'] = nationality
        
        # Dates
        dob = self._extract_date_of_birth(text)
        if dob:
            fields['date_of_birth'] = dob
        
        expiry = self._extract_expiry_date(text)
        if expiry:
            fields['expiry_date'] = expiry
        
        return fields
    
    def _extract_form_fields(self, text: str) -> Dict:
        """Extract labeled fields from forms"""
        fields = {}
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            line = line.strip()
            if ':' in line:
                # Split on colon (field: value)
                parts = line.split(':', 1)
                if len(parts) == 2:
                    field_name = parts[0].strip().lower()
                    field_value = parts[1].strip()
                    
                    # Map to standard field names
                    standard_name = self._map_field_name(field_name)
                    if standard_name and field_value:
                        fields[standard_name] = field_value
        
        return fields
    
    def _extract_generic_fields(self, text: str) -> Dict:
        """Extract common fields from any text"""
        fields = {}
        
        # Email
        email_match = self.patterns['email'].search(text)
        if email_match:
            fields['email'] = email_match.group()
        
        # Phone
        phone = self._extract_phone(text)
        if phone:
            fields['phone'] = phone
        
        # Dates
        dates = self.patterns['date'].findall(text)
        if dates:
            fields['dates'] = dates
        
        return fields
    
    def _extract_name(self, lines: List[str]) -> Optional[str]:
        """Extract person's name from text lines"""
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            # Name is usually capitalized and 2-4 words
            if line.isupper() and 2 <= len(line.split()) <= 4:
                # Clean up and title case
                name = ' '.join(word.capitalize() for word in line.split())
                if len(name) > 3:  # Minimum name length
                    return name
        return None
    
    def _extract_id_number(self, text: str) -> Optional[str]:
        """Extract ID number"""
        # Look for patterns like: ID: XXXXX or ID No: XXXXX
        id_patterns = [
            re.compile(r'(?:ID|id|Id)[\s:]+([A-Z0-9]{6,15})'),
            re.compile(r'(?:Number|No|NO)[\s:]+([A-Z0-9]{6,15})'),
            self.patterns['id_number']
        ]
        
        for pattern in id_patterns:
            match = pattern.search(text)
            if match:
                return match.group(1) if match.lastindex else match.group()
        
        return None
    
    def _extract_expiry_date(self, text: str) -> Optional[str]:
        """Extract expiry/expiration date"""
        expiry_pattern = re.compile(
            r'(?:Expiry|Expiration|Valid Until|Expires)[\s:]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            re.IGNORECASE
        )
        
        match = expiry_pattern.search(text)
        if match:
            return self._parse_date(match.group(1))
        
        return None
    
    def _extract_address(self, lines: List[str]) -> Optional[str]:
        """Extract address from lines"""
        address_parts = []
        
        for line in lines:
            line = line.strip()
            # Address lines often contain numbers (street numbers, postal codes)
            if any(keyword in line.lower() for keyword in ['street', 'st', 'ave', 'road', 'rd', 'city', 'delhi', 'mumbai', 'lane', 'sector']):
                address_parts.append(line)
            elif re.search(r'\d+', line) and len(line.split()) > 2 and not any(k in line.lower() for k in ['dob', 'date', 'phone', 'id', 'no']):
                # Likely an address line with street number, excluding other fields
                address_parts.append(line)
        
        if address_parts:
            return ', '.join(address_parts[:3])  # Max 3 lines
        
        return None
    
    def _extract_gender(self, text: str) -> Optional[str]:
        """Extract gender"""
        gender_pattern = re.compile(r'\b(Male|Female|M|F|MALE|FEMALE)\b', re.IGNORECASE)
        match = gender_pattern.search(text)
        
        if match:
            gender = match.group().upper()
            if gender in ['M', 'MALE']:
                return 'Male'
            elif gender in ['F', 'FEMALE']:
                return 'Female'
        
        return None
    
    def _extract_nationality(self, text: str) -> Optional[str]:
        """Extract nationality"""
        nat_pattern = re.compile(
            r'(?:Nationality|Citizen of|Country)[\s:]+([A-Z]{3}|[A-Z][a-z]+)',
            re.IGNORECASE
        )
        
        match = nat_pattern.search(text)
        if match:
            return match.group(1)
        
        return None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract and validate phone number"""
        phone_matches = self.patterns['phone'].findall(text)
        
        if PHONENUMBERS_AVAILABLE:
            for phone in phone_matches:
                try:
                    # Try to parse and validate
                    parsed = phonenumbers.parse(phone, None)
                    if phonenumbers.is_valid_number(parsed):
                        return phonenumbers.format_number(
                            parsed, 
                            phonenumbers.PhoneNumberFormat.INTERNATIONAL
                        )
                except:
                    continue
        
        # Return raw match if validation fails or library not available
        if phone_matches:
            return phone_matches[0]
        
        return None
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string to standard format YYYY-MM-DD"""
        try:
            parsed_date = date_parser.parse(date_str, fuzzy=True)
            return parsed_date.strftime('%Y-%m-%d')
        except:
            return date_str  # Return original if parsing fails
    
    def _map_field_name(self, field_name: str) -> Optional[str]:
        """Map various field names to standard names"""
        field_name = field_name.lower()
        
        for standard_name, keywords in self.field_keywords.items():
            if any(keyword in field_name for keyword in keywords):
                return standard_name
        
        # Return as-is if no mapping found
        return field_name.replace(' ', '_')
    
    def _calculate_field_confidence(self, field_name: str, field_value: str) -> float:
        """Calculate confidence score for extracted field"""
        if not field_value:
            return 0.0
        
        confidence = 0.7  # Base confidence
        
        # Boost confidence for validated fields
        if field_name == 'email' and '@' in field_value:
            confidence += 0.2
        
        if field_name == 'phone' and len(field_value) >= 10:
            confidence += 0.15
        
        if 'date' in field_name:
            try:
                date_parser.parse(field_value)
                confidence += 0.2
            except:
                pass
        
        # Length-based confidence
        if len(field_value) > 2:
            confidence += 0.1
        
        return min(confidence, 1.0)  # Cap at 1.0
