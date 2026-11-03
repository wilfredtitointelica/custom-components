---
name: crear-composicion
description: Crea una composición (caso de uso real armado con la API del componente y helpers u-*) de un componente int-* en Intelica Components. Pregunta el componente, el título y la descripción, genera version-N/compositions/<slug>/example.ts + example.html y la deja visible en el tab Compositions y en el menú. Úsalo cuando el usuario diga "crea una composición", "agrega el caso KPI a card", "nuevo ejemplo de uso de <componente>", "forma de uso de <componente>" o /crear-composicion. Para mostrar un input, estado o slot de la API usar crear-variante.
argument-hint: "[componente] [título de la composición]"
---

# Crear una composición

Genera la carpeta `src/components/<componente>/version-<N>/compositions/<slug>/` con un `example.ts` y
un `example.html` mínimos, listos para que el maquetador escriba el caso. La página los muestra en el
tab **Compositions** (Variants | API | Compositions) y el menú lateral, bajo el rótulo "Compositions".

## Variant o Composition

| | Variant (`variants/`, skill `crear-variante`) | Composition (`compositions/`, esta skill) |
|---|---|---|
| Qué muestra | **un** input, estado o slot de la API (`outlined`, `selectable`, `#footer`) | un **caso real** de la base de conocimientos (KPI, selector de versión, fila de métricas) |
| Contenido | mínimo, para que se vea el efecto | el que pide el caso, armado con helpers `u-*` |
| API | puede nacer junto con un input nuevo de la base | **no agrega API**: combina lo que ya existe |

Los casos de la base de conocimientos (Intelica.knowledgeBase) son, por defecto, composiciones: la base
documenta PrimeNG y combinaciones de su API. Si para el caso hace falta algo que la API no tiene (un estado, un modificador del contenedor), **no se
crea la composición**: se avisa y se propone primero la variante (input + variante). Regla de la casa: un
formato de la base de conocimientos solo se vuelve input si cambia el contenedor de una forma que los
modificadores existentes no cubren; si lo que cambia es el contenido, es una composición.

## 0. Validar antes de preguntar

Con lo que dio el usuario, comprueba **antes de preguntar el resto**:

1. **Que el componente exista**: carpeta `src/components/<id>/` (o `_<id>_/`) o un `title:` que coincida
   en `src/components/*/version-*/base/*.html`. Si no existe, **no se crea nada** y se responde:

   > No se puede crear la composición: el componente **<nombre>** no existe.
   > Primero créalo con `/crear-componente`.

   Si el nombre se parece a uno existente (`Crad` → `card`), sugiérelo y pregunta si era ese.
2. **Que la versión exista** (si pidió una): `version-<N>/` dentro del componente.
3. **Que el slug esté libre**: ni `version-<N>/compositions/<slug>/` ni `version-<N>/variants/<slug>/`
   (slug en kebab-case: `Version Picker` → `version-picker`). El slug es el ancla `#<id>-<slug>` de la
   página, único entre las dos carpetas. Si existe, **no se crea nada** y se responde:

   > No se puede crear **<Título>**: `<id>` ya tiene un ejemplo `<slug>` (`version-<N>/<carpeta>/<slug>/`).

El script hace las mismas comprobaciones y falla sin tocar nada; si aun así falla, traduce su error.

## 1. Datos

Hay que saber tres cosas. Lo que venga en los argumentos (`/crear-composicion card KPI`) o en el
mensaje no se vuelve a preguntar; lo que falte se pregunta **todo en un solo mensaje**:

1. **Componente**: el ID o el nombre visible. Conviértelo siempre al `id`.
2. **Título** de la composición: el nombre del caso (`KPI`, `Version Picker`, `Metric Group`).
3. **Descripción**: una línea que diga el caso y con qué API se arma, con los nombres de la API entre
   comillas invertidas como en PrimeNG ("Card `flat` con un KPI armado con helpers: título, moneda y
   valor."). Puede quedar vacía.

La versión es la más reciente (`version-N` mayor), salvo que el usuario pida otra.

## 2. Generar

```bash
npm run new:composition -- <id> "<Título>" --description "<Descripción>" [--version <N>]
```

Es `scripts/new-variant.mjs` con `--composition`: mismo `example.ts` (clase `<Id><Slug>Example`,
selector `<id>-<slug>-example`, importa solo la base) y mismo `example.html` con solo la cabecera, pero
en `compositions/<slug>/`. Al terminar regenera `src/generated/`.

No escribas los archivos a mano ni copies los de otra composición: usa el script.

## 3. Posición

La carpeta nueva aparece sola en el tab y en el menú: en orden alfabético, o **después** de las listadas
si el config ya tiene `compositions`. Con 3 o más composiciones (o si el usuario pidió una posición):

1. `npm run order:variants -- <id> --compositions` y pega la tabla en el chat, marcando la nueva.
2. Pregunta si la deja ahí o en cuál la quiere (AskUserQuestion). Por defecto no se toca el config.
3. Si pide otra: `npm run order:variants -- <id> --compositions <slugs en el orden nuevo>`.

## 4. Verificar

```bash
npm run check:component -- <id>   # 0 errores
npm run build
```

Confirma al usuario la ruta creada y el enlace: `/components/<id>#<id>-<slug>` (abre el tab Compositions).

## Reglas del contenido (las escribe el maquetador)

Las mismas de cualquier ejemplo (`AGENTS.md`): helpers `u-*`, sin `style` inline salvo el tamaño del
propio componente, sin `[attr.aria-*]`/`role`/`tabindex` sobre el `<int-*>`, atributos en el orden
formato · contenido · estado · `[style]` · eventos. Además:

- Solo inputs que ya existen en la base. Si falta uno, se para y se propone la variante.
- Otros `int-*` que use el caso van en `uses` de `<id>.config.ts`; si aún no están en `done`, con su
  provisional `dep:<id> provisional`.

## Qué NO hacer

- ❌ Agregar inputs, modificadores SCSS ni tocar `base/` para que la composición funcione.
- ❌ Crear la composición en `variants/` o como variante: va en `compositions/`.
- ❌ Escribir el caso debajo de la cabecera si el usuario solo pidió crearla.
- ❌ Poner el título o la descripción en `<id>.config.ts` u otro `.ts`.
- ❌ Tocar `<id>-page.ts`, `routes.ts`, `inventory.ts` ni `src/generated/`.
- ❌ Reutilizar un slug que ya existe como variante.

Una variante que ya existe y en realidad es un caso de uso no se recrea: se mueve con
`npm run move -- <id> <slug> --to composition` (dry run; `--yes` aplica; conserva slug, clase y URL).

Renombrar, eliminar, ocultar u ordenar una composición: las mismas skills que una variante
(`renombrar-variante`, `eliminar-variante`, `ocultar`, `reactivar`, `ordenar-variantes`); los scripts
detectan la carpeta por el slug.
