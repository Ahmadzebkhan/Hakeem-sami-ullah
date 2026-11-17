const menuButton = document.querySelector(".menu");
const navLinks = document.querySelector(".navlinks");
if (menuButton && navLinks) menuButton.addEventListener("click", () => navLinks.classList.toggle("open"));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

const bookingForm = document.querySelector("#consultation-form");
if (bookingForm) {
  bookingForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = bookingForm.querySelector("button[type=submit]");
    const notice = bookingForm.querySelector(".notice");
    button.disabled = true;
    button.textContent = "Sending…";
    notice.style.display = "none";
    const payload = Object.fromEntries(new FormData(bookingForm).entries());
    try {
      const response = await fetch("/api/consultations", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit request.");
      notice.textContent = result.message;
      notice.style.display = "block";
      bookingForm.reset();
    } catch (error) {
      notice.textContent = error.message;
      notice.style.display = "block";
    } finally {
      button.disabled = false;
      button.textContent = "Request a consultation";
    }
  });
}

const productList = document.querySelector("#product-list");
if (productList) {
  fetch("/api/products").then(r => r.json()).then(products => {
    if (!products.length) {
      productList.innerHTML = '<p class="muted">No products are listed yet. Please check back soon.</p>';
      return;
    }
    productList.innerHTML = products.map(p => `
      <article class="product-card reveal visible">
        <div class="product-image">${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover">` : "❋"}</div>
        <div class="product-body"><small>${escapeHtml(p.category)}</small><h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description)}</p><div class="price">${p.price == null ? "Ask for price" : `PKR ${Number(p.price).toLocaleString("en-PK")}`}</div>
        <p><a class="btn outline" href="/consultation">Ask about this item ↗</a></p></div>
      </article>`).join("");
  }).catch(() => productList.innerHTML = '<p class="muted">Products could not be loaded right now.</p>');
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
