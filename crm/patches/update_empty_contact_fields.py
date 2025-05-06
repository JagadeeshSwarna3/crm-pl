import frappe
from crm.crm.utils import get_contact_details
from frappe.contacts.doctype.contact.contact import get_default_contact

def execute():
    feedbacks = frappe.get_all(
        "Customer Feedback",
        filters={"docstatus": ["<", 2]},
        fields=["name", "feedback_from", "party_name", "contact_person"]
    )

    for fb in feedbacks:
        if not fb.feedback_from or not fb.party_name:
            continue

        party = frappe.get_cached_doc(fb.feedback_from, fb.party_name)

        lead = party if party.doctype == "Lead" else None

        contact_person = fb.contact_person
        if not contact_person and party.doctype != "Lead":
            contact_person = get_default_contact(party.doctype, party.name)

        if not contact_person:
            continue

        contact_details = get_contact_details(contact_person, lead=lead) or {}

        update_fields = {}
        if not fb.contact_person:
            update_fields["contact_person"] = contact_person
        if not frappe.db.get_value("Customer Feedback", fb.name, "contact_display"):
            update_fields["contact_display"] = contact_details.get("contact_display", "")
        if not frappe.db.get_value("Customer Feedback", fb.name, "contact_mobile"):
            update_fields["contact_mobile"] = contact_details.get("contact_mobile", "")
        if not frappe.db.get_value("Customer Feedback", fb.name, "contact_phone"):
            update_fields["contact_phone"] = contact_details.get("contact_phone", "")
        if not frappe.db.get_value("Customer Feedback", fb.name, "contact_email"):
            update_fields["contact_email"] = contact_details.get("contact_email", "")

        if update_fields:
            set_clause = ", ".join([f"{field} = %s" for field in update_fields])
            values = list(update_fields.values()) + [fb.name]

            frappe.db.sql(
                f"""UPDATE `tabCustomer Feedback` SET {set_clause} WHERE name = %s""",
                values
            )
