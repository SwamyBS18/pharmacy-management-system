import pandas as pd
import os
from pathlib import Path

# Method 1: Find the CSV file automatically
def find_csv_file(filename='Medicine_Details.csv'):
    """Search for CSV file in common locations"""
    possible_paths = [
        filename,  # Current directory
        f'data/{filename}',  # data subdirectory
        f'../data/{filename}',  # data in parent directory
        f'../../data/{filename}',  # two levels up
        os.path.join(os.path.dirname(__file__), filename),  # Same as script
        os.path.join(os.path.dirname(__file__), '..', 'data', filename),  # Relative to script
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"✅ Found CSV at: {path}")
            return path
    
    # If not found, raise helpful error
    raise FileNotFoundError(
        f"❌ Could not find {filename}. Please provide the full path.\n"
        f"Searched in:\n" + "\n".join(f"  - {p}" for p in possible_paths)
    )

# Try to load the file
try:
    csv_path = find_csv_file('Medicine_Details.csv')
    medicine_df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(medicine_df)} medicines successfully!")
    print(f"\nColumns: {list(medicine_df.columns)}")
    print(f"\nFirst few rows:")
    print(medicine_df.head())
    
except FileNotFoundError as e:
    print(e)
    print("\n💡 SOLUTION: Use the full path like this:")
    print("medicine_df = pd.read_csv(r'C:\\Users\\vinuu\\Downloads\\Medicine_Details.csv')")
    
# Continue with categorization
def categorize_medicine(uses):
    if pd.isna(uses):
        return 'Other'
    
    uses_lower = str(uses).lower()
    
    # Define category keywords
    categories = {
        'Analgesic': ['pain', 'ache', 'analgesic', 'sore'],
        'Antipyretic': ['fever', 'pyrexia', 'temperature'],
        'Respiratory': ['cold', 'cough', 'flu', 'respiratory', 'bronchitis', 'asthma'],
        'Antihistamine': ['allergy', 'allergic', 'antihistamine', 'histamine'],
        'Antibiotic': ['infection', 'antibiotic', 'bacterial', 'antimicrobial'],
        'Antidiabetic': ['diabetes', 'blood sugar', 'insulin', 'glucose'],
        'Cardiovascular': ['blood pressure', 'hypertension', 'cardiac', 'heart', 'cholesterol'],
        'Gastrointestinal': ['stomach', 'gastric', 'digestion', 'acidity', 'ulcer', 'diarrhea'],
        'Antifungal': ['fungal', 'antifungal', 'fungus', 'yeast'],
        'Antiviral': ['viral', 'antiviral', 'virus'],
        'Supplement': ['vitamin', 'mineral', 'supplement', 'calcium', 'iron'],
        'Dermatological': ['skin', 'rash', 'dermatitis', 'eczema', 'psoriasis'],
        'Ophthalmic': ['eye', 'ophthalmic', 'vision', 'conjunctivitis'],
        'Anti-inflammatory': ['inflammation', 'inflammatory', 'swelling', 'arthritis'],
    }
    
    # Check each category
    for category, keywords in categories.items():
        if any(keyword in uses_lower for keyword in keywords):
            return category
    
    return 'Other'

# Apply categorization
if 'medicine_df' in locals():
    medicine_df['Category'] = medicine_df['Uses'].apply(categorize_medicine)
    medicine_df['Medicine_ID'] = range(1, len(medicine_df) + 1)
    
    # Show category distribution
    print("\n📊 Category Distribution:")
    print(medicine_df['Category'].value_counts())
    
    # Save categorized data
    output_path = 'Medicine_Details_Categorized2.csv'
    medicine_df.to_csv(output_path, index=False)
    print(f"\n✅ Saved categorized data to: {output_path}")


