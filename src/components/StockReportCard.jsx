import React, { useState } from 'react';
import { Package, AlertTriangle, CheckCircle, Edit3, Check, X, Plus, PlusCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function StockReportCard({ filteredProduct = '', onClose, onAddStockClick }) {
  const { inventory, updateProduct, settings } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(0);
  const [editPrice, setEditPrice] = useState(0);

  const currency = settings.currency || '₹';
  const isHindi = settings.language === 'hi';

  // Filter products if a specific product was queried
  const displayProducts = filteredProduct
    ? inventory.filter((item) =>
        item.name.toLowerCase().includes(filteredProduct.toLowerCase())
      )
    : inventory;

  const handleStartEdit = (product) => {
    setEditingId(product.id);
    setEditQty(product.quantity);
    setEditPrice(product.price);
  };

  const handleSaveEdit = (id) => {
    updateProduct(id, {
      quantity: Math.max(0, Number(editQty) || 0),
      price: Math.max(0, Number(editPrice) || 0)
    });
    setEditingId(null);
  };

  const handleQuickAdd = (id, currentQty, amount) => {
    updateProduct(id, {
      quantity: Math.max(0, Number(currentQty) + amount)
    });
  };

  const lowStockItems = inventory.filter((i) => i.quantity <= (i.lowStockThreshold || 5));

  return (
    <div className="stock-report-card animate-slide-up">
      {/* Top Banner Header */}
      <div className="stock-card-header">
        <div className="stock-header-title-group">
          <div className="stock-icon-pill">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="stock-card-title">
              {filteredProduct
                ? (isHindi ? `"${filteredProduct}" का स्टॉक स्टेटस` : `Stock for "${filteredProduct}"`)
                : (isHindi ? 'लाइव स्टॉक एवं इन्वेंटरी रिपोर्ट' : 'Live Stock & Inventory Report')}
            </h3>
            <span className="stock-card-subtitle">
              {isHindi
                ? `कुल ${inventory.length} प्रोडक्ट्स स्टोर में उपलब्ध हैं`
                : `${inventory.length} total products in inventory`}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="stock-close-btn"
            title="Dismiss report"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Low stock alert banner if any item is running out */}
      {lowStockItems.length > 0 && !filteredProduct && (
        <div className="low-stock-alert-banner">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <span>
            {isHindi
              ? `चेतावनी: ${lowStockItems.length} प्रोडक्ट का स्टॉक कम है (${lowStockItems.map((i) => i.name).join(', ')})!`
              : `Warning: ${lowStockItems.length} product(s) are low on stock (${lowStockItems.map((i) => i.name).join(', ')})!`}
          </span>
        </div>
      )}

      {/* Products Stock List */}
      <div className="stock-items-table-wrapper">
        <table className="material-table stock-table">
          <thead>
            <tr>
              <th>{isHindi ? 'प्रोडक्ट' : 'Product'}</th>
              <th className="text-center">{isHindi ? 'उपलब्ध स्टॉक' : 'Stock Qty'}</th>
              <th className="text-right">{isHindi ? 'सेलिंग प्राइस' : 'Selling Price'}</th>
              <th className="text-center">{isHindi ? 'स्थिति' : 'Status'}</th>
              <th className="text-right">{isHindi ? 'क्विक एक्शन' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {displayProducts.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-slate-500">
                  {isHindi ? 'कोई प्रोडक्ट नहीं मिला' : 'No matching products found in stock.'}
                </td>
              </tr>
            ) : (
              displayProducts.map((prod) => {
                const isEditing = editingId === prod.id;
                const isLow = prod.quantity <= (prod.lowStockThreshold || 5);
                const isOut = prod.quantity === 0;

                return (
                  <tr key={prod.id} className={isLow ? 'low-stock-row' : ''}>
                    <td>
                      <div className="prod-name-box">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{prod.name}</span>
                        {prod.costPrice > 0 && (
                          <span className="text-xs text-slate-400">
                            {isHindi ? 'लागत: ' : 'Cost: '}{currency}{prod.costPrice}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock Quantity Column (or Edit Input) */}
                    <td className="text-center">
                      {isEditing ? (
                        <div className="edit-qty-inline">
                          <input
                            type="number"
                            min="0"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="inline-edit-input w-16 text-center"
                          />
                        </div>
                      ) : (
                        <span className="stock-qty-number">{prod.quantity}</span>
                      )}
                    </td>

                    {/* Price Column */}
                    <td className="text-right">
                      {isEditing ? (
                        <div className="edit-price-inline justify-end">
                          <span className="text-xs">{currency}</span>
                          <input
                            type="number"
                            min="0"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="inline-edit-input w-20 text-right"
                          />
                        </div>
                      ) : (
                        <span className="font-semibold">{currency} {prod.price}</span>
                      )}
                    </td>

                    {/* Status Badge */}
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

                    {/* Actions Column */}
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
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(prod.id, prod.quantity, 5)}
                            className="quick-pill-add"
                            title="Add +5 units immediately"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(prod.id, prod.quantity, 10)}
                            className="quick-pill-add"
                            title="Add +10 units immediately"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(prod)}
                            className="stock-edit-icon-btn"
                            title="Edit stock or price"
                          >
                            <Edit3 size={15} />
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

      {/* Footer Quick Controls */}
      <div className="stock-card-footer">
        {onAddStockClick && (
          <button
            type="button"
            onClick={onAddStockClick}
            className="m3-button-tonal text-xs py-2 px-3"
          >
            <Plus size={15} />
            <span>{isHindi ? 'स्टॉक में नया प्रोडक्ट जोड़ें' : 'Add Stock via Voice/Text'}</span>
          </button>
        )}

        <span className="text-xs text-slate-400 ml-auto">
          {isHindi ? 'टिप: पेंसिल आइकन पर क्लिक करके स्टॉक सीधे एडिट करें' : 'Tip: Click pencil icon to edit stock'}
        </span>
      </div>
    </div>
  );
}
