// Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.provide("crm");

crm.CustomerFeedback = class CustomerFeedback extends frappe.ui.form.Controller {
	setup() {
		this.setup_queries();
	}

	refresh () {
		this.set_feedback_from();
	}

	setup_queries() {
		let me = this;

		me.frm.set_query("feedback_from", () => {
			return {
				"filters": {
					"name": ["in", crm.utils.get_feedback_allowed_party_types()],
				}
			}
		});
	}

	set_feedback_from() {
		let allowed_party_types = crm.utils.get_feedback_allowed_party_types();
		if (allowed_party_types.length == 1 && !this.frm.doc.feedback_from) {
			this.frm.set_value("feedback_from", allowed_party_types[0]);
			this.frm.set_df_property("feedback_from", "hidden", 1);
		}
	}

	feedback_from () {
		this.update_dynamic_fields();
		this.frm.set_value("party_name", "");
	}

	party_name() {
		return this.get_customer_name();
	}

	update_dynamic_fields() {
		if (this.frm.doc.feedback_from) {
			this.frm.set_df_property("party_name", "label", __(this.frm.doc.feedback_from));
		} else {
			this.frm.set_df_property("party_name", "label", __("Party"));
		}
	}

	get_customer_name() {
		if (this.frm.doc.feedback_from && this.frm.doc.party_name) {
			return frappe.call({
				method: "crm.crm.doctype.customer_feedback.customer_feedback.get_customer_name",
				args: {
					feedback_from: this.frm.doc.feedback_from,
					party_name: this.frm.doc.party_name,
				},
				callback: (r) => {
					if (!r.exc) {
						this.frm.set_value("customer_name", r.message);
					}
				}
			});
		}
	}

	reference_doctype() {
		this.frm.set_value("reference_name", null);
	}

	reference_name () {
		return this.determine_party();
	}

	determine_party() {
		if (this.frm.doc.reference_doctype && this.frm.doc.reference_name) {
			return this.frm.call({
				method: "determine_party_from_reference_name",
				doc: this.frm.doc,
				callback: () => {
					this.frm.refresh_fields();
				}
			});
		}
	}
}

frappe.ui.form.on('Customer Feedback', {
    feedback_type: function(frm) {
        if (!frm.doc.feedback_type) return;

        frappe.db.get_doc('Feedback Type', frm.doc.feedback_type)
            .then(function(feedback_type_doc) {
                let feedback_sub_type_mandatory = feedback_type_doc.feedback_sub_type_mandatory || false;
                let feedback_status_mandatory = feedback_type_doc.feedback_status_mandatory || false;

                frm.set_df_property('feedback_sub_type', 'reqd', feedback_sub_type_mandatory);
                frm.set_df_property('feedback_status', 'reqd', feedback_status_mandatory);

                if (feedback_sub_type_mandatory) {
                    frm.set_value('feedback_sub_type', null);
                }
                if (feedback_status_mandatory) {
                    frm.set_value('feedback_status', null);
                }

                frm.set_query('feedback_sub_type', function() {
                    return {
                        filters: {
                            feedback_type: frm.doc.feedback_type
                        }
                    };
                });

                frm.set_query('feedback_status', function() {
                    return {
                        filters: {
                            feedback_type: frm.doc.feedback_type
                        }
                    };
                });
            })
    },

    onload: function(frm) {
        frm.trigger('feedback_type');
    },

    project: function(frm) {
        frm.events.get_project_details(frm);
    },

    get_project_details(frm) {
        if (frm.doc.project) {
            return frappe.call({
                method: 'erpnext.projects.doctype.project.project.get_project_details',
                args: {
                    project: frm.doc.project,
                    doctype: frm.doc.doctype,
                },
                callback: function(r) {
                    if (r.message) {
                        frm.set_value(r.message);
                    }
                }
            });
        }
    },
});


extend_cscript(cur_frm.cscript, new crm.CustomerFeedback({frm: cur_frm}));
