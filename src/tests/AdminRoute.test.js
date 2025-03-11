import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AdminRoute from '../components/AdminRoute';

describe('AdminRoute', () => {
    test('renders children when user is an admin', () => {
        render(
            <AdminRoute loggedInUser={{ role: 'admin' }}>
                <div>Admin Content</div>
            </AdminRoute>
        );

        expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    test('renders unauthorized message when user is not an admin', () => {
        render(
            <AdminRoute loggedInUser={{ role: 'user' }}>
                <div>Admin Content</div>
            </AdminRoute>
        );

        expect(screen.getByText('You are not authorized to view this page.')).toBeInTheDocument();
    });

    test('renders unauthorized message when user is not logged in', () => {
        render(
            <AdminRoute loggedInUser={null}>
                <div>Admin Content</div>
            </AdminRoute>
        );

        expect(screen.getByText('You are not authorized to view this page.')).toBeInTheDocument();
    });
});