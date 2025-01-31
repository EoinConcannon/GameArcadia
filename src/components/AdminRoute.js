import React from 'react';

const AdminRoute = ({ loggedInUser, children }) => {
    if (loggedInUser?.role !== 'admin') {
        return <div>You are not authorized to view this page.</div>;
    }
    return children;
};

export default AdminRoute;