import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AboutPage from '../components/AboutPage';

describe('AboutPage', () => {
    test('renders the about page content', () => {
        render(<AboutPage />);

        expect(screen.getByText('This is the about page')).toBeInTheDocument();
    });
});