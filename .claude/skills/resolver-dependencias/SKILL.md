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

Muestra la lista (componente, versión, archivo, línea). Una versión con el provisional que **no** declara
`<dep>` en `requires`, o un `requires` sin provisional ni uso real, se reporta como inconsistencia.

## 3. Reemplazar (por cada componente, sin preguntar salvo conflicto)

1. Lee la API pública de `src/components/<dep>/version-N/base/<dep>.ts` (inputs, outputs, `model()`,
   `ControlValueAccessor`) y su variante `basic`.
2. **HTML**: cambia el bloque entre `<!-- dep:<dep> provisional … -->` y `<!-- /dep:<dep> -->` por
   `<int-<dep>>` con los mismos datos, eventos y ARIA que tenía el provisional, usando la API real
   (mismos nombres que PrimeNG). Borra ambos comentarios marcadores.
3. **TS**: importa `Int<Dep>` desde `../../../<dep>/version-N/base/<dep>` y agrégalo a `imports`; borra
   el código marcado `TODO(dep:<dep> provisional)` que ya no se usa (handlers del input nativo…).
4. **SCSS**: borra las reglas y tokens marcados `TODO(dep:<dep> provisional)`; deja solo lo que
   posiciona al hijo dentro del padre (márgenes, alineación), nunca estilos que pisen los del hijo.
5. `requires` se **mantiene** (sigue componiéndolo).
6. Si la API real no cubre algo que el provisional hacía (un evento, un estado), **no** inventes: deja
   ese punto con el provisional, avísalo y pregunta.
7. Lo customizado a mano fuera de los marcadores no se toca.

## 4. Listar dependencias (`--listar` o "¿en qué orden…?")

```bash
grep -n "requires" src/components/*/*.config.ts
grep -rln "dep:[a-z-]* provisional" src/components/
```

Responde con una tabla: componente · requiere · estado de cada dependencia (diseñador) · provisional sí/no.
Para el orden de trabajo, ordena por capas: primero los que nadie requiere y no requieren nada (átomos),
después los que solo requieren componentes ya `done`. Si hay un ciclo, repórtalo. La misma información se
ve en Reference → Status (columna "Requiere") y en el chip "Requires …" de cada página.

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
- ❌ Quitar `requires` ni tocar `status`/`designer` del componente actualizado.
- ❌ Importar variantes o estilos sueltos del componente requerido: solo su base.
