from sqlalchemy.event import listens_for
from redcape.db import db, Asset, AssetTracking, AssetPhase, DailyLog
from sqlalchemy import func


def delete_duplicates_in_daily_log():
    # Step 1: Identify duplicates in the daily_log table
    duplicates = (
        db.session.query(
            DailyLog.log_date,
            DailyLog.employee_id,
            DailyLog.asset_id,
            DailyLog.phase_id,
            DailyLog.status_id,
            DailyLog.man_days,
            DailyLog.description,
            func.count(DailyLog.id).label('duplicate_count')
        )
        .group_by(
            DailyLog.log_date,
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

    # Step 2: For each set of duplicates, retain one (smallest id) and delete the rest
    for duplicate in duplicates:
        # Find all duplicate entries matching the current record
        duplicate_entries = DailyLog.query.filter_by(
            log_date=duplicate.log_date,
            employee_id=duplicate.employee_id,
            asset_id=duplicate.asset_id,
            phase_id=duplicate.phase_id,
            status_id=duplicate.status_id,
            man_days=duplicate.man_days,
            description=duplicate.description
        ).order_by(DailyLog.id).all()  # Sort by id, so we can easily keep the first one

        # Retain the first entry and delete the rest
        for entry in duplicate_entries[1:]:  # Skip the first entry and delete others
            db.session.delete(entry)

    # Step 3: Commit the changes to the database
    # db.session.commit()

# Listen for inserts on DailyLog table
@listens_for(DailyLog, 'after_insert')
def after_insert_daily_log(mapper, connection, target):
    # Run duplicate check and cleanup after an insert
    delete_duplicates_in_daily_log()

@listens_for(Asset, 'after_insert')
def add_tracking_entries(mapper, connection, target):
    # Get all phase IDs from the AssetPhase table
    phase_ids = [phase.phase_id for phase in AssetPhase.query.all()]

    # Create tracking entries for each phase
    tracking_entries = [
        AssetTracking(
            asset_id=target.asset_id,
            phase_id=phase_id,
            status_id=1,  # Default status ID
            assignee=None,
            eta=None,
            sys_start_date=None,
            sys_end_date=None,
            man_days=None
        )
        for phase_id in phase_ids
    ]

    # Add the entries to the session
    db.session.bulk_save_objects(tracking_entries)
