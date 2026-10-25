import { ensure, cents, id, text, date, period, InputError } from './validation.js';
const stamp = () => new Date().toISOString();
const sorted = (rows, key) => rows.slice().sort((a,b) => (key ? a[key].localeCompare(b[key]) : 0) || a.id-b.id);
const sum = (rows,key='amountCents') => rows.reduce((n,r)=>n+r[key],0);
export function initialData() {
  return { settings:{id:1,name:'Apartman Yönetimi',address:'',monthlyCents:200000,dueDay:10}, units:[], accounts:[{id:1,name:'Nakit Kasa',openingCents:0},{id:2,name:'Banka',openingCents:0}], charges:[], payments:[], expenses:[], transfers:[], allocations:[], audit:[] };
}
function recalculate(d) {
  d.allocations=[];
  for(const c of d.charges) c.paidCents=0;
  const charges=sorted(d.charges.filter(c=>!c.voidReason),'dueDate');
  for(const p of sorted(d.payments.filter(p=>!p.voidReason),'date')) {
    let remaining=p.amountCents;
    const own=charges.filter(c=>c.unitId===p.unitId);
    if(p.chargeId) own.sort((a,b)=>Number(b.id===p.chargeId)-Number(a.id===p.chargeId));
    for(const c of own) {
      const amount=Math.min(remaining,c.amountCents-c.paidCents);
      if(amount>0) {d.allocations.push({paymentId:p.id,chargeId:c.id,amountCents:amount});c.paidCents+=amount;remaining-=amount;}
      if(!remaining) break;
    }
  }
  for(const u of d.units) {
    const own=charges.filter(c=>c.unitId===u.id);
    u.debtCents=sum(own)-sum(own,'paidCents');
    u.advanceCents=sum(d.payments.filter(p=>!p.voidReason&&p.unitId===u.id))-sum(own,'paidCents');
  }
  for(const a of d.accounts) a.balanceCents=a.openingCents+sum(d.payments.filter(p=>!p.voidReason&&p.accountId===a.id))-sum(d.expenses.filter(e=>!e.voidReason&&e.accountId===a.id))+d.transfers.filter(t=>!t.voidReason).reduce((n,t)=>n+(t.toId===a.id?t.amountCents:0)-(t.fromId===a.id?t.amountCents:0),0);
  return d;
}
export function snapshotLocal(data) {
  const d=recalculate(structuredClone(data));
  d.units=sorted(d.units);d.charges=sorted(d.charges,'dueDate');d.payments=sorted(d.payments,'date');d.expenses=sorted(d.expenses,'date');d.transfers=sorted(d.transfers,'date');
  d.audit=d.audit.slice().sort((a,b)=>b.id-a.id).slice(0,500);
  return {...d,backupFormat:'aidat-browser-v1',storageMode:'browser'};
}
export function executeLocal(data,action,p) {
  ensure(p&&typeof p==='object'&&!Array.isArray(p),'İşlem bilgileri geçersiz.');
  const d=structuredClone(data);
  const find=(table,value)=>{id(value);const row=d[table].find(r=>r.id===value);ensure(row,'Kayıt bulunamadı.',404);return row;};
  const add=(table,values)=>{const row={id:d[table].reduce((n,r)=>Math.max(n,r.id),0)+1,...values};if(['charges','payments','expenses','transfers','audit'].includes(table))row.createdAt=stamp();d[table].push(row);return row;};
  let result;
  switch(action) {
    case 'unit.save': {
      ensure(typeof p.active==='boolean','Daire durumu geçersiz.');
      const u={number:text(p.number,'Daire numarası',20,true),owner:text(p.owner,'Malik',100),resident:text(p.resident,'Sakin',100),phone:text(p.phone,'Telefon',30),monthlyCents:cents(p.monthlyCents,true),active:p.active};
      ensure(!d.units.some(r=>r.number===u.number&&r.id!==p.id),'Bu daire numarası zaten kayıtlı.');
      if(p.id){Object.assign(find('units',p.id),u);result={id:p.id,...u};}else result=add('units',u);break;
    }
    case 'charge.batch': {
      period(p.period);date(p.dueDate);
      const rows=d.units.filter(u=>u.active&&u.monthlyCents>0&&!d.charges.some(c=>c.unitId===u.id&&c.kind==='dues'&&c.period===p.period&&!c.voidReason));
      ensure(rows.length,'Bu dönem aidatlar zaten oluşturulmuş veya aidatı olan aktif daire yok.');
      for(const u of rows)add('charges',{unitId:u.id,kind:'dues',period:p.period,dueDate:p.dueDate,amountCents:u.monthlyCents,note:'Aylık aidat',voidReason:null});
      result={count:rows.length,totalCents:sum(rows,'monthlyCents')};break;
    }
    case 'charge.add':
      ensure(['extra','opening'].includes(p.kind),'Borç türü geçersiz.');
      result=add('charges',{unitId:find('units',p.unitId).id,kind:p.kind,period:null,dueDate:date(p.dueDate),amountCents:cents(p.amountCents),note:text(p.note,'Açıklama',300,true),voidReason:null});break;
    case 'payment.add': {
      const v={unitId:find('units',p.unitId).id,accountId:find('accounts',p.accountId).id,chargeId:p.chargeId?find('charges',p.chargeId).id:null,date:date(p.date),amountCents:cents(p.amountCents),note:text(p.note||'','Açıklama',300),requestKey:text(p.requestKey,'İşlem anahtarı',100,true)};
      if(v.chargeId){const c=find('charges',v.chargeId);ensure(c.unitId===v.unitId&&!c.voidReason,'Seçilen borç bu daireye ait değil veya iptal edilmiş.');}
      const previous=d.payments.find(r=>r.requestKey===v.requestKey);
      if(previous){ensure(Object.keys(v).every(k=>previous[k]===v[k]),'Aynı işlem anahtarı farklı bilgilerle kullanılamaz.');return {data:d,result:{id:previous.id,duplicate:true}};}
      result=add('payments',{...v,voidReason:null});break;
    }
    case 'expense.add':result=add('expenses',{accountId:find('accounts',p.accountId).id,date:date(p.date),category:text(p.category,'Kategori',80,true),amountCents:cents(p.amountCents),note:text(p.note||'','Açıklama',300),voidReason:null});break;
    case 'transfer.add':
      ensure(p.fromId!==p.toId,'Kaynak ve hedef hesap farklı olmalı.');
      result=add('transfers',{fromId:find('accounts',p.fromId).id,toId:find('accounts',p.toId).id,date:date(p.date),amountCents:cents(p.amountCents),note:text(p.note||'','Açıklama',300),voidReason:null});break;
    case 'account.opening':find('accounts',p.id).openingCents=cents(p.openingCents,true,true);result={id:p.id};break;
    case 'record.void': {
      ensure(['charges','payments','expenses','transfers'].includes(p.type),'Kayıt türü geçersiz.');const r=find(p.type,p.id);
      ensure(!r.voidReason,'Kayıt zaten iptal edilmiş.');r.voidReason=text(p.reason,'İptal gerekçesi',300,true);result={id:p.id};break;
    }
    case 'settings.save':
      ensure(Number.isInteger(p.dueDay)&&p.dueDay>=1&&p.dueDay<=28,'Son ödeme günü 1–28 arasında olmalı.');
      d.settings={id:1,name:text(p.name,'Apartman adı',100,true),address:text(p.address,'Adres',300),monthlyCents:cents(p.monthlyCents,true),dueDay:p.dueDay};result={};break;
    default:throw new InputError('İşlem bulunamadı.',404);
  }
  add('audit',{action,payload:JSON.stringify({...p,requestKey:undefined})});
  d.audit=d.audit.slice(-500);
  return {data:recalculate(d),result};
}
export function restoreBackup(input) {
  ensure(input&&input.backupFormat==='aidat-browser-v1','Bu dosya bir aidat takip yedeği değil.');
  const d=initialData();
  ensure(input.settings&&typeof input.settings==='object','Apartman ayarları eksik.');
  d.settings=executeLocal(d,'settings.save',input.settings).data.settings;
  for(const table of ['units','accounts','charges','payments','expenses','transfers','audit']) {
    ensure(Array.isArray(input[table])&&input[table].length<=50000,'Yedek kayıtları eksik veya dosya çok büyük.');
    const ids=new Set();for(const r of input[table]){ensure(r&&typeof r==='object'&&!Array.isArray(r),'Geçersiz yedek kaydı.');id(r.id);ensure(!ids.has(r.id),'Yedekte yinelenen kayıt numarası var.');ids.add(r.id);}
  }
  const ref=(table,value)=>{id(value);ensure(d[table].some(r=>r.id===value),'Yedekte geçersiz kayıt bağlantısı var.');return value;};
  d.units=input.units.map(u=>{ensure(typeof u.active==='boolean','Daire durumu geçersiz.');return {id:u.id,number:text(u.number,'Daire numarası',20,true),owner:text(u.owner,'Malik',100),resident:text(u.resident,'Sakin',100),phone:text(u.phone,'Telefon',30),monthlyCents:cents(u.monthlyCents,true),active:u.active};});
  ensure(new Set(d.units.map(u=>u.number)).size===d.units.length,'Yedekte yinelenen daire numarası var.');
  ensure(input.accounts.length===2&&input.accounts.some(a=>a.id===1)&&input.accounts.some(a=>a.id===2),'Yedekte kasa ve banka hesapları eksik.');
  d.accounts=input.accounts.map(a=>({id:a.id,name:text(a.name,'Hesap adı',100,true),openingCents:cents(a.openingCents,true,true)}));
  const extra=r=>({voidReason:r.voidReason?text(r.voidReason,'İptal gerekçesi',300,true):null,createdAt:text(r.createdAt||stamp(),'Kayıt tarihi',50,true)});
  d.charges=input.charges.map(c=>{ensure(['dues','extra','opening'].includes(c.kind),'Borç türü geçersiz.');return {id:c.id,unitId:ref('units',c.unitId),kind:c.kind,period:c.kind==='dues'?period(c.period):null,dueDate:date(c.dueDate),amountCents:cents(c.amountCents),note:text(c.note||'','Açıklama',300),...extra(c)};});
  const uniqueDues=d.charges.filter(c=>c.kind==='dues'&&!c.voidReason).map(c=>c.unitId+':'+c.period);
  ensure(new Set(uniqueDues).size===uniqueDues.length,'Yedekte yinelenen dönem aidatı var.');
  d.payments=input.payments.map(p=>{
    const unitId=ref('units',p.unitId),chargeId=p.chargeId?ref('charges',p.chargeId):null;
    if(chargeId)ensure(d.charges.find(c=>c.id===chargeId).unitId===unitId,'Yedekte tahsilat farklı daireye bağlı.');
    return {id:p.id,unitId,chargeId,accountId:ref('accounts',p.accountId),date:date(p.date),amountCents:cents(p.amountCents),note:text(p.note||'','Açıklama',300),requestKey:text(p.requestKey,'İşlem anahtarı',100,true),...extra(p)};
  });
  ensure(new Set(d.payments.map(p=>p.requestKey)).size===d.payments.length,'Yedekte yinelenen tahsilat anahtarı var.');
  d.expenses=input.expenses.map(e=>({id:e.id,accountId:ref('accounts',e.accountId),date:date(e.date),amountCents:cents(e.amountCents),category:text(e.category,'Kategori',80,true),note:text(e.note||'','Açıklama',300),...extra(e)}));
  d.transfers=input.transfers.map(t=>{ensure(t.fromId!==t.toId,'Transfer hesapları aynı olamaz.');return {id:t.id,fromId:ref('accounts',t.fromId),toId:ref('accounts',t.toId),date:date(t.date),amountCents:cents(t.amountCents),note:text(t.note||'','Açıklama',300),...extra(t)};});
  d.audit=input.audit.slice(-500).map(a=>({id:a.id,action:text(a.action,'İşlem türü',100,true),payload:text(a.payload||'{}','İşlem bilgisi',10000),createdAt:text(a.createdAt||stamp(),'İşlem tarihi',50,true)}));
  return recalculate(d);
}
