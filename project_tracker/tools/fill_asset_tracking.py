from redcape.db import db, Asset, AssetTracking, AssetPhase
from redcape import create_app  # Import your app factory function

def backfill_asset_tracking():
    # Get all phase IDs
    phase_ids = [phase.phase_id for phase in AssetPhase.query.all()]

    # Get all assets
    assets = Asset.query.all()

    # For each asset, add tracking entries for all phases if they don't exist
    for asset in assets:
        if asset.asset_name == 'Other':
            continue
        for phase_id in phase_ids:
            # Check if the tracking entry for this asset and phase already exists
            if phase_id == 2:
                continue
            existing_entry = AssetTracking.query.filter_by(asset_id=asset.asset_id, phase_id=phase_id).first()

            if not existing_entry:
                # If not, create a new entry
                new_entry = AssetTracking(
                    asset_id=asset.asset_id,
                    phase_id=phase_id,
                    status_id=1,  # Default status ID
                    assignee=None,
                    eta=None,
                    sys_start_date=None,
                    sys_end_date=None,
                    man_days=None
                )
                db.session.add(new_entry)

    # Commit all the changes at once to the database
    db.session.commit()

if __name__ == "__main__":
    # Create the Flask app instance
    app = create_app()  # Ensure you have a function that creates and configures your app

    # Run the backfill inside the app context
    with app.app_context():
        backfill_asset_tracking()
