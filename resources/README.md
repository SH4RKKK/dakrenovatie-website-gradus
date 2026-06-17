# resources/

Bronbestanden die de website bij het **bouwen** inleest. Deze map wordt
bewust **niet** in `public/` geplaatst, zodat e-mailadressen en postcodes uit
goedgekeurde reviews nooit publiek op de site terechtkomen.

> Let op: na het toevoegen of wijzigen van bestanden hier moet de site opnieuw
> gebouwd en gepubliceerd worden voordat de wijziging zichtbaar is.

## Structuur

- `reviews/text/` — één JSON-bestand per goedgekeurde review.
- `reviews/image/` — optionele foto's die bij een specifieke review horen
  (verwijs ernaar via het `image`-veld in het review-JSON).
- `page-images/` — losse sfeerfoto's om de reviewpagina mee op te vullen.

## Een review goedkeuren

1. Je ontvangt per e-mail een nieuwe review met daarin een JSON-blok.
2. Kopieer dat JSON-blok naar een nieuw bestand in `reviews/text/`
   (gebruik de voorgestelde bestandsnaam, bv. `2026-06-17-jan.json`).
3. Publiceer de site opnieuw. De review verschijnt dan op de reviewpagina en,
   bij de eerste 10, in de carousel op de homepagina.
