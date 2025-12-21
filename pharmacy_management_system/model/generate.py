import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

print("=" * 60)
print("PHARMACY ML DATA GENERATION SCRIPT")
print("=" * 60)

# ============================================================================
# STEP 1: LOAD AND CATEGORIZE MEDICINE DATA
# ============================================================================

def find_csv_file(filename='Medicine_Details.csv'):
    """Search for CSV file in common locations"""
    possible_paths = [
        filename,
        f'data/{filename}',
        f'../data/{filename}',
        f'../../data/{filename}',
        os.path.join(os.path.dirname(__file__), filename),
        os.path.join(os.path.dirname(__file__), '..', 'data', filename),
        # Add your specific path here if needed
        r'C:\Users\vinuu\Downloads\DBms El\swamy\pharmacy-management-system\1766332661966_Medicine_Details.csv',
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"✅ Found CSV at: {path}")
            return path
    
    raise FileNotFoundError(
        f"❌ Could not find {filename}.\n"
        f"Please update the path in the script or move the file to the script directory."
    )

print("\n[1/5] Loading Medicine Data...")
try:
    csv_path = find_csv_file('Medicine_Details.csv')
    medicine_df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(medicine_df)} medicines successfully!")
except FileNotFoundError as e:
    print(e)
    print("\n💡 MANUAL FIX: Replace line 32 with your actual CSV path:")
    print("medicine_df = pd.read_csv(r'YOUR_FULL_PATH_HERE')")
    exit(1)

# ============================================================================
# STEP 2: CATEGORIZE MEDICINES
# ============================================================================

print("\n[2/5] Categorizing Medicines...")

def categorize_medicine(uses):
    """Categorize medicine based on uses"""
    if pd.isna(uses):
        return 'Other'
    
    uses_lower = str(uses).lower()
    
    categories = {
        'Analgesic': ['pain', 'ache', 'analgesic', 'sore', 'headache'],
        'Antipyretic': ['fever', 'pyrexia', 'temperature'],
        'Respiratory': ['cold', 'cough', 'flu', 'respiratory', 'bronchitis', 'asthma', 'breathe'],
        'Antihistamine': ['allergy', 'allergic', 'antihistamine', 'histamine', 'sneeze'],
        'Antibiotic': ['infection', 'antibiotic', 'bacterial', 'antimicrobial'],
        'Antidiabetic': ['diabetes', 'blood sugar', 'insulin', 'glucose', 'diabetic'],
        'Cardiovascular': ['blood pressure', 'hypertension', 'cardiac', 'heart', 'cholesterol', 'bp'],
        'Gastrointestinal': ['stomach', 'gastric', 'digestion', 'acidity', 'ulcer', 'diarrhea', 'constipation'],
        'Antifungal': ['fungal', 'antifungal', 'fungus', 'yeast'],
        'Antiviral': ['viral', 'antiviral', 'virus'],
        'Supplement': ['vitamin', 'mineral', 'supplement', 'calcium', 'iron', 'nutrition'],
        'Dermatological': ['skin', 'rash', 'dermatitis', 'eczema', 'psoriasis', 'cream', 'ointment'],
        'Ophthalmic': ['eye', 'ophthalmic', 'vision', 'conjunctivitis'],
        'Anti-inflammatory': ['inflammation', 'inflammatory', 'swelling', 'arthritis'],
    }
    
    for category, keywords in categories.items():
        if any(keyword in uses_lower for keyword in keywords):
            return category
    
    return 'Other'

medicine_df['Category'] = medicine_df['Uses'].apply(categorize_medicine)
medicine_df['Medicine_ID'] = range(1, len(medicine_df) + 1)

# Add synthetic price if not present
if 'Price' not in medicine_df.columns:
    medicine_df['Price'] = np.random.uniform(5, 500, len(medicine_df)).round(2)

print(f"✅ Categorized medicines into {medicine_df['Category'].nunique()} categories")
print("\n📊 Category Distribution:")
print(medicine_df['Category'].value_counts().head(10))

# Save categorized data
medicine_df.to_csv('Medicine_Details_Categorized.csv', index=False)
print("\n✅ Saved: Medicine_Details_Categorized.csv")

# ============================================================================
# STEP 3: GENERATE HISTORICAL SALES DATA
# ============================================================================

print("\n[3/5] Generating Historical Sales Data...")

