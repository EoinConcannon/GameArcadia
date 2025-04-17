// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// This is needed to mock CSS modules
jest.mock('identity-obj-proxy', () => ({}));

// Mock the CSS imports
jest.mock('../src/App.css', () => ({}), { virtual: true });
jest.mock('../styles/CheckOutPage.css', () => ({}), { virtual: true });
jest.mock('../styles/AuthPages.css', () => ({}), { virtual: true });
jest.mock('../styles/ProfilePage.css', () => ({}), { virtual: true });
jest.mock('../styles/FrontPage.css', () => ({}), { virtual: true });
jest.mock('../styles/StorePage.css', () => ({}), { virtual: true });
jest.mock('bootstrap/dist/css/bootstrap.min.css', () => ({}), { virtual: true });