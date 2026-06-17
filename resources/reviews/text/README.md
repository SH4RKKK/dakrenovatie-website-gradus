# reviews/text/

Eén JSON-bestand per goedgekeurde review. Formaat:

```json
{
  "name": "Jan Jansen",
  "email": "jan@example.com",
  "postcode": "1234 AB",
  "review": "Geweldig werk aan ons dak!",
  "anonymous": false,
  "date": "2026-06-17",
  "image": ""
}
```

- `name`, `email`, `postcode` — gegevens van de klant. **E-mail en postcode
  worden nooit publiek getoond**; ze staan hier alleen zodat jij de klant kunt
  terugvinden.
- `review` — de tekst die op de site verschijnt. (verplicht)
- `anonymous` — `true` verbergt de naam op de site ("Anonieme klant").
- `date` — `JJJJ-MM-DD`; bepaalt de volgorde (nieuwste eerst).
- `image` — optioneel; bestandsnaam in `../image/` (bv. `dak-jan.jpg`).
