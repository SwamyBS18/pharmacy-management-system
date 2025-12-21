import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("PHARMACY ML MODEL TRAINING - SALES PREDICTION")
print("=" * 80)

# ============================================================================
# STEP 1: LOAD DATA
# ============================================================================

print("\n[1/6] Loading Generated Data...")

try:
    medicine_df = pd.read_csv('../data/Medicine_Details_Categorized.csv')
    historical_sales = pd.read_csv('../data/historical_sales.csv')
    weather_df = pd.read_csv('../data/weather_data.csv')
    print(f"✅ Loaded Medicine Data: {len(medicine_df):,} records")
    print(f"✅ Loaded Sales Data: {len(historical_sales):,} records")
    print(f"✅ Loaded Weather Data: {len(weather_df):,} records")
except FileNotFoundError as e:
    print(f"❌ Error: {e}")
    exit(1)

# ============================================================================
# STEP 2: MERGE SALES WITH WEATHER
# ============================================================================

print("\n[2/6] Merging Sales with Weather Data...")

historical_sales['Date'] = pd.to_datetime(historical_sales['Date'])
weather_df['Date'] = pd.to_datetime(weather_df['Date'])

sales_with_weather = historical_sales.merge(weather_df, on='Date', how='left')
print(f"✅ Merged dataset: {len(sales_with_weather):,} records")

# ============================================================================
# STEP 3: CREATE LAG FEATURES
# ============================================================================

print("\n[3/6] Creating Lag Features and Rolling Averages...")

def create_lag_features(df, medicine_id, lags=[7, 14, 30]):
    medicine_sales = df[df['Medicine_ID'] == medicine_id].sort_values('Date').copy()

    for lag in lags:
        medicine_sales[f'Sales_Lag_{lag}'] = medicine_sales['Quantity_Sold'].shift(lag)

    medicine_sales['Rolling_Avg_7'] = medicine_sales['Quantity_Sold'].rolling(7, 1).mean()
    medicine_sales['Rolling_Avg_14'] = medicine_sales['Quantity_Sold'].rolling(14, 1).mean()
    medicine_sales['Rolling_Avg_30'] = medicine_sales['Quantity_Sold'].rolling(30, 1).mean()

    medicine_sales['Growth_Rate_7'] = (
        (medicine_sales['Quantity_Sold'] - medicine_sales['Sales_Lag_7']) /
        (medicine_sales['Sales_Lag_7'] + 1)
    )

    return medicine_sales

medicine_counts = historical_sales.groupby('Medicine_ID').size()
valid_medicines = medicine_counts[medicine_counts >= 60].index.tolist()

all_features = []
for med_id in valid_medicines[:500]:
    all_features.append(create_lag_features(sales_with_weather, med_id))

final_df = pd.concat(all_features, ignore_index=True).dropna()
final_df.to_csv('ml_training_data.csv', index=False)

print(f"✅ Final training dataset: {final_df.shape}")

# ============================================================================
# STEP 4: FEATURE PREPARATION
# ============================================================================

print("\n[4/6] Preparing Features...")

season_map = {'Winter': 0, 'Summer': 1, 'Monsoon': 2, 'Spring': 3}
day_map = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
           'Friday': 4, 'Saturday': 5, 'Sunday': 6}
category_map = {c: i for i, c in enumerate(final_df['Category'].unique())}
category_map['UNKNOWN'] = -1

final_df['Season_Encoded'] = final_df['Season_x'].map(season_map)
final_df['Day_Encoded'] = final_df['Day_of_Week'].map(day_map)
final_df['Category_Encoded'] = final_df['Category'].map(category_map)
final_df['Is_Weekend_Encoded'] = final_df['Is_Weekend'].astype(int)

feature_cols = [
    'Month', 'Week_of_Year',
    'Temperature_Avg', 'Humidity', 'Rainfall',
    'Sales_Lag_7', 'Sales_Lag_14', 'Sales_Lag_30',
    'Rolling_Avg_7', 'Rolling_Avg_14', 'Rolling_Avg_30',
    'Growth_Rate_7',
    'Season_Encoded', 'Day_Encoded', 'Category_Encoded', 'Is_Weekend_Encoded'
]

X = final_df[feature_cols]
y = final_df['Quantity_Sold']

# ============================================================================
# STEP 5: TRAIN MODELS
# ============================================================================

print("\n[5/6] Training Models...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

gb_model = GradientBoostingRegressor(n_estimators=200, max_depth=5, random_state=42)
rf_model = RandomForestRegressor(n_estimators=200, max_depth=15, n_jobs=-1, random_state=42)

gb_model.fit(X_train, y_train)
rf_model.fit(X_train, y_train)

y_pred_gb = gb_model.predict(X_test)
y_pred_rf = rf_model.predict(X_test)

def metrics(y_true, y_pred):
    return (
        mean_absolute_error(y_true, y_pred),
        np.sqrt(mean_squared_error(y_true, y_pred)),
        r2_score(y_true, y_pred),
        np.mean(np.abs((y_true - y_pred) / (y_true + 1))) * 100
    )

gb_mae, gb_rmse, gb_r2, gb_mape = metrics(y_test, y_pred_gb)
rf_mae, rf_rmse, rf_r2, rf_mape = metrics(y_test, y_pred_rf)

best_model, best_name, best_pred = (
    (gb_model, "Gradient Boosting", y_pred_gb)
    if gb_r2 > rf_r2 else
    (rf_model, "Random Forest", y_pred_rf)
)

joblib.dump(best_model, 'sales_prediction_model.pkl')
joblib.dump(
    {
        'season_mapping': season_map,
        'day_mapping': day_map,
        'category_mapping': category_map,
        'feature_cols': feature_cols
    },
    'model_encodings.pkl'
)

# ============================================================================
# STEP 6: VISUALIZATION (MATPLOTLIB ONLY)
# ============================================================================

print("\n[6/6] Generating Plots...")

importance_df = pd.DataFrame({
    'Feature': feature_cols,
    'Importance': best_model.feature_importances_
}).sort_values(by='Importance', ascending=False)

importance_df.to_csv('feature_importance.csv', index=False)

# Feature importance plot
plt.figure(figsize=(12, 8))
top = importance_df.head(10)
plt.barh(top['Feature'], top['Importance'])
plt.gca().invert_yaxis()
plt.title(f"Top 10 Feature Importance - {best_name}", fontsize=16, fontweight='bold')
plt.xlabel("Importance")
plt.tight_layout()
plt.savefig("feature_importance_plot.png", dpi=300)
plt.close()

# Actual vs predicted
plt.figure(figsize=(10, 8))
plt.scatter(y_test, best_pred, alpha=0.5, s=10)
plt.plot([y_test.min(), y_test.max()],
         [y_test.min(), y_test.max()], 'r--')
plt.xlabel("Actual Sales")
plt.ylabel("Predicted Sales")
plt.title(f"Actual vs Predicted - {best_name}")
plt.tight_layout()
plt.savefig("actual_vs_predicted.png", dpi=300)
plt.close()

# Residuals
residuals = y_test - best_pred
plt.figure(figsize=(10, 6))
plt.scatter(y_test, residuals, alpha=0.5, s=10)
plt.axhline(0, color='r', linestyle='--')
plt.xlabel("Actual Sales")
plt.ylabel("Residuals")
plt.title("Residual Plot")
plt.tight_layout()
plt.savefig("residuals_plot.png", dpi=300)
plt.close()

print("\n🎉 Training Complete. All outputs saved successfully.")
print("=" * 80)
