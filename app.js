const PRODUCTS = window.RAFA_PALMA_PRODUCTS || [];
const METHODS = window.RAFA_PALMA_METHODS || [];
const WHATSAPP_NUMBER = '5555991128100';

const state = { cart: [], checkoutStep: 1 };
const money = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const byId = id => document.getElementById(id);

function productCard(product){
  const firstSize = product.sizes[0];
  const sizeButtons = product.sizes.map((s,i)=>`<button type="button" class="size-btn ${i===0?'active':''}" data-grams="${s.grams}" data-price="${s.price}">${s.grams === 1000 ? '1 kg' : s.grams + ' g'}</button>`).join('');
  const typeButtons = [
    product.beans ? `<button type="button" class="type-btn active" data-type="graos">Em grãos</button>` : '',
    product.ground ? `<button type="button" class="type-btn" data-type="moido">Moído</button>` : ''
  ].join('');
  const methods = METHODS.map(m=>m ? `<option value="${m}">${m}</option>` : `<option value="" selected disabled>Selecione seu método</option>`).join('');
  const visual = product.image ? `<img src="${product.image}" alt="Café ${product.name}">` : `<div class="product-placeholder">${product.name}<small>CAFÉ RAFA PALMA</small></div>`;
  return `<article class="product-card" data-product-id="${product.id}" data-selected-grams="${firstSize.grams}" data-selected-price="${firstSize.price}" data-selected-type="${product.beans?'graos':'moido'}">
    <div class="product-visual">${visual}</div>
    <div class="product-body">
      <div class="product-title-row"><h3>${product.name}</h3><span class="product-price" data-price-display>${money(firstSize.price)}</span></div>
      <p class="product-desc">${product.description}</p>
      <span class="control-label">Tamanho</span><div class="segmented">${sizeButtons}</div>
      <span class="control-label">Como você prefere?</span><div class="segmented">${typeButtons}</div>
      ${product.ground ? `<div class="method-wrap hidden"><label class="control-label">Como você prepara seu café?</label><select class="method-select">${methods}</select><p class="helper hidden">Não se preocupe. Vamos indicar a moagem adequada para você.</p><div class="guidance-wrap hidden"><label class="control-label">Conte como você prepara seu café</label><textarea class="guidance-input" rows="2" placeholder="Ex.: uso coador de pano, cafeteira elétrica, filtro de papel..."></textarea><p class="guidance-help">Essa informação ajuda a Rafa Palma a indicar a moagem adequada.</p></div></div>`:''}
      <div class="product-actions"><div class="quantity-row"><select class="qty-select" aria-label="Quantidade">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}">${n} un.</option>`).join('')}</select></div><button class="btn btn-primary add-btn" type="button">Adicionar</button></div>
    </div>
  </article>`;
}


function methodOrderLabel(method){
  if(method==='Não sei qual escolher') return 'Cliente precisa de orientação';
  return method;
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
      method.classList.remove('needs-attention');
      const needsGuidance=method.value==='Não sei qual escolher';
      card.querySelector('.helper').classList.toggle('hidden',!needsGuidance);
      card.querySelector('.guidance-wrap')?.classList.toggle('hidden',!needsGuidance);
      if(!needsGuidance){
        const guidance=card.querySelector('.guidance-input');
        if(guidance) guidance.value='';
      }
    });
    card.querySelector('.guidance-input')?.addEventListener('input',e=>e.target.classList.remove('needs-attention'));
    card.querySelector('.add-btn').addEventListener('click',()=>addFromCard(card));
  });
}

function addFromCard(card){
  const product=PRODUCTS.find(p=>p.id===card.dataset.productId);
  const type=card.dataset.selectedType;
  const method=type==='moido' ? card.querySelector('.method-select')?.value || '' : '';
  if(type==='moido' && !method){
    const select=card.querySelector('.method-select');
    select?.classList.add('needs-attention');
    select?.focus();
    alert('Precisamos saber como você prepara seu café para fazermos a moagem adequada.');
    return;
  }
  const guidance=type==='moido' && method==='Não sei qual escolher' ? (card.querySelector('.guidance-input')?.value || '').trim() : '';
  if(type==='moido' && method==='Não sei qual escolher' && !guidance){
    const field=card.querySelector('.guidance-input');
    field?.classList.add('needs-attention');
    field?.focus();
    alert('Conte rapidamente como você prepara seu café para podermos indicar a moagem adequada.');
    return;
  }
  const qty=Number(card.querySelector('.qty-select').value);
  const key=[product.id,card.dataset.selectedGrams,type,method,guidance].join('|');
  const existing=state.cart.find(i=>i.key===key);
  if(existing) existing.qty+=qty; else state.cart.push({key,productId:product.id,name:product.name,grams:Number(card.dataset.selectedGrams),price:Number(card.dataset.selectedPrice),type,method,guidance,qty});
  renderCart();
  const addBtn=card.querySelector('.add-btn');
  const originalText='Adicionar';
  addBtn.textContent=`✓ ${qty} ${qty===1?'adicionado':'adicionados'}`;
  addBtn.classList.add('added');
  clearTimeout(addBtn._feedbackTimer);
  addBtn._feedbackTimer=setTimeout(()=>{
    addBtn.textContent=originalText;
    addBtn.classList.remove('added');
  },1600);
}

function renderCart(){
  const items=byId('cartItems'), empty=byId('cartEmpty'), footer=byId('cartFooter');
  const count=state.cart.reduce((s,i)=>s+i.qty,0); byId('cartBadge').textContent=count;
  const quickCart=byId('quickCart');
  const quickSummary=byId('quickCartSummary');
  const runningTotal=state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  if(quickCart && quickSummary){
    quickSummary.textContent=`${count} ${count===1?'item':'itens'} · ${money(runningTotal)}`;
    quickCart.classList.toggle('hidden',count===0);
  }
  if(!state.cart.length){items.innerHTML='';empty.classList.remove('hidden');footer.classList.add('hidden');return;}
  empty.classList.add('hidden');footer.classList.remove('hidden');
  items.innerHTML=state.cart.map((i,idx)=>`<div class="cart-item"><div><h4>${i.name} · ${i.grams} g</h4><div class="cart-meta">${i.type==='graos'?'Em grãos':`Moído · ${methodOrderLabel(i.method)}${i.guidance?`<br><span class="cart-guidance">Como prepara: ${i.guidance}</span>`:''}`}</div><div class="cart-controls"><button class="qty-btn" data-action="minus" data-index="${idx}">−</button><strong>${i.qty}</strong><button class="qty-btn" data-action="plus" data-index="${idx}">+</button><button class="remove-btn" data-action="remove" data-index="${idx}">Excluir</button></div></div><div class="cart-price">${money(i.price*i.qty)}</div></div>`).join('');
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
function goStep(step){state.checkoutStep=step;document.querySelectorAll('.checkout-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===step));document.querySelectorAll('[data-step-dot]').forEach(x=>x.classList.toggle('active',Number(x.dataset.stepDot)<=step));byId('checkoutTitle').textContent=step===1?'Seus dados':step===2?'Entrega':'Resumo do seu pedido';if(step===3){saveRememberedCustomerData();renderReview()}}


const onlyDigits = value => (value || '').replace(/\D/g,'');

function formatCPF(value){
  const d=onlyDigits(value).slice(0,11);
  return d.replace(/(\d{3})(\d)/,'$1.$2')
          .replace(/(\d{3})(\d)/,'$1.$2')
          .replace(/(\d{3})(\d{1,2})$/,'$1-$2');
}

function formatPhone(value){
  const d=onlyDigits(value).slice(0,11);
  if(d.length<=10){
    return d.replace(/(\d{2})(\d)/,'($1) $2')
            .replace(/(\d{4})(\d)/,'$1-$2');
  }
  return d.replace(/(\d{2})(\d)/,'($1) $2')
          .replace(/(\d{5})(\d)/,'$1-$2');
}

function formatCEP(value){
  const d=onlyDigits(value).slice(0,8);
  return d.replace(/(\d{5})(\d)/,'$1-$2');
}

function isValidCPF(value){
  const cpf=onlyDigits(value);
  if(cpf.length!==11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = size => {
    let sum=0;
    for(let i=0;i<size;i++) sum += Number(cpf[i]) * (size+1-i);
    const r=(sum*10)%11;
    return r===10 ? 0 : r;
  };
  return calc(9)===Number(cpf[9]) && calc(10)===Number(cpf[10]);
}

function setCepStatus(message, type='hint'){
  const el=byId('cepStatus');
  if(!el) return;
  el.textContent=message;
  el.classList.remove('error','success');
  if(type==='error') el.classList.add('error');
  if(type==='success') el.classList.add('success');
}

async function lookupCEP(){
  const form=byId('checkoutForm');
  const cep=onlyDigits(form.cep.value);
  if(cep.length!==8){
    setCepStatus('Informe os 8 números do CEP.','error');
    return;
  }
  setCepStatus('Buscando endereço...');
  try{
    const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if(!response.ok) throw new Error('Falha na consulta');
    const data=await response.json();
    if(data.erro) throw new Error('CEP não encontrado');
    form.street.value=data.logradouro || '';
    form.district.value=data.bairro || '';
    form.city.value=data.localidade || '';
    form.state.value=(data.uf || '').toUpperCase();
    setCepStatus('Endereço encontrado. Confira e informe o número.','success');
    if(form.street.value) form.number.focus();
  }catch{
    setCepStatus('Não conseguimos localizar esse CEP. Preencha o endereço manualmente.','error');
  }
}


const CUSTOMER_STORAGE_KEY='rafaPalmaCustomerDataV1';

function getRememberedCustomerData(){
  try{
    return JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY) || 'null');
  }catch{
    return null;
  }
}

function saveRememberedCustomerData(){
  const form=byId('checkoutForm');
  if(!form?.rememberData?.checked) return;
  const data={
    name:form.name.value,
    cpf:form.cpf.value,
    phone:form.phone.value,
    email:form.email.value,
    delivery:form.delivery.value,
    cep:form.cep.value,
    street:form.street.value,
    number:form.number.value,
    complement:form.complement.value,
    district:form.district.value,
    city:form.city.value,
    state:form.state.value
  };
  try{
    localStorage.setItem(CUSTOMER_STORAGE_KEY,JSON.stringify(data));
  }catch{}
}

function clearRememberedCustomerData(){
  try{localStorage.removeItem(CUSTOMER_STORAGE_KEY)}catch{}
}

function restoreRememberedCustomerData(){
  const form=byId('checkoutForm');
  if(!form) return;
  const data=getRememberedCustomerData();
  if(!data) return;

  ['name','cpf','phone','email','cep','street','number','complement','district','city','state'].forEach(name=>{
    if(form.elements[name] && data[name] !== undefined) form.elements[name].value=data[name] || '';
  });

  if(form.rememberData) form.rememberData.checked=true;

  if(data.delivery){
    const deliveryInput=form.querySelector(`input[name="delivery"][value="${data.delivery}"]`);
    if(deliveryInput){
      deliveryInput.checked=true;
      deliveryInput.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }
}

function setupFormUX(){
  const form=byId('checkoutForm');
  restoreRememberedCustomerData();
  form.cpf.addEventListener('input',e=>e.target.value=formatCPF(e.target.value));
  form.phone.addEventListener('input',e=>e.target.value=formatPhone(e.target.value));
  form.cep.addEventListener('input',e=>{
    e.target.value=formatCEP(e.target.value);
    const digits=onlyDigits(e.target.value);
    if(digits.length<8) setCepStatus('Ao informar o CEP, buscamos o endereço automaticamente.');
    if(digits.length===8) lookupCEP();
  });
  form.state.addEventListener('input',e=>e.target.value=e.target.value.replace(/[^a-zA-Z]/g,'').slice(0,2).toUpperCase());
  form.querySelectorAll('input,textarea').forEach(input=>{
    input.addEventListener('input',()=>input.closest('.field')?.classList.remove('invalid'));
  });

  form.rememberData?.addEventListener('change',()=>{
    if(!form.rememberData.checked) clearRememberedCustomerData();
  });
}

function validateStep(step){
  const form=byId('checkoutForm');
  const pane=document.querySelector(`.checkout-step[data-step="${step}"]`);
  let ok=true;

  pane.querySelectorAll('[required]').forEach(input=>{
    const field=input.closest('.field');
    let valid=Boolean(input.value.trim());

    if(input.type==='email' && input.value.trim()) valid=input.validity.valid;
    if(input.name==='cpf') valid=isValidCPF(input.value);
    if(input.name==='phone') valid=onlyDigits(input.value).length>=10;

    field?.classList.toggle('invalid',!valid);
    if(!valid) ok=false;
  });

  if(step===2 && form.delivery.value==='envio'){
    ['cep','street','number','district','city','state'].forEach(name=>{
      const input=form.elements[name];
      let valid=Boolean(input.value.trim());
      if(name==='cep') valid=onlyDigits(input.value).length===8;
      if(name==='state') valid=input.value.trim().length===2;
      input.closest('.field')?.classList.toggle('invalid',!valid);
      if(!valid) ok=false;
    });
  }

  if(!ok){
    const firstInvalid=pane.querySelector('.field.invalid input, .field.invalid textarea');
    firstInvalid?.focus();
  }
  return ok;
}

function renderReview(){
  const form=byId('checkoutForm'); const total=state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  let html=`<div class="review-line"><div><strong>${form.name.value}</strong><small>${form.phone.value} · ${form.email.value}</small></div></div>`;
  html+=state.cart.map(i=>`<div class="review-line"><div><strong>${i.qty} × ${i.name} ${i.grams} g</strong><small>${i.type==='graos'?'Em grãos':`Moído · ${methodOrderLabel(i.method)}${i.guidance?`<br>Como prepara: ${i.guidance}`:''}`}</small></div><strong>${money(i.qty*i.price)}</strong></div>`).join('');
  const delivery=form.delivery.value==='retirada'?'Retirada':`${form.street.value}, ${form.number.value} · ${form.district.value} · ${form.city.value}/${form.state.value.toUpperCase()}`;
  html+=`<div class="review-line"><div><strong>Entrega</strong><small>${delivery}</small></div></div><div class="review-line review-total"><span>Total dos produtos</span><strong>${money(total)}</strong></div><p class="freight-note">Entrega: frete calculado após o envio do pedido antes do pagamento.</p>`;
  byId('orderReview').innerHTML=html;
}

function buildWhatsAppMessage(){
  saveRememberedCustomerData();
  const f=byId('checkoutForm');
  const total=state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  const isPickup=f.delivery.value==='retirada';

  const lines=[
    '☕ *NOVO PEDIDO — CAFÉ RAFA PALMA*',
    '',
    '👤 *CLIENTE*',
    `Nome: ${f.name.value}`,
    `CPF: ${f.cpf.value}`,
    `WhatsApp: ${f.phone.value}`,
    `E-mail: ${f.email.value}`,
    '',
    '────────────────────',
    '☕ *PEDIDO*',
    ''
  ];

  state.cart.forEach((i,index)=>{
    const itemSubtotal=i.qty*i.price;
    lines.push(
      `*${index+1}. Café ${i.name} — ${i.grams} g*`,
      `Tipo: ${i.type==='graos'?'Em grãos':'Moído'}`,
      ...(i.type==='moido' ? [
        `Método: ${methodOrderLabel(i.method)}`,
        ...(i.guidance ? [`Como prepara: ${i.guidance}`] : [])
      ] : []),
      `Quantidade: ${i.qty}`,
      `Valor unitário: ${money(i.price)}`,
      `Subtotal: ${money(itemSubtotal)}`,
      ''
    );
  });

  lines.push(
    '────────────────────',
    '💰 *VALORES*',
    `Produtos: ${money(total)}`
  );

  if(isPickup){
    lines.push(
      'Retirada: sem frete',
      `Total: ${money(total)}`
    );
  } else {
    lines.push(
      `Frete: calcular para CEP ${f.cep.value}`,
      'Pedido aguardando cálculo do frete e confirmação do cliente.'
    );
  }

  lines.push(
    '',
    '────────────────────',
    '📍 *ENTREGA*'
  );

  if(isPickup){
    lines.push('Tipo de entrega: Retirada');
  } else {
    lines.push(
      'Tipo de entrega: Envio',
      `CEP: ${f.cep.value}`,
      `Endereço: ${f.street.value}, ${f.number.value}`,
      `Complemento: ${f.complement.value || '—'}`,
      `Bairro: ${f.district.value}`,
      `Cidade/UF: ${f.city.value}/${f.state.value.toUpperCase()}`
    );
  }

  if(f.notes.value.trim()){
    lines.push('', '📝 *OBSERVAÇÕES*', f.notes.value.trim());
  }

  lines.push(
    '',
    '────────────────────',
    '📦 Pedido realizado pelo site Café Rafa Palma',
    'Obrigado pela preferência! ☕'
  );

  return lines.join('\n');
}

byId('openCartBtn').addEventListener('click',openCart);
byId('quickCart')?.addEventListener('click',openCart);byId('closeCartBtn').addEventListener('click',closeCart);byId('overlay').addEventListener('click',closeCart);byId('continueShoppingBtn').addEventListener('click',closeCart);byId('continueShoppingEmpty').addEventListener('click',closeCart);byId('checkoutBtn').addEventListener('click',openCheckout);byId('closeCheckoutBtn').addEventListener('click',closeCheckout);
document.querySelectorAll('[data-next]').forEach(btn=>btn.addEventListener('click',()=>{const next=Number(btn.dataset.next);if(validateStep(next-1))goStep(next)}));document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>goStep(Number(btn.dataset.back))));
byId('checkoutForm').addEventListener('change',e=>{if(e.target.name==='delivery')byId('addressFields').classList.toggle('hidden',e.target.value!=='envio')});
byId('checkoutForm').addEventListener('submit',e=>{e.preventDefault();if(!validateStep(1)||!validateStep(2))return;const msg=encodeURIComponent(buildWhatsAppMessage());window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`,'_blank','noopener,noreferrer')});

setupFormUX();renderProducts();renderCart();
