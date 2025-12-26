import os
import logging
from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
from db import get_db_connection, execute_query

predictions_bp = Blueprint('predictions', __name__, url_prefix='/api/predictions')
logger = logging.getLogger(__name__)

# Global variables to store model and data
model = None
encodings = None
medicine_df = None
historical_sales = None
weather_df = None
training_data = None
feature_cols = None
model_loaded = False

def load_model_and_data():
    """Load ML model and required CSV data from the model directory"""
    global model, encodings, medicine_df, historical_sales, weather_df, training_data, feature_cols, model_loaded
    
    if model_loaded:
        return True

    try:
        # Path to model directory (relative to this file: ../../model)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        model_dir = os.path.join(base_dir, 'pharmacy_management_system', 'model')
        
        logger.info(f"Loading ML models from: {model_dir}")

        model = joblib.load(os.path.join(model_dir, 'sales_prediction_model.pkl'))
        encodings = joblib.load(os.path.join(model_dir, 'model_encodings.pkl'))
        
        medicine_df = pd.read_csv(os.path.join(model_dir, 'Medicine_Details_Categorized.csv'))
        historical_sales = pd.read_csv(os.path.join(model_dir, 'historical_sales.csv'))
        weather_df = pd.read_csv(os.path.join(model_dir, 'weather_data.csv'))
        training_data = pd.read_csv(os.path.join(model_dir, 'ml_training_data.csv'))
        
        feature_cols = encodings['feature_cols']
        model_loaded = True
        logger.info("ML Models and data loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Error loading ML models: {e}")
        return False

# Helper functions for ML predictions
def get_season(month):
    if month in [12, 1, 2]: return 'Winter'
    elif month in [3, 4, 5]: return 'Summer'
    elif month in [6, 7, 8, 9]: return 'Monsoon'
    else: return 'Spring'

def get_weather_for_season(season):
    season_col = 'Season_x' if 'Season_x' in weather_df.columns else 'Season'
    seasonal = weather_df[weather_df[season_col] == season]
    return {
        'temperature': seasonal['Temperature_Avg'].mean(),
        'humidity': seasonal['Humidity'].mean(),
        'rainfall': seasonal['Rainfall'].mean()
    }

@predictions_bp.route('/medicine/<int:medicine_id>/forecast', methods=['GET'])
def get_forecast(medicine_id):
    if not load_model_and_data():
        return jsonify({'error': 'ML model not available'}), 503
        
    try:
        days = int(request.args.get('days', 30))
        
        med_info = medicine_df[medicine_df['Medicine_ID'] == medicine_id]
        if med_info.empty:
            return jsonify({'error': 'Medicine not found in ML database'}), 404

        med_info = med_info.iloc[0]
        category = med_info['Category']
        
        history = training_data[training_data['Medicine_ID'] == medicine_id]
        if history.empty:
            return jsonify({'error': 'No training history for this medicine'}), 404

        recent = history.tail(30)
        predictions = []
        start_date = datetime.now()
        
        season_mapping = encodings['season_mapping']
        day_mapping = encodings['day_mapping']
        category_mapping = encodings['category_mapping']

        for i in range(days):
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
                'date': day.strftime('%Y-%m-%d'),
                'day': day.strftime('%A'),
                'season': season,
                'predicted_sales': pred
            })

        return jsonify({
            'medicine_id': medicine_id,
            'medicine_name': med_info['Medicine Name'],
            'forecast': predictions,
            'summary': {
                'total_predicted': sum(p['predicted_sales'] for p in predictions),
                'avg_daily': round(sum(p['predicted_sales'] for p in predictions) / days, 1)
            }
        })

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@predictions_bp.route('/seasonal-demand', methods=['GET'])
def get_seasonal_demand():
    if not load_model_and_data():
        return jsonify({'error': 'ML model not available'}), 503
        
    try:
        season = request.args.get('season', 'Winter')
        limit = int(request.args.get('limit', 10))
        
        season_col = 'Season_x' if 'Season_x' in training_data.columns else 'Season'
        data = training_data[training_data[season_col] == season]

        summary = (
            data.groupby(['Medicine_ID', 'Medicine_Name', 'Category'])['Quantity_Sold']
            .mean()
            .reset_index()
            .sort_values('Quantity_Sold', ascending=False)
            .head(limit)
        )
        
        summary['Estimated_Monthly_Demand'] = (summary['Quantity_Sold'] * 30).astype(int)
        
        return jsonify(summary.to_dict(orient='records'))

    except Exception as e:
        logger.error(f"Seasonal demand error: {e}")
        return jsonify({'error': str(e)}), 500

