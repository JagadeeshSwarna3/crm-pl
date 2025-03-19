import frappe


def execute():
	frappe.db.sql("""
		update `tabAppointment` app
		inner join `tabAppointment Source` src on src.name = app.appointment_source
		set app.disable_automated_notifications = src.disable_automated_notifications
	""")