def generate_historical_sales(medicine_df, start_date='2022-01-01', end_date='2024-12-31'):
    """Generate realistic historical sales with seasonal patterns"""
    sales_data = []
    
    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    
    # Seasonal multipliers for different categories
    seasonal_patterns = {
        'Analgesic': {'Winter': 1.3, 'Summer': 0.9, 'Monsoon': 1.1, 'Spring': 1.0},
        'Antipyretic': {'Winter': 1.5, 'Summer': 0.8, 'Monsoon': 1.4, 'Spring': 1.0},
        'Respiratory': {'Winter': 2.0, 'Summer': 0.6, 'Monsoon': 1.8, 'Spring': 1.2},
        'Antihistamine': {'Winter': 1.2, 'Summer': 1.0, 'Monsoon': 1.6, 'Spring': 1.8},
        'Antibiotic': {'Winter': 1.3, 'Summer': 1.0, 'Monsoon': 1.7, 'Spring': 1.1},
        'Antidiabetic': {'Winter': 1.0, 'Summer': 1.0, 'Monsoon': 1.0, 'Spring': 1.0},
        'Cardiovascular': {'Winter': 1.1, 'Summer': 1.0, 'Monsoon': 1.0, 'Spring': 1.0},
        'Gastrointestinal': {'Winter': 1.1, 'Summer': 1.3, 'Monsoon': 1.5, 'Spring': 1.0},
        'Supplement': {'Winter': 1.1, 'Summer': 1.0, 'Monsoon': 0.9, 'Spring': 1.0},
        'Dermatological': {'Winter': 0.8, 'Summer': 1.4, 'Monsoon': 1.3, 'Spring': 1.0},
    }
    
    # Filter to top medicines by category for realistic sales
    top_medicines = (medicine_df.groupby('Category')
                    .apply(lambda x: x.sample(min(50, len(x))))
                    .reset_index(drop=True))
    
    print(f"Generating sales for {len(top_medicines)} medicines...")
    
    current_date = start
    day_count = 0
    total_days = (end - start).days + 1
    
    while current_date <= end:
        # Progress indicator
        day_count += 1
        if day_count % 100 == 0:
            print(f"  Progress: {day_count}/{total_days} days ({day_count*100//total_days}%)")
        
        # Determine season
        month = current_date.month
        if month in [12, 1, 2]:
            season = 'Winter'
        elif month in [3, 4, 5]:
            season = 'Summer'
        elif month in [6, 7, 8, 9]:
            season = 'Monsoon'
        else:
            season = 'Spring'
        
        # Determine if weekend (lower sales)
        is_weekend = current_date.weekday() >= 5
        weekend_factor = 0.7 if is_weekend else 1.0
        
        # Select random medicines (20-50 per day)
        num_sales = random.randint(20, 50)
        selected_medicines = top_medicines.sample(n=min(num_sales, len(top_medicines)))
        
        for _, med in selected_medicines.iterrows():
            category = med['Category']
            base_quantity = random.randint(5, 30)
            
            # Apply seasonal multiplier
            multiplier = seasonal_patterns.get(category, {}).get(season, 1.0)
            quantity = int(base_quantity * multiplier * weekend_factor)
            
            # Add randomness
            quantity = max(1, quantity + random.randint(-5, 5))
            
            price = med.get('Price', random.uniform(5, 500))
            
            sales_data.append({
                'Date': current_date.strftime('%Y-%m-%d'),
                'Medicine_ID': med['Medicine_ID'],
                'Medicine_Name': med['Medicine Name'],
                'Category': category,
                'Quantity_Sold': quantity,
                'Price': round(price, 2),
                'Total_Amount': round(quantity * price, 2),
                'Day_of_Week': current_date.strftime('%A'),
                'Is_Weekend': is_weekend,
                'Month': current_date.month,
                'Season': season,
                'Year': current_date.year,
                'Week_of_Year': current_date.isocalendar()[1]
            })
        
        current_date += timedelta(days=1)
    
    return pd.DataFrame(sales_data)

historical_sales = generate_historical_sales(medicine_df)
historical_sales.to_csv('historical_sales.csv', index=False)
print(f"\n✅ Generated {len(historical_sales)} sales records")
print(f"✅ Saved: historical_sales.csv")

# ============================================================================
# STEP 4: GENERATE WEATHER DATA
# ============================================================================

print("\n[4/5] Generating Weather Data...")

def generate_weather_data(start_date='2022-01-01', end_date='2024-12-31'):
    """Generate realistic Indian weather data"""
    weather_data = []
    
    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    
    current_date = start
    while current_date <= end:
        month = current_date.month
        
        # Indian climate patterns
        if month in [12, 1, 2]:  # Winter
            temp_min = random.uniform(10, 18)
            temp_max = random.uniform(22, 30)
            humidity = random.uniform(50, 70)
            rainfall = random.uniform(0, 5) if random.random() > 0.9 else 0
            season = 'Winter'
        elif month in [3, 4, 5]:  # Summer
            temp_min = random.uniform(25, 32)
            temp_max = random.uniform(35, 45)
            humidity = random.uniform(30, 50)
            rainfall = random.uniform(0, 10) if random.random() > 0.85 else 0
            season = 'Summer'
        elif month in [6, 7, 8, 9]:  # Monsoon
            temp_min = random.uniform(22, 28)
            temp_max = random.uniform(28, 35)
            humidity = random.uniform(70, 95)
            rainfall = random.uniform(0, 150) if random.random() > 0.3 else 0
            season = 'Monsoon'
        else:  # Spring
            temp_min = random.uniform(18, 25)
            temp_max = random.uniform(28, 35)
            humidity = random.uniform(55, 75)
            rainfall = random.uniform(0, 20) if random.random() > 0.8 else 0
            season = 'Spring'
        
        temp_avg = (temp_min + temp_max) / 2
        
        weather_data.append({
            'Date': current_date.strftime('%Y-%m-%d'),
            'Temperature_Min': round(temp_min, 1),
            'Temperature_Max': round(temp_max, 1),
            'Temperature_Avg': round(temp_avg, 1),
            'Humidity': round(humidity, 1),
            'Rainfall': round(rainfall, 1),
            'Season': season
        })
        
        current_date += timedelta(days=1)
    
    return pd.DataFrame(weather_data)

