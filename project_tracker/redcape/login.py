from flask import Blueprint, request, session, jsonify
from .db import db, Credentials, Employee
from flask_bcrypt import check_password_hash

login_bp = Blueprint('login', __name__)

@login_bp.route('/api/login/', methods=['POST'])
def login():
    data = request.get_json()
    email_or_contact = data.get('username').casefold()
    password = data.get('password')

    # Query Employee table for email or contact
    employee = Employee.query.filter(
        (Employee.email == email_or_contact) | 
        (Employee.contact == email_or_contact)
    ).first()

    if employee:
        # Find corresponding credentials
        credentials = Credentials.query.filter_by(employee_id=employee.employee_id).first()

        if credentials and check_password_hash(credentials.password, password):
            session['user_id'] = employee.employee_id
            session.permanent = True
            return jsonify({'message': 'Login successful'}), 200

    return jsonify({'message': 'Invalid credentials'}), 401

