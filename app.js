/* =====================================================
   Helix Pharma Group — Portal de pedidos B2B
   Edita la sección CONFIG y PRODUCTS para personalizar.
   ===================================================== */

// ---------- CONFIGURACIÓN (cámbiala a tus datos reales) ----------
const CONFIG = {
  minOrder: 150000,          // pedido mínimo (COP)
  freeShippingFrom: 300000,  // envío gratis desde (COP)
  shippingFee: 12000,        // costo de envío si no alcanza el mínimo para envío gratis
  cutoffTime: "2:00 p. m.",  // hora límite para despacho el mismo día
  whatsapp: "573137005733",            // número con indicativo de país y sin + ni espacios, ej: "573001234567". Vacío = oculta los botones de WhatsApp
  email: "helixpharmagroupsas@gmail.com",               // correo de contacto, ej: "pedidos@helixpharma.com". Vacío = oculta la tarjeta de correo
  zones: [
    { name: "Cali",    note: "Despacho exprés el mismo día" },
    { name: "Jamundí", note: "Despacho exprés el mismo día" },
    { name: "Palmira", note: "Despacho el mismo día" },
    { name: "Yumbo",   note: "Despacho exprés el mismo día" }
  ]
};

// ---------- CATÁLOGO (precios y stock de ejemplo: reemplázalos por los reales) ----------
const CATEGORIES = [
  { id: "hipertension", label: "Hipertensión", icon: "❤️" },
  { id: "diabetes",     label: "Diabetes",     icon: "🩸" },
  { id: "analgesicos",  label: "Analgésicos",  icon: "💊" }
];

const PRODUCTS = [
  { id: 1,  name: "Losartán 50 mg",          pres: "Caja x 30 tabletas",      cat: "hipertension", price: 14500, stock: 120 },
  { id: 2,  name: "Enalapril 20 mg",         pres: "Caja x 30 tabletas",      cat: "hipertension", price: 9800,  stock: 85 },
  { id: 3,  name: "Amlodipino 5 mg",         pres: "Caja x 30 tabletas",      cat: "hipertension", price: 8900,  stock: 14 },
  { id: 4,  name: "Metformina 850 mg",       pres: "Caja x 30 tabletas",      cat: "diabetes",     price: 11200, stock: 140 },
  { id: 5,  name: "Glibenclamida 5 mg",      pres: "Caja x 30 tabletas",      cat: "diabetes",     price: 7600,  stock: 60 },
  { id: 6,  name: "Acetaminofén 500 mg",     pres: "Caja x 100 tabletas",     cat: "analgesicos",  price: 12800, stock: 300 },
  { id: 7,  name: "Ibuprofeno 400 mg",       pres: "Caja x 50 tabletas",      cat: "analgesicos",  price: 15900, stock: 180 },
  { id: 8,  name: "Naproxeno 250 mg",        pres: "Caja x 30 tabletas",      cat: "analgesicos",  price: 10400, stock: 9 },
  { id: 9,  name: "Diclofenaco 50 mg",       pres: "Caja x 30 tabletas",      cat: "analgesicos",  price: 8700,  stock: 0 }
];

const LOW_STOCK = 20;
const STORAGE_CART = "helix_cart_v1";
const STORAGE_ORDERS = "helix_orders_v1";

// ---------- Utilidades ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = n => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const catById = id => CATEGORIES.find(c => c.id === id);
const prodById = id => PRODUCTS.find(p => p.id === id);

function storageGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
}

// ---------- Estado ----------
const state = {
  search: "",
  category: "all",
  sort: "name",
  cart: storageGet(STORAGE_CART, {}) // { productId: cantidad }
};

// limpiar productos que ya no existan o cantidades inválidas
Object.keys(state.cart).forEach(id => {
  const p = prodById(Number(id));
  if (!p || !Number.isInteger(state.cart[id]) || state.cart[id] < 1) delete state.cart[id];
  else state.cart[id] = Math.min(state.cart[id], p.stock);
});

// ---------- Catálogo: render ----------
function stockBadge(stock) {
  if (stock === 0) return '<span class="badge badge--out">Agotado</span>';
  if (stock <= LOW_STOCK) return '<span class="badge badge--low">Pocas unidades</span>';
  return '<span class="badge badge--ok">Disponible</span>';
}

function getFilteredProducts() {
  const q = state.search.trim().toLowerCase();
  let list = PRODUCTS.filter(p =>
    (state.category === "all" || p.cat === state.category) &&
    (!q || p.name.toLowerCase().includes(q) || p.pres.toLowerCase().includes(q))
  );
  const sorters = {
    "name": (a, b) => a.name.localeCompare(b.name, "es"),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "stock": (a, b) => b.stock - a.stock
  };
  return list.sort(sorters[state.sort]);
}

