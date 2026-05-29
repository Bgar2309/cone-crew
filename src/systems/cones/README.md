# systems/cones — pose + physique fake + marques
Interface : `tryPlaceCone(state, intent)` (arme/démarre une pose), `stepCones(state, dt)` (intègre culbutes, maj marks).
NE détecte PAS les collisions (c'est `collision` qui injecte vel dans le cône). Ici on intègre vel + friction et on décide marks.satisfied.
Une marque est satisfaite ssi un cône debout occupe sa case. Dépend de `core/` et du type `Intent`.
