const PRODUCTS = window.RAFA_PALMA_PRODUCTS || [];
const METHODS = window.RAFA_PALMA_METHODS || [];
const WHATSAPP_NUMBER = '5555991128100';

const state = { cart: [], checkoutStep: 1 };
const money = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const byId = id => document.getElementById(id);

function productCard(product){
  const firstSize = product.sizes[0];
  const sizeButtons = product.sizes.map((s,i)=>`<button type="button" class="size-btn ${i===0?'active':''}" data-grams="${s.grams}" data-price="${s.price}">${s.grams} g</button>`).join('');
  const typeButtons = [
    product.beans ? `<button type="button" class="type-btn active" data-type="graos">Em grãos</button>` : '',
    product.ground ? `<button type="button" class="type-btn" data-type="moido">Moído</button>` : ''
  ].join('');
  const methods = METHODS.map(m=>`<option value="${m}">${m}</option>`).join('');
  const visual = product.image ? `<img src="${product.image}" alt="Café ${product.name}">` : `<div class="product-placeholder">${product.name}<small>CAFÉ RAFA PALMA</small></div>`;
  return `<article class="product-card" data-product-id="${product.id}" data-selected-grams="${firstSize.grams}" data-selected-price="${firstSize.price}" data-selected-type="${product.beans?'graos':'moido'}">
    <div class="product-visual">${visual}</div>
    <div class="product-body">
      <div class="product-title-row"><h3>${product.name}</h3><span class="product-price" data-price-display>${money(firstSize.price)}</span></div>
      <p class="product-desc">${product.description}</p>
      <span class="control-label">Tamanho</span><div class="segmented">${sizeButtons}</div>
      <span class="control-label">Como você prefere?</span><div class="segmented">${typeButtons}</div>
      ${product.ground ? `<div class="method-wrap hidden"><label class="control-label">Como você prepara seu café?</label><select class="method-select">${methods}</select><p class="helper hidden">Não se preocupe. Vamos indicar a moagem adequada para você.</p></div>`:''}
      <div class="product-actions"><div class="quantity-row"><select class="qty-select" aria-label="Quantidade">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}">${n} un.</option>`).join('')}</select></div><button class="btn btn-primary add-btn" type="button">Adicionar ao pedido</button></div>
    </div>
  </article>`;
}

function renderProducts(){
  byId('productsGrid').innerHTML = PRODUCTS.map(productCard).join('');
  document.querySelectorAll('.product-card').forEach(card=>{
    card.querySelectorAll('.size-btn').forEach(btn=>btn.addEventListener('click',()=>{
      card.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
      card.dataset.selectedGrams=btn.dataset.grams; card.dataset.selectedPrice=btn.dataset.price;
      card.querySelector('[data-price-display]').textContent=money(Number(btn.dataset.price));
    }));
    card.querySelectorAll('.type-btn').forEach(btn=>btn.addEventListener('click',()=>{
      card.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
      card.dataset.selectedType=btn.dataset.type;
      const wrap=card.querySelector('.method-wrap'); if(wrap) wrap.classList.toggle('hidden',btn.dataset.type!=='moido');
    }));
    const method=card.querySelector('.method-select'); if(method) method.addEventListener('change',()=>{
      card.querySelector('.helper').classList.toggle('hidden',method.value!=='Não sei qual escolher');
    });
    card.querySelector('.add-btn').addEventListener('click',()=>addFromCard(card));
  });
}

function addFromCard(card){
  const product=PRODUCTS.find(p=>p.id===card.dataset.productId);
  const type=card.dataset.selectedType;
  const method=type==='moido' ? card.querySelector('.method-select')?.value || '' : '';
  const qty=Number(card.querySelector('.qty-select').value);
  const key=[product.id,card.dataset.selectedGrams,type,method].join('|');
  const existing=state.cart.find(i=>i.key===key);
  if(existing) existing.qty+=qty; else state.cart.push({key,productId:product.id,name:product.name,grams:Number(card.dataset.selectedGrams),price:Number(card.dataset.selectedPrice),type,method,qty});
  renderCart(); openCart();
}

function renderCart(){
  const items=byId('cartItems'), empty=byId('cartEmpty'), footer=byId('cartFooter');
  const count=state.cart.reduce((s,i)=>s+i.qty,0); byId('cartBadge').textContent=count;
  if(!state.cart.length){items.innerHTML='';empty.classList.remove('hidden');footer.classList.add('hidden');return;}
  empty.classList.add('hidden');footer.classList.remove('hidden');
  items.innerHTML=state.cart.map((i,idx)=>`<div class="cart-item"><div><h4>${i.name} · ${i.grams} g</h4><div class="cart-meta">${i.type==='graos'?'Em grãos':`Moído · ${i.method}`}</div><div class="cart-controls"><button class="qty-btn" data-action="minus" data-index="${idx}">−</button><strong>${i.qty}</strong><button class="qty-btn" data-action="plus" data-index="${idx}">+</button><button class="remove-btn" data-action="remove" data-index="${idx}">Excluir</button></div></div><div class="cart-price">${money(i.price*i.qty)}</div></div>`).join('');
  const total=state.cart.reduce((s,i)=>s+i.price*i.qty,0); byId('cartTotal').textContent=money(total);
  items.querySelectorAll('button[data-action]').forEach(btn=>btn.addEventListener('click',()=>{
    const idx=Number(btn.dataset.index), action=btn.dataset.action;
    if(action==='plus') state.cart[idx].qty++;
    if(action==='minus'){state.cart[idx].qty--;if(state.cart[idx].qty<=0)state.cart.splice(idx,1)}
    if(action==='remove')state.cart.splice(idx,1);
    renderCart();
  }));
}

function openCart(){byId('cartDrawer').classList.add('open');byId('cartDrawer').setAttribute('aria-hidden','false');byId('overlay').hidden=false}
function closeCart(){byId('cartDrawer').classList.remove('open');byId('cartDrawer').setAttribute('aria-hidden','true');byId('overlay').hidden=true}
function openCheckout(){if(!state.cart.length)return;closeCart();byId('checkoutModal').classList.add('open');byId('checkoutModal').setAttribute('aria-hidden','false');goStep(1)}
function closeCheckout(){byId('checkoutModal').classList.remove('open');byId('checkoutModal').setAttribute('aria-hidden','true')}
function goStep(step){state.checkoutStep=step;document.querySelectorAll('.checkout-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===step));document.querySelectorAll('[data-step-dot]').forEach(x=>x.classList.toggle('active',Number(x.dataset.stepDot)<=step));byId('checkoutTitle').textContent=step===1?'Seus dados':step===2?'Entrega':'Resumo do seu pedido';if(step===3)renderReview()}

function validateStep(step){
  const pane=document.querySelector(`.checkout-step[data-step="${step}"]`); let ok=true;
  pane.querySelectorAll('[required]').forEach(input=>{const field=input.closest('.field');const valid=input.value.trim() && (input.type!=='email'||input.validity.valid);field?.classList.toggle('invalid',!valid);if(!valid)ok=false});
  if(step===2 && byId('checkoutForm').delivery.value==='envio'){
    ['cep','street','number','district','city','state'].forEach(name=>{const input=byId('checkoutForm').elements[name];const valid=input.value.trim();input.closest('.field')?.classList.toggle('invalid',!valid);if(!valid)ok=false})
  }
  return ok;
}

function renderReview(){
  const form=byId('checkoutForm'); const total=state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  let html=`<div class="review-line"><div><strong>${form.name.value}</strong><small>${form.phone.value} · ${form.email.value}</small></div></div>`;
  html+=state.cart.map(i=>`<div class="review-line"><div><strong>${i.qty} × ${i.name} ${i.grams} g</strong><small>${i.type==='graos'?'Em grãos':`Moído · ${i.method}`}</small></div><strong>${money(i.qty*i.price)}</strong></div>`).join('');
  const delivery=form.delivery.value==='retirada'?'Retirada':`${form.street.value}, ${form.number.value} · ${form.district.value} · ${form.city.value}/${form.state.value.toUpperCase()}`;
  html+=`<div class="review-line"><div><strong>Entrega</strong><small>${delivery}</small></div></div><div class="review-line review-total"><span>Total dos produtos</span><strong>${money(total)}</strong></div><p class="freight-note">Frete: a confirmar antes do pagamento.</p>`;
  byId('orderReview').innerHTML=html;
}

function buildWhatsAppMessage(){
  const f=byId('checkoutForm'); const total=state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  const lines=['*NOVO PEDIDO — CAFÉ RAFA PALMA*','',`Cliente: ${f.name.value}`,'','*PEDIDO*',''];
  state.cart.forEach(i=>{lines.push(`${i.qty} × Café ${i.name} ${i.grams} g`,i.type==='graos'?'Em grãos':`Moído · Método: ${i.method}`,`${money(i.qty*i.price)}`,'')});
  lines.push(`*Subtotal:* ${money(total)}`,'*Frete:* a confirmar',`*Total dos produtos:* ${money(total)}`,'','*ENTREGA*','',`Nome: ${f.name.value}`,`CPF: ${f.cpf.value}`,`WhatsApp: ${f.phone.value}`,`E-mail: ${f.email.value}`);
  if(f.delivery.value==='retirada') lines.push('Modalidade: Retirada'); else lines.push(`CEP: ${f.cep.value}`,`Endereço: ${f.street.value}, ${f.number.value}${f.complement.value?` · ${f.complement.value}`:''}`,`Bairro: ${f.district.value}`,`Cidade/UF: ${f.city.value}/${f.state.value.toUpperCase()}`);
  if(f.notes.value.trim()) lines.push('',`Observações: ${f.notes.value.trim()}`);
  return lines.join('\n');
}

byId('openCartBtn').addEventListener('click',openCart);byId('closeCartBtn').addEventListener('click',closeCart);byId('overlay').addEventListener('click',closeCart);byId('continueShoppingBtn').addEventListener('click',closeCart);byId('continueShoppingEmpty').addEventListener('click',closeCart);byId('checkoutBtn').addEventListener('click',openCheckout);byId('closeCheckoutBtn').addEventListener('click',closeCheckout);
document.querySelectorAll('[data-next]').forEach(btn=>btn.addEventListener('click',()=>{const next=Number(btn.dataset.next);if(validateStep(next-1))goStep(next)}));document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>goStep(Number(btn.dataset.back))));
byId('checkoutForm').addEventListener('change',e=>{if(e.target.name==='delivery')byId('addressFields').classList.toggle('hidden',e.target.value!=='envio')});
byId('checkoutForm').addEventListener('submit',e=>{e.preventDefault();if(!validateStep(1)||!validateStep(2))return;const msg=encodeURIComponent(buildWhatsAppMessage());window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`,'_blank','noopener,noreferrer')});

renderProducts();renderCart();
