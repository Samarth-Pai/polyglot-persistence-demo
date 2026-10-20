// Polyglot Persistence Interactive Frontend Showcase

let redisTtlTimer = null;
let currentActiveDriver = 'driver-88';

// Menu Presets demonstrating MongoDB's flexible mixed document capabilities
const MENU_PRESETS = {
  pizza: {
    restaurantName: 'Bella Napoli Pizzeria',
    itemName: 'Artisan Truffle Pizza',
    basePrice: 18.99,
    category: 'Pizza',
    description: 'Black truffle cream, wild mushrooms, fior di latte mozzarella.',
    customizations: [
      {
        name: 'Crust Type',
        type: 'single_choice',
        required: true,
        options: [
          { label: 'Classic Thin Crust', priceModifier: 0.00 },
          { label: 'Cheese-Stuffed Crust', priceModifier: 3.50 },
          { label: 'Gluten-Free Cauliflower', priceModifier: 2.75 }
        ]
      },
      {
        name: 'Size',
        type: 'single_choice',
        options: [
          { label: 'Personal (10")', priceModifier: 0.00 },
          { label: 'Large (14")', priceModifier: 5.00 },
          { label: 'Family (18")', priceModifier: 9.50 }
        ]
      },
      {
        name: 'Extra Gourmet Toppings',
        type: 'multi_choice',
        options: [
          { label: 'Prosciutto di Parma', priceModifier: 3.00 },
          { label: 'Hot Honey Drizzle', priceModifier: 1.00 },
          { label: 'Kalamata Olives', priceModifier: 1.25 }
        ]
      }
    ]
  },
  burger: {
    restaurantName: 'Gridiron Gourmet Burgers',
    itemName: 'Double Wagyu Smash Burger',
    basePrice: 14.50,
    category: 'Burgers',
    description: 'Two 4oz American Wagyu patties, smoked cheddar, caramelized shallots.',
    customizations: [
      {
        name: 'Bun Option',
        type: 'single_choice',
        options: [
          { label: 'Toasted Brioche', priceModifier: 0.00 },
          { label: 'Pretzel Bun', priceModifier: 1.50 },
          { label: 'Lettuce Wrap (Keto)', priceModifier: 0.00 }
        ]
      },
      {
        name: 'Doneness',
        type: 'single_choice',
        options: [
          { label: 'Medium Rare', priceModifier: 0 },
          { label: 'Medium Well', priceModifier: 0 },
          { label: 'Crispy Smashed Edges', priceModifier: 0 }
        ]
      },
      {
        name: 'Add-ons',
        type: 'multi_choice',
        options: [
          { label: 'Crispy Applewood Bacon', priceModifier: 2.25 },
          { label: 'Truffle Aioli', priceModifier: 1.25 },
          { label: 'Fried Free-Range Egg', priceModifier: 1.75 }
        ]
      }
    ]
  },
  boba: {
    restaurantName: 'Tiger Sugar Lounge',
    itemName: 'Brown Sugar Pearl Milk Tea',
    basePrice: 6.75,
    category: 'Beverages',
    description: 'Fresh organic milk with tiger-striped brown sugar syrup and warm boba pearls.',
    customizations: [
      {
        name: 'Sweetness Level',
        type: 'slider',
        options: ['0% Unsweetened', '30% Less Sweet', '50% Half Sweet', '70% Regular', '100% Extra Sweet']
      },
      {
        name: 'Ice Level',
        type: 'single_choice',
        options: ['No Ice', 'Less Ice (30%)', 'Regular Ice (100%)']
      },
      {
        name: 'Toppings',
        type: 'multi_choice',
        options: [
          { label: 'Golden Boba', priceModifier: 0.75 },
          { label: 'Egg Pudding', priceModifier: 1.00 },
          { label: 'Cheese Foam Cap', priceModifier: 1.50 },
          { label: 'Grass Jelly', priceModifier: 0.75 }
        ]
      }
    ]
  }
};

// ----------------------------------------------------
// Toast Notification System
// ----------------------------------------------------
function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || '📌'}</span>
    <div class="toast-msg">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-desc">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ----------------------------------------------------
// 1. Cluster Health Checker
// ----------------------------------------------------
async function checkClusterHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    updateBadge('badgePostgres', data.databases?.postgres);
    updateBadge('badgeMongo', data.databases?.mongodb);
    updateBadge('badgeRedis', data.databases?.redis);
  } catch (err) {
    updateBadge('badgePostgres', 'error');
    updateBadge('badgeMongo', 'error');
    updateBadge('badgeRedis', 'error');
  }
}

