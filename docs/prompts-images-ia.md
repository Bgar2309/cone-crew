# Images IA (GPT Image 2) — prompts & conventions

Ce document liste les images à générer avec ChatGPT (GPT Image 2) pour améliorer
le visuel de Cone Crew, avec les prompts exacts à copier-coller.

## Pourquoi un fond vert et pas transparent ?

GPT Image 2 **ne sait pas produire de fond transparent** (contrairement à
GPT Image 1.5). On demande donc un fond vert pur (#00FF00) uniforme : le
détourage (chroma-key) sera fait automatiquement côté code au moment de
l'intégration. Si vous avez accès à GPT Image 1.5 via l'API avec
`background: "transparent"`, un vrai PNG transparent est encore mieux —
les deux formats seront acceptés.

## Mode d'emploi

1. Dans ChatGPT, **joindre la photo de référence** `assets/revo-42-r2.jpg`
   pour le prompt n°1 (et idéalement joindre le sprite du cône obtenu comme
   référence de style pour les prompts suivants — cohérence graphique).
2. Copier-coller le prompt tel quel (en anglais, le modèle suit mieux).
3. Vérifier le résultat : fond vert bien uniforme, pas de reflet vert sur
   l'objet, pas d'ombre au sol, pas de texte parasite. Régénérer si besoin.
4. Enregistrer chaque image en PNG sous `assets/sprites/` avec **exactement**
   le nom de fichier indiqué.

## Priorités

| Priorité | Fichier | Rôle |
|---|---|---|
| ★★★ | `cone.png` | Le héros du jeu — dessiné partout (3 stages + menu) |
| ★★ | `truck.png` | Le camion du stage 2 |
| ★ | `bg-menu.png` | Décor du menu |
| ★ | `bg-dusk.png` | Ciel du stage 2 |
| ★ | `bg-night.png` | Skyline du stage 3 |
| ★ | `bg-depot.png` | Mur du dépôt, stage 1 |

Le cône seul suffit déjà à transformer le jeu. Tout le reste est optionnel :
le code garde un rendu vectoriel de secours si une image manque.

## Contraintes respectées côté code (rien à faire pour vous)

- Les animations sont conservées : inclinaison, écrasement à l'atterrissage,
  chute/renversement, fantôme pointillé, flash rétro-réfléchissant, yeux
  animés du mascotte (menu) — tout est appliqué **par-dessus** le sprite.
  C'est pour ça que le sprite doit être **sans visage** et **sans ombre**.
- L'ombre au sol, le gyrophare clignotant et les roues restent gérés en code.
- Fallback vectoriel automatique si les fichiers sont absents (mode hors
  ligne / kiosque inchangé).

---

## 1. `cone.png` — le REVO 42 R2 (★★★)

> **Joindre la photo `assets/revo-42-r2.jpg` au message.** Format portrait.

```
Using the attached photo of a REVO 42 R2 traffic cone as the exact reference
for proportions, colors and details, create a single 2D video-game sprite of
this cone.

View: perfectly straight-on side view (orthographic profile, camera at half
the cone's height), the whole cone visible including the black rubber base,
centered, filling about 90% of the image height.

Keep the signature details from the photo: fluorescent red-orange body, two
white retro-reflective bands (the lower band wider than the upper one), the
knurled grip section near the rounded tip, and the black stackable rubber
base.

Style: clean stylized 2D game art, semi-flat with subtle cel shading, crisp
edges, lit softly from the upper left with a subtle vertical highlight on the
left side of the body. No face, no eyes.

Background: solid uniform pure green (#00FF00), edge to edge. No ground, no
floor, no cast shadow, no reflection, no green color cast on the cone itself,
no text, no watermark.

Portrait format.
```

## 2. `truck.png` — le camion EHS (★★)

> **Joindre le sprite `cone.png` obtenu** comme référence de style.
> Format paysage.

```
A single 2D video-game sprite of a small roadworks flatbed truck, in the same
clean stylized 2D game-art style as the attached cone sprite (semi-flat,
subtle cel shading, crisp edges, lit from the upper left).

View: perfect side view (orthographic profile), facing right, whole truck
visible, centered, filling about 90% of the image width.

Details: bright safety red-orange cab (#FF4A1F) on the RIGHT side with a
light-blue side window and the letters "EHS" in bold white on the door; an
amber warning beacon on the cab roof, switched OFF (no glow); a dark graphite
flatbed with a low side rail on the LEFT, completely EMPTY (no cargo, no
cones, no people); two wheels with black tires and grey rims, fully visible
below the body.

Background: solid uniform pure green (#00FF00), edge to edge. No road, no
ground, no cast shadow, no motion blur, no green color cast on the truck, no
text other than "EHS", no watermark.

Landscape format.
```

## 3. `bg-menu.png` — décor du menu (★)

> Format paysage. Fond plein-cadre, pas de fond vert ici.

```
Wide 2D game background illustration for the main menu of an arcade game
about roadworks.

Scene: an empty night-to-dusk highway seen from a low angle, straight dashed
center line receding to the horizon, dark silhouetted hills at the horizon,
deep indigo sky fading to a warm orange glow near the horizon, a few subtle
stars in the upper sky. A single soft spotlight cone of light hits the empty
road on the right third of the image — leave that area empty, a mascot will
be drawn there by the game.

Style: moody, clean, semi-flat stylized game art with smooth gradients,
cinematic lighting. The upper-left area must stay dark and uncluttered
(title text will be overlaid there).

No traffic cones, no vehicles, no people, no text, no watermark, no logo.

Landscape format.
```

## 4. `bg-dusk.png` — ciel du stage 2 (★)

```
A wide 2D game background strip: dusk sky over distant dark hills, for a
side-scrolling game.

Deep indigo-violet at the top blending to a warm orange glow at the horizon,
a low sun glow slightly right of center, thin dark silhouetted hills along
the bottom edge of the image. The composition must be almost uniform
horizontally (no strong unique landmark), so it can scroll seamlessly.

Style: clean semi-flat stylized game art, smooth gradients, no grain. Sky and
hills ONLY — no road, no vehicles, no cones, no people, no text, no
watermark.

Landscape format.
```

## 5. `bg-night.png` — skyline du stage 3 (★)

```
A wide 2D game background strip: a dark city skyline at night for a
side-scrolling arcade game.

Flat black-blue building silhouettes of varied heights along the bottom of
the image, small warm lit windows scattered on the buildings, deep navy night
sky above with subtle stars. Composition roughly uniform horizontally, no
single landmark.

Style: clean semi-flat stylized game art, crisp shapes, no grain. Skyline and
sky ONLY — no road, no vehicles, no people, no text, no watermark.

Landscape format.
```

## 6. `bg-depot.png` — le dépôt, stage 1 (★)

```
A 2D game background: the inside wall of a roadworks depot / warehouse at
night, for an arcade game.

Dark blue-grey corrugated metal wall, two tall industrial shelving racks (one
on the left, one on the right) loaded with vague dark crates, cool ambient
darkness with two soft warm ceiling spotlights creating visible light cones,
and a large EMPTY space in the middle of the image (the gameplay happens
there). Slightly moody, high contrast.

Style: clean semi-flat stylized game art, crisp shapes, smooth gradients, no
grain. No people, no vehicles, no traffic cones, no text, no watermark.

Landscape format.
```
