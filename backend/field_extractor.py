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
    
    def __init__(self):
        # Common patterns for field detection
        self.patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'),
            'date': re.compile(r'\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b'),
            'id_number': re.compile(r'\b[A-Z0-9]{6,15}\b'),
            'postal_code': re.compile(r'\b\d{5,6}\b'),
            'number': re.compile(r'\b\d+\b'),
        }
        
        # Field keywords for detection
        self.field_keywords = {
            'name': ['name', 'full name', 'nombre', 'apellido'],
            'address': ['address', 'street', 'city', 'state', 'dirección'],
            'dob': ['date of birth', 'dob', 'birth date', 'born', 'fecha de nacimiento'],
            'id': ['id', 'identification', 'document number', 'license', 'passport'],
            'phone': ['phone', 'telephone', 'mobile', 'cell', 'teléfono'],
            'email': ['email', 'e-mail', 'correo'],
        }
    
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
        
        # Extract by document type
        if document_type == "id_card":
            fields = self._extract_id_card_fields(text)
        elif document_type == "passport":
            fields = self._extract_passport_fields(text)
        elif document_type == "form":
            fields = self._extract_form_fields(text)
        else:
            fields = self._extract_generic_fields(text)
        
        # Calculate confidence for each field
        for field_name, field_value in fields.items():
            confidence[field_name] = self._calculate_field_confidence(field_name, field_value)
        
        return {
            "fields": fields,
            "confidence": confidence,
            "document_type": document_type
        }
    
    def _extract_id_card_fields(self, text: str) -> Dict:
        """Extract fields specific to ID cards"""
        fields = {}
        lines = text.split('\n')
        
        # Extract name (usually first or second line, capitalized)
        name = self._extract_name(lines)
        if name:
            fields['full_name'] = name
        
        # Extract ID number
        id_number = self._extract_id_number(text)
        if id_number:
            fields['id_number'] = id_number
        
        # Extract date of birth
        dob = self._extract_date_of_birth(text)
        if dob:
            fields['date_of_birth'] = dob
        
        # Extract address
        address = self._extract_address(lines)
        if address:
            fields['address'] = address
        
        # Extract gender
        gender = self._extract_gender(text)
        if gender:
            fields['gender'] = gender
        
        return fields
    
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
    
    def _extract_date_of_birth(self, text: str) -> Optional[str]:
        """Extract date of birth"""
        # Look for context keywords
        dob_pattern = re.compile(
            r'(?:DOB|Date of Birth|Born|Birth Date)[\s:]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            re.IGNORECASE
        )
        
        match = dob_pattern.search(text)
        if match:
            date_str = match.group(1)
            return self._parse_date(date_str)
        
        # Try to find dates and infer DOB (typically older date)
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
            if any(keyword in line.lower() for keyword in ['street', 'st', 'ave', 'road', 'rd', 'city']):
                address_parts.append(line)
            elif re.search(r'\d+', line) and len(line.split()) > 2:
                # Likely an address line with street number
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
