from redcape.db import db, DailyLog
from flask import Flask
from sqlalchemy import update

# Assuming your Flask app is set up as 'app' in your main application
app = Flask(__name__)

# Update your app configuration as needed
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:eddy@localhost:5432/redcapestudios'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def increment_phase_ids():
    # Create an update statement that increments the phase_id by 1 if phase_id > 1
    # stmt = update(DailyLog).where(DailyLog.phase_id > 1).values(phase_id=DailyLog.phase_id + 1)
    stmt = update(DailyLog).where(DailyLog.status_id == 7).values(phase_id=DailyLog.status_id + 1)  

    # Execute the update statement
    with db.engine.connect() as conn:
        conn.execute(stmt)
        conn.commit()

if __name__ == '__main__':
    # Ensure that database operations are executed within the app context
    with app.app_context():
        # Increment phase_id for all rows with phase_id > 1
        increment_phase_ids()

    print("Phase IDs updated successfully.")
