import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("PHARMACY SALES PREDICTION & STOCK RECOMMENDATION SYSTEM")
print("=" * 80)

# =============================================================================
# LOAD MODEL AND DATA
# =============================================================================

print("\n[1/4] Loading Model and Data...")

try:
    model = joblib.load('sales_prediction_model.pkl')
    encodings = joblib.load('model_encodings.pkl')

    medicine_df = pd.read_csv('Medicine_Details_Categorized.csv')
    historical_sales = pd.read_csv('historical_sales.csv')
    weather_df = pd.read_csv('weather_data.csv')
    training_data = pd.read_csv('ml_training_data.csv')

    print("✅ Model & data loaded successfully")

except FileNotFoundError as e:
    print(f"❌ Missing file: {e}")
    exit(1)

season_mapping = encodings['season_mapping']
day_mapping = encodings['day_mapping']
category_mapping = encodings['category_mapping']
feature_cols = encodings['feature_cols']

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_season(month):
    if month in [12, 1, 2]:
        return 'Winter'
    elif month in [3, 4, 5]:
        return 'Summer'
    elif month in [6, 7, 8, 9]:
        return 'Monsoon'
    else:
        return 'Spring'

def get_weather_for_season(season):
    season_col = 'Season_x' if 'Season_x' in weather_df.columns else 'Season'
    seasonal = weather_df[weather_df[season_col] == season]

    return {
        'temperature': seasonal['Temperature_Avg'].mean(),
        'humidity': seasonal['Humidity'].mean(),
        'rainfall': seasonal['Rainfall'].mean()
    }

# =============================================================================
# PREDICTION FUNCTIONS
# =============================================================================

print("\n[2/4] Initializing Prediction Functions...")

def predict_next_30_days(medicine_id, start_date=None):

    if start_date is None:
        start_date = datetime.now()
    elif isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d')

    med_info = medicine_df[medicine_df['Medicine_ID'] == medicine_id]
    if med_info.empty:
        print("❌ Invalid Medicine ID")
        return None

    med_info = med_info.iloc[0]
    category = med_info['Category']

    history = training_data[training_data['Medicine_ID'] == medicine_id]
    if history.empty:
        print("⚠️ No history available")
        return None

    recent = history.tail(30)
    predictions = []

    for i in range(30):
        day = start_date + timedelta(days=i)
        season = get_season(day.month)
        weather = get_weather_for_season(season)

        features = {
            'Month': day.month,
            'Week_of_Year': day.isocalendar()[1],
            'Temperature_Avg': weather['temperature'],
            'Humidity': weather['humidity'],
            'Rainfall': weather['rainfall'],
            'Sales_Lag_7': recent['Quantity_Sold'].tail(7).mean(),
            'Sales_Lag_14': recent['Quantity_Sold'].tail(14).mean(),
            'Sales_Lag_30': recent['Quantity_Sold'].mean(),
            'Rolling_Avg_7': recent['Quantity_Sold'].tail(7).mean(),
            'Rolling_Avg_14': recent['Quantity_Sold'].tail(14).mean(),
            'Rolling_Avg_30': recent['Quantity_Sold'].mean(),
            'Growth_Rate_7': 0.0,
            'Season_Encoded': season_mapping[season],
            'Day_Encoded': day_mapping[day.strftime('%A')],
            'Category_Encoded': category_mapping.get(category, -1),
            'Is_Weekend_Encoded': 1 if day.weekday() >= 5 else 0
        }

        X = pd.DataFrame([features])[feature_cols]
        pred = max(0, int(model.predict(X)[0]))

        predictions.append({
            'Date': day.strftime('%Y-%m-%d'),
            'Day': day.strftime('%A'),
            'Season': season,
            'Predicted_Sales': pred
        })

    return pd.DataFrame(predictions)

def predict_seasonal_demand(season, top_n=10):
    season_col = 'Season_x' if 'Season_x' in training_data.columns else 'Season'
    data = training_data[training_data[season_col] == season]

    summary = (
        data.groupby(['Medicine_ID', 'Medicine_Name', 'Category'])['Quantity_Sold']
        .mean()
        .reset_index()
        .sort_values('Quantity_Sold', ascending=False)
        .head(top_n)
    )

    summary['Estimated_Monthly_Demand'] = (summary['Quantity_Sold'] * 30).astype(int)
    return summary

def get_reorder_recommendations():

    recommendations = []
    top_meds = (
        historical_sales.groupby('Medicine_ID')['Quantity_Sold']
        .sum()
        .sort_values(ascending=False)
        .head(50)
        .index.tolist()
    )

    for med_id in top_meds:
        forecast = predict_next_30_days(med_id)
        if forecast is None:
            continue

        avg_daily = forecast['Predicted_Sales'].mean()
        total_30 = forecast['Predicted_Sales'].sum()

        current_stock = int(avg_daily * np.random.uniform(10, 25))
        days_stock = current_stock / avg_daily if avg_daily > 0 else 999

        recommendations.append({
            'Medicine_ID': med_id,
            'Medicine_Name': medicine_df.loc[
                medicine_df['Medicine_ID'] == med_id, 'Medicine Name'
            ].values[0],
            'Current_Stock': current_stock,
            'Avg_Daily_Sales': int(avg_daily),
            'Predicted_30_Days': int(total_30),
            'Days_of_Stock': round(days_stock, 1),
            'Reorder_Needed': 'YES' if days_stock < 14 else 'NO',
            'Recommended_Order_Qty': int(total_30 * 1.2) if days_stock < 14 else 0
        })

    return pd.DataFrame(recommendations)

# =============================================================================
# DEMO EXECUTION
# =============================================================================

print("\n[3/4] Running Demo...")

top_med = historical_sales.groupby('Medicine_ID')['Quantity_Sold'].sum().idxmax()
info = medicine_df[medicine_df['Medicine_ID'] == top_med].iloc[0]

print(f"\n📦 Medicine: {info['Medicine Name']} ({info['Category']})")

forecast = predict_next_30_days(top_med)
print(f"Total 30-day demand: {forecast['Predicted_Sales'].sum()}")
forecast.to_csv(f'forecast_medicine_{top_med}.csv', index=False)

for s in ['Winter', 'Summer', 'Monsoon', 'Spring']:
    seasonal = predict_seasonal_demand(s)
    seasonal.to_csv(f'seasonal_forecast_{s.lower()}.csv', index=False)

reorder_df = get_reorder_recommendations()
reorder_df.to_csv('reorder_recommendations.csv', index=False)

# =============================================================================
# INTERACTIVE MODE (OPTIONAL)
# =============================================================================

print("\n[4/4] Interactive Mode Ready (optional)")

def interactive_predict():
    name = input("\nEnter medicine name (or 'quit'): ").strip()
    if name.lower() == 'quit':
        return False

    matches = medicine_df[
        medicine_df['Medicine Name'].str.contains(name, case=False, na=False)
    ]

    if matches.empty:
        print("❌ No matches found")
        return True

    print(matches[['Medicine_ID', 'Medicine Name']].head(10).to_string(index=False))
    med_id = int(input("Enter Medicine ID: "))

    forecast = predict_next_30_days(med_id)
    print(forecast.head(7).to_string(index=False))
    return True

# Uncomment to enable
# while interactive_predict():
#     pass

print("\n" + "=" * 80)
print("✅ SYSTEM READY — FORECASTING & REORDER FILES GENERATED")
print("=" * 80)
