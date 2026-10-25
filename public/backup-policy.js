import { snapshotLocal } from './local-store.js';
export function backupDay(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));
  const part=type=>parts.find(p=>p.type===type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function createCheckpoint(existing,data,{previous,reason='Günlük otomatik yedek',now=new Date()}={}) {
  const createdAt=new Date(now).toISOString(),day=backupDay(now);
  const rows=existing.slice();let sequence=rows.reduce((n,r)=>Math.max(n,r.sequence||0),0);
  const record=(kind,state,id,label)=>({id,kind,day,createdAt,sequence:++sequence,reason:label,backup:snapshotLocal(state)});
  if(previous)rows.push(record('recent',previous,`recent:${crypto.randomUUID()}`,`${reason} · işlem öncesi`));
  const daily=record('daily',data,`daily:${day}`,reason);
  const all=rows.filter(r=>r.id!==daily.id).concat(daily);
  const days=all.filter(r=>r.kind==='daily').sort((a,b)=>b.day.localeCompare(a.day)).slice(0,30);
  const recent=all.filter(r=>r.kind==='recent').sort((a,b)=>b.sequence-a.sequence).slice(0,10);
  return [...days,...recent].sort((a,b)=>b.sequence-a.sequence);
}
export function backupMetadata(history) {
  return history.slice().sort((a,b)=>b.sequence-a.sequence).map(({id,kind,day,createdAt,reason,backup})=>({id,kind,day,createdAt,reason,units:backup.units.length,payments:backup.payments.length,charges:backup.charges.length,expenses:backup.expenses.length}));
}