function updateBadge(elementId, status) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove('connected', 'error');

  const stateSpan = el.querySelector('.status-state');
  if (status === 'connected') {
    el.classList.add('connected');
    if (stateSpan) stateSpan.textContent = 'Connected';
  } else {
    el.classList.add('error');
    if (stateSpan) stateSpan.textContent = status || 'Error';
  }
}

// ----------------------------------------------------
// 2. PostgreSQL: Users & Wallets
// ----------------------------------------------------
function switchUserTab(tab) {
  const tabCreate = document.getElementById('tabCreateUser');
  const tabFunds = document.getElementById('tabAddFunds');
  const formCreate = document.getElementById('formCreateUser');
  const formFunds = document.getElementById('formAddFunds');

  if (tab === 'create') {
    if (tabCreate) tabCreate.classList.add('active');
    if (tabFunds) tabFunds.classList.remove('active');
    if (formCreate) formCreate.classList.remove('hidden');
    if (formFunds) formFunds.classList.add('hidden');
  } else {
    if (tabFunds) tabFunds.classList.add('active');
    if (tabCreate) tabCreate.classList.remove('active');
    if (formFunds) formFunds.classList.remove('hidden');
    if (formCreate) formCreate.classList.add('hidden');
  }
}

function setFundAmount(amount) {
  const input = document.getElementById('fundsAmount');
  if (input) input.value = amount.toFixed(2);
}

