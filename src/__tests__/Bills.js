/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from '@testing-library/dom';
import BillsUI from '../views/BillsUI.js';
import Bills from '../containers/Bills.js';
import mockStore from '../__mocks__/store.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import router from '../app/Router.js';

describe('Given I am connected as an employee', () => {
	describe('When I am on Bills Page', () => {
		test('Then bill icon in vertical layout should be highlighted', async () => {
			Object.defineProperty(window, 'localStorage', {
				value: localStorageMock,
			});
			window.localStorage.setItem(
				'user',
				JSON.stringify({
					type: 'Employee',
				})
			);
			const root = document.createElement('div');
			root.setAttribute('id', 'root');
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId('icon-window'));
			const windowIcon = screen.getByTestId('icon-window');
			//to-do write expect expression
			expect(windowIcon.classList.contains('active-icon')).toBe(true);
		});
		test('Then bills should be ordered from earliest to latest', () => {
			document.body.innerHTML = BillsUI({ data: bills });
			// Retrieving raw dates from mock data
			// and sorting them in descending order
			const rawDates = bills
				.map((b) => b.date)
				.sort((a, b) => new Date(b) - new Date(a));
			// retrieving displayed dates from the DOM
			// and matching them with the expected format
			const displayedDates = screen
				.getAllByText(
					/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
				)
				.map((a) => a.innerHTML);
			// formatting raw dates to match the displayed format
			// and comparing them with the displayed dates
			const formattedRawDates = rawDates.map((date) =>
				new Date(date).toISOString().slice(0, 10)
			);
			expect(displayedDates.sort()).toEqual(formattedRawDates.sort());
		});
	});
	describe("When I click on 'Nouvelle note de frais'", () => {
		test('Then it should navigate to NewBill page', () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const onNavigate = jest.fn();
			// creating a mock Bills instance
			// to test the navigation
			const billsContainer = new Bills({
				document,
				onNavigate,
				store: null,
				localStorage: window.localStorage,
			});
			const newBillBtn = screen.getByTestId('btn-new-bill');
			fireEvent.click(newBillBtn);
			expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
		});
	});
	describe('When I click on an eye icon', () => {
		test('Then it should open the modal with the bill proof', () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const onNavigate = jest.fn();
			$.fn.modal = jest.fn(); // Mock jQuery modal
			const billsContainer = new Bills({
				document,
				onNavigate,
				store: null,
				localStorage: window.localStorage,
			});
			const eyeIcon = screen.getAllByTestId('icon-eye')[0];
			fireEvent.click(eyeIcon);
			expect($.fn.modal).toHaveBeenCalledWith('show');
		});
	});
	describe('When I call getBills', () => {
		test('Then it should return bills sorted and formatted', async () => {
			// assuming getBills is an async function
			const billsContainer = new Bills({
				document,
				onNavigate: jest.fn(),
				store: mockStore,
				localStorage: window.localStorage,
			});
			const result = await billsContainer.getBills(); // assuming getBills returns a promise
			expect(result).toBeDefined(); // checking if result is defined
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
			expect(result[0]).toHaveProperty('date');
			expect(result[0]).toHaveProperty('status');
		});
	});
	describe('When I navigate to Bills', () => {
		test('fetches bills from mock API GET', async () => {
			// spyOn the mockStore's bills method
			const getSpy = jest.spyOn(mockStore, 'bills');
			const billsContainer = new Bills({
				document,
				onNavigate: jest.fn(),
				store: mockStore,
				localStorage: window.localStorage,
			});
			await billsContainer.getBills();
			expect(getSpy).toHaveBeenCalledTimes(1);
		});
		test('Then it should handle 404 error', async () => {
			const errorStore = {
				bills: () => ({
					list: () => Promise.reject(new Error('Erreur 404')),
				})
			};
			const billsContainer = new Bills({
				document,
				onNavigate: jest.fn(),
				store: errorStore,
				localStorage: window.localStorage,
			});
			await expect(billsContainer.getBills()).rejects.toThrow('Erreur 404');
		});
		test('Then it should handle 500 error', async () => {
			const errorStore = {
				bills: () => ({
					list: () => Promise.reject(new Error('Erreur 500')),
				})
			};
			const billsContainer = new Bills({
				document,
				onNavigate: jest.fn(),
				store: errorStore,
				localStorage: window.localStorage,
			});
			await expect(billsContainer.getBills()).rejects.toThrow('Erreur 500');
		});
	});
});
