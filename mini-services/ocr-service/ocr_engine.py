"""
OCR Engine for ID Document Processing using RapidOCR ONNX
Supports: Uganda National ID and Makerere University Student ID
"""

import cv2
import numpy as np
import re
from difflib import SequenceMatcher
from rapidocr_onnxruntime import RapidOCR

# Initialize OCR engine at module level
ocr_engine = RapidOCR()


# =============================================================================
# IMAGE PREPROCESSING
# =============================================================================

def deskew(img: np.ndarray) -> np.ndarray:
    """Correct image rotation using minimum area rectangle."""
    if img is None or img.size == 0:
        return img
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    gray = cv2.bitwise_not(gray)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) < 10:
        return img
    
    angle = cv2.minAreaRect(coords)[-1]
    
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    
    if abs(angle) < 1:
        return img
    
    (h, w) = img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    return rotated


def preprocess_image(img: np.ndarray, target_width: int = 1400) -> np.ndarray:
    """Upscale, deskew, denoise, sharpen, and apply CLAHE contrast.
    Accepts numpy array directly (in-memory image).
    """
    if img is None or img.size == 0:
        return img
    
    # Upscale if too small
    h, w = img.shape[:2]
    if w < target_width:
        scale = target_width / w
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # Deskew
    img = deskew(img)
    
    # Convert to grayscale for processing
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, None, h=10, searchWindowSize=21)
    
    # Apply CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    
    # Sharpen
    kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    
    # Convert back to BGR for OCR
    result = cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)
    
    return result