async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    const json = await res.json();

    const tbody = document.getElementById('usersTableBody');
    const select = document.getElementById('fundsUserSelect');
    const countEl = document.getElementById('userCount');

    if (!json.success || !Array.isArray(json.data)) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center muted">No users found.</td></tr>';
      return;
    }

    const users = json.data;
    if (countEl) countEl.textContent = users.length;

    // Update select dropdown
    if (select) {
      if (users.length === 0) {
        select.innerHTML = '<option value="" disabled selected>No users available - create one first</option>';
      } else {
        select.innerHTML = users.map(u => 
          `<option value="${u.id}">${escapeHtml(u.name)} (ID: ${u.id}) - Balance: $${Number(u.walletBalance).toFixed(2)}</option>`
        ).join('');
      }
    }

    // Update table
    if (tbody) {
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center muted">No users yet. Create one above!</td></tr>';
        return;
      }

      tbody.innerHTML = users.map(u => `
        <tr id="user-row-${u.id}">
          <td><code>#${u.id}</code></td>
          <td><strong>${escapeHtml(u.name)}</strong></td>
          <td class="muted">${escapeHtml(u.email)}</td>
          <td class="balance-cell">$${Number(u.walletBalance).toFixed(2)}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    appendLog('postgres', 'Failed to load users: ' + err.message);
  }
}

async function handleCreateUser(e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById('userName');
  const emailInput = document.getElementById('userEmail');
  const balanceInput = document.getElementById('userBalance');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const walletBalance = balanceInput ? parseFloat(balanceInput.value) : 0;

  if (!name || !email) {
    showToast('error', 'Validation Error', 'Name and email are required');
    return;
  }

  const btn = document.getElementById('btnSubmitUser');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Writing to PostgreSQL...';
  }

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, walletBalance })
    });
    const json = await res.json();

    if (!res.ok) {
      showToast('error', 'PostgreSQL Error', json.message || 'Failed to create user');
      appendLog('postgres', `❌ POST /api/users failed (${res.status}): ${json.message}`);
    } else {
      showToast('success', 'User Created in PostgreSQL', `User #${json.data.id} "${json.data.name}" (Balance: $${json.data.walletBalance})`);
      appendLog('postgres', `✅ POST /api/users created User #${json.data.id} "${json.data.name}" ($${json.data.walletBalance})`);
      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      await loadUsers();
    }
  } catch (err) {
    showToast('error', 'Network Error', err.message);
    appendLog('postgres', `❌ Network error creating user: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Create User in PostgreSQL';
    }
  }
}

async function handleAddFunds(e) {
  if (e) e.preventDefault();

  const userSelect = document.getElementById('fundsUserSelect');
  const amountInput = document.getElementById('fundsAmount');

  const userId = userSelect ? userSelect.value : '';
  const amount = amountInput ? parseFloat(amountInput.value) : 0;

  if (!userId) {
    showToast('error', 'Selection Required', 'Please select a user from the dropdown.');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showToast('error', 'Invalid Amount', 'Please enter a positive dollar amount.');
    return;
  }

  const btn = document.getElementById('btnSubmitFunds');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Executing Atomic Increment...';
  }

  try {
    const res = await fetch(`/api/users/${userId}/add-funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const json = await res.json();

    if (!res.ok) {
      showToast('error', 'Transaction Failed', json.message || 'Could not add funds');
      appendLog('postgres', `❌ POST /api/users/${userId}/add-funds failed: ${json.message}`);
    } else {
      showToast('success', 'Wallet Updated', `Added $${amount.toFixed(2)} to User #${userId}. New balance: $${json.data.walletBalance.toFixed(2)}`);
      appendLog('postgres', `✅ POST /api/users/${userId}/add-funds (+ $${amount.toFixed(2)}) ➔ New Balance: $${json.data.walletBalance.toFixed(2)}`);
      await loadUsers();

      // Highlight updated row briefly
      const row = document.getElementById(`user-row-${userId}`);
      if (row) {
        row.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
        setTimeout(() => { row.style.backgroundColor = ''; }, 1200);
      }
    }
  } catch (err) {
    showToast('error', 'Network Error', err.message);
    appendLog('postgres', `❌ Network error updating wallet: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Deposit Funds (Atomic Increment)';
    }
  }
}

// ----------------------------------------------------
// 3. MongoDB: Restaurant Menu Catalog
// ----------------------------------------------------
function applyMenuPreset(key, btnEl) {
  const preset = MENU_PRESETS[key];
  if (!preset) return;

  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    const defaultBtn = document.querySelector(`.preset-btn[data-preset="${key}"]`);
    if (defaultBtn) defaultBtn.classList.add('active');
  }

  const restInput = document.getElementById('restaurantName');
  const itemInput = document.getElementById('itemName');
  const priceInput = document.getElementById('basePrice');
  const customInput = document.getElementById('menuCustomizations');

  if (restInput) restInput.value = preset.restaurantName;
  if (itemInput) itemInput.value = preset.itemName;
  if (priceInput) priceInput.value = preset.basePrice;
  if (customInput) customInput.value = JSON.stringify(preset.customizations, null, 2);
}

async function loadMenuItems() {
  try {
    const res = await fetch('/api/menu');
    const json = await res.json();

    const list = document.getElementById('menuItemsList');
    const countEl = document.getElementById('menuCount');

    if (!json.success || !Array.isArray(json.data)) {
      if (list) list.innerHTML = '<div class="muted text-center p-3">No catalog items.</div>';
      return;
    }

    const items = json.data;
    if (countEl) countEl.textContent = items.length;

    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = '<div class="muted text-center p-3">Catalog is empty. Add a delicious item above!</div>';
      return;
    }

    list.innerHTML = items.map(item => {
      const customChips = (item.customizations || []).map(c => {
        const title = c.name || c.title || 'Option';
        const optCount = Array.isArray(c.options) ? c.options.length : (Array.isArray(c.scale) ? c.scale.length : '?');
        return `<span class="custom-chip">${escapeHtml(title)} (${optCount})</span>`;
      }).join('');

      return `
        <div class="menu-item-card">
          <div class="menu-item-header">
            <div>
              <span class="item-name">${escapeHtml(item.itemName)}</span>
              <span class="restaurant-tag"> • ${escapeHtml(item.restaurantName)}</span>
            </div>
            <span class="item-price">$${Number(item.basePrice).toFixed(2)}</span>
          </div>
          ${item.description ? `<p class="muted-small">${escapeHtml(item.description)}</p>` : ''}
          ${customChips ? `<div class="customization-tags">${customChips}</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    appendLog('mongo', 'Failed to load catalog: ' + err.message);
  }
}

async function handleCreateMenu(e) {
  if (e) e.preventDefault();

  const restInput = document.getElementById('restaurantName');
  const itemInput = document.getElementById('itemName');
  const priceInput = document.getElementById('basePrice');
  const customInput = document.getElementById('menuCustomizations');

  const restaurantName = restInput ? restInput.value.trim() : '';
  const itemName = itemInput ? itemInput.value.trim() : '';
  const basePrice = priceInput ? parseFloat(priceInput.value) : 0;
  const rawCustomizations = customInput ? customInput.value.trim() : '';

  if (!restaurantName || !itemName) {
    showToast('error', 'Validation Error', 'Restaurant name and item name are required.');
    return;
  }

  let customizations = [];
  if (rawCustomizations) {
    try {
      customizations = JSON.parse(rawCustomizations);
      if (!Array.isArray(customizations)) {
        throw new Error('Customizations must be a JSON array [ ... ].');
      }
    } catch (parseErr) {
      showToast('error', 'Invalid JSON', 'Customizations field must be valid JSON array: ' + parseErr.message);
      return;
    }
  }

  const btn = document.getElementById('btnSubmitMenu');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Writing BSON to MongoDB...';
  }

  try {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantName,
        itemName,
        basePrice,
        customizations
      })
    });
    const json = await res.json();

    if (!res.ok) {
      showToast('error', 'MongoDB Error', json.message || 'Failed to save menu item');
      appendLog('mongo', `❌ POST /api/menu failed: ${json.message}`);
    } else {
      showToast('success', 'Saved to MongoDB', `Created "${json.data.itemName}" with ${customizations.length} customization categories`);
      appendLog('mongo', `✅ POST /api/menu created "${json.data.itemName}" in MongoDB [ID: ${json.data._id}]`);
      await loadMenuItems();
    }
  } catch (err) {
    showToast('error', 'Network Error', err.message);
    appendLog('mongo', `❌ Network error saving menu item: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Save Menu Item to MongoDB';
    }
  }
}

// ----------------------------------------------------
// 4. Redis: Live Driver Tracking & 60s TTL Monitor
// ----------------------------------------------------
const LOCATION_PRESETS = {
  downtown: { lat: 37.774929, lng: -122.419416 },
  financial: { lat: 37.7946, lng: -122.4000 },
  mission: { lat: 37.7599, lng: -122.4148 }
};

function setPresetLocation(name) {
  const loc = LOCATION_PRESETS[name];
  if (loc) {
    const latInput = document.getElementById('driverLat');
    const lngInput = document.getElementById('driverLng');
    if (latInput) latInput.value = loc.lat;
    if (lngInput) lngInput.value = loc.lng;
  }
}

function randomizeLocation() {
  const baseLat = 37.774929;
  const baseLng = -122.419416;
  const deltaLat = (Math.random() - 0.5) * 0.04;
  const deltaLng = (Math.random() - 0.5) * 0.04;
  const latInput = document.getElementById('driverLat');
  const lngInput = document.getElementById('driverLng');
  if (latInput) latInput.value = (baseLat + deltaLat).toFixed(6);
  if (lngInput) lngInput.value = (baseLng + deltaLng).toFixed(6);
}

async function handleBroadcastLocation(e) {
  if (e) e.preventDefault();

  const idInput = document.getElementById('driverId');
  const latInput = document.getElementById('driverLat');
  const lngInput = document.getElementById('driverLng');

  const driverId = idInput ? idInput.value.trim() : 'driver-88';
  const lat = latInput ? parseFloat(latInput.value) : 37.7749;
  const lng = lngInput ? parseFloat(lngInput.value) : -122.4194;

  currentActiveDriver = driverId;
  const keyLabel = document.getElementById('redisKeyLabel');
  if (keyLabel) keyLabel.textContent = `driver:${driverId}:location`;

  const btn = document.getElementById('btnSubmitLocation');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Pushing to Redis...';
  }

  try {
    const res = await fetch(`/api/driver/${encodeURIComponent(driverId)}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    });
    const json = await res.json();

    if (!res.ok) {
      showToast('error', 'Redis Error', json.message || 'Failed to update location');
      appendLog('redis', `❌ POST /api/driver/${driverId}/location failed: ${json.message}`);
    } else {
      showToast('success', 'Redis Location Updated', `Stored ${json.key} with 60s TTL`);
      appendLog('redis', `✅ POST /api/driver/${driverId}/location ➔ SET "${json.key}" (TTL: ${json.ttl}s)`);
      startTtlMonitor(driverId);
    }
  } catch (err) {
    showToast('error', 'Network Error', err.message);
    appendLog('redis', `❌ Network error updating driver location: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Broadcast GPS (Set 60s TTL in Redis)';
    }
  }
}

