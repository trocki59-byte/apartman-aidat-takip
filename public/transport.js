export const storageMode = 'server';
export function request(path, body, csrf) {
  return fetch('/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, credentials: 'same-origin', body: body === undefined ? undefined : JSON.stringify(body) });
}
