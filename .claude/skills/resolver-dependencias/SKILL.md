---
name: resolver-dependencias
description: Reemplaza los provisionales que dejó replicar-primeng cuando un componente int-* compone otro que aún no estaba terminado (p. ej. int-multi-select con un checkbox nativo marcado "dep:checkbox provisional"). Verifica que la dependencia esté en done, cambia el bloque provisional por el componente real (<int-checkbox>), borra los TODO(dep:…) y los estilos que solo existían por el provisional, y valida con build. También lista el grafo de dependencias (requires de cada <id>.config.ts) y el orden de trabajo. Úsalo cuando el usuario diga "el checkbox ya está listo, actualiza el multiselect", "resuelve las dependencias de checkbox", "¿qué componentes esperan al checkbox?", "¿en qué orden maquetamos?" o /resolver-dependencias.
argument-hint: "[id de la dependencia terminada | --listar]"
---

# Resolver dependencias entre componentes `int-*`

Cuando un componente compone otro (`multi-select` → `checkbox`), `replicar-primeng` (fase 1.6) lo declara
en `requires` de `src/components/<id>/<id>.config.ts` y, si la dependencia no estaba en `done`, deja un
**provisional** marcado:

```html
<!-- dep:checkbox provisional · replace with <int-checkbox> when checkbox is done -->
<input type="checkbox" class="int-multi-select__checkbox" … />
<!-- /dep:checkbox -->
```

más `// TODO(dep:checkbox provisional)` en el TS/SCSS que solo existe por él. Esta skill los reemplaza.

Hay dos tipos de dependencia, con el mismo marcador:

| Config | Dónde está el provisional | Al reemplazar se importa `Int<Dep>` en |
|---|---|---|
| `requires` (la base lo compone: multi-select → checkbox) | `base/<id>.html` / `.ts` / `.scss` | la base (`base/<id>.ts`) |
| `uses` (solo el contenido de una variante: el botón del `#footer` de card) | `variants/<slug>/example.html` (marcado nativo + helpers `.u-*`) | el `example.ts` de esa variante, **nunca** la base |

La página de cada componente lista ambas en el chip **Dependencies** (popover "Requeridas" /
"Opcionales", con estado y enlace).

---

## 1. Datos

- **Dependencia** (id). Si no viene, lista las pendientes (sección 4) y pregunta cuál.
- Comprueba su estado (versión más reciente):
  ```bash
  grep -n "static readonly status" src/components/<dep>/version-*/base/<dep>.ts
  ```
  Si no está en `done`: "**<dep>** sigue en <estado> (a cargo de <designer>); el provisional se mantiene".
  Fin, sin tocar nada.

## 2. Encontrar los provisionales

```bash
grep -rn "dep:<dep> provisional\|TODO(dep:<dep>" src/components/
grep -ln "'<dep>'" src/components/*/*.config.ts
```

Muestra la lista (componente, versión, archivo, línea, `requires`/`uses`). Se reporta como
inconsistencia: un provisional en la base sin `<dep>` en `requires`, uno en una variante sin `<dep>` en
`uses`, o un `requires`/`uses` sin provisional ni uso real.

## 3. Reemplazar (por cada componente, sin preguntar salvo conflicto)

1. Lee la API pública de `src/components/<dep>/version-N/base/<dep>.ts` (inputs, outputs, `model()`,
   `ControlValueAccessor`) y su variante `basic`.
2. **HTML**: cambia el bloque entre `<!-- dep:<dep> provisional … -->` y `<!-- /dep:<dep> -->` por
   `<int-<dep>>` con los mismos datos, eventos y ARIA que tenía el provisional, usando la API real
   (mismos nombres que PrimeNG). Borra ambos comentarios marcadores.
3. **TS**: importa `Int<Dep>` y agrégalo a `imports`; borra el código marcado
   `TODO(dep:<dep> provisional)` que ya no se usa (handlers del input nativo…).
   - Base (`requires`): `../../../<dep>/version-N/base/<dep>` desde `base/<id>.ts`.
   - Variante (`uses`): `../../../../<dep>/version-N/base/<dep>` desde `variants/<slug>/example.ts`.
4. **SCSS** (solo `requires`): borra las reglas y tokens marcados `TODO(dep:<dep> provisional)`; deja solo
   lo que posiciona al hijo dentro del padre (márgenes, alineación), nunca estilos que pisen los del hijo.
   En una variante (`uses`) quita también los helpers que solo imitaban al hijo (`u-px-3 u-radius-lg…` del
   botón nativo) y deja los de posición (`u-ms-auto`, `u-align-self-*`).
5. `requires` / `uses` se **mantienen** (sigue usándolo).
6. Si la API real no cubre algo que el provisional hacía (un evento, un estado), **no** inventes: deja
   ese punto con el provisional, avísalo y pregunta.
7. Lo customizado a mano fuera de los marcadores no se toca.

## 4. Listar dependencias (`--listar` o "¿en qué orden…?")

```bash
grep -nE "requires|uses" src/components/*/*.config.ts
grep -rln "dep:[a-z-]* provisional" src/components/
```

Responde con una tabla: componente · dependencia · tipo (requerida / opcional) · estado (diseñador) ·
provisional sí/no. El orden de trabajo solo lo condicionan las **requeridas**: una opcional no bloquea
dar el componente por terminado (su variante sigue funcionando con el provisional).
Para el orden de trabajo, ordena por capas: primero los que nadie requiere y no requieren nada (átomos),
después los que solo requieren componentes ya `done`. Si hay un ciclo, repórtalo. La misma información se
ve en Reference → Status (columna "Requiere") y en el chip "Dependencies" de cada página.

## 5. Validar e informar

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
grep -rn "dep:<dep> provisional\|TODO(dep:<dep>" src/components/   # debe salir vacío
```

Informe: componentes actualizados (enlaces), lo que quedó provisional y por qué, resultado real de build
y tests. Revisión visual en `http://localhost:4321/components/<id>` (con el Style Guide en
`localhost:8080`); si no puedes abrir el navegador, dilo.

## Qué NO hacer

- ❌ Reemplazar si la dependencia no está en `done`.
- ❌ Modificar la base, estilos o variantes del componente requerido para que "encaje": si falta algo en
  su API, se reporta a su diseñador.
- ❌ Quitar `requires`/`uses` ni tocar `status`/`designer` del componente actualizado.
- ❌ Mover a la base una dependencia de `uses`: el componente real se importa solo en el `example.ts`.
- ❌ Importar variantes o estilos sueltos del componente requerido: solo su base.
