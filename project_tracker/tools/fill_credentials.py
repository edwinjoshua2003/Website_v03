import pandas as pd
from flask_bcrypt import generate_password_hash
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from redcape.db import db, Credentials  # Import Credentials model

# Database connection setup
DATABASE_URI = 'postgresql://postgres:eddy@localhost/redcapestudios' 
engine = create_engine(DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

def import_credentials_from_excel(file_path):
    # Read the Excel file
    df = pd.read_excel(file_path)

    # Iterate over the rows of the DataFrame
    for index, row in df.iterrows():
        employee_id = row['employee_id']
        password = row['password']

        # Hash the password
        hashed_password = generate_password_hash(password).decode('utf-8')

        # Create a new Credentials object
        new_credential = Credentials(
            employee_id=employee_id,
            password=hashed_password
        )

        # Add the new credential to the session
        session.add(new_credential)

    # Commit the session to save the changes in the database
    session.commit()
    print("Credentials imported successfully!")

# Example usage
if __name__ == "__main__":
    file_path = r'C:\Users\edwin\Documents\Redcape studios Internship docs\emp-cred.xlsx' 
    import_credentials_from_excel(file_path)
