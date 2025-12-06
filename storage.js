/* storage.js - simple wrapper for localStorage (no export, global) */
window.AppStorage = {
  set(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){ console.error(e); }
  },
  get(key, defaultValue=null){
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : defaultValue; } catch(e){ return defaultValue; }
  },
  remove(key){ localStorage.removeItem(key); }
};

/* convenience: last-read, favorites, pinned */
window.AppStorage.getLastRead = function(){ return this.get('lastRead', null); };
window.AppStorage.setLastRead = function(obj){ this.set('lastRead', obj); };
window.AppStorage.getFavorites = function(){ return this.get('favorites', []); };
window.AppStorage.addFavorite = function(ayahRef){ const a = this.getFavorites(); if(!a.includes(ayahRef)) a.push(ayahRef); this.set('favorites', a); };
window.AppStorage.removeFavorite = function(ayahRef){ let a=this.getFavorites(); a = a.filter(x=>x!==ayahRef); this.set('favorites', a); };
