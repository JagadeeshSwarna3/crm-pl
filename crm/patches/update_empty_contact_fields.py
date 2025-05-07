import frappe
from crm.crm.utils import get_contact_details
from frappe.contacts.doctype.contact.contact import get_default_contact

def execute():
	feedbacks = frappe.get_all(
		"Customer Feedback",
		fields=["name", "feedback_from", "party_name", "contact_person"]
	)

	for fb in feedbacks:
		if not fb.feedback_from or not fb.party_name:
			continue

		party = frappe.get_doc(fb.feedback_from, fb.party_name)

		lead = party if party.doctype == "Lead" else None

		contact_person = fb.contact_person
		if not contact_person and party.doctype != "Lead":
			contact_person = get_default_contact(party.doctype, party.name)

		if not contact_person:
			continue

		contact_details = get_contact_details(contact_person, lead=lead) or {}

		if not fb.contact_person:
			frappe.db.set_value("Customer Feedback", fb.name, {
				"contact_person": contact_person,
				"contact_display": contact_details.get("contact_display", ""),
				"contact_mobile": contact_details.get("contact_mobile", ""),
				"contact_phone": contact_details.get("contact_phone", ""),
				"contact_email": contact_details.get("contact_email", "")
			})
