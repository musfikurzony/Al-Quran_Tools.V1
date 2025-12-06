/* sujas.js - small UI helpers */
(function(){
  window.Sujas = {
    init: function(){
      // Close modals on outside click
      document.addEventListener('click', function(e){
        // grammar modal
        const gm = document.getElementById('grammarModal');
        if(gm && gm.style.display === 'flex'){
          const inside = e.target.closest('.modal-content');
          if(!inside) gm.style.display = 'none';
        }
        // word modal
        const wm = document.getElementById('wordModal');
        if(wm && wm.style.display === 'flex'){
          const inside2 = e.target.closest('.modal-content');
          if(!inside2) wm.style.display = 'none';
        }
      });

      // close buttons already wired in script.js (IDs closeGrammar / closeWord)
    }
  };

  // auto-init
  window.addEventListener('DOMContentLoaded', function(){ if(window.Sujas) Sujas.init(); });
})();