function renderChips() {
  const all = [{ id: "all", label: "Todos" }, ...CATEGORIES];
  $("#chips").innerHTML = all.map(c =>
    `<button class="chip ${state.category === c.id ? "is-active" : ""}" data-cat="${c.id}" role="tab" aria-selected="${state.category === c.id}">${c.label}</button>`
  ).join("");
}

function renderProducts() {
  const list = getFilteredProducts();
  $("#emptyMsg").hidden = list.length > 0;
  $("#productGrid").innerHTML = list.map(p => {
    const cat = catById(p.cat);
    const out = p.stock === 0;
    return `
      <article class="card" data-id="${p.id}">
        <div class="card__top">
          <div class="card__icon" aria-hidden="true">${cat.icon}</div>
          ${stockBadge(p.stock)}
        </div>
        <span class="card__cat">${cat.label}</span>
        <h3>${p.name}</h3>
        <p class="card__pres">${p.pres}</p>
        <p class="card__stock">${out ? "Sin existencias por ahora" : p.stock + " cajas en stock"}</p>
        <div class="card__price">${money(p.price)} <small>/ caja</small></div>
        <div class="card__actions">
          <div class="qty" aria-label="Cantidad">
            <button type="button" data-act="dec" aria-label="Menos" ${out ? "disabled" : ""}>−</button>
            <input type="number" min="1" max="${p.stock}" value="1" inputmode="numeric" aria-label="Cantidad de cajas" ${out ? "disabled" : ""}>
            <button type="button" data-act="inc" aria-label="Más" ${out ? "disabled" : ""}>+</button>
          </div>
          <button type="button" class="btn btn--primary" data-act="add" ${out ? "disabled" : ""}>${out ? "Agotado" : "Agregar"}</button>
        </div>
      </article>`;
  }).join("");
}

// ---------- Carrito ----------
function cartLines() {
  return Object.entries(state.cart).map(([id, qty]) => {
    const p = prodById(Number(id));
    return { p, qty, total: p.price * qty };
  });
}

function cartTotals() {
  const lines = cartLines();
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const shipping = subtotal === 0 ? 0 : (subtotal >= CONFIG.freeShippingFrom ? 0 : CONFIG.shippingFee);
  return { subtotal, shipping, total: subtotal + shipping, units: lines.reduce((s, l) => s + l.qty, 0) };
}

function saveCart() { storageSet(STORAGE_CART, state.cart); }

function addToCart(id, qty) {
  const p = prodById(id);
  if (!p || p.stock === 0) return;
  const current = state.cart[id] || 0;
  const next = Math.min(current + qty, p.stock);
  state.cart[id] = next;
  if (current + qty > p.stock) toast(`Solo hay ${p.stock} cajas de ${p.name}`);
  else toast(`${p.name} agregado al pedido`);
  saveCart();
  renderCart();
  const btn = $("#openCart");
  btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
}

function setQty(id, qty) {
  const p = prodById(id);
  if (qty <= 0) delete state.cart[id];
  else state.cart[id] = Math.min(qty, p.stock);
  saveCart();
  renderCart();
}

function renderCart() {
  const lines = cartLines();
  const t = cartTotals();
  $("#cartCount").textContent = t.units;

  if (lines.length === 0) {
    $("#cartItems").innerHTML = '<div class="cart-empty"><p>Tu pedido está vacío.</p><p>Agrega productos desde el catálogo.</p></div>';
    $("#cartFoot").hidden = true;
    return;
  }
  $("#cartFoot").hidden = false;
  $("#cartItems").innerHTML = lines.map(({ p, qty, total }) => `
    <div class="cart-item" data-id="${p.id}">
      <div><h4>${p.name}</h4><small>${p.pres} · ${money(p.price)}</small></div>
      <div class="cart-item__price">${money(total)}</div>
      <div class="cart-item__row">
        <div class="qty">
          <button type="button" data-cact="dec" aria-label="Menos">−</button>
          <input type="number" min="1" max="${p.stock}" value="${qty}" inputmode="numeric" aria-label="Cantidad">
          <button type="button" data-cact="inc" aria-label="Más">+</button>
        </div>
        <button type="button" class="cart-item__remove" data-cact="remove">Quitar</button>
      </div>
    </div>`).join("");

  $("#subtotal").textContent = money(t.subtotal);
  $("#shipping").textContent = t.shipping === 0 ? "Gratis" : money(t.shipping);
  $("#total").textContent = money(t.total);

  const hint = $("#minHint");
  const btn = $("#checkoutBtn");
  if (t.subtotal < CONFIG.minOrder) {
    hint.className = "hint";
    hint.textContent = `Te faltan ${money(CONFIG.minOrder - t.subtotal)} para el pedido mínimo (${money(CONFIG.minOrder)}).`;
    btn.disabled = true;
  } else if (t.subtotal < CONFIG.freeShippingFrom) {
    hint.className = "hint ok";
    hint.textContent = `Agrega ${money(CONFIG.freeShippingFrom - t.subtotal)} más y el envío es gratis.`;
    btn.disabled = false;
  } else {
    hint.className = "hint ok";
    hint.textContent = "¡Tienes envío gratis!";
    btn.disabled = false;
  }
}

