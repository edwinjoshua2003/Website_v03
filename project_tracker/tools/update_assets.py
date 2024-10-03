import pandas as pd
from sqlalchemy import func, cast
from sqlalchemy.types import Integer
from redcape import create_app  # Import your Flask app
from redcape.db import db, AssetType, Asset  # Import db and models

def update_assets_from_excel(file_path):
    """
    Reads an Excel file and updates the Asset table in the database.

    Parameters:
    - file_path: The path to the Excel file containing asset data.
    """

    # Step 1: Read Excel file into a DataFrame
    df = pd.read_excel(file_path)

    # Step 2: Run the code inside the Flask application context
    with app.app_context():
        # Iterate through DataFrame rows
        for index, row in df.iterrows():
            project_id = row['project_id']
            asset_type_name = row['asset_type_name']
            set_name = row['set_name'] if pd.notnull(row['set_name']) else 'NaN'  # Handle null set_name
            asset_name = row['asset_name']
            category_id = row['category_id'] if pd.notnull(row['category_id']) else None  # Handle null category_id

            # Step 3: Get the asset_type_id from AssetType table based on asset_type_name using db.session.query()
            asset_type = db.session.query(AssetType).filter_by(asset_type_name=asset_type_name).first()

            if not asset_type:
                print(f"Asset type '{asset_type_name}' not found in AssetType table.")
                continue  # Skip if asset type is not found

            # Step 4: Extract the number part from asset_id and get the highest existing number
            # Assuming the asset_id is in format '{project_id}{asset_type_name}{number}', we extract the number
            asset_id_prefix = f"{project_id}{asset_type_name}"

            highest_number = db.session.query(
                func.max(
                    cast(
                        func.substring(Asset.asset_id, len(asset_id_prefix) + 1, 10),  # Extract the number part
                        Integer
                    )
                )
            ).filter(
                Asset.project_id == project_id,
                Asset.asset_type_id == asset_type.asset_type_id
            ).scalar()

            # Step 5: Generate new asset_id
            if highest_number:
                new_number = highest_number + 1
            else:
                new_number = 1

            # Create new asset_id by concatenating project_id, asset_type_name, and the new number
            new_asset_id = f"{project_id}{asset_type_name}{new_number}"

            # Step 6: Insert new row into Asset table using db.session.add()
            new_asset = Asset(
                asset_id=new_asset_id,
                project_id=project_id,
                set_name=set_name,  # This can be None
                asset_type_id=asset_type.asset_type_id,
                asset_name=asset_name,
                category_id=category_id  # This can be None
            )

            # Add to session and commit the transaction
            db.session.add(new_asset)

        # Step 7: Commit the changes
        db.session.commit()

    print(f"Assets updated successfully from {file_path}.")

if __name__ == '__main__':
    # Create the Flask app instance
    app = create_app()  # Ensure you have a function that creates and configures your app
    file_path = r"C:\Users\edwin\Documents\Redcape studios Internship docs\Assets Update\assets_latest_update.xlsx"

    with app.app_context():
        update_assets_from_excel(file_path)