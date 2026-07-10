<a id="cli--models--catalog"></a>
# CLI — Models aur catalog

<a id="check-models"></a>
### `check-models`

**Sankshipt vivaran:** `ai-i18n-tools check-models`

Pratyek konfigure kiye gaye model id ko sakriya provider ke `GET /models` suchi (sadasyata aur `expiration_date`) ke viruddh pramanit karein. Ismein provider ki API key ki avashyakta hoti hai (Ollama jaise keyless providers ke liye koi API key nahin). Yadi koi bhi konfigure kiya gaya id gayab hai ya samay se pare, to yah shunya se alag exit code dega aur provider ke `requestTimeoutMs` ka samman karega. Yadi provider mulya (jaise OpenRouter) pradan karta hai, to yah prompt/completion ke liye USD per 1M tokens bhi dikhata hai.

**Aur dekhein:** [LLM providers](/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Sankshipt vivaran:** `ai-i18n-tools list-models`

Sakriya provider dwara apni `GET /models` suchi ke madhyam se pracharit pratyek model ki suchi banayein (id ke anusaar kramit; sakriya provider config `provider` key ka palan karta hai, `-P` / `--provider` ke saath override karein). Ismein provider ki API key ki avashyakta hoti hai (Ollama jaise keyless providers ke liye koi API key nahin). Yadi provider mulya (jaise OpenRouter) pradan karta hai, to yah prompt/completion ke liye USD per 1M tokens bhi dikhata hai aur `expiration_date` se adhik pratyek entry ko tag karta hai.

**Mukhya vikalp:** `-P` / `--provider`

**Aur dekhein:** [LLM providers](/guide/providers-and-models)

---

<a id="bench-models"></a>
### `bench-models`

**Sankshipt vivaran:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

Pratyek konfigure kiye gaye model ko ek sample ke madhyam se alag se pramanit karein (ek model client, koi fallback chain nahin). Yeh model id, input/output tokens, diwar ghadi anuvad samay, aur USD kharch (`—` providers jo kharch nahin batate hain), ke saath-saath ek totals pankti aur pratyek model ke asafalataon ki suchi print karta hai.

Model default roop se sakriya provider ke `translationModels`, `uiModels`, aur `localeModels` ids ka sangh hai (override `--model` ke saath); sample default roop se ek nirdharit angrezi markdown block hai (override `--text` / `--file` ke saath); source/target default roop se config `sourceLocale` aur pehla `docs[]` target sthaniya hai, jo oopar ki `targetLocales` tak pahunchta hai (override `--source` / `--target` ke saath). Yeh model ko samantala chalata hai, config `concurrency` (default 4) dwara seemabindu kiya gaya hai; pratyek model ko abhi bhi alag se samayit kiya jata hai. Ismein sakriya provider ki API key ki avashyakta hoti hai.

**Mukhya vikalp:** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**Sankshipt vivaran:** `ai-i18n-tools list-languages [search]`

Bundled UI bhashaon ki catalog (`data/ui-languages-complete.json`) ko ek manav-pathya table ke roop mein pradarshit karein (code, text disha, angrezi naam, mool naam). Ismein kisi bhi config ya API key ki avashyakta nahin hoti. Ek vikalp `search` term pradan karein jo keval un pratyek entry ko rakhta hai jinke code, mool naam, angrezi naam, ya disha us term ko shamil karte hain (case-insensitive), jaise `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.
