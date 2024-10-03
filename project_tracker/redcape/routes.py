import os
import tempfile
from datetime import datetime, timedelta
import time
from sqlalchemy.orm import joinedload
from flask import Blueprint, request, session, jsonify, send_from_directory, abort
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, text, cast, Date, or_, and_, not_, case
from .db import db, Project, Employee, Asset, AssetStatus, AssetCategory, \
                AssetType, AssetPhase, DailyLog, AssetTracking, Leaves

routes_bp = Blueprint('routes', __name__)
base_url = 'C:/testing_owncloud/daily_log/'

@routes_bp.route('/api/session/', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({'session': True}), 200
    return jsonify({'session': False}), 401

@routes_bp.route('/api/logout/', methods=['POST'])
def logout():
    session.clear()  # Clear all session data
    return jsonify({'message': 'Logged out successfully'}), 200

@routes_bp.route('/api/dashboard/', methods=['GET'])
def get_projects():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    active_projects = Project.query.filter_by(isactive=True).order_by(Project.index).all()
    projects_list = [{'id': p.project_id, 'name': p.project_name, 'isactive': p.isactive} for p in active_projects]
    return jsonify(projects_list)

@routes_bp.route('/api/asset_tracking/<id>/', methods=['GET'])
def get_asset_tracking(id):
    try:
        # Query the database for the asset tracking details with the given asset ID
        asset_tracking = AssetTracking.query.filter(
            and_(
                AssetTracking.assignee == session['user_id'],  # Filter by assignee
                AssetTracking.sys_end_date.is_(None),  # Filter where sys_end_date is NULL
                or_(AssetTracking.status_id == 2, AssetTracking.status_id == 7)  # Filter for status_id 2 (WIP) or 7 (Hold)
            )
        ).all()

        # Check if asset tracking data exists for the given asset ID
        if not asset_tracking:
            print('No asset tracking data found for this ID')
            # return jsonify({'message': 'No asset tracking data found for this ID'}), 404

        # Serialize the asset tracking data into a dictionary format
        asset_tracking_data = [
            {
                'asset_type_id': entry.asset.asset_type_id,
                'asset_name': entry.asset.asset_name,
                'phase_id': entry.phase_id,
                'status_id': entry.status_id,
                'assignee': entry.assignee,
                'eta': entry.eta,
                'sys_start_date': entry.sys_start_date,
                'sys_end_date': entry.sys_end_date,
                'man_days': entry.man_days,
            } for entry in asset_tracking
        ]
        # print(asset_tracking_data)
        # Return the serialized data as a JSON response
        return jsonify(asset_tracking_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/api/daily_log/<id>/', methods=['GET'])
def get_user_logs(id):
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401

    log_date = db.func.current_date()
    employee_id = session['user_id']  # Assuming user is logged in and you have user session management
    logs = DailyLog.query.filter(
        func.date(DailyLog.log_date) == log_date,
        DailyLog.project_id == id, 
        DailyLog.employee_id == employee_id 
    ).order_by(DailyLog.id.asc()).all()
    print(logs)
    return jsonify([log.to_dict() for log in logs])

@routes_bp.route('/api/project/<id>/', methods=['GET'])
def get_project_details(id):
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401

    # Get all assets associated with the selected project
    project_assets = Asset.query.filter_by(project_id=id).order_by(Asset.asset_name.asc()).all()
    
    # Extract unique asset type IDs from the project assets
    asset_type_ids = {asset.asset_type_id for asset in project_assets}
    
    # Get only the asset types present in the project
    asset_types = AssetType.query.filter(AssetType.asset_type_id.in_(asset_type_ids)).order_by(AssetType.asset_type_id.asc()).all()
    
    asset_phases = AssetPhase.query.order_by(AssetPhase.phase_id.asc()).all()
    
    # Fetch only statuses with status_id 2 (WIP) and 7 (Done)
    statuses = AssetStatus.query.filter(AssetStatus.status_id.in_([2, 7, 8])).order_by(AssetStatus.status_id.asc()).all()

    asset_data = [{'asset_name': asset.asset_name, 'asset_type_id': asset.asset_type_id} for asset in project_assets]
    type_data = [{'id': t.asset_type_id, 'name': t.asset_type_name} for t in asset_types]
    phase_data = [{'id': p.phase_id, 'name': p.phase_name} for p in asset_phases]
    status_data = [{'id': status.status_id, 'name': status.status_name} for status in statuses]

    return jsonify({'assets': asset_data, 'types': type_data, 'phases': phase_data, 'status': status_data}), 200

# @routes_bp.route('/api/project/<id>/', methods=['GET'])
# def get_project_details(id):
#     if 'user_id' not in session:
#         return jsonify({'message': 'Unauthorized'}), 401

#     # Get all assets associated with the selected project
#     project_assets = Asset.query.filter_by(project_id=id).order_by(Asset.asset_name.asc()).all()

#     # Extract unique asset type IDs from the project assets
#     asset_type_ids = {asset.asset_type_id for asset in project_assets}

#     # Get only the asset types present in the project
#     asset_types = AssetType.query.filter(AssetType.asset_type_id.in_(asset_type_ids)).order_by(AssetType.asset_type_id.asc()).all()

#     # Get all asset phases
#     asset_phases = AssetPhase.query.order_by(AssetPhase.phase_id.asc()).all()

#     # Fetch only statuses with status_id 2 (WIP) and 7 (Hold)
#     statuses = AssetStatus.query.filter(AssetStatus.status_id.in_([2, 7])).order_by(AssetStatus.status_id.asc()).all()

#     # Fetch AssetTracking data for WIP (status_id=2) and Hold (status_id=7)
#     asset_tracking_data = AssetTracking.query.options(
#         joinedload(AssetTracking.asset),
#         joinedload(AssetTracking.phase),
#         joinedload(AssetTracking.status)
#     ).filter(
#         AssetTracking.asset_id.in_([asset.asset_id for asset in project_assets]),  # Filter by assets in the project
#         AssetTracking.status_id.in_([2, 7])  # WIP and Hold only
#     ).all()

#     # Prepare the response with WIP preloaded and Hold with man_days disabled
#     tracking_data = []
#     for tracking in asset_tracking_data:
#         tracking_info = {
#             'asset_id': tracking.asset_id,
#             'asset_name': tracking.asset.asset_name,
#             'phase_id': tracking.phase_id,
#             'phase_name': tracking.phase.phase_name,
#             'status_id': tracking.status_id,
#             'status_name': tracking.status.status_name,
#             'man_days': tracking.man_days if tracking.status_id == 2 else None,  # Disable man_days for Hold
#             'is_hold': tracking.status_id == 7  # Mark if the status is Hold
#         }   
#         tracking_data.append(tracking_info)

#     # Prepare the asset, type, phase, and status data for the response
#     asset_data = [{'asset_name': asset.asset_name, 'asset_type_id': asset.asset_type_id} for asset in project_assets]
#     type_data = [{'id': t.asset_type_id, 'name': t.asset_type_name} for t in asset_types]
#     phase_data = [{'id': p.phase_id, 'name': p.phase_name} for p in asset_phases]
#     status_data = [{'id': status.status_id, 'name': status.status_name} for status in statuses]

#     return jsonify({
#         'assets': asset_data,
#         'types': type_data,
#         'phases': phase_data,
#         'status': status_data,
#         'tracking': tracking_data  # Return tracking data
#     }), 200

# NOT USED BUT NEEDED FOR PROJECT DROPDOWN
@routes_bp.route('/api/project/assets/<id>/', methods=['GET'])
def get_assets_by_project(id):
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    assets = Asset.query.filter_by(project_id=id).all()
    asset_data = [{'id': asset.asset_id, 'name': asset.asset_name, 'type_id': asset.asset_type_id} for asset in assets]
    return jsonify({'assets': asset_data}), 200

@routes_bp.route('/api/daily_log/<id>/', methods=['POST'])
def create_daily_log(id):
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    
    db.session.execute(text('SET TIME ZONE "Asia/Kolkata";'))

    data = request.form
    asset_type = data.get('assetType')
    asset_name = data.get('assetName')
    process = data.get('process')  # This will be the phase_id
    status_id = data.get('status')
    c_man_days = data.get('cManDays')
    man_days = data.get('manDays')
    description = data.get('description').strip()
    image = request.files.get('image')
    print("here", 3)
    required_fields = ['assetType', 'assetName', 'process', 'status', 'manDays', 'description']
    for field in required_fields:
        if not data.get(field):
            print("here", field)
            return jsonify({'message': f'Missing {field} in form data'}), 400
    print("here", 2)
    if man_days:
        try:
            man_days = float(man_days)
        except ValueError:
            print("here", 1)
            return jsonify({'message': 'Invalid Actual Man-days value'}), 400
    else:
        man_days = None  # Handle the absence of man_days appropriately
    if c_man_days:
        try:
            c_man_days = float(c_man_days)
        except ValueError:
            print("here", 1)
            return jsonify({'message': 'Invalid Consumed Man-days value'}), 400
    else:
        c_man_days = None  # Handle the absence of man_days appropriately
    print("here")
    if not image:
        return jsonify({'message': 'No image uploaded'}), 400

    # Save the image temporarily
    temp_filename = os.path.join(tempfile.gettempdir(), image.filename)
    image.save(temp_filename)

    # Query the Asset
    asset = Asset.query.filter_by(project_id=id, asset_name=asset_name).first()
    if not asset:
        os.remove(temp_filename)  # Clean up temporary file
        return jsonify({'message': 'Asset not found'}), 404

    # Query the AssetPhase
    phase = AssetPhase.query.filter_by(phase_id=process).first()
    if not phase:
        os.remove(temp_filename)  # Clean up temporary file
        return jsonify({'message': 'Phase not found'}), 404
    
    status = AssetStatus.query.filter_by(status_id=status_id).first()
    if not status:
        os.remove(temp_filename)  # Clean up temporary file
        return jsonify({'message': 'Phase not found'}), 404

    # Query the Employee to get the employee_name
    employee = Employee.query.filter_by(employee_id=session['user_id']).first()
    if not employee:
        os.remove(temp_filename)  # Clean up temporary file
        return jsonify({'message': 'Employee not found'}), 404

    # Generate the ownCloud path using the employee_name and phase_name
    owncloud_path = base_url
    current_date = datetime.now()
    year = current_date.strftime("%Y")
    month = current_date.strftime("%m")
    day = current_date.strftime("%d")
    employee_name = employee.employee_name.lower().replace(' ', '_')
    phase_name = phase.phase_name.lower().replace(' ', '_')
    asset_id = asset.asset_id

    # Ensure directory structure
    directory_path = os.path.join(owncloud_path, year, month, day, employee_name, phase_name)
    os.makedirs(directory_path, exist_ok=True)

    # Generate unique filename
    base_filename = f"{asset_id}_v_"
    n = 1
    while True:
        filename = f"{base_filename}{n}.jpg"
        file_path = os.path.join(directory_path, filename)
        if not os.path.exists(file_path):
            break
        n += 1

    # Attempt to move the image to the ownCloud server directory with retries
    max_retries = 5
    for attempt in range(max_retries):
        try:
            os.rename(temp_filename, file_path)
            break  # Move was successful, exit the retry loop
        except PermissionError:
            if attempt < max_retries - 1:
                time.sleep(0.5)  # Wait for 500ms before retrying
            else:
                os.remove(temp_filename)  # Clean up temporary file
                return jsonify({'message': 'Failed to move image due to file lock'}), 500

    # Generate the path to store in the database
    image_path_in_db = os.path.join(year, month, day, employee_name, phase_name , filename)
    log_entry = DailyLog(
        log_date=db.func.now(),
        employee_id=session['user_id'],
        project_id=id,
        asset_id=asset.asset_id,
        phase_id=phase.phase_id,
        status_id=status.status_id,
        man_days=man_days,
        description=description,
        image_url=image_path_in_db  # Update to use image_url
    )
    try:
        db.session.add(log_entry)
        print(db.func.current_date(), session['user_id'], id, asset.asset_id, phase.phase_id, status.status_id, man_days, description, image_path_in_db)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create log entry', 'error': str(e)}), 500

    return jsonify({'message': 'Log entry created successfully'}), 201

@routes_bp.route('/api/dailies/', methods=['GET'])
def get_dailies():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    
    # db.session.execute(text('SET TIME ZONE "Asia/Kolkata";'))
    date = request.args.get('date')
    
    # Get the current timestamp and calculate the 12 PM window for filtering
    current_time = datetime.strptime(date, '%Y-%m-%d')

    # Calculate the current day of the week (0 = Monday, ..., 6 = Sunday in Python's weekday() format)
    current_day_of_week = current_time.weekday()  # Monday = 0, ..., Sunday = 6

    # Start time is the current day's 12 PM
    start_time = current_time.replace(hour=12, minute=0, second=0, microsecond=0)

    # Set the start and end times based on the day of the week and 12 PM window logic
    if current_day_of_week == 6:  # If Monday (Python weekday Monday = 0)
        end_time = current_time + timedelta(days=2)  # Go back to Saturday
        end_time = end_time.replace(hour=12, minute=0, second=0, microsecond=0)
    else:
        # Otherwise, use previous day's 12 PM
        end_time = current_time + timedelta(days=1)
        end_time = end_time.replace(hour=12, minute=0, second=0, microsecond=0)

    # Convert start_time and end_time to appropriate SQLAlchemy types
    start_time_sql = db.func.to_timestamp(start_time.isoformat(), 'YYYY-MM-DD"T"HH24:MI:SS')
    end_time_sql = db.func.to_timestamp(end_time.isoformat(), 'YYYY-MM-DD"T"HH24:MI:SS')

    print(f"Start Time: {start_time_sql}")
    print(f"End Time: {end_time_sql}")

    # Query the logs within this time window
    query = db.session.query(DailyLog).options(
        joinedload(DailyLog.employee),
        joinedload(DailyLog.project),
        joinedload(DailyLog.asset),
        joinedload(DailyLog.phase),
        joinedload(DailyLog.status)
    ).filter(
        and_(
            DailyLog.log_date >= start_time_sql,
            DailyLog.log_date < end_time_sql
        )
    ).join(Employee).order_by(Employee.username.asc(), DailyLog.phase_id.asc())

    current_logs = query.all()
    # print(current_logs)

    # Collect employee IDs from current_logs
    employee_ids_in_logs = [log.employee_id for log in current_logs]

    # Query employees whose employee_id is not in current_logs and whose department is not 'management' or 'production'
    excluded_employees_query = db.session.query(Employee).filter(
        and_(
            not_(Employee.employee_id.in_(employee_ids_in_logs)),
            Employee.department.notin_(['Management', 'Production'])
        )
    )

    excluded_employees = excluded_employees_query.all()

    # Query to get the usernames from the Leaves table
    leave_usernames_query = db.session.query(Leaves.username).all()
    leave_usernames = {username[0].lower() for username in leave_usernames_query}  # Create a set for faster lookup

    # Format response for current logs
    response = []
    for log in current_logs:
        response.append({
            'id': log.id,
            'date': log.log_date,
            'employee_name': log.employee.username.title(),
            'project_name': log.project.project_name,
            'project_id': log.project.project_id,
            'asset_name': log.asset.asset_name,
            'asset_type': log.asset.asset_type.asset_type_name,
            'phase_name': log.phase.phase_name,
            'man_days': log.man_days,
            'status': log.status.status_name,
            'description': log.description,
            'image_url': log.image_url
        })

    # Add excluded employees to the response
    excluded_employee_response = []
    absent_employees_response = []  # New response data for absent employees

    for employee in excluded_employees:
        employee_data = {
            'employee_id': employee.employee_id,
            'employee_name': employee.username.title(),
            'department': employee.department
        }
    
        # Check if employee name is in Leaves (absent) list
        if employee.username.lower() in leave_usernames:
            absent_employees_response.append(employee_data)
        else:
            excluded_employee_response.append(employee_data)

    response_data = {
        'current_logs': response,
        'excluded_employees': excluded_employee_response,
        'absent_employees': absent_employees_response  # Add absent employees to response
    }

    return jsonify(response_data), 200

@routes_bp.route('/api/logs/', methods=['GET'])
def get_logs():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    date = request.args.get('date')

    # Base query
    query = db.session.query(DailyLog).options(
        joinedload(DailyLog.employee),
        joinedload(DailyLog.project),
        joinedload(DailyLog.asset),
        joinedload(DailyLog.phase),
        joinedload(DailyLog.status)
    ).order_by(DailyLog.phase_id.asc(), DailyLog.employee_id.asc())

    if date:
        query = query.filter(cast(DailyLog.log_date, Date) == date)
    elif start_date and end_date:
        query = query.filter(cast(DailyLog.log_date, Date).between(start_date, end_date))

    logs = query.all()

    # Format response
    response = []
    for log in logs:
        response.append({
            'id': log.id,
            'date': log.log_date,
            'employee_name': log.employee.username.title(),
            'project_name': log.project.project_name,
            'project_id': log.project.project_id,
            'asset_name': log.asset.asset_name,
            'asset_type': log.asset.asset_type.asset_type_name,
            'phase_name': log.phase.phase_name,
            'man_days': log.man_days,
            'status': log.status.status_name,
            'description': log.description,
            'image_url': log.image_url
        }) 

    return jsonify(response), 200

@routes_bp.route('/api/image/<path:filename>', methods=['GET'])
def serve_image(filename):
    owncloud_path = base_url
    try:
        # Serve the image from the ownCloud directory
        return send_from_directory(owncloud_path, filename)
    except FileNotFoundError:
        abort(404)
