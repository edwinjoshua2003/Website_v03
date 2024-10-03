from sqlalchemy.event import listens_for
from sqlalchemy import update
from redcape.db import db, Asset, AssetTracking, AssetPhase, DailyLog
from sqlalchemy import func

def delete_duplicates_in_daily_log():
    # Step 1: Identify duplicates in the daily_log table
    duplicates = (
        db.session.query(
            func.date(DailyLog.log_date).label('log_date'),
            DailyLog.employee_id,
            DailyLog.asset_id,
            DailyLog.phase_id,
            DailyLog.status_id,
            DailyLog.man_days,
            DailyLog.description,
            func.count(DailyLog.id).label('duplicate_count')
        )
        .group_by(
            func.date(DailyLog.log_date),
            DailyLog.employee_id,
            DailyLog.asset_id,
            DailyLog.phase_id,
            DailyLog.status_id,
            DailyLog.man_days,
            DailyLog.description
        )
        .having(func.count(DailyLog.id) > 1)  # Filter for duplicate records
        .all()
    )

    # List to store the IDs of entries to delete
    ids_to_delete = []

    # Step 2: Collect the IDs of entries to delete
    for duplicate in duplicates:
        # Find all duplicate entries matching the current record
        duplicate_entries = DailyLog.query.filter(
            func.date(DailyLog.log_date) == duplicate.log_date,
            DailyLog.employee_id == duplicate.employee_id,
            DailyLog.asset_id == duplicate.asset_id,
            DailyLog.phase_id == duplicate.phase_id,
            DailyLog.status_id == duplicate.status_id,
            DailyLog.man_days == duplicate.man_days,
            DailyLog.description == duplicate.description
        ).order_by(DailyLog.id).all()  # Sort by id to keep the first one

        # Collect the IDs of entries to delete (skip the first entry)
        ids_to_delete.extend(entry.id for entry in duplicate_entries[1:])

    # Step 3: Perform bulk deletion using session.execute()
    if ids_to_delete:
        db.session.execute(
            DailyLog.__table__.delete().where(DailyLog.id.in_(ids_to_delete))
        )

    # Step 4: Commit the changes to the database
    # db.session.commit()

def add_assest_tracking_entries(target):
    if target.asset_name == 'Other':
        return
    # Step 1: Get all phase IDs from the AssetPhase table
    phase_ids = db.session.query(AssetPhase.phase_id).all()

    # Step 2: Check if the tracking entries for the asset and each phase already exist
    for phase_id_tuple in phase_ids:
        phase_id = phase_id_tuple[0]  # Extract the phase_id from the tuple
        if phase_id == 2:
            continue

        # Check if a tracking entry already exists for this asset and phase
        existing_entry = db.session.query(AssetTracking).filter_by(
            asset_id=target.asset_id,
            phase_id=phase_id
        ).first()

        # Step 3: If no entry exists, create one
        if not existing_entry:
            new_entry = AssetTracking(
                asset_id=target.asset_id,
                phase_id=phase_id,
                status_id=1,  # Default status ID
                assignee=None,
                eta=None,
                sys_start_date=None,
                sys_end_date=None,
                man_days=None
            )
            db.session.add(new_entry)

    # Step 4: Commit the changes to the database
    # db.session.commit()

def update_asset_tracking_from_daily_log(connection, target):
    # Step 1: Get the most recent daily log entry
    recent_log = target

    current_asset = db.session.query(Asset).filter_by(
        asset_id=recent_log.asset_id
    ).first()
    
    if not recent_log or current_asset.asset_name == 'Other':
        return  # Exit if no daily log entries exist
    
    # sculpt is part of mod process
    phase_id = recent_log.phase_id
    if phase_id == 2:
        phase_id = 1

    # Step 2: Get the most recent asset tracking entry for this asset and phase
    recent_tracking = db.session.query(AssetTracking).filter_by(
        asset_id=recent_log.asset_id,
        phase_id=phase_id
    ).order_by(AssetTracking.id.desc()).first()

    recent_tracking_assignee = AssetTracking.query.filter_by(
        asset_id=recent_log.asset_id,
        phase_id=phase_id,
        assignee=recent_log.employee_id
    ).order_by(AssetTracking.id.desc()).first()

    status_changed = recent_tracking.status_id != recent_log.status_id

    print('here tracking...5')
    # Step 3: If no tracking entry exists, create a new one
    if recent_tracking.assignee == None:
        print('here tracking...9')
        stmt = update(AssetTracking).where(
            AssetTracking.asset_id == target.asset_id,
            AssetTracking.phase_id == phase_id
            ).values(
                sys_end_date=recent_log.log_date
                # sys_end_date=datetime.now()  # Set the end date as the current date
            )
        print('here tracking...12')
        # recent_tracking.sys_end_date = recent_log.log_date.date()
        connection.execute(stmt)
    else:
        print('here tracking...10')
        # Step 4: Check if there is a change in status or assignee
        if recent_tracking_assignee:
            status_changed = recent_tracking_assignee.status_id != recent_log.status_id
            # Step 5: If the status has changed, mark the previous entry's sys_end_date
            print('here tracking...6')
            # Step 5: If the status has changed, mark the previous entry's sys_end_date
            if status_changed:
                stmt = update(AssetTracking).where(
                    AssetTracking.asset_id == target.asset_id,
                    AssetTracking.phase_id == target.phase_id,
                    AssetTracking.assignee == target.employee_id
                    ).values(
                        sys_end_date=recent_log.log_date
                        # sys_end_date=datetime.now()  # Set the end date as the current date
                    )
                print('here tracking...11')
                # recent_tracking.sys_end_date = recent_log.log_date.date()
                connection.execute(stmt)
    
    if not recent_tracking_assignee or recent_tracking.assignee == None or (status_changed and recent_tracking_assignee):
        # Step 6: Create a new entry for the changed status or assignee
        new_tracking_entry = AssetTracking(
            asset_id=recent_log.asset_id,
            phase_id=phase_id,
            status_id=recent_log.status_id,
            assignee=recent_log.employee_id,
            man_days=recent_log.man_days,
            sys_start_date=recent_log.log_date,  # Set the sys_start_date to the current log date
            sys_end_date=None  # No end date yet as this is the current active tracking
        )
        db.session.add(new_tracking_entry)
        print('here tracking...7')

# Listen for inserts on DailyLog table
@listens_for(DailyLog, 'after_insert')
def after_insert_daily_log(mapper, connection, target):
    print('here tracking...1')
    # Run duplicate check and cleanup after an insert
    delete_duplicates_in_daily_log()
    print('here tracking...2')
    # Run update to check any new asset status updates
    update_asset_tracking_from_daily_log(connection, target)
    print('here tracking...3')
    pass

@listens_for(Asset, 'after_insert')
def add_tracking_entries_after_insert(mapper, connection, target):
    # print('here tracking')
    add_assest_tracking_entries(target)
