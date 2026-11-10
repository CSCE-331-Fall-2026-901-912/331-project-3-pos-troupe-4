import React, { createContext, useContext, useState, useMemo } from 'react';

export const ADDON_PRICE = 0.50;

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState('');

  function addItem(item) {
    setItems((prev) => [...prev, item]);
  }

  function updateItem(index, updatedItem) {
    setItems((prev) => prev.map((item, i) => (i === index ? updatedItem : item)));
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.itemTotal) || 0), 0);
  }, [items]);

  const tax = useMemo(() => {
    return Number((subtotal * 0.0825).toFixed(2));
  }, [subtotal]);

  const total = useMemo(() => {
    return Number((subtotal + tax).toFixed(2));
  }, [subtotal, tax]);

  const value = {
    items,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    customerName,
    setCustomerName,
    subtotal,
    tax,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    return {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      clearCart: () => {},
      customerName: '',
      setCustomerName: () => {},
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  }
  return context;
}

export default CartContext;
