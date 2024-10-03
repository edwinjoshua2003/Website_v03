from redcape.db import db, Asset, AssetTracking, DailyLog
from redcape import create_app  # Import your app factory function

def update_asset_tracking_from_daily_logs():
    # Step 1: Fetch all daily logs (or you can add filters as needed)
    all_logs = DailyLog.query.order_by(DailyLog.id.asc()).all()

    for log_entry in all_logs:
        print(f'Processing log entry: {log_entry.id}')

        current_asset = db.session.query(Asset).filter_by(
            asset_id=log_entry.asset_id
        ).first()
        
        if current_asset.asset_name == 'Other':
            print(f'Exiting due to vague asset name: {current_asset.asset_name}')
            continue  # SKIP if no daily log entries exist
        
        phase_id = log_entry.phase_id
        if phase_id == 2:
            phase_id = 1

        # Step 2: Get the most recent asset tracking entry for this asset and phase
        recent_tracking = AssetTracking.query.filter_by(
            asset_id=log_entry.asset_id,
            phase_id=phase_id
            # assignee=log_entry.employee_id
        ).order_by(AssetTracking.id.desc()).first()

        recent_tracking_assignee = AssetTracking.query.filter_by(
            asset_id=log_entry.asset_id,
            phase_id=phase_id,
            assignee=log_entry.employee_id
        ).order_by(AssetTracking.id.desc()).first()

        status_changed = recent_tracking.status_id != log_entry.status_id
        # assignee_changed = recent_tracking.assignee != log_entry.employee_id

        # Step 3: If no tracking entry exists, create a new one
        if recent_tracking.assignee == None:
            print(f'Creating new tracking entry for asset {log_entry.asset_id} and phase {log_entry.phase_id}')
            recent_tracking.sys_end_date = log_entry.log_date
            db.session.add(recent_tracking)
        else:
            # Step 4: Check if there is a change in status or assignee
            print(f'Updating tracking for asset {log_entry.asset_id} and phase {log_entry.phase_id}')
            if recent_tracking_assignee:
                status_changed = recent_tracking_assignee.status_id != log_entry.status_id
                # Step 5: If the status has changed, mark the previous entry's sys_end_date
                if status_changed:
                    print(f'Status changed for asset {log_entry.asset_id} and phase {log_entry.phase_id}')
                    recent_tracking_assignee.sys_end_date = log_entry.log_date
                    db.session.add(recent_tracking_assignee)  # Update the existing entry with the end date

        if not recent_tracking_assignee or recent_tracking.assignee == None or (status_changed and recent_tracking_assignee):
            # Step 6: Create a new entry for the changed status or assignee
            new_tracking_entry = AssetTracking(
                asset_id=log_entry.asset_id,
                phase_id=phase_id,
                status_id=log_entry.status_id,
                assignee=log_entry.employee_id,
                man_days=log_entry.man_days,
                sys_start_date=log_entry.log_date,  # Set the sys_start_date to the current log date
                sys_end_date=None  # No end date yet as this is the current active tracking
            )
            db.session.add(new_tracking_entry)

    # Step 7: Commit the changes after processing all logs
    db.session.commit()

if __name__ == "__main__":
    # Create the Flask app instance
    app = create_app()

    # Run the update inside the app context
    with app.app_context():
        update_asset_tracking_from_daily_logs()
