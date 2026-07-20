const menuItems = [
  { name: 'Masala Dosa', price: 10.5, description: 'Crispy dosa with spiced potato filling.', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80' },
  { name: 'Chicken Briyani', price: 14.0, description: 'Fragrant rice with tender chicken and spices.', image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=800&q=80' },
  { name: 'Vegetable Pizza', price: 12.0, description: 'Loaded with fresh vegetables and melted cheese.', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cheese Burger', price: 13.5, description: 'Juicy burger with melted cheddar and fries.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { name: 'Idli Sambar', price: 8.5, description: 'Soft steamed rice cakes with lentil curry.', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80' },
  { name: 'Chicken Shawarma Wrap', price: 11.0, description: 'Spiced chicken wrap with crunchy salad.', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80' }
];

const storageKey = 'harbor-bistro-orders';
let orders = JSON.parse(localStorage.getItem(storageKey) || '[]');

const dishSelect = document.getElementById('dish');
const menuGrid = document.getElementById('menu-grid');
const orderForm = document.getElementById('order-form');
const ordersList = document.getElementById('orders-list');
const menuPopupBtn = document.getElementById('menu-popup-btn');
const menuModal = document.getElementById('menu-modal');
const menuModalClose = document.getElementById('menu-modal-close');
const menuModalList = document.getElementById('menu-modal-list');
const qrLabelInput = document.getElementById('qr-label');
const qrLinkInput = document.getElementById('qr-link');
const qrImage = document.getElementById('qr-image');
const orderCountEl = document.getElementById('order-count');
const customerCountEl = document.getElementById('customer-count');
const activeCustomerCountEl = document.getElementById('active-customer-count');
const statusMessageEl = document.getElementById('status-message');

function renderMenu() {
  menuGrid.innerHTML = '';
  menuModalList.innerHTML = '';
  menuItems.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'menu-card';
    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <div class="price">₹${item.price.toFixed(2)}</div>
    `;
    menuGrid.appendChild(card);

    const modalItem = document.createElement('li');
    modalItem.innerHTML = `<span>${item.name}</span><strong>₹${item.price.toFixed(2)}</strong>`;
    menuModalList.appendChild(modalItem);
  });

  dishSelect.innerHTML = menuItems
    .map((item) => `<option value="${item.name}">${item.name}</option>`)
    .join('');
}

function renderOrders() {
  if (!orders.length) {
    ordersList.innerHTML = '<p>No orders yet. Your latest customer orders will appear here.</p>';
    orderCountEl.textContent = '0';
    customerCountEl.textContent = '0';
    activeCustomerCountEl.textContent = '1';
    statusMessageEl.textContent = 'Ready to take the next order.';
    return;
  }

  const uniqueCustomers = new Set(orders.map((order) => order.customerName.toLowerCase()));
  orderCountEl.textContent = orders.length;
  customerCountEl.textContent = uniqueCustomers.size;
  activeCustomerCountEl.textContent = Math.max(1, uniqueCustomers.size + 2);
  statusMessageEl.textContent = `${orders.length} active orders tracked.`;

  ordersList.innerHTML = orders
    .map(
      (order) => `
        <div class="order-item">
          <div>
            <strong>${order.customerName}</strong>
            <div>${order.dish} × ${order.quantity}</div>
            <div>${order.address}</div>
            <small>${order.notes || 'No special instructions'}</small>
          </div>
          <button data-id="${order.id}">Remove</button>
        </div>
      `
    )
    .join('');
}

orderForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const order = {
    id: Date.now().toString(),
    customerName: document.getElementById('customerName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    dish: dishSelect.value,
    quantity: Number(document.getElementById('quantity').value),
    notes: document.getElementById('notes').value.trim()
  };

  orders.unshift(order);
  localStorage.setItem(storageKey, JSON.stringify(orders));
  orderForm.reset();
  document.getElementById('quantity').value = '1';
  renderOrders();
});

ordersList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;

  const id = button.getAttribute('data-id');
  orders = orders.filter((order) => order.id !== id);
  localStorage.setItem(storageKey, JSON.stringify(orders));
  renderOrders();
});

menuPopupBtn.addEventListener('click', () => {
  menuModal.classList.add('open');
  menuModal.setAttribute('aria-hidden', 'false');
});

menuModalClose.addEventListener('click', closeModal);
menuModal.addEventListener('click', (event) => {
  if (event.target === menuModal) {
    closeModal();
  }
});

function closeModal() {
  menuModal.classList.remove('open');
  menuModal.setAttribute('aria-hidden', 'true');
}

function updateQrCode() {
  const label = qrLabelInput.value.trim() || 'Scan for location';
  const link = qrLinkInput.value.trim() || 'https://www.google.com/maps';
  document.querySelector('.qr-box p strong').textContent = label;
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(link)}`;
  qrImage.alt = `QR code for ${label}`;
}

qrLabelInput.addEventListener('input', updateQrCode);
qrLinkInput.addEventListener('input', updateQrCode);

renderMenu();
renderOrders();
updateQrCode();
