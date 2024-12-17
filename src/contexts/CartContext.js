import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

// Hook to use the CartContext
export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (item) => {
        const itemExists = cartItems.some((cartItem) => cartItem.id === item.id);

        if (itemExists) {
            return; // Do not add duplicate items
        }

        setCartItems((prevItems) => [...prevItems, item]);
    };

    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};