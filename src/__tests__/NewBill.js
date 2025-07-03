/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js"

describe("Given I am connected as an Employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: window.localStorage })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
    document.body.innerHTML = `<div id="root"></div>`
    router()
    window.onNavigate(ROUTES_PATH.NewBill)
  })

  describe("When I upload a file with an invalid format", () => {
    test("Then the input should be reset and an alert should appear", () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = jest.fn()
      window.alert = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      const fileInput = screen.getByTestId("file")
      const file = new File(["test"], "test.pdf", { type: "application/pdf" })
      fireEvent.change(fileInput, { target: { files: [file] } })
      expect(window.alert).toHaveBeenCalledWith('Veuillez télécharger un fichier au format PNG, JPG ou JPEG.')
      expect(fileInput.value).toBe("")
    })
  })

  describe("When I upload a file with a valid format", () => {
    test("Then the file should be accepted and stored", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      const fileInput = screen.getByTestId("file")
      const file = new File(["test"], "test.png", { type: "image/png" })
      fireEvent.change(fileInput, { target: { files: [file] } })
      await waitFor(() =>
        expect(newBill.fileUrl).not.toBeNull() && expect(newBill.fileName).toBe("test.png")
      )
    })
  })

  describe("When I submit the form with valid data", () => {
    test("Then the bill should be created and I should be redirected to Bills page", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // Remplir le formulaire
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } })
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Taxi" } })
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-01-01" } })
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "42" } })
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "10" } })
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } })
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "test" } })

      // Simuler un fichier valide
      newBill.fileUrl = "https://localhost/test.png"
      newBill.fileName = "test.png"

      // Soumettre le formulaire
      const form = screen.getByTestId("form-new-bill")
      fireEvent.submit(form)

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills)
    })
  })

  describe("When an error occurs on bill creation", () => {
    test("Then it should log the error", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = jest.fn()
      const errorStore = {
        bills: () => ({
          create: () => Promise.reject(new Error("API Error"))
        })
      }
      const newBill = new NewBill({ document, onNavigate, store: errorStore, localStorage: window.localStorage })
      const fileInput = screen.getByTestId("file")
      const file = new File(["test"], "test.png", { type: "image/png" })
      const logSpy = jest.spyOn(console, "error").mockImplementation(() => {})
      fireEvent.change(fileInput, { target: { files: [file] } })
      await waitFor(() => expect(logSpy).toHaveBeenCalled())
      logSpy.mockRestore()
    })
  })
})
