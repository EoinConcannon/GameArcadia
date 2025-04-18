import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const CartContext = createContext();

// Hook to use the CartContext
export const useCart = () => {
    return useContext(CartContext);
};

// CartProvider component to provide cart context to its children
export const CartProvider = ({ children, loggedInUser }) => {
    const [cartItems, setCartItems] = useState([]); // State to store cart items
    const navigate = useNavigate();

    // Function to add an item to the cart
    const addToCart = (item) => {
        // Redirect to login if logged out
        if (!loggedInUser) {
            navigate('/login');
            return;
        }

        const itemExists = cartItems.some((cartItem) => cartItem.game_id === item.game_id);

        if (itemExists) {
            return; // Do not add duplicate items
        }

        setCartItems((prevItems) => [...prevItems, item]); // Add item to cart
        alert(`${item.name} has been added to your cart`); // Display alert message
    };

    // Function to remove an item from the cart
    const removeFromCart = (game_id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.game_id !== game_id)); // Remove item from cart
    };

    // Function to clear all items from the cart
    const clearCart = () => {
        setCartItems([]); // Clear the cart
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};