@predictions_bp.route('/reorder-recommendations', methods=['GET'])
def get_reorder_recommendations():
    if not load_model_and_data():
        return jsonify({'error': 'ML model not available'}), 503
        
    try:
        recommendations = []
        top_meds = (
            historical_sales.groupby('Medicine_ID')['Quantity_Sold']
            .sum()
            .sort_values(ascending=False)
            .head(20) # Limit to top 20 for performance
            .index.tolist()
        )
        
        # Get real current stock from DB if possible, otherwise simulate
        stock_map = {}
        try:
            stock_query = "SELECT id, name, quantity FROM medicines"
            stock_results = execute_query(stock_query)
            # Map by similar name or ID if possible. 
            # Since ML IDs might not match DB IDs exactly, we'll try to match by name
            for row in stock_results:
                stock_map[row['name'].lower()] = row['quantity']
        except:
            logger.warning("Could not fetch real stock levels")

        for med_id in top_meds:
            # Re-use logic from predict_next_30_days but streamlined
            med_info = medicine_df[medicine_df['Medicine_ID'] == med_id]
            if med_info.empty: continue
            
            med_name = med_info.iloc[0]['Medicine Name']
            category = med_info.iloc[0]['Category']
            
            # Forecast (simplified for reorder logic)
            history = training_data[training_data['Medicine_ID'] == med_id]
            if history.empty: continue
            
            avg_daily_sales = history['Quantity_Sold'].mean() # Simple avg for speed
            predicted_30_days = int(avg_daily_sales * 30)
            
            # Try to find real stock, else simulate
            current_stock = stock_map.get(med_name.lower())
            if current_stock is None:
                 current_stock = int(avg_daily_sales * np.random.uniform(5, 40))
            
            days_stock = current_stock / avg_daily_sales if avg_daily_sales > 0 else 999
            
            recommendations.append({
                'medicine_id': int(med_id),
                'medicine_name': med_name,
                'category': category,
                'current_stock': int(current_stock),
                'avg_daily_sales': round(float(avg_daily_sales), 1),
                'days_remaining': round(float(days_stock), 1),
                'status': 'Urgent' if days_stock < 14 else ('Warning' if days_stock < 30 else 'OK'),
                'recommended_qty': int(predicted_30_days * 1.2) if days_stock < 30 else 0
            })
            
        return jsonify(sorted(recommendations, key=lambda x: x['days_remaining']))

    except Exception as e:
        logger.error(f"Reorder recommendations error: {e}")
        return jsonify({'error': str(e)}), 500

@predictions_bp.route('/expiry-alerts', methods=['GET'])
def get_expiry_alerts():
    """Get medicines expiring soon from the actual database"""
    try:
        days = int(request.args.get('days', 90))
        
        query = """
            SELECT m.id, m.name as medicine_name, b.batch_id, b.quantity, b.expiry_date,
                   DATE_PART('day', b.expiry_date - CURRENT_DATE) as days_until_expiry
            FROM batches b
            JOIN medicines m ON b.medicine_id = m.id
            WHERE b.expiry_date <= CURRENT_DATE + interval '%s days'
            AND b.quantity > 0
            ORDER BY b.expiry_date ASC
        """
        results = execute_query(query, (days,))
        
        alerts = []
        for r in results:
            days_left = int(r['days_until_expiry'])
            status = 'Expired' if days_left < 0 else ('Critical' if days_left < 30 else 'Warning')
            
            alerts.append({
                'medicine_id': r['id'],
                'medicine_name': r['medicine_name'],
                'batch_id': r['batch_id'],
                'expiry_date': r['expiry_date'].strftime('%Y-%m-%d'),
                'days_until': days_left,
                'quantity': r['quantity'],
                'status': status
            })
            
        return jsonify(alerts)
    except Exception as e:
        logger.error(f"Expiry alerts error: {e}")
        return jsonify({'error': str(e)}), 500

@predictions_bp.route('/sales-analytics', methods=['GET'])
def get_sales_analytics():
    """Get sales analytics from actual database"""
    try:
        period = int(request.args.get('period', 30))
        
        # Sales trend
        trend_query = """
            SELECT DATE(created_at) as date, 
                   SUM(final_amount) as revenue,
                   COUNT(id) as transactions,
                   AVG(final_amount) as avg_order_value
            FROM sales 
            WHERE created_at >= CURRENT_DATE - interval '%s days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """
        trend_data = execute_query(trend_query, (period,))
        
        # Category analytics (using medicines table link)
        cat_query = """
            SELECT m.category, SUM(si.total_price) as revenue
            FROM sales_items si
            JOIN medicines m ON si.medicine_id = m.id
            JOIN sales s ON si.sale_id = s.id
            WHERE s.created_at >= CURRENT_DATE - interval '%s days'
            GROUP BY m.category
            ORDER BY revenue DESC
            LIMIT 5
        """
        cat_data = execute_query(cat_query, (period,))
        
        # Stats summary
        total_rev = sum(float(d['revenue']) for d in trend_data)
        total_tx = sum(int(d['transactions']) for d in trend_data)
        
        return jsonify({
            'trend': trend_data,
            'categories': cat_data,
            'summary': {
                'total_revenue': total_rev,
                'total_transactions': total_tx,
                'avg_daily_revenue': total_rev / period if period > 0 else 0
            }
        })
    except Exception as e:
        logger.error(f"Sales analytics error: {e}")
        return jsonify({'error': str(e)}), 500
