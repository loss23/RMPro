/* Shopify Storefront API: product grid, cart, hand-off to Shopify checkout. */
(function () {
  const cfg = (window.RMP_CONFIG || {}).shopify || {};
  const $ = id => document.getElementById(id);
  const grid = $("merchList"), note = $("merchNote"), panel = $("cart"), linesBox = $("cartLines"), msg = $("cartMsg");
  const domain = String(cfg.domain || "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  function make(tag, text, cls) { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }
  function placeholders(text) {
    note.textContent = text; grid.textContent = "";
    // Generic line drawings, shown until Shopify supplies real product photos.
    const draw = [
      "M35 18 15 30l9 18 10-5v40h32V43l10 5 9-18-20-12c-4 10-26 10-30 0Z",
      "M34 30 18 40 9 74l13 4 8-22v32h40V56l8 22 13-4-9-34-16-10c0-26-32-26-32 0Zm0 0c4 18 28 18 32 0M38 74h24l5 14H33Z",
      "M50 14a36 36 0 1 0 .1 0Zm0 26a10 10 0 1 0 .1 0ZM27 40c3-7 9-13 17-15"
    ];
    ["[T-shirt]", "[Hoodie]", "[Music or poster]"].forEach((name, n) => {
      const art = make("div", "", "art"), ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg"), path = document.createElementNS(ns, "path");
      svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("aria-hidden", "true"); path.setAttribute("d", draw[n]); svg.append(path); art.append(svg);
      const c = make("div", "", "card"), b = make("button", "Coming soon"); b.disabled = true;
      c.append(art, make("h3", name), make("p", "[Price]"), b); grid.append(c);
    });
  }
  if (!domain) return placeholders("The online store is not open yet.");
  if (!/^[a-z0-9-]+\.myshopify\.com$/i.test(domain)) return placeholders("The store address is not set up correctly. Check config.js.");
  if (/^(shpat_|shpss_|shpca_|shppa_)/.test(cfg.publicToken || "")) return placeholders("The store is unavailable right now.");

  async function api(query, variables) {
    const headers = { "Content-Type": "application/json" };
    if (cfg.publicToken) headers["X-Shopify-Storefront-Access-Token"] = cfg.publicToken;
    const res = await fetch("https://" + domain + "/api/" + (cfg.apiVersion || "2026-10") + "/graphql.json",
      { method: "POST", headers, body: JSON.stringify({ query, variables }) });
    if (!res.ok) throw new Error("Shopify returned " + res.status);
    const body = await res.json();
    if (body.errors && body.errors.length) throw new Error(body.errors[0].message);
    return body.data;
  }
  const money = m => new Intl.NumberFormat("en-US", { style: "currency", currency: m.currencyCode }).format(Number(m.amount));
  const PRODUCT = "nodes{id title featuredImage{url(transform:{maxWidth:600}) altText} variants(first:20){nodes{id title availableForSale price{amount currencyCode}}}}";
  const CART = "id checkoutUrl totalQuantity cost{subtotalAmount{amount currencyCode}} lines(first:50){nodes{id quantity merchandise{... on ProductVariant{title product{title}}}}}";
  const KEY = "rmp-cart:" + domain;
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} }
  };
  let cart = null, busy = false;

  function renderCart() {
    linesBox.textContent = "";
    if (!cart || !cart.totalQuantity) { panel.hidden = true; return; }
    panel.hidden = false;
    cart.lines.nodes.forEach(l => {
      const v = l.merchandise, li = make("li", "", "row"), info = make("div"), ctl = make("div", "", "qty");
      info.append(make("strong", v.product.title), make("span", v.title === "Default Title" ? "" : v.title));
      const step = (label, aria, q) => { const b = make("button", label, "ghost"); b.type = "button"; b.setAttribute("aria-label", aria + " " + v.product.title); b.onclick = () => setQty(l.id, q); return b; };
      ctl.append(step("−", "Remove one", l.quantity - 1), make("b", String(l.quantity)), step("+", "Add one", l.quantity + 1), step("Remove", "Remove all", 0));
      li.append(info, ctl); linesBox.append(li);
    });
    $("cartTotal").textContent = "Subtotal: " + money(cart.cost.subtotalAmount) + " (" + cart.totalQuantity + (cart.totalQuantity === 1 ? " item)" : " items)");
    $("checkout").href = cart.checkoutUrl;
  }
  async function change(work) {
    if (busy) return; busy = true; msg.textContent = "";
    try {
      const r = await work();
      const problem = (r.userErrors || []).concat(r.warnings || [])[0];
      if (r.cart) { cart = r.cart; store.set(cart.id); renderCart(); }
      if (problem) msg.textContent = problem.message;
    } catch (e) { console.error(e); msg.textContent = "The cart could not be updated. Please try again."; }
    finally { busy = false; }
  }
  const mutate = async (name, sig, args, vars) =>
    (await api("mutation(" + sig + "){" + name + "(" + args + "){cart{" + CART + "} userErrors{message} warnings{message}}}", vars))[name];
  function add(variantId) {
    const lines = [{ merchandiseId: variantId, quantity: 1 }];
    return change(() => cart
      ? mutate("cartLinesAdd", "$cartId:ID!,$lines:[CartLineInput!]!", "cartId:$cartId,lines:$lines", { cartId: cart.id, lines })
      : mutate("cartCreate", "$input:CartInput", "input:$input", { input: { lines } }));
  }
  function setQty(lineId, quantity) {
    return change(() => quantity > 0
      ? mutate("cartLinesUpdate", "$cartId:ID!,$lines:[CartLineUpdateInput!]!", "cartId:$cartId,lines:$lines", { cartId: cart.id, lines: [{ id: lineId, quantity }] })
      : mutate("cartLinesRemove", "$cartId:ID!,$lineIds:[ID!]!", "cartId:$cartId,lineIds:$lineIds", { cartId: cart.id, lineIds: [lineId] }));
  }
  function productCard(p) {
    const c = make("div", "", "card");
    if (p.featuredImage) { const i = make("img", "", "shot"); i.src = p.featuredImage.url; i.alt = p.featuredImage.altText || p.title; i.loading = "lazy"; c.append(i); }
    else c.append(make("div", "Photo", "art"));
    const price = make("p"), button = make("button"), variants = p.variants.nodes;
    if (!variants.length) return null;
    let chosen = variants.find(v => v.availableForSale) || variants[0];
    const show = () => { price.textContent = money(chosen.price); button.disabled = !chosen.availableForSale; button.textContent = chosen.availableForSale ? "Add to cart" : "Sold out"; };
    c.append(make("h3", p.title), price);
    if (variants.length > 1) {
      const s = make("select"); s.id = "v-" + p.id.split("/").pop(); s.setAttribute("aria-label", "Option for " + p.title);
      variants.forEach(v => { const o = make("option", v.title + (v.availableForSale ? "" : " (sold out)")); o.value = v.id; s.append(o); });
      s.value = chosen.id; s.onchange = () => { chosen = variants.find(v => v.id === s.value); show(); }; c.append(s);
    }
    button.type = "button"; button.onclick = () => add(chosen.id); c.append(button); show(); return c;
  }
  (async function () {
    note.textContent = "Loading merch…";
    try {
      const data = cfg.collection
        ? await api("query($h:String!){collection(handle:$h){products(first:12){" + PRODUCT + "}}}", { h: cfg.collection })
        : await api("{products(first:12){" + PRODUCT + "}}");
      const nodes = cfg.collection ? ((data.collection || {}).products || {}).nodes : data.products.nodes;
      if (!nodes || !nodes.length) return placeholders("No merch is listed yet. Check back soon.");
      note.textContent = "Checkout is handled securely by Shopify."; grid.textContent = "";
      nodes.map(productCard).filter(Boolean).forEach(c => grid.append(c));
    } catch (e) { console.error(e); return placeholders("Merch could not load right now. Please try again later."); }
    const saved = store.get();
    if (saved) {
      try { const d = await api("query($id:ID!){cart(id:$id){" + CART + "}}", { id: saved }); cart = d.cart; if (!cart) store.set(null); renderCart(); }
      catch (e) { console.error(e); }
    }
  })();
})();