def run_ocr(img: np.ndarray, conf_threshold: float = 0.5) -> list:
    """Run OCR detection and recognition, return sorted results."""
    if img is None or img.size == 0:
        return []
    
    result, _ = ocr_engine(img)
    
    if result is None or len(result) == 0:
        return []
    
    ocr_results = []
    for item in result:
        if len(item) >= 3:
            box = item[0]
            text = item[1]
            confidence = float(item[2])
            
            if confidence >= conf_threshold and text.strip():
                y_pos = min(p[1] for p in box) if box is not None else 0
                ocr_results.append({
                    'text': text.strip(),
                    'confidence': confidence,
                    'box': box,
                    'y_pos': y_pos
                })
    
    # Sort by y-position (top to bottom)
    ocr_results.sort(key=lambda x: x['y_pos'])
    
    return ocr_results


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def _sim(a: str, b: str) -> float:
    """String similarity using SequenceMatcher."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _is_label_noise(token: str) -> bool:
    """Filter out OCR-corrupted label words."""
    noise_patterns = [
        r'^[A-Z]{1,3}$',
        r'^[A-Z]+\s*[.:]+$',
        r'^(SUR|GIV|NAM|NAT|SEX|DOB|EXP|REG|PRO|HAL)',
    ]
    token = token.strip().upper()
    for pattern in noise_patterns:
        if re.match(pattern, token):
            return True
    return False


def fix_date(raw: str) -> str:
    """Correct OCR digit errors in dates."""
    corrections = {
        'O': '0', 'o': '0',
        'l': '1', 'I': '1', 'i': '1',
        'Z': '2', 'z': '2',
        'S': '5', 's': '5',
        'B': '8', 'b': '8',
        'G': '6', 'g': '6',
        'A': '4', 'a': '4',
    }
    fixed = ''.join(corrections.get(c, c) for c in raw)
    return fixed


def looks_like_name(t: str) -> bool:
    """Validate if text looks like a name."""
    t = t.strip()
    if len(t) < 2:
        return False
    if not re.match(r'^[A-Z][a-zA-Z\- ]+$', t):
        return False
    if _is_label_noise(t):
        return False
    return True


def value_after(idx: int, ocr_results: list, max_lookahead: int = 4) -> str | None:
    """Extract value after a label keyword."""
    for i in range(idx + 1, min(idx + max_lookahead, len(ocr_results))):
        text = ocr_results[i]['text'].strip()
        if not _is_label_noise(text):
            return text
    return None


# =============================================================================
# CARD TYPE DETECTION
# =============================================================================

def detect_card_type(ocr_results: list) -> str:
    """Detect card type based on keyword signals.
    Returns: 'student_id', 'national_id', or 'unknown'
    """
    if not ocr_results:
        return 'unknown'
    
    all_text = ' '.join([r['text'].upper() for r in ocr_results])
    
    # Student ID signals
    student_signals = ['MAKERERE', 'UNIVERSITY', 'STUDENT ID', 'REGNO', 'REG NO', 
                       'PROGRAM', 'HALL', 'FACULTY', 'STUDENT', 'ADMISSION']
    student_score = sum(1 for sig in student_signals if sig in all_text)
    
    # National ID signals
    national_signals = ['REPUBLIC OF UGANDA', 'NATIONAL ID', 'NIN', 'NATIONAL IDENTITY',
                        'CARD NUMBER', 'SURNAME', 'GIVEN NAME', 'UGA']
    national_score = sum(1 for sig in national_signals if sig in all_text)
    
    # Check for specific patterns
    # Student ID: RegNo pattern like 15/U/12345/PS
    if re.search(r'\d{2}/[A-Z]/\d+(/[A-Z]+)?', all_text):
        student_score += 3
    
    # National ID: NIN pattern like CM12345678XX
    if re.search(r'[A-Z]{2}\d{7,9}[A-Z0-9]{2,6}', all_text):
        national_score += 3
    
    # Determine card type
    if student_score > national_score and student_score >= 2:
        return 'student_id'
    elif national_score > student_score and national_score >= 2:
        return 'national_id'
    elif student_score == national_score and student_score > 0:
        # Tie-breaker: look for specific keywords
        if 'MAKERERE' in all_text:
            return 'student_id'
        if 'REPUBLIC' in all_text or 'NIN' in all_text:
            return 'national_id'
    
    return 'unknown'


# =============================================================================
# NATIONAL ID PARSER
# =============================================================================

def extract_national_id_fields(ocr_results: list) -> dict:
    """Extract Uganda National ID fields from OCR results."""
    fields = {
        'surname': None,
        'given_name': None,
        'date_of_birth': None,
        'nin': None,
        'card_no': None,
        'sex': None,
        'nationality': None,
        'date_of_expiry': None,
    }
    
    if not ocr_results:
        return fields
    
    all_text = ' '.join([r['text'] for r in ocr_results])
    
    # Surname extraction
    surname_keys = ['SURNAME', 'SURNAM', 'SURNANE', 'SURNYME', 'SURNA']
    for i, result in enumerate(ocr_results):
        text_upper = result['text'].upper()
        for key in surname_keys:
            if key in text_upper:
                remaining = text_upper.split(key)[-1].strip()
                if remaining and looks_like_name(remaining):
                    fields['surname'] = remaining.title()
                    break
                val = value_after(i, ocr_results)
                if val and looks_like_name(val):
                    fields['surname'] = val.title()
                    break
    
    # Given name extraction
    given_keys = ['GIVEN NAME', 'GIVEN NAM', 'GIVENNAME', 'GIVEN NANE', 'GIVEN N', 'FIRST NAME']
    for i, result in enumerate(ocr_results):
        text_upper = result['text'].upper()
        for key in given_keys:
            if key in text_upper:
                remaining = text_upper.split(key)[-1].strip()
                if remaining and looks_like_name(remaining):
                    fields['given_name'] = remaining.title()
                    break
                val = value_after(i, ocr_results)
                if val and looks_like_name(val):
                    fields['given_name'] = val.title()
                    break
    
    # Date of birth extraction
    dob_pattern = r'\b(\d{2}[./]\d{2}[./]\d{4})\b'
    dob_matches = re.findall(dob_pattern, all_text)
    for match in dob_matches:
        fixed = fix_date(match)
        parts = re.split(r'[./]', fixed)
        if len(parts) == 3:
            day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
            if 1920 <= year <= 2010 and 1 <= month <= 12 and 1 <= day <= 31:
                fields['date_of_birth'] = f"{day:02d}.{month:02d}.{year}"
                break
    
    # NIN extraction (Uganda National ID Number pattern)
    nin_pattern = r'\b([A-Z]{2}\d{7,9}[A-Z0-9]{2,6})\b'
    nin_matches = re.findall(nin_pattern, all_text)
    if nin_matches:
        fields['nin'] = nin_matches[0]
    
    # Card number extraction (9 digits)
    card_pattern = r'\b(\d{9})\b'
    card_matches = re.findall(card_pattern, all_text)
    if card_matches:
        fields['card_no'] = card_matches[0]
    
    # Sex extraction with multiple strategies
    if 'UGA' in all_text:
        uga_match = re.search(r'UGA\s*([MF])\b', all_text)
        if uga_match:
            fields['sex'] = uga_match.group(1)
    
    if not fields['sex']:
        sex_match = re.search(r'SEX\s*[:\s]*([MF])\b', all_text, re.IGNORECASE)
        if sex_match:
            fields['sex'] = sex_match.group(1).upper()
    
    if not fields['sex']:
        for result in ocr_results:
            text = result['text'].strip().upper()
            if text in ['M', 'F', 'MALE', 'FEMALE']:
                fields['sex'] = 'M' if text in ['M', 'MALE'] else 'F'
                break
    
    # NIN prefix sex detection (CF = Female, CM = Male)
    if not fields['sex'] and fields['nin']:
        nin_prefix = fields['nin'][:2].upper()
        if nin_prefix == 'CF':
            fields['sex'] = 'F'
        elif nin_prefix == 'CM':
            fields['sex'] = 'M'
    
    # Nationality extraction
    if 'UGA' in all_text.upper():
        fields['nationality'] = 'UGANDAN'
    nat_match = re.search(r'NATIONALITY\s*[:\s]*(\w+)', all_text, re.IGNORECASE)
    if nat_match:
        fields['nationality'] = nat_match.group(1).upper()
    
    # Date of expiry extraction
    expiry_pattern = r'\b(\d{2}[./]\d{2}[./]\d{4})\b'
    expiry_matches = re.findall(expiry_pattern, all_text)
    for match in expiry_matches:
        fixed = fix_date(match)
        parts = re.split(r'[./]', fixed)
        if len(parts) == 3:
            year = int(parts[2])
            if 2020 <= year <= 2040:
                day, month = int(parts[0]), int(parts[1])
                if 1 <= month <= 12 and 1 <= day <= 31:
                    fields['date_of_expiry'] = f"{day:02d}.{month:02d}.{year}"
                    break
    
    return fields


# =============================================================================
# STUDENT ID PARSER
# =============================================================================

def extract_student_id_fields(ocr_results: list) -> dict:
    """Extract Makerere University Student ID fields from OCR results."""
    fields = {
        'surname': None,
        'given_name': None,
        'student_id': None,
        'reg_no': None,
        'faculty': None,
        'program': None,
        'hall': None,
        'date_of_expiry': None,
    }
    
    if not ocr_results:
        return fields
    
    all_text = ' '.join([r['text'] for r in ocr_results])
    all_text_upper = all_text.upper()
    
    # Student ID extraction (9-10 digits, typically standalone)
    # Look for patterns like "STUDENT NO: 123456789" or standalone 9-10 digit numbers
    student_id_patterns = [
        r'STUDENT\s*(?:ID|NO|NUMBER)?\s*[:\s]*(\d{9,10})\b',
        r'ID\s*NO\s*[:\s]*(\d{9,10})\b',
        r'\b(\d{9,10})\b',
    ]
    for pattern in student_id_patterns:
        matches = re.findall(pattern, all_text_upper)
        if matches:
            # Prefer the one that appears after "STUDENT" label
            fields['student_id'] = matches[0]
            break
    
    # Registration Number extraction (e.g., 15/U/12345/PS or 20/U/5678/EVE)
    reg_no_pattern = r'\b(\d{2}/[A-Z]/\d+(/[A-Z]+)?)\b'
    reg_matches = re.findall(reg_no_pattern, all_text_upper)
    if reg_matches:
        fields['reg_no'] = reg_matches[0][0]  # First group of first match
    
    # Name extraction - look for "NAME:" label or longest all-caps name
    name_found = False
    for i, result in enumerate(ocr_results):
        text = result['text']
        text_upper = text.upper()
        
        # Check for NAME label
        if 'NAME' in text_upper:
            # Try to extract name after label
            remaining = text_upper.split('NAME')[-1].strip()
            remaining = re.sub(r'^[:\s]+', '', remaining)  # Remove leading colons/spaces
            if remaining and looks_like_name(remaining):
                # Split into given name and surname
                name_parts = remaining.split()
                if len(name_parts) >= 2:
                    fields['given_name'] = name_parts[0].title()
                    fields['surname'] = ' '.join(name_parts[1:]).title()
                else:
                    fields['surname'] = remaining.title()
                name_found = True
                break
            
            # Look at next tokens
            val = value_after(i, ocr_results)
            if val and looks_like_name(val):
                name_parts = val.split()
                if len(name_parts) >= 2:
                    fields['given_name'] = name_parts[0].title()
                    fields['surname'] = ' '.join(name_parts[1:]).title()
                else:
                    fields['surname'] = val.title()
                name_found = True
                break
    
    # If no name found via label, try to find longest all-caps name-like text
    if not name_found:
        best_name = None
        best_len = 0
        for result in ocr_results:
            text = result['text'].strip()
            # Check if it looks like a full name (2+ words, all caps or title case)
            if ' ' in text and looks_like_name(text.split()[0]):
                words = text.split()
                if len(words) >= 2 and all(looks_like_name(w) or w.isupper() for w in words):
                    if len(text) > best_len:
                        best_name = text
                        best_len = len(text)
        
        if best_name:
            name_parts = best_name.split()
            fields['given_name'] = name_parts[0].title()
            fields['surname'] = ' '.join(name_parts[1:]).title()
    
    # Faculty extraction
    faculty_keys = ['FACULTY', 'SCHOOL', 'COLLEGE']
    for i, result in enumerate(ocr_results):
        text_upper = result['text'].upper()
        for key in faculty_keys:
            if key in text_upper:
                remaining = text_upper.split(key)[-1].strip()
                remaining = re.sub(r'^[:\s]+', '', remaining)
                if remaining and len(remaining) > 3:
                    fields['faculty'] = remaining.title()
                    break
                val = value_after(i, ocr_results)
                if val and len(val) > 3:
                    fields['faculty'] = val.title()
                    break
    
    # Program extraction
    program_keys = ['PROGRAM', 'PROGRAMME', 'COURSE']
    for i, result in enumerate(ocr_results):
        text_upper = result['text'].upper()
        for key in program_keys:
            if key in text_upper:
                remaining = text_upper.split(key)[-1].strip()
                remaining = re.sub(r'^[:\s]+', '', remaining)
                if remaining and len(remaining) > 3:
                    fields['program'] = remaining.title()
                    break
                val = value_after(i, ocr_results, max_lookahead=3)
                if val and len(val) > 3:
                    fields['program'] = val.title()
                    break
    
    # Hall extraction
    hall_keys = ['HALL', 'RESIDENCE']
    for i, result in enumerate(ocr_results):
        text_upper = result['text'].upper()
        for key in hall_keys:
            if key in text_upper:
                remaining = text_upper.split(key)[-1].strip()
                remaining = re.sub(r'^[:\s]+', '', remaining)
                if remaining and len(remaining) > 3:
                    fields['hall'] = remaining.title()
                    break
                val = value_after(i, ocr_results)
                if val and len(val) > 3:
                    fields['hall'] = val.title()
                    break
    
    # Date of expiry - Month Year format (e.g., "JANUARY 2025", "DEC 2024")
    month_pattern = r'\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})\b'
    month_matches = re.findall(month_pattern, all_text_upper)
    if month_matches:
        month, year = month_matches[-1]  # Usually expiry is the last date
        fields['date_of_expiry'] = f"{month.title()} {year}"
    
    return fields


# =============================================================================
# MAIN PROCESSING FUNCTION
# =============================================================================

def process_id_image(img: np.ndarray) -> dict:
    """Full pipeline: preprocess → OCR → detect card type → extract fields.
    
    Args:
        img: numpy array of the image (BGR format from cv2)
    
    Returns:
        dict with keys: card_type, fields, raw_text, ocr_count
    """
    # Preprocess
    processed = preprocess_image(img)
    
    # Run OCR
    ocr_results = run_ocr(processed)
    
    # Detect card type
    card_type = detect_card_type(ocr_results)
    
    # Extract fields based on card type
    if card_type == 'student_id':
        fields = extract_student_id_fields(ocr_results)
    elif card_type == 'national_id':
        fields = extract_national_id_fields(ocr_results)
    else:
        # Default to national ID fields for unknown
        fields = extract_national_id_fields(ocr_results)
    
    # Compile raw text
    raw_text = ' '.join([r['text'] for r in ocr_results])
    
    return {
        'card_type': card_type,
        'fields': fields,
        'raw_text': raw_text,
        'ocr_count': len(ocr_results)
    }
