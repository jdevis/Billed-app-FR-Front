import { ROUTES_PATH } from '../constants/routes.js';
import { formatDate, formatStatus } from '../app/format.js';
import Logout from './Logout.js';

export default class {
	constructor({ document, onNavigate, store, localStorage }) {
		this.document = document;
		this.onNavigate = onNavigate;
		this.store = store;
		const buttonNewBill = document.querySelector(
			`button[data-testid="btn-new-bill"]`
		);
		if (buttonNewBill)
			buttonNewBill.addEventListener('click', this.handleClickNewBill);
		const iconEye = document.querySelectorAll(
			`div[data-testid="icon-eye"]`
		);
		if (iconEye)
			iconEye.forEach((icon) => {
				icon.addEventListener('click', () =>
					this.handleClickIconEye(icon)
				);
			});
		new Logout({ document, localStorage, onNavigate });
	}

	handleClickNewBill = () => {
		this.onNavigate(ROUTES_PATH['NewBill']);
	};

	handleClickIconEye = (icon) => {
		const billUrl = icon.getAttribute('data-bill-url');
		const imgWidth = Math.floor($('#modaleFile').width() * 0.5);
		$('#modaleFile')
			.find('.modal-body')
			.html(
				`<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
			);
		$('#modaleFile').modal('show');
	};

	getBills = () => {
		if (this.store) {
			return this.store
				.bills()
				.list()
				.then((snapshot) => { 
					// snapshot is an array of bills, we sort them by date descending
					snapshot.sort((a, b) => {
						return new Date(b.date) - new Date(a.date);	
					});
					const bills = snapshot.map((doc) => {
						try {
							return {
								...doc,
								date: formatDate(doc.date),
								status: formatStatus(doc.status),
							};
						} catch (e) {
							console.error(e, 'for', doc);
							return {
								...doc,
								date: doc.date,
								status: formatStatus(doc.status),
							};
						}
					})
					return bills;
				});
		}
	};
}
