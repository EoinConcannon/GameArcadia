import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

//hook to use the CartContext
export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (item) => {
        const itemExists = cartItems.some((cartItem) => cartItem.id === item.id);

        if (itemExists) {
            return; //do not add duplicate items, most other gaming sites do this
        }

        setCartItems((prevItems) => [...prevItems, item]);
    };

    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart }}>
            {children}
        </CartContext.Provider>
    );
};