// ---------- Drawer y modales ----------
function openDrawer() {
  $("#overlay").hidden = false;
  const d = $("#drawer");
  d.classList.add("is-open");
  d.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  $("#overlay").hidden = true;
  const d = $("#drawer");
  d.classList.remove("is-open");
  d.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function openModal(id) {
  $("#" + id).hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  $("#" + id).hidden = true;
  document.body.style.overflow = "";
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ---------- Formulario de pedido ----------
function validateForm(form) {
  let ok = true;
  const rules = {
    name:    v => v.trim().length >= 3 || "Escribe el nombre de la droguería.",
    nit:     v => /^[0-9.\-\s]{5,15}$/.test(v.trim()) || "Ingresa un NIT o cédula válido.",
    contact: v => v.trim().length >= 3 || "Escribe el nombre del contacto.",
    phone:   v => /^[0-9+\s]{7,15}$/.test(v.trim()) || "Ingresa un teléfono válido.",
    city:    v => v !== "" || "Selecciona un municipio.",
    address: v => v.trim().length >= 5 || "Escribe la dirección de entrega."
  };
  Object.keys(rules).forEach(name => {
    const input = form.elements[name];
    const field = input.closest(".field");
    const result = rules[name](input.value);
    const msg = result === true ? "" : result;
    field.classList.toggle("has-error", !!msg);
    $(".error", field).textContent = msg;
    if (msg) ok = false;
  });
  return ok;
}

function buildOrder(form) {
  const t = cartTotals();
  const data = new FormData(form);
  const code = "HX-" + Date.now().toString(36).toUpperCase().slice(-6);
  return {
    code,
    date: new Date().toISOString(),
    customer: {
      name: data.get("name").trim(),
      nit: data.get("nit").trim(),
      contact: data.get("contact").trim(),
      phone: data.get("phone").trim(),
      city: data.get("city"),
      address: data.get("address").trim()
    },
    payment: data.get("payment"),
    notes: (data.get("notes") || "").trim(),
    items: cartLines().map(l => ({ id: l.p.id, name: l.p.name, pres: l.p.pres, qty: l.qty, price: l.p.price, total: l.total })),
    subtotal: t.subtotal, shipping: t.shipping, total: t.total
  };
}

function orderToText(o) {
  const lines = o.items.map(i => `• ${i.qty} x ${i.name} (${i.pres}) — ${money(i.total)}`);
  return [
    `PEDIDO ${o.code} — Helix Pharma Group`,
    `Droguería: ${o.customer.name} (NIT ${o.customer.nit})`,
    `Contacto: ${o.customer.contact} · ${o.customer.phone}`,
    `Entrega: ${o.customer.address}, ${o.customer.city}`,
    `Pago: ${o.payment}`,
    "",
    ...lines,
    "",
    `Subtotal: ${money(o.subtotal)}`,
    `Envío: ${o.shipping === 0 ? "Gratis" : money(o.shipping)}`,
    `TOTAL: ${money(o.total)}`,
    o.notes ? `\nObservaciones: ${o.notes}` : ""
  ].join("\n").trim();
}

function submitOrder(e) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!validateForm(form)) return;

  const order = buildOrder(form);

  // Guardar el pedido en este navegador.
  // Para recibirlo de verdad, aquí se conectaría un backend, correo o hoja de cálculo.
  const orders = storageGet(STORAGE_ORDERS, []);
  orders.push(order);
  storageSet(STORAGE_ORDERS, orders);

  const text = orderToText(order);
  $("#orderCode").textContent = order.code;
  $("#orderSummary").textContent = text;

  const wa = $("#waOrder");
  if (CONFIG.whatsapp) {
    wa.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
    wa.hidden = false;
  } else {
    wa.hidden = true;
  }

  state.cart = {};
  saveCart();
  renderCart();
  form.reset();
  closeModal("checkoutModal");
  closeDrawer();
  openModal("successModal");
}

