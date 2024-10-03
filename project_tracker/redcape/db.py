from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import OID
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class Employee(db.Model):
	__tablename__ = 'employee'
	employee_id = db.Column(db.String(80), primary_key=True)
	employee_name = db.Column(db.String(255))
	designation = db.Column(db.String(255))
	department = db.Column(db.String(255))
	contact = db.Column(db.String(15))
	email = db.Column(db.String(80))
	username = db.Column(db.String(80))

class Credentials(db.Model):
	__tablename__ = 'credentials'
	employee_id = db.Column(db.String(80), db.ForeignKey('employee.employee_id'), primary_key=True)
	password = db.Column(db.Text, nullable=False)

class Project(db.Model):
	__tablename__ = 'project'
	project_id = db.Column(db.String(80), primary_key=True)
	project_name = db.Column(db.String(255), unique=True)
	isactive = db.Column(db.Boolean, default=True)
	index = db.Column(db.Integer, nullable=True)

class AssetType(db.Model):
	__tablename__ = 'asset_type'
	asset_type_id = db.Column(db.Integer, primary_key=True)
	asset_type_name = db.Column(db.String(255), unique=True)

class AssetPhase(db.Model):
	__tablename__ = 'asset_phase'
	phase_id = db.Column(db.Integer, primary_key=True)
	phase_name = db.Column(db.String(255), unique=True)

class AssetStatus(db.Model):
	__tablename__ = 'asset_status'
	status_id = db.Column(db.Integer, primary_key=True)
	status_name = db.Column(db.String(255))

class AssetCategory(db.Model):
	__tablename__ = 'asset_category'
	category_id = db.Column(db.Integer, primary_key=True)
	category_name = db.Column(db.String(255))

class Asset(db.Model):
	__tablename__ = 'asset'
	asset_id = db.Column(db.String(80), primary_key=True)
	project_id = db.Column(db.String(80), db.ForeignKey('project.project_id'))
	set_name = db.Column(db.String(80), nullable=True)
	asset_type_id = db.Column(db.Integer, db.ForeignKey('asset_type.asset_type_id'))
	asset_name = db.Column(db.String(255))
	category_id = db.Column(db.Integer, db.ForeignKey('asset_category.category_id'), nullable=True)

	project = relationship('Project', backref='assets')
	asset_type = relationship('AssetType', backref='assets')
	asset_category = relationship('AssetCategory', backref='assets')

class AssetTracking(db.Model):
	__tablename__ = 'asset_tracking'
	id = db.Column(db.Integer, primary_key=True)
	asset_id = db.Column(db.String(80), db.ForeignKey('asset.asset_id'))
	phase_id = db.Column(db.Integer, db.ForeignKey('asset_phase.phase_id'))
	status_id = db.Column(db.Integer, db.ForeignKey('asset_status.status_id'))
	assignee = db.Column(db.String(80), db.ForeignKey('employee.employee_id'), nullable=True)
	eta = db.Column(db.Date, nullable=True)
	man_days = db.Column(db.Integer)
	sys_start_date = db.Column(db.Date)
	sys_end_date = db.Column(db.Date)

	# Relationships
	asset = db.relationship('Asset', backref='tracking')
	phase = db.relationship('AssetPhase', backref='tracking')
	status = db.relationship('AssetStatus', backref='tracking')
	employee = db.relationship('Employee', backref='tracking')

class DailyLog(db.Model):
	__tablename__ = 'daily_log'
	id = db.Column(db.Integer, primary_key=True)
	log_date = db.Column(db.DateTime)
	project_id = db.Column(db.String(80), db.ForeignKey('project.project_id'))   
	employee_id = db.Column(db.String(80), db.ForeignKey('employee.employee_id'))
	asset_id = db.Column(db.String(80), db.ForeignKey('asset.asset_id'))
	phase_id = db.Column(db.Integer, db.ForeignKey('asset_phase.phase_id'))
	status_id = db.Column(db.Integer, db.ForeignKey('asset_status.status_id'))
	eta = db.Column(db.Date, nullable=True)
	man_days = db.Column(db.Integer)
	description = db.Column(db.Text)
	image_url = db.Column(db.Text)

	employee = relationship('Employee', backref='daily_logs')
	project = relationship('Project', backref='daily_logs')
	asset = relationship('Asset', backref='daily_logs')
	phase = relationship('AssetPhase', backref='daily_logs')
	status = relationship('AssetStatus', backref='daily_logs')

	def to_dict(self):
		return {
            'id': self.id,
            'log_date': self.log_date.date(),
            'project_id': self.project_id,
            'employee_id': self.employee_id,
            'asset_id': self.asset_id,
			'asset_type_id': self.asset.asset_type_id,
			'asset_name': self.asset.asset_name,
            'phase_id': self.phase_id,
            'status_id': self.status_id,
            'eta': self.eta,
            'man_days': self.man_days,
            'description': self.description,
            'image_url': self.image_url
        }

class Leaves(db.Model):
	__tablename__ = 'leaves'
	username = db.Column(db.String(80), primary_key=True)