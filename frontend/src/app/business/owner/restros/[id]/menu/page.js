"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Plus, Search, Filter, Edit, Trash2, DollarSign, X, Loader2, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useRestaurantStore from "@/store/useRestaurantStore";

export default function MenuPage() {
    const params = useParams();
    const restaurantId = params.id;

    // Get restaurant data and menu functions
    const { restaurants, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } = useRestaurantStore();
    const currentRestaurant = useMemo(() =>
        restaurants.find(r => r._id === restaurantId),
        [restaurants, restaurantId]
    );

    // Get menu from restaurant object (already fetched by layout)
    const menuItems = currentRestaurant?.menu || [];


    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        isVeg: true,
        isAvailable: true,
        preparationTime: "15",
        image: ""
    });
    const [formLoading, setFormLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Get unique categories from menu items
    const categories = ["all", ...new Set(menuItems.map(item => item.category).filter(Boolean))];

    // Filter menu items
    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Open modal for adding new item
    const handleAddNew = () => {
        setEditingItem(null);
        setFormData({
            name: "",
            description: "",
            price: "",
            category: "",
            isVeg: true,
            isAvailable: true,
            preparationTime: "15",
            image: "",
            stock: ""
        });
        setIsModalOpen(true);
    };

    // Open modal for editing item
    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || "",
            price: item.price.toString(),
            category: item.category || "",
            isVeg: item.isVeg !== undefined ? item.isVeg : true,
            isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
            preparationTime: item.preparationTime?.toString() || "15",
            image: item.image || "",
            stock: item.stock !== undefined && item.stock !== null ? item.stock.toString() : ""
        });
        setIsModalOpen(true);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setErrorMessage("");

        try {
            const itemData = {
                ...formData,
                price: parseFloat(formData.price),
                preparationTime: parseInt(formData.preparationTime),
                stock: formData.stock === "" ? null : parseInt(formData.stock)
            };

            if (editingItem) {
                await updateMenuItem(restaurantId, editingItem._id, itemData);
                showSuccess("Menu item updated successfully!");
            } else {
                await addMenuItem(restaurantId, itemData);
                showSuccess("Menu item added successfully!");
            }

            setIsModalOpen(false);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to save menu item");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (itemId) => {
        if (!confirm("Are you sure you want to delete this menu item?")) return;

        try {
            await deleteMenuItem(restaurantId, itemId);
            showSuccess("Menu item deleted successfully!");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to delete menu item");
        }
    };

    // Handle toggle availability
    const handleToggleAvailability = async (itemId) => {
        try {
            await toggleMenuItemAvailability(restaurantId, itemId);
        } catch (error) {
            setErrorMessage(error.message || "Failed to toggle availability");
        }
    };

    // Show success message
    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    return (
        <div className="space-y-6">
            {/* Success Message */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-center gap-2"
                    >
                        <Check size={18} />
                        {successMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-2"
                    >
                        <AlertCircle size={18} />
                        {errorMessage}
                        <button onClick={() => setErrorMessage("")} className="ml-auto">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Menu Management</h2>
                    <p className="text-muted-foreground text-sm">Add, edit, and organize restaurant menu items.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="bg-sunset hover:bg-sunset/90 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} />
                    Add Item
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunset"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-muted-foreground" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-sunset"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === "all" ? "All Categories" : cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Menu Items List */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
                    <p className="text-muted-foreground">
                        {menuItems.length === 0 ? "No menu items yet. Add your first item!" : "No menu items found."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredItems.map((item) => (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex items-center p-3 gap-4"
                        >
                            {/* Image Placeholder */}
                            <div className="h-16 w-16 bg-secondary flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-muted-foreground text-[10px]">No Img</span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-3.5 h-3.5 border flex items-center justify-center rounded-[3px] ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                        </div>
                                        <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground whitespace-nowrap">
                                        {item.category || "Uncategorized"}
                                    </span>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-1 truncate">{item.description}</p>
                                {/* Stock Display */}
                                <div className="mt-1">
                                    {item.stock !== null && item.stock !== undefined ? (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.stock > 10 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                                            Stock: {item.stock}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">Unlimited</span>
                                    )}
                                </div>
                            </div>

                            {/* Actions & Price */}
                            <div className="flex items-center gap-6">
                                <div className="text-sm font-bold text-foreground">₹{item.price}</div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleAvailability(item._id)}
                                        className={`w-8 h-5 rounded-full relative transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${item.isAvailable ? 'translate-x-3' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-foreground">
                                        {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                                    </h3>
                                    <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Item Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sunset"
                                                placeholder="e.g., Margherita Pizza"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Price (₹) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sunset"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sunset"
                                            placeholder="Brief description of the item..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                                            <input
                                                type="text"
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sunset"
                                                placeholder="e.g., Main Course, Appetizers"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">Preparation Time (min)</label>
                                            <input
                                                type="number"
                                                name="preparationTime"
                                                value={formData.preparationTime}
                                                onChange={handleInputChange}
                                                min="1"
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sunset"
                                                placeholder="15"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Image URL (optional)</label>
                                        <input
                                            type="url"
                                            name="image"
                                            value={formData.image}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sunset"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>

                                    <div className="flex gap-6">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Daily Stock <span className="text-xs text-muted-foreground font-normal">(Leave empty for unlimited)</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="stock"
                                                value={formData.stock}
                                                onChange={handleInputChange}
                                                min="0"
                                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sunset"
                                                placeholder="Unlimited"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isVeg"
                                                checked={formData.isVeg}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-sunset focus:ring-sunset"
                                            />
                                            <span className="text-sm text-foreground">Vegetarian</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isAvailable"
                                                checked={formData.isAvailable}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-sunset focus:ring-sunset"
                                            />
                                            <span className="text-sm text-foreground">Available</span>
                                        </label>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={formLoading}
                                            className="flex-1 px-4 py-2 bg-sunset hover:bg-sunset/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {formLoading && <Loader2 className="animate-spin" size={18} />}
                                            {editingItem ? "Update Item" : "Add Item"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
