import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from redcape.db import Employee  # Import your ORM model

# Database connection setup
DATABASE_URI = 'postgresql://postgres:eddy@localhost/redcapestudios'
engine = create_engine(DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

def import_employee_data_from_excel(file_path):
    # Read the Excel file
    df = pd.read_excel(file_path)

    # Rename columns to match database schema
    df.rename(columns={
        'Employee id': 'EMPLOYEE_ID',
        'Name': 'EMPLOYEE_NAME',
        'Designation': 'DESIGNATION',
        'Department': 'DEPARTMENT',
        'Mobile Number': 'CONTACT',
        'Mail Id': 'EMAIL'
    }, inplace=True)

    # Convert CONTACT to string if it contains non-numeric characters
    df['CONTACT'] = df['CONTACT'].astype(str)

    # Insert data into the EMPLOYEE table using ORM model
    for _, row in df.iterrows():
        employee = Employee(
            employee_id=row['EMPLOYEE_ID'],
            employee_name=row['EMPLOYEE_NAME'],
            designation=row['DESIGNATION'],
            department=row['DEPARTMENT'],
            contact=row['CONTACT'],
            email=row['EMAIL']
        )
        session.add(employee)

    session.commit()
    print("Employee data imported successfully!")

# Example usage
if __name__ == "__main__":
    file_path = r'C:\Users\edwin\Documents\Redcape studios Internship docs\emp-details.xlsx'
    import_employee_data_from_excel(file_path)