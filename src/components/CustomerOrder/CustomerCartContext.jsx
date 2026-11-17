import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export const CUSTOMER_ADDON_PRICE = 0.50;

const CustomerCartContext = createContext(null);

export function CustomerCartProvider({ children }) {
  const [items, setItems] = useState([]);
  
  // Customer Profile stored in localStorage
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('customer_account_profile');
      return saved ? JSON.parse(saved) : { name: '', phone: '', email: '', favorites: [], recentOrders: [] };
    } catch {
      return { name: '', phone: '', email: '', favorites: [], recentOrders: [] };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('customer_account_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save customer profile to localStorage', e);
    }
  }, [profile]);

  function updateProfile(updatedFields) {
    setProfile((prev) => ({
      ...prev,
      ...updatedFields
    }));
  }

  function toggleFavorite(drinkName) {
    setProfile((prev) => {
      const exists = prev.favorites?.includes(drinkName);
      const nextFavs = exists
        ? prev.favorites.filter((f) => f !== drinkName)
        : [...(prev.favorites || []), drinkName];
      return { ...prev, favorites: nextFavs };
    });
  }

  function addRecentOrder(orderRecord) {
    setProfile((prev) => {
      const existing = prev.recentOrders || [];
      const updated = [orderRecord, ...existing.filter((o) => o.orderId !== orderRecord.orderId)].slice(0, 10);
      return { ...prev, recentOrders: updated };
    });
  }

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

  function reorder(pastItems) {
    if (!Array.isArray(pastItems)) return;
    setItems((prev) => [...prev, ...pastItems]);
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

  const totalItemCount = useMemo(() => {
    return items.length;
  }, [items]);

  const value = {
    items,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    reorder,
    subtotal,
    tax,
    total,
    totalItemCount,
    profile,
    updateProfile,
    toggleFavorite,
    addRecentOrder,
  };

  return (
    <CustomerCartContext.Provider value={value}>
      {children}
    </CustomerCartContext.Provider>
  );
}

export function useCustomerCart() {
  const ctx = useContext(CustomerCartContext);
  if (!ctx) {
    throw new Error('useCustomerCart must be used within a CustomerCartProvider');
  }
  return ctx;
}