function startTtlMonitor(driverId) {
  if (redisTtlTimer) {
    clearInterval(redisTtlTimer);
  }

  const pollLocation = async () => {
    try {
      const res = await fetch(`/api/driver/${encodeURIComponent(driverId)}/location`);
      const badge = document.getElementById('ttlBadge');
      const text = document.getElementById('ttlSecondsText');
      const fill = document.getElementById('ttlProgressFill');
      const body = document.getElementById('telemetryContent');

      if (res.status === 404) {
        clearInterval(redisTtlTimer);
        if (text) text.textContent = '0';
        if (fill) fill.style.width = '0%';
        if (badge) badge.style.borderColor = '#ef4444';
        if (body) {
          body.innerHTML = `
            <div style="color: #ef4444; font-weight: 600;">
              ⚠️ Key "driver:${escapeHtml(driverId)}:location" expired and evicted from Redis!
            </div>
            <div class="muted-small mt-1">TTL reached 0 seconds. Ephemeral state removed automatically.</div>
          `;
        }
        appendLog('redis', `⏳ Key driver:${driverId}:location expired in Redis (TTL reached 0s).`);
        return;
      }

      const json = await res.json();
      const ttl = json.ttlRemainingSeconds ?? 0;

      if (text) text.textContent = ttl;
      if (fill) {
        const percent = Math.max(0, Math.min(100, (ttl / 60) * 100));
        fill.style.width = `${percent}%`;
        if (ttl > 30) {
          fill.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        } else if (ttl > 10) {
          fill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        } else {
          fill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
        }
      }

      if (body) {
        body.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span><strong>Driver:</strong> ${escapeHtml(json.data.driverId)}</span>
            <span class="muted">Updated: ${new Date(json.data.updatedAt).toLocaleTimeString()}</span>
          </div>
          <div><strong>GPS:</strong> ${json.data.lat.toFixed(6)}, ${json.data.lng.toFixed(6)}</div>
          <div class="muted-small" style="margin-top: 4px;">Redis TTL Remaining: <strong>${ttl} seconds</strong></div>
        `;
      }
    } catch (err) {
      console.error(err);
    }
  };

  pollLocation();
  redisTtlTimer = setInterval(pollLocation, 1000);
}

// ----------------------------------------------------
// 5. Console Logging Helpers
// ----------------------------------------------------
function appendLog(type, message) {
  const container = document.getElementById('consoleLogs');
  if (!container) return;

  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const time = new Date().toLocaleTimeString();
  const typeClass = `log-${type}`;
  const tag = type.toUpperCase();

  entry.innerHTML = `
    <span class="log-time">[${time}]</span>
    <span class="${typeClass}">[${tag}]</span>
    <span class="log-text">${escapeHtml(message)}</span>
  `;

  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

function clearLogs() {
  const container = document.getElementById('consoleLogs');
  if (container) {
    container.innerHTML = '<div class="log-entry log-system"><span class="log-time">[System]</span><span class="log-text">Console cleared.</span></div>';
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export functions to window for onclick handlers
window.switchUserTab = switchUserTab;
window.setFundAmount = setFundAmount;
window.applyMenuPreset = applyMenuPreset;
window.setPresetLocation = setPresetLocation;
window.randomizeLocation = randomizeLocation;
window.loadUsers = loadUsers;
window.loadMenuItems = loadMenuItems;
window.clearLogs = clearLogs;
window.showToast = showToast;
window.handleCreateUser = handleCreateUser;
window.handleAddFunds = handleAddFunds;
window.handleCreateMenu = handleCreateMenu;
window.handleBroadcastLocation = handleBroadcastLocation;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Immediately bind form submission handlers with preventDefault
  const formCreateUser = document.getElementById('formCreateUser');
  if (formCreateUser) formCreateUser.addEventListener('submit', handleCreateUser);

  const formAddFunds = document.getElementById('formAddFunds');
  if (formAddFunds) formAddFunds.addEventListener('submit', handleAddFunds);

  const formCreateMenu = document.getElementById('formCreateMenu');
  if (formCreateMenu) formCreateMenu.addEventListener('submit', handleCreateMenu);

  const formDriver = document.getElementById('formDriverLocation');
  if (formDriver) formDriver.addEventListener('submit', handleBroadcastLocation);

  // 2. Apply initial preset safely
  try {
    applyMenuPreset('pizza');
  } catch (err) {
    console.error('Preset error:', err);
  }

  // 3. Load data
  try { await checkClusterHealth(); } catch (e) { console.error(e); }
  try { await loadUsers(); } catch (e) { console.error(e); }
  try { await loadMenuItems(); } catch (e) { console.error(e); }

  // 4. Setup health check interval
  setInterval(checkClusterHealth, 4000);
});
