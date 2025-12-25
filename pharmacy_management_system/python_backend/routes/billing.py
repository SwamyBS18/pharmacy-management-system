"""
Billing API Routes
Handles invoice generation, PDF creation, and invoice management
"""
from flask import Blueprint, request, jsonify, send_file
from db import execute_query, get_db_connection, release_db_connection
from psycopg2 import extras
import logging
from datetime import datetime
import os
from io import BytesIO

# Import reportlab for PDF generation
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
    from reportlab.pdfgen import canvas
except ImportError:
    # If reportlab is not installed, we'll handle it gracefully
    pass

logger = logging.getLogger(__name__)
billing_bp = Blueprint('billing', __name__)

# Create invoices directory if it doesn't exist
INVOICES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'invoices')
os.makedirs(INVOICES_DIR, exist_ok=True)


def generate_invoice_pdf(sale_data):
    """
    Generate a professional PDF invoice for a sale
    
    Args:
        sale_data: Dictionary containing sale information and items
        
    Returns:
        BytesIO object containing the PDF data
    """
    buffer = BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#059669'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#475569')
    )
    
    # Title
    elements.append(Paragraph("PHARMACY INVOICE", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Company Information
    company_info = f"""
    <b>PharmaAI Management System</b><br/>
    123 Medical Street, Healthcare District<br/>
    Phone: +91 1234567890 | Email: info@pharmaai.com<br/>
    GSTIN: 29ABCDE1234F1Z5
    """
    elements.append(Paragraph(company_info, normal_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Invoice Details and Customer Info in two columns
    invoice_date = datetime.fromisoformat(str(sale_data['created_at'])).strftime('%d-%b-%Y %I:%M %p') if sale_data.get('created_at') else datetime.now().strftime('%d-%b-%Y %I:%M %p')
    
    invoice_details_data = [
        ['Invoice Number:', sale_data.get('invoice_number', 'N/A')],
        ['Invoice Date:', invoice_date],
        ['Payment Method:', sale_data.get('payment_method', 'Cash').upper()],
        ['Payment Status:', sale_data.get('payment_status', 'Paid').upper()],
    ]
    
    customer_details_data = [
        ['Customer Name:', sale_data.get('customer_name', 'Walk-in Customer')],
        ['Phone:', sale_data.get('customer_phone', 'N/A')],
        ['', ''],
        ['', ''],
    ]
    
    # Create two-column layout for invoice and customer details
    details_table = Table(
        [[
            Table(invoice_details_data, colWidths=[1.5*inch, 2*inch]),
            Table(customer_details_data, colWidths=[1.5*inch, 2*inch])
        ]],
        colWidths=[3.5*inch, 3.5*inch]
    )
    
    details_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1e293b')),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    elements.append(details_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Items Table Header
    elements.append(Paragraph("ITEMS", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Items table
    items_data = [['#', 'Medicine Name', 'Quantity', 'Unit Price', 'Total']]
    
    for idx, item in enumerate(sale_data.get('items', []), 1):
        items_data.append([
            str(idx),
            str(item.get('medicine_name', 'N/A')),
            str(item.get('quantity', 0)),
            f"₹{float(item.get('unit_price', 0)):.2f}",
            f"₹{float(item.get('total_price', 0)):.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[0.5*inch, 3.5*inch, 1*inch, 1.2*inch, 1.3*inch])
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1e293b')),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Totals section
    subtotal = float(sale_data.get('total_amount', 0))
    tax = float(sale_data.get('tax_amount', 0))
    discount = float(sale_data.get('discount_amount', 0))
    final_total = float(sale_data.get('final_amount', 0))
    
    totals_data = [
        ['Subtotal:', f"₹{subtotal:.2f}"],
        ['Tax (10%):', f"₹{tax:.2f}"],
    ]
    
    if discount > 0:
        totals_data.append(['Discount:', f"-₹{discount:.2f}"])
    
    totals_data.append(['TOTAL AMOUNT:', f"₹{final_total:.2f}"])
    
    totals_table = Table(totals_data, colWidths=[5*inch, 1.5*inch])
    totals_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -2), 10),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('TEXTCOLOR', (0, 0), (-1, -2), colors.HexColor('#475569')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#059669')),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#059669')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(totals_table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Notes section
    if sale_data.get('notes'):
        elements.append(Paragraph(f"<b>Notes:</b> {sale_data['notes']}", normal_style))
        elements.append(Spacer(1, 0.2*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#94a3b8'),
        alignment=TA_CENTER
    )
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Thank you for your business!", footer_style))
    elements.append(Paragraph("This is a computer-generated invoice and does not require a signature.", footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


@billing_bp.route('/generate-invoice/<int:sale_id>', methods=['POST'])
def generate_invoice(sale_id):
    """Generate PDF invoice for a sale"""
    try:
        # Fetch sale data with items
        sale_query = """
            SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                   u.name as sold_by_name
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.sold_by = u.id
            WHERE s.id = %s
        """
        sale = execute_query(sale_query, (sale_id,), fetch_one=True)
        
        if not sale:
            return jsonify({'error': 'Sale not found'}), 404
        
        # Fetch sale items
        items_query = "SELECT * FROM sales_items WHERE sale_id = %s"
        items = execute_query(items_query, (sale_id,))
        
        sale_data = dict(sale)
        sale_data['items'] = items
        
        # Generate PDF
        pdf_buffer = generate_invoice_pdf(sale_data)
        
        # Save PDF to file
        invoice_filename = f"invoice_{sale_data['invoice_number']}.pdf"
        invoice_path = os.path.join(INVOICES_DIR, invoice_filename)
        
        with open(invoice_path, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        logger.info(f"Invoice generated: {invoice_filename}")
        
        return jsonify({
            'success': True,
            'message': 'Invoice generated successfully',
            'invoice_number': sale_data['invoice_number'],
            'invoice_url': f'/api/billing/invoice/{sale_id}',
            'download_url': f'/api/billing/download/{sale_id}'
        }), 201
        
    except Exception as e:
        logger.error(f"Error generating invoice: {e}")
        return jsonify({'error': 'Failed to generate invoice', 'details': str(e)}), 500


@billing_bp.route('/invoice/<int:sale_id>', methods=['GET'])
def get_invoice(sale_id):
    """Download PDF invoice for a sale"""
    try:
        # Fetch sale to get invoice number
        sale_query = "SELECT invoice_number FROM sales WHERE id = %s"
        sale = execute_query(sale_query, (sale_id,), fetch_one=True)
        
        if not sale:
            return jsonify({'error': 'Sale not found'}), 404
        
        invoice_filename = f"invoice_{sale['invoice_number']}.pdf"
        invoice_path = os.path.join(INVOICES_DIR, invoice_filename)
        
        # If invoice doesn't exist, generate it
        if not os.path.exists(invoice_path):
            # Fetch complete sale data
            sale_query = """
                SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                       u.name as sold_by_name
                FROM sales s
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN users u ON s.sold_by = u.id
                WHERE s.id = %s
            """
            sale_data = execute_query(sale_query, (sale_id,), fetch_one=True)
            items = execute_query("SELECT * FROM sales_items WHERE sale_id = %s", (sale_id,))
            
            sale_dict = dict(sale_data)
            sale_dict['items'] = items
            
            pdf_buffer = generate_invoice_pdf(sale_dict)
            
            with open(invoice_path, 'wb') as f:
                f.write(pdf_buffer.getvalue())
        
        return send_file(
            invoice_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=invoice_filename
        )
        
    except Exception as e:
        logger.error(f"Error retrieving invoice: {e}")
        return jsonify({'error': 'Failed to retrieve invoice', 'details': str(e)}), 500


@billing_bp.route('/download/<int:sale_id>', methods=['GET'])
def download_invoice(sale_id):
    """Download invoice (alias for get_invoice)"""
    return get_invoice(sale_id)


@billing_bp.route('/invoices', methods=['GET'])
def list_invoices():
    """List all invoices with pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        start_date = request.args.get('startDate', '')
        end_date = request.args.get('endDate', '')
        
        query = """
            SELECT s.id, s.invoice_number, s.total_amount, s.tax_amount, 
                   s.discount_amount, s.final_amount, s.payment_method, 
                   s.payment_status, s.created_at,
                   c.name as customer_name, c.phone as customer_phone
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE 1=1
        """
        count_query = "SELECT COUNT(*) as count FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE 1=1"
        params = []
        
        if search:
            query += " AND (s.invoice_number ILIKE %s OR c.name ILIKE %s)"
            count_query += " AND (s.invoice_number ILIKE %s OR c.name ILIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
        if start_date:
            query += " AND DATE(s.created_at) >= %s"
            count_query += " AND DATE(s.created_at) >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND DATE(s.created_at) <= %s"
            count_query += " AND DATE(s.created_at) <= %s"
            params.append(end_date)
        
        # Get total count
        total_result = execute_query(count_query, tuple(params) if params else None, fetch_one=True)
        total = total_result['count'] if total_result else 0
        
        # Add pagination
        offset = (page - 1) * limit
        query += " ORDER BY s.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        invoices = execute_query(query, tuple(params) if params else None)
        
        # Add invoice file existence check
        for invoice in invoices:
            invoice_filename = f"invoice_{invoice['invoice_number']}.pdf"
            invoice_path = os.path.join(INVOICES_DIR, invoice_filename)
            invoice['has_pdf'] = os.path.exists(invoice_path)
            invoice['download_url'] = f'/api/billing/invoice/{invoice["id"]}'
        
        return jsonify({
            'data': invoices,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing invoices: {e}")
        return jsonify({'error': 'Failed to list invoices', 'details': str(e)}), 500


@billing_bp.route('/invoice/<int:sale_id>/preview', methods=['GET'])
def preview_invoice(sale_id):
    """Get invoice data for preview (JSON format)"""
    try:
        sale_query = """
            SELECT s.*, c.name as customer_name, c.phone as customer_phone,
                   u.name as sold_by_name
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.sold_by = u.id
            WHERE s.id = %s
        """
        sale = execute_query(sale_query, (sale_id,), fetch_one=True)
        
        if not sale:
            return jsonify({'error': 'Sale not found'}), 404
        
        items = execute_query("SELECT * FROM sales_items WHERE sale_id = %s", (sale_id,))
        
        result = dict(sale)
        result['items'] = items
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error previewing invoice: {e}")
        return jsonify({'error': 'Failed to preview invoice', 'details': str(e)}), 500
