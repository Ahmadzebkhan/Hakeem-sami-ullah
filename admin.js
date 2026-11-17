const auth = "Basic " + btoa(prompt("Admin username") + ":" + prompt("Admin password"));
const headers = { "Content-Type": "application/json", "Authorization": auth };
const productsBody = document.querySelector("#admin-products");
const consultBody = document.querySelector("#admin-consultations");
const status = document.querySelector("#admin-status");

async function api(url, options={}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  if (response.status === 401) throw new Error("Login failed. Refresh and try again.");
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function load(){
  try{
    const [products, consultations] = await Promise.all([api("/api/admin/products"),api("/api/admin/consultations")]);
    productsBody.innerHTML = products.map(p=>`<tr><td>${p.id}</td><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${p.price??"—"}</td><td>${p.stock}</td><td>${p.active?"Active":"Hidden"}</td><td><button class="btn outline" data-edit="${p.id}">Edit</button> <button class="btn outline" data-delete="${p.id}">Delete</button></td></tr>`).join("") || "<tr><td colspan=7>No products.</td></tr>";
    consultBody.innerHTML = consultations.map(c=>`<tr><td>${c.id}</td><td>${esc(c.full_name)}<br>${esc(c.phone)}<br>${esc(c.email)}</td><td>${esc(c.consultation_type)}<br>${esc(c.preferred_date)}</td><td>${esc(c.message)}</td><td><select data-status="${c.id}">${["New","Contacted","Confirmed","Completed","Cancelled"].map(s=>`<option ${s===c.status?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("") || "<tr><td colspan=5>No consultation requests.</td></tr>";
  }catch(e){status.textContent=e.message;}
}
document.querySelector("#product-form").addEventListener("submit",async e=>{
  e.preventDefault(); const form=e.currentTarget; const data=Object.fromEntries(new FormData(form).entries());
  const id=data.id; delete data.id; data.active=data.active==="on";
  try{await api(id?`/api/admin/products/${id}`:"/api/admin/products",{method:id?"PUT":"POST",body:JSON.stringify(data)});form.reset();form.elements.id.value="";status.textContent="Product saved.";load();}catch(err){status.textContent=err.message;}
});
productsBody.addEventListener("click",async e=>{
  const id=e.target.dataset.edit||e.target.dataset.delete;if(!id)return;
  try{
    if(e.target.dataset.delete){if(confirm("Delete this product?")){await api(`/api/admin/products/${id}`,{method:"DELETE"});load();}}
    else{const p=(await api("/api/admin/products")).find(x=>x.id===Number(id));const f=document.querySelector("#product-form");Object.entries(p).forEach(([k,v])=>{if(f.elements[k]){if(k==="active")f.elements[k].checked=!!v;else f.elements[k].value=v??"";}});window.scrollTo({top:0,behavior:"smooth"});}
  }catch(err){status.textContent=err.message;}
});
consultBody.addEventListener("change",async e=>{const id=e.target.dataset.status;if(!id)return;try{await api(`/api/admin/consultations/${id}`,{method:"PATCH",body:JSON.stringify({status:e.target.value})});status.textContent="Consultation status updated.";}catch(err){status.textContent=err.message;}});
load();