weather_df = generate_weather_data()
weather_df.to_csv('weather_data.csv', index=False)
print(f"✅ Generated {len(weather_df)} weather records")
print(f"✅ Saved: weather_data.csv")

# ============================================================================
# STEP 5: CREATE SEASONAL ILLNESS MAPPING
# ============================================================================

print("\n[5/5] Creating Seasonal Illness Data...")

seasonal_illness = pd.DataFrame([
    {'Season': 'Winter', 'Illness': 'Common Cold', 'Peak_Months': 'Nov-Feb', 'Related_Categories': 'Respiratory,Analgesic,Antipyretic', 'Severity': 'High'},
    {'Season': 'Winter', 'Illness': 'Seasonal Flu', 'Peak_Months': 'Dec-Feb', 'Related_Categories': 'Respiratory,Antipyretic', 'Severity': 'High'},
    {'Season': 'Winter', 'Illness': 'Pneumonia', 'Peak_Months': 'Dec-Jan', 'Related_Categories': 'Antibiotic,Respiratory', 'Severity': 'Very High'},
    {'Season': 'Summer', 'Illness': 'Heat Stroke', 'Peak_Months': 'Apr-Jun', 'Related_Categories': 'Supplement', 'Severity': 'Medium'},
    {'Season': 'Summer', 'Illness': 'Dehydration', 'Peak_Months': 'Apr-Jun', 'Related_Categories': 'Supplement', 'Severity': 'Medium'},
    {'Season': 'Summer', 'Illness': 'Skin Infections', 'Peak_Months': 'Apr-Jun', 'Related_Categories': 'Dermatological,Antifungal', 'Severity': 'Low'},
    {'Season': 'Monsoon', 'Illness': 'Dengue', 'Peak_Months': 'Jul-Oct', 'Related_Categories': 'Antipyretic,Analgesic', 'Severity': 'Very High'},
    {'Season': 'Monsoon', 'Illness': 'Malaria', 'Peak_Months': 'Jul-Oct', 'Related_Categories': 'Antibiotic', 'Severity': 'High'},
    {'Season': 'Monsoon', 'Illness': 'Typhoid', 'Peak_Months': 'Jul-Sep', 'Related_Categories': 'Antibiotic', 'Severity': 'High'},
    {'Season': 'Monsoon', 'Illness': 'Gastroenteritis', 'Peak_Months': 'Jun-Sep', 'Related_Categories': 'Gastrointestinal,Antibiotic', 'Severity': 'Medium'},
    {'Season': 'Spring', 'Illness': 'Allergies', 'Peak_Months': 'Feb-Apr', 'Related_Categories': 'Antihistamine', 'Severity': 'Medium'},
    {'Season': 'All', 'Illness': 'Diabetes', 'Peak_Months': 'All', 'Related_Categories': 'Antidiabetic', 'Severity': 'Constant'},
    {'Season': 'All', 'Illness': 'Hypertension', 'Peak_Months': 'All', 'Related_Categories': 'Cardiovascular', 'Severity': 'Constant'},
])

seasonal_illness.to_csv('seasonal_illness.csv', index=False)
print(f"✅ Created seasonal illness mapping")
print(f"✅ Saved: seasonal_illness.csv")

# ============================================================================
# SUMMARY
# ============================================================================

print("\n" + "=" * 60)
print("✅ DATA GENERATION COMPLETE!")
print("=" * 60)
print("\n📁 Generated Files:")
print("  1. Medicine_Details_Categorized.csv")
print("  2. historical_sales.csv")
print("  3. weather_data.csv")
print("  4. seasonal_illness.csv")
print("\n📊 Summary:")
print(f"  • Medicines: {len(medicine_df):,}")
print(f"  • Sales Records: {len(historical_sales):,}")
print(f"  • Weather Records: {len(weather_df):,}")
print(f"  • Categories: {medicine_df['Category'].nunique()}")
print(f"  • Date Range: 2022-01-01 to 2024-12-31")
print("\n🎯 Next Step: Run the model training script!")
print("=" * 60)