import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  TrendingDown
} from 'lucide-react';

export default function InventoryModal({ isOpen, onClose }) {
  const {
    inventory,
    addOrUpdateStock,
    updateProduct,
    deleteProduct,
    settings
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formError, setFormError] = useState('');

  // New product form fields
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newLowStockThreshold, setNewLowStockThreshold] = useState('5');

  // Inline editing row state
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({
    name: '',
    quantity: 0,
    price: 0,
    costPrice: 0,
    lowStockThreshold: 5
  });

  if (!isOpen) return null;

  const currency = settings.currency || '₹';
  const isHindi = settings.language === 'hi';

  const handleStartEdit = (prod) => {
    setEditingId(prod.id);
    setEditFields({
      name: prod.name,
      quantity: prod.quantity,
      price: prod.price,
      costPrice: prod.costPrice || 0,
      lowStockThreshold: prod.lowStockThreshold || 5
    });
  };

  const handleSaveEdit = (id) => {
    const cost = Number(editFields.costPrice);
    if (isNaN(cost) || cost <= 0) {
      alert(
        isHindi
          ? 'प्रोडक्ट की खरीद लागत (Cost Price) दर्ज करना अनिवार्य है!'
          : 'Cost price of the product is mandatory!'
      );
      return;
    }
    updateProduct(id, {
      name: editFields.name.trim() || 'Product',
      quantity: Math.max(0, Number(editFields.quantity) || 0),
      price: Math.max(0, Number(editFields.price) || 0),
      costPrice: cost,
      lowStockThreshold: Math.max(1, Number(editFields.lowStockThreshold) || 5)
    });
    setEditingId(null);
  };

  const handleQuickAdd = (id, currentQty, amount) => {
    updateProduct(id, {
      quantity: Math.max(0, Number(currentQty) + amount)
    });
  };

  const handleDelete = (id, name) => {
    const confirmMsg = isHindi
      ? `क्या आप सच में "${name}" को इन्वेंटरी से हटाना चाहते हैं?`
      : `Are you sure you want to delete "${name}" from inventory?`;
    if (window.confirm(confirmMsg)) {
      deleteProduct(id);
    }
  };

  const handleAddNewSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!newName.trim()) {
      setFormError(isHindi ? 'प्रोडक्ट का नाम लिखना आवश्यक है!' : 'Product name is required!');
      return;
    }

    const cost = Number(newCostPrice);
    if (!newCostPrice || isNaN(cost) || cost <= 0) {
      setFormError(
        isHindi
          ? 'प्रोडक्ट की खरीद लागत मूल्य (Cost Price) दर्ज करना अनिवार्य है!'
          : 'Cost price of the product is mandatory!'
      );
      return;
    }

    addOrUpdateStock(
      newName.trim(),
      Number(newQty) || 0,
      Number(newPrice) || 0,
      cost
    );

    // Reset form
    setNewName('');
    setNewQty('');
    setNewPrice('');
    setNewCostPrice('');
    setFormError('');
    setIsAddingNew(false);
  };

  // Filtered inventory list
  const filteredProducts = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const isLow = item.quantity <= (item.lowStockThreshold || 5);
    if (filterLowStockOnly) {
      return matchesSearch && isLow;
    }
    return matchesSearch;
  });

  const lowStockCount = inventory.filter((i) => i.quantity <= (i.lowStockThreshold || 5)).length;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="m3-dialog-container inventory-dialog animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-dialog-title"
      >
        {/* Header */}
        <div className="dialog-header">
          <div className="dialog-title-group">
            <div className="flex items-center gap-2">
              <div className="stock-icon-pill">
                <Package size={22} className="text-blue-600" />
              </div>
              <h2 id="inventory-dialog-title" className="dialog-title">
                {isHindi ? 'इन्वेंटरी एवं स्टॉक प्रबंधन' : 'Inventory & Stock Management'}
              </h2>
            </div>
            <p className="dialog-subtitle">
              {isHindi
                ? `स्टॉक देखें, नए प्रोडक्ट्स जोड़ें और इन्वेंटरी सीधे एडिट करें (कुल ${inventory.length} प्रोडक्ट्स)`
                : `View stock, add products, and update inventory counts (${inventory.length} total products)`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dialog-close-btn"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Bar (Search, Filter, Add button) */}
        <div className="inventory-toolbar">
          <div className="inventory-search-box">
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={isHindi ? 'प्रोडक्ट सर्च करें...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inventory-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="inventory-toolbar-actions">
            {lowStockCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`filter-low-stock-btn ${filterLowStockOnly ? 'active' : ''}`}
                title={isHindi ? 'केवल कम स्टॉक वाले दिखाएं' : 'Show only low stock items'}
              >
                <AlertTriangle size={14} />
                <span>
                  {isHindi ? `कम स्टॉक (${lowStockCount})` : `Low Stock (${lowStockCount})`}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="m3-button-filled add-prod-btn"
            >
              <Plus size={16} />
              <span>{isHindi ? 'नया प्रोडक्ट जोड़ें' : 'Add Product'}</span>
            </button>
          </div>
        </div>

        {/* Dialog Body */}
        <div className="dialog-body custom-scrollbar inventory-body">
          {/* Collapsible Add New Product Form */}
          {isAddingNew && (
            <form onSubmit={handleAddNewSubmit} className="add-product-form animate-slide-up">
              <div className="form-header-bar">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-blue-500" />
                  {isHindi ? 'नया प्रोडक्ट इन्वेंटरी में जोड़ें' : 'Add New Inventory Item'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setFormError('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              </div>

              {formError && (
                <div className="form-error-alert mb-3 animate-slide-up" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.8rem', fontWeight: 600 }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, color: '#dc2626' }} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">{isHindi ? 'प्रोडक्ट का नाम *' : 'Product Name *'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isHindi ? 'जैसे Polo T-Shirt' : 'e.g. Polo T-Shirt'}
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="m3-text-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{isHindi ? 'शुरुआती स्टॉक (मात्रा)' : 'Initial Stock Qty'}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="m3-text-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{isHindi ? 'सेलिंग प्राइस (प्रति पीस)' : 'Selling Price / Unit'}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="500"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="m3-text-field"
                  />
                </div>
              </div>

              <div className="form-grid-2 mt-2">
                <div className="form-group">
                  <label className="form-label" style={{ color: '#b91c1c', fontWeight: 700 }}>
                    {isHindi ? 'खरीद लागत मूल्य (Cost Price) * (अनिवार्य)' : 'Cost Price / Unit * (Mandatory)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder={isHindi ? 'लागत दर्ज करें (जैसे: 350)' : 'e.g. 350'}
                    value={newCostPrice}
                    onChange={(e) => {
                      setNewCostPrice(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="m3-text-field"
                    style={{ borderColor: !newCostPrice ? '#fca5a5' : undefined }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{isHindi ? 'कम स्टॉक चेतावनी थ्रेशोल्ड' : 'Low Stock Alert Threshold'}</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={newLowStockThreshold}
                    onChange={(e) => setNewLowStockThreshold(e.target.value)}
                    className="m3-text-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="m3-button-tonal text-xs py-2 px-3"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="m3-button-filled text-xs py-2 px-4"
                >
                  <Plus size={15} />
                  <span>{isHindi ? 'इन्वेंटरी में सेव करें' : 'Save to Inventory'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Products Table */}
          <div className="inventory-table-container">
            <table className="material-table stock-table">
              <thead>
                <tr>
                  <th>{isHindi ? 'प्रोडक्ट' : 'Product'}</th>
                  <th className="text-center">{isHindi ? 'उपलब्ध स्टॉक' : 'Stock Qty'}</th>
                  <th className="text-right">{isHindi ? 'सेलिंग प्राइस' : 'Selling Price'}</th>
                  <th className="text-right">{isHindi ? 'लागत (Cost)' : 'Cost Price'}</th>
                  <th className="text-center">{isHindi ? 'स्थिति' : 'Status'}</th>
                  <th className="text-right">{isHindi ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">
                      <Package size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold">
                        {isHindi ? 'कोई प्रोडक्ट नहीं मिला' : 'No products found'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {isHindi
                          ? 'नया प्रोडक्ट जोड़ने के लिए ऊपर दिए गए बटन का उपयोग करें।'
                          : 'Click "Add Product" above to create an inventory item.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const isEditing = editingId === prod.id;
                    const isLow = prod.quantity <= (prod.lowStockThreshold || 5);
                    const isOut = prod.quantity === 0;

                    return (
                      <tr key={prod.id} className={isLow ? 'low-stock-row' : ''}>
                        {/* Product Name */}
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFields.name}
                              onChange={(e) =>
                                setEditFields({ ...editFields, name: e.target.value })
                              }
                              className="inline-edit-input w-full"
                            />
                          ) : (
                            <div className="prod-name-box">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {prod.name}
                              </span>
                              <span className="text-xs text-slate-400">
                                ID: {prod.id} • {prod.updatedAt || 'Recently updated'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Stock Qty */}
                        <td className="text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editFields.quantity}
                              onChange={(e) =>
                                setEditFields({ ...editFields, quantity: e.target.value })
                              }
                              className="inline-edit-input w-16 text-center"
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="stock-qty-number">{prod.quantity}</span>
                              <span className="text-xs text-slate-400">pcs</span>
                            </div>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="text-right">
                          {isEditing ? (
                            <div className="edit-price-inline justify-end">
                              <span className="text-xs">{currency}</span>
                              <input
                                type="number"
                                min="0"
                                value={editFields.price}
                                onChange={(e) =>
                                  setEditFields({ ...editFields, price: e.target.value })
                                }
                                className="inline-edit-input w-20 text-right"
                              />
                            </div>
                          ) : (
                            <span className="font-semibold">
                              {currency}{prod.price}
                            </span>
                          )}
                        </td>

                        {/* Cost Price */}
                        <td className="text-right">
                          {isEditing ? (
                            <div className="edit-price-inline justify-end">
                              <span className="text-xs">{currency}</span>
                              <input
                                type="number"
                                required
                                min="0.01"
                                step="any"
                                value={editFields.costPrice}
                                onChange={(e) =>
                                  setEditFields({ ...editFields, costPrice: e.target.value })
                                }
                                placeholder="Cost *"
                                className="inline-edit-input w-20 text-right"
                                style={{ borderColor: (!editFields.costPrice || Number(editFields.costPrice) <= 0) ? '#fca5a5' : undefined }}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {prod.costPrice > 0 ? `${currency}${prod.costPrice}` : '—'}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="text-center">
                          {isOut ? (
                            <span className="stock-badge out-of-stock">
                              {isHindi ? 'स्टॉक खत्म' : 'Out of Stock'}
                            </span>
                          ) : isLow ? (
                            <span className="stock-badge low-stock">
                              {isHindi ? 'कम स्टॉक' : 'Low Stock'}
                            </span>
                          ) : (
                            <span className="stock-badge in-stock">
                              {isHindi ? 'उपलब्ध' : 'In Stock'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="text-right">
                          {isEditing ? (
                            <div className="inline-action-btns justify-end">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(prod.id)}
                                className="action-btn-save"
                                title="Save"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="action-btn-cancel"
                                title="Cancel"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-action-btns justify-end">
                              {/* Quick restock pills */}
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(prod.id, prod.quantity, 5)}
                                className="quick-pill-add"
                                title="Add +5 units"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(prod.id, prod.quantity, 10)}
                                className="quick-pill-add"
                                title="Add +10 units"
                              >
                                +10
                              </button>
                              {/* Edit icon */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(prod)}
                                className="stock-edit-icon-btn"
                                title={isHindi ? 'एडिट करें' : 'Edit item'}
                              >
                                <Edit3 size={15} />
                              </button>
                              {/* Delete icon */}
                              <button
                                type="button"
                                onClick={() => handleDelete(prod.id, prod.name)}
                                className="stock-delete-icon-btn"
                                title={isHindi ? 'हटाएं' : 'Delete item'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="dialog-footer">
          <span className="text-xs text-slate-500 mr-auto">
            {isHindi
              ? 'टिप: +5 या +10 दबाकर तुरंत स्टॉक बढ़ाएं, या पेंसिल पर क्लिक करके रेट बदलें।'
              : 'Tip: Tap +5 or +10 to restock instantly, or pencil icon to change prices.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="m3-button-filled"
          >
            <span>{isHindi ? 'पूर्ण (Close)' : 'Done'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
