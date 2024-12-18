import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

// Hook to use the CartContext
export const useCart = () => {
    return useContext(CartContext);
};

// CartProvider component to provide cart context to its children
export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]); // State to store cart items

    // Function to add an item to the cart
    const addToCart = (item) => {
        const itemExists = cartItems.some((cartItem) => cartItem.id === item.id);

        if (itemExists) {
            return; // Do not add duplicate items
        }

        setCartItems((prevItems) => [...prevItems, item]); // Add item to cart
    };

    // Function to remove an item from the cart
    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id)); // Remove item from cart
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