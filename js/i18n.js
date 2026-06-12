/* CONE CREW — i18n.js : FR/EN strings */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});

  const D = {
    'menu.tagline':      { fr: '3 manches · 1 équipe · 0 incident', en: '3 shifts · 1 crew · 0 incidents' },
    'menu.play':         { fr: 'JOUER', en: 'PLAY' },
    'menu.howto':        { fr: 'COMMENT JOUER', en: 'HOW TO PLAY' },
    'menu.best':         { fr: 'RECORD', en: 'BEST' },
    'menu.board':        { fr: 'CLASSEMENT', en: 'LEADERBOARD' },
    'menu.credit':       { fr: 'Un jeu EHS — avec le cône REVO 42 R2 dans son propre rôle', en: 'An EHS game — starring the REVO 42 R2 cone as itself' },

    'stage.word':        { fr: 'MANCHE', en: 'STAGE' },
    'stage.start':       { fr: 'DÉMARRER', en: 'START' },
    'stage.ready':       { fr: 'PRÊT ?', en: 'READY?' },
    'stage.go':          { fr: 'GO !', en: 'GO!' },

    's1.name':           { fr: 'LE DÉPÔT', en: 'THE DEPOT' },
    's1.task':           { fr: 'Empile 10 cônes sur la palette. Lâche au bon moment — vise le centre !', en: 'Stack 10 cones on the pallet. Release at the right moment — aim dead centre!' },
    's1.hint':           { fr: 'Touche l’écran ou ESPACE pour lâcher', en: 'Tap the screen or press SPACE to drop' },

    's2.name':           { fr: 'POSE EXPRESS', en: 'ROLLING DEPLOY' },
    's2.task':           { fr: 'Ferme la voie : depuis le camion, largue un cône sur chaque repère.', en: 'Close the lane: drop a cone onto every marker from the moving truck.' },
    's2.hint':           { fr: 'Touche l’écran ou ESPACE quand un repère arrive sous le camion', en: 'Tap or press SPACE when a marker reaches the truck' },

    's3.name':           { fr: 'HEURE DE POINTE', en: 'RUSH HOUR' },
    's3.task':           { fr: 'Le vent et le trafic couchent les cônes. Redresse-les et tiens la zone 60 secondes !', en: 'Wind and traffic knock cones down. Tap them back up and hold the zone for 60 seconds!' },
    's3.hint':           { fr: 'Touche un cône tombé pour le redresser', en: 'Tap a fallen cone to stand it back up' },

    'grade.perfect':     { fr: 'PARFAIT', en: 'PERFECT' },
    'grade.good':        { fr: 'BIEN', en: 'GOOD' },
    'grade.ok':          { fr: 'OK', en: 'OK' },
    'grade.miss':        { fr: 'RATÉ', en: 'MISS' },
    'grade.quick':       { fr: 'ÉCLAIR !', en: 'QUICK!' },

    'banner.s1done':     { fr: 'DÉPÔT BOUCLÉ !', en: 'DEPOT DONE!' },
    'banner.s1fail':     { fr: 'AÏE… 3 RATÉS', en: 'OUCH… 3 MISSES' },
    'banner.s2done':     { fr: 'VOIE SÉCURISÉE !', en: 'LANE SECURED!' },
    'banner.s3done':     { fr: 'SERVICE TERMINÉ !', en: 'SHIFT COMPLETE!' },
    'banner.breach':     { fr: 'ZONE ENVAHIE !', en: 'ZONE BREACHED!' },

    'result.clear':      { fr: 'MANCHE TERMINÉE', en: 'STAGE COMPLETE' },
    'result.score':      { fr: 'Score de manche', en: 'Stage score' },
    'result.perfects':   { fr: 'Parfaits', en: 'Perfects' },
    'result.combo':      { fr: 'Meilleur combo', en: 'Best combo' },
    'result.misses':     { fr: 'Ratés', en: 'Misses' },
    'result.deployed':   { fr: 'Cônes posés', en: 'Cones placed' },
    'result.fixed':      { fr: 'Cônes redressés', en: 'Cones rescued' },
    'result.integrity':  { fr: 'Intégrité de zone', en: 'Zone integrity' },
    'result.cleanBonus': { fr: 'Bonus sans-faute', en: 'Clean sweep bonus' },
    'result.taperBonus': { fr: 'Bonus biseau parfait', en: 'Perfect taper bonus' },
    'result.holdBonus':  { fr: 'Bonus zone tenue', en: 'Zone held bonus' },
    'result.next':       { fr: 'SUITE', en: 'NEXT' },

    'final.title':       { fr: 'RAPPORT DE MISSION', en: 'MISSION REPORT' },
    'final.total':       { fr: 'SCORE TOTAL', en: 'TOTAL SCORE' },
    'final.newBest':     { fr: 'NOUVEAU RECORD !', en: 'NEW RECORD!' },
    'final.save':        { fr: 'SAUVER LE SCORE', en: 'SAVE SCORE' },
    'final.board':       { fr: 'CLASSEMENT', en: 'LEADERBOARD' },
    'final.replay':      { fr: 'REJOUER', en: 'PLAY AGAIN' },
    'final.menu':        { fr: 'MENU', en: 'MENU' },
    'final.product':     { fr: 'La star du jeu : le REVO 42 R2 — conçu pour encaisser.', en: 'Star of the show: the REVO 42 R2 — built to take a hit.' },

    'rank.0':            { fr: 'RECRUE', en: 'ROOKIE' },
    'rank.1':            { fr: 'ÉQUIPIER', en: 'ROAD CREW' },
    'rank.2':            { fr: 'CHEF DE CHANTIER', en: 'SITE FOREMAN' },
    'rank.3':            { fr: 'LÉGENDE DU CÔNE', en: 'CONE LEGEND' },

    'entry.title':       { fr: 'ENTRE TES INITIALES', en: 'ENTER YOUR INITIALS' },
    'entry.ok':          { fr: 'VALIDER', en: 'CONFIRM' },

    'board.title':       { fr: 'MEILLEURS ÉQUIPIERS', en: 'TOP CREW' },
    'board.empty':       { fr: 'Personne au tableau — sois le premier !', en: 'Board is empty — be the first!' },

    'pause.title':       { fr: 'PAUSE', en: 'PAUSED' },
    'pause.resume':      { fr: 'REPRENDRE', en: 'RESUME' },
    'pause.quit':        { fr: 'QUITTER', en: 'QUIT' },

    'howto.title':       { fr: 'COMMENT JOUER', en: 'HOW TO PLAY' },
    'howto.close':       { fr: 'COMPRIS !', en: 'GOT IT!' },

    'hud.zone':          { fr: 'ZONE', en: 'ZONE' },
    'hud.supply':        { fr: 'CÔNES', en: 'CONES' }
  };

  let lang = CC.store.get('cc_lang', null);
  if (lang !== 'fr' && lang !== 'en') {
    lang = (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }

  CC.i18n = {
    get lang() { return lang; },
    t(key) {
      const e = D[key];
      if (!e) return key;
      return e[lang] || e.en || key;
    },
    toggle() {
      lang = lang === 'fr' ? 'en' : 'fr';
      CC.store.set('cc_lang', lang);
      document.documentElement.lang = lang;
      if (CC.ui && CC.ui.rerender) CC.ui.rerender();
    },
    init() {
      document.documentElement.lang = lang;
    }
  };
})();