// ---------- Eventos ----------
function bindEvents() {
  // Búsqueda, orden, categorías
  $("#searchInput").addEventListener("input", e => { state.search = e.target.value; renderProducts(); });
  $("#sortSelect").addEventListener("change", e => { state.sort = e.target.value; renderProducts(); });
  $("#chips").addEventListener("click", e => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.category = btn.dataset.cat;
    renderChips();
    renderProducts();
  });

  // Tarjetas de producto
  $("#productGrid").addEventListener("click", e => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const card = btn.closest(".card");
    const id = Number(card.dataset.id);
    const input = $("input", card);
    const max = prodById(id).stock;
    let val = parseInt(input.value, 10) || 1;
    if (btn.dataset.act === "inc") input.value = Math.min(val + 1, max);
    if (btn.dataset.act === "dec") input.value = Math.max(val - 1, 1);
    if (btn.dataset.act === "add") {
      addToCart(id, Math.min(Math.max(val, 1), max));
      input.value = 1;
    }
  });
  $("#productGrid").addEventListener("change", e => {
    if (e.target.matches(".qty input")) {
      const max = prodById(Number(e.target.closest(".card").dataset.id)).stock;
      e.target.value = Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), max);
    }
  });

  // Carrito
  $("#openCart").addEventListener("click", openDrawer);
  $("#closeCart").addEventListener("click", closeDrawer);
  $("#overlay").addEventListener("click", closeDrawer);
  $("#clearCart").addEventListener("click", () => {
    state.cart = {};
    saveCart();
    renderCart();
  });
  $("#cartItems").addEventListener("click", e => {
    const btn = e.target.closest("[data-cact]");
    if (!btn) return;
    const id = Number(btn.closest(".cart-item").dataset.id);
    const qty = state.cart[id] || 0;
    if (btn.dataset.cact === "inc") setQty(id, qty + 1);
    if (btn.dataset.cact === "dec") setQty(id, qty - 1);
    if (btn.dataset.cact === "remove") setQty(id, 0);
  });
  $("#cartItems").addEventListener("change", e => {
    if (e.target.matches(".qty input")) {
      const id = Number(e.target.closest(".cart-item").dataset.id);
      setQty(id, parseInt(e.target.value, 10) || 0);
    }
  });

  // Checkout
  $("#checkoutBtn").addEventListener("click", () => {
    if (cartTotals().subtotal < CONFIG.minOrder) return;
    $("#checkoutTotal").textContent = money(cartTotals().total);
    openModal("checkoutModal");
  });
  $("#checkoutForm").addEventListener("submit", submitOrder);

  // Cerrar modales
  $$("[data-close]").forEach(b => b.addEventListener("click", () => closeModal(b.dataset.close)));
  $$(".modal").forEach(m => m.addEventListener("click", e => { if (e.target === m) closeModal(m.id); }));
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    $$(".modal").forEach(m => { if (!m.hidden) closeModal(m.id); });
    closeDrawer();
  });

  // Copiar resumen
  $("#copyOrder").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("#orderSummary").textContent);
      toast("Resumen copiado");
    } catch {
      toast("No se pudo copiar automáticamente");
    }
  });
}

// ---------- Inicio ----------
function init() {
  $("#statProducts").textContent = PRODUCTS.filter(p => p.stock > 0).length;
  $("#termMin").textContent = money(CONFIG.minOrder);
  $("#termFree").textContent = money(CONFIG.freeShippingFrom);
  $("#termCutoff").textContent = CONFIG.cutoffTime;

  $("#zonesList").innerHTML = CONFIG.zones.map(z => `<li><strong>${z.name}</strong><span>${z.note}</span></li>`).join("");
  $("#fCity").innerHTML = '<option value="">Selecciona…</option>' + CONFIG.zones.map(z => `<option>${z.name}</option>`).join("");

  initContact();
  renderChips();
  renderProducts();
  renderCart();
  bindEvents();
}

function initContact() {
  const hello = encodeURIComponent("Hola, quiero información sobre los productos de Helix Pharma.");
  const wa = String(CONFIG.whatsapp || "").replace(/\D/g, "");
  const mail = String(CONFIG.email || "").trim();

  if (wa) {
    const url = `https://wa.me/${wa}?text=${hello}`;
    $("#contactWa").href = url;
    $("#contactWa").hidden = false;
    $("#contactWaText").textContent = (wa.startsWith("57") && wa.length === 12)
      ? `+57 ${wa.slice(2, 5)} ${wa.slice(5)}` : "+" + wa;
    $("#waFloat").href = url;
    $("#waFloat").hidden = false;
  }
  if (mail) {
    $("#contactMail").hidden = false;
    $("#contactMailText").textContent = mail;
    $("#copyMail").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(mail); toast("Correo copiado"); }
      catch { toast("Copia el correo: " + mail); }
    });
  }
  if (!wa && !mail) $("#contacto").hidden = true;
}

document.addEventListener("DOMContentLoaded", init);

