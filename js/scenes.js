/* CONE CREW — scenes.js : minimal scene manager */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});

  const scenes = {};
  let current = null;
  let currentName = '';

  CC.scenes = {
    add(name, scene) { scenes[name] = scene; },
    go(name, params) {
      if (current && current.exit) current.exit();
      currentName = name;
      current = scenes[name];
      if (current && current.enter) current.enter(params || {});
    },
    get current() { return current; },
    get name() { return currentName; }
  };
})();
