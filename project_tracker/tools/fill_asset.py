import pandas as pd
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from redcape.db import Asset, AssetType, AssetCategory

DATABASE_URI = 'postgresql://postgres:eddy@localhost/redcapestudios'

engine = create_engine(DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

def import_assets_from_excel(file_path):

    # Load Excel data
    df = pd.read_excel(file_path)

    # Fetch all asset types and create a map for lookup
    atypes = session.query(AssetType).all()
    asset_type_map = {atype.asset_type_name: atype.asset_type_id for atype in atypes}

    # Fetch all asset categories and create a map for lookup
    categories = session.query(AssetCategory).all()
    category_map = {category.category_name: category.category_id for category in categories}

    previous_project_id = None
    previous_asset_type = None
    counter = 1

    for index, row in df.iterrows():
        project_id = row['project_id']
        asset_type = row['asset_type']
        set_name = row['set_name']
        asset_name = row['asset_name']
        category_name = row['category_name']  # New column in Excel file

        # Reset the counter when the project_id or asset_type changes
        if project_id != previous_project_id or asset_type != previous_asset_type:
            counter = 1

        # Generate unique asset_id
        asset_id = f"{project_id}{asset_type}{counter}"

        # Get asset_type_id from the map
        asset_type_id = asset_type_map.get(asset_type)
        
        # Get category_id from the category map, allow NULL if not found
        category_id = category_map.get(category_name, None)

        # Create a new asset instance
        new_asset = Asset(
            asset_id=asset_id,
            project_id=project_id,
            set_name=set_name,
            asset_type_id=asset_type_id,
            asset_name=asset_name,
            category_id=category_id  # category_id can be NULL (None in Python)
        )

        # Add the new asset to the session
        session.add(new_asset)

        # Update previous variables and increment counter
        previous_project_id = project_id
        previous_asset_type = asset_type
        counter += 1

    # try to put above loop as a function
    try:
        # Commit the session to save data to the database
        session.commit()
    except:
        counter+=1

    print("Data successfully inserted into the database.")

if __name__ == "__main__":
    excel_file_path = r'C:\Users\edwin\Documents\Redcape studios Internship docs\Assets Update\assets_latest_update.xlsx'
    import_assets_from_excel(excel_file_path)
