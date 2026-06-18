// ============================================================================
// Translations
// ----------------------------------------------------------------------------
// Each key holds all five languages on adjacent lines so you can proofread or
// fix any single language inline. Estonian (et) is the source/default.
// Order: et = Eesti, en = English, ru = Русский, fi = Suomi, lv = Latviešu.
// Placeholders like {name}, {email}, {filtered} are filled in at runtime.
// ============================================================================

export type Lang = "et" | "en" | "ru" | "fi" | "lv";

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "et", label: "Eesti", short: "EST" },
  { code: "en", label: "English", short: "ENG" },
  { code: "ru", label: "Русский", short: "RUS" },
  { code: "fi", label: "Suomi", short: "FIN" },
  { code: "lv", label: "Latviešu", short: "LV" },
];

export const DEFAULT_LANG: Lang = "et";

type Entry = Record<Lang, string>;

export const messages: Record<string, Entry> = {
  // ---- Common ----
  "common.cancel": { et: "Tühista", en: "Cancel", ru: "Отмена", fi: "Peruuta", lv: "Atcelt" },
  "common.save": { et: "Salvesta", en: "Save", ru: "Сохранить", fi: "Tallenna", lv: "Saglabāt" },
  "common.delete": { et: "Kustuta", en: "Delete", ru: "Удалить", fi: "Poista", lv: "Dzēst" },
  "common.create": { et: "Loo", en: "Create", ru: "Создать", fi: "Luo", lv: "Izveidot" },
  "common.loading": { et: "Laadimine…", en: "Loading…", ru: "Загрузка…", fi: "Ladataan…", lv: "Ielādē…" },

  // ---- Language switcher ----
  "lang.label": { et: "Keel", en: "Language", ru: "Язык", fi: "Kieli", lv: "Valoda" },

  // ---- Header navigation ----
  "nav.library": { et: "Raamatukogu", en: "Library", ru: "Библиотека", fi: "Kirjasto", lv: "Bibliotēka" },
  "nav.upload": { et: "Lae üles", en: "Upload", ru: "Загрузить", fi: "Lataa", lv: "Augšupielādēt" },
  "nav.signOut": { et: "Logi välja", en: "Sign out", ru: "Выйти", fi: "Kirjaudu ulos", lv: "Izrakstīties" },

  // ---- Sidebar ----
  "sidebar.library": { et: "Raamatukogu", en: "Library", ru: "Библиотека", fi: "Kirjasto", lv: "Bibliotēka" },
  "sidebar.allDocuments": { et: "Kõik dokumendid", en: "All documents", ru: "Все документы", fi: "Kaikki asiakirjat", lv: "Visi dokumenti" },
  "sidebar.unfiled": { et: "Sorteerimata", en: "Unfiled", ru: "Без папки", fi: "Lajittelematon", lv: "Nešķiroti" },
  "sidebar.folders": { et: "Kaustad", en: "Folders", ru: "Папки", fi: "Kansiot", lv: "Mapes" },
  "sidebar.newFolder": { et: "Uus kaust", en: "New folder", ru: "Новая папка", fi: "Uusi kansio", lv: "Jauna mape" },
  "sidebar.noFolders": { et: "Kaustu veel pole.", en: "No folders yet.", ru: "Папок пока нет.", fi: "Ei kansioita vielä.", lv: "Vēl nav mapju." },
  "sidebar.newSubfolderIn": { et: "Uus alamkaust kaustas „{name}”", en: 'New subfolder in "{name}"', ru: "Новая подпапка в «{name}»", fi: 'Uusi alikansio kansiossa "{name}"', lv: 'Jauna apakšmape mapē "{name}"' },
  "sidebar.folderNamePlaceholder": { et: "Kausta nimi", en: "Folder name", ru: "Имя папки", fi: "Kansion nimi", lv: "Mapes nosaukums" },
  "sidebar.renameFolder": { et: "Nimeta kaust ümber", en: "Rename folder", ru: "Переименовать папку", fi: "Nimeä kansio uudelleen", lv: "Pārdēvēt mapi" },
  "sidebar.deleteFolderTitle": { et: "Kustutada „{name}”?", en: 'Delete "{name}"?', ru: "Удалить «{name}»?", fi: 'Poistetaanko "{name}"?', lv: 'Dzēst "{name}"?' },
  "sidebar.deleteFolderDesc": { et: "Kaust eemaldatakse. Selles olevad dokumendid säilivad ja liigutatakse Sorteerimata alla. Ka alamkaustad on mõjutatud.", en: "The folder is removed. Documents inside it are kept and moved to Unfiled. Any subfolders are also affected.", ru: "Папка будет удалена. Документы в ней сохранятся и переместятся в «Без папки». Подпапки также затрагиваются.", fi: "Kansio poistetaan. Sen sisällä olevat asiakirjat säilytetään ja siirretään Lajittelematon-kansioon. Myös alikansiot poistetaan.", lv: "Mape tiek noņemta. Tajā esošie dokumenti tiek saglabāti un pārvietoti uz Nešķiroti. Tiek ietekmētas arī apakšmapes." },
  "sidebar.newSubfolder": { et: "Uus alamkaust", en: "New subfolder", ru: "Новая подпапка", fi: "Uusi alikansio", lv: "Jauna apakšmape" },
  "sidebar.rename": { et: "Nimeta ümber", en: "Rename", ru: "Переименовать", fi: "Nimeä uudelleen", lv: "Pārdēvēt" },
  "sidebar.folderActions": { et: "Kausta toimingud", en: "Folder actions", ru: "Действия с папкой", fi: "Kansion toiminnot", lv: "Mapes darbības" },
  "sidebar.expand": { et: "Laienda", en: "Expand", ru: "Развернуть", fi: "Laajenna", lv: "Izvērst" },
  "sidebar.collapse": { et: "Ahenda", en: "Collapse", ru: "Свернуть", fi: "Tiivistä", lv: "Sakļaut" },
  "sidebar.moveTo": { et: "Liiguta kausta…", en: "Move to…", ru: "Переместить в…", fi: "Siirrä kansioon…", lv: "Pārvietot uz…" },
  "sidebar.moveFolderTitle": { et: "Liiguta „{name}”", en: 'Move "{name}"', ru: "Переместить «{name}»", fi: 'Siirrä "{name}"', lv: 'Pārvietot "{name}"' },
  "sidebar.moveFolderDesc": { et: "Vali uus ülemkaust.", en: "Choose a new parent folder.", ru: "Выберите новую родительскую папку.", fi: "Valitse uusi yläkansio.", lv: "Izvēlieties jaunu vecākmapi." },
  "sidebar.moveSelectDest": { et: "Vali sihtkoht", en: "Select destination", ru: "Выберите назначение", fi: "Valitse kohde", lv: "Izvēlieties galamērķi" },
  "sidebar.moveTopLevel": { et: "Ülemine tase (ülemkaustata)", en: "Top level (no parent)", ru: "Верхний уровень (без родителя)", fi: "Ylin taso (ei yläkansiota)", lv: "Augšējais līmenis (bez vecākmapes)" },
  "sidebar.move": { et: "Liiguta", en: "Move", ru: "Переместить", fi: "Siirrä", lv: "Pārvietot" },

  // ---- Sidebar toasts ----
  "toast.subfolderCreated": { et: "Alamkaust loodud.", en: "Subfolder created.", ru: "Подпапка создана.", fi: "Alikansio luotu.", lv: "Apakšmape izveidota." },
  "toast.folderCreated": { et: "Kaust loodud.", en: "Folder created.", ru: "Папка создана.", fi: "Kansio luotu.", lv: "Mape izveidota." },
  "toast.folderCreateErr": { et: "Kausta ei õnnestunud luua.", en: "Couldn't create folder.", ru: "Не удалось создать папку.", fi: "Kansiota ei voitu luoda.", lv: "Neizdevās izveidot mapi." },
  "toast.folderRenamed": { et: "Kaust ümber nimetatud.", en: "Folder renamed.", ru: "Папка переименована.", fi: "Kansio nimetty uudelleen.", lv: "Mape pārdēvēta." },
  "toast.folderRenameErr": { et: "Kausta ei õnnestunud ümber nimetada.", en: "Couldn't rename folder.", ru: "Не удалось переименовать папку.", fi: "Kansiota ei voitu nimetä uudelleen.", lv: "Neizdevās pārdēvēt mapi." },
  "toast.folderDeleted": { et: "Kaust kustutatud. Selle dokumendid liigutati Sorteerimata alla.", en: "Folder deleted. Its documents moved to Unfiled.", ru: "Папка удалена. Её документы перемещены в «Без папки».", fi: "Kansio poistettu. Sen asiakirjat siirrettiin Lajittelematon-kansioon.", lv: "Mape dzēsta. Tās dokumenti pārvietoti uz Nešķiroti." },
  "toast.folderDeleteErr": { et: "Kausta ei õnnestunud kustutada.", en: "Couldn't delete folder.", ru: "Не удалось удалить папку.", fi: "Kansiota ei voitu poistaa.", lv: "Neizdevās dzēst mapi." },
  "toast.folderMoved": { et: "Kaust liigutatud.", en: "Folder moved.", ru: "Папка перемещена.", fi: "Kansio siirretty.", lv: "Mape pārvietota." },
  "toast.folderMoveErr": { et: "Kausta ei õnnestunud liigutada.", en: "Couldn't move folder.", ru: "Не удалось переместить папку.", fi: "Kansiota ei voitu siirtää.", lv: "Neizdevās pārvietot mapi." },

  // ---- Library ----
  "library.documents": { et: "Dokumendid", en: "Documents", ru: "Документы", fi: "Asiakirjat", lv: "Dokumenti" },
  "library.folder": { et: "Kaust", en: "Folder", ru: "Папка", fi: "Kansio", lv: "Mape" },
  "library.count": { et: "{filtered} / {total} dokumenti", en: "{filtered} of {total} documents", ru: "{filtered} из {total} документов", fi: "{filtered}/{total} asiakirjaa", lv: "{filtered} no {total} dokumentiem" },
  "library.largeThumbs": { et: "Suured pisipildid", en: "Large thumbnails", ru: "Большие миниатюры", fi: "Suuret pikkukuvat", lv: "Lieli sīktēli" },
  "library.smallThumbs": { et: "Väikesed pisipildid", en: "Small thumbnails", ru: "Маленькие миниатюры", fi: "Pienet pikkukuvat", lv: "Mazi sīktēli" },
  "library.numberedList": { et: "Nummerdatud loend", en: "Numbered list", ru: "Нумерованный список", fi: "Numeroitu luettelo", lv: "Numurēts saraksts" },
  "library.uploadDocument": { et: "Lae dokument üles", en: "Upload document", ru: "Загрузить документ", fi: "Lataa asiakirja", lv: "Augšupielādēt dokumentu" },
  "library.searchPlaceholder": { et: "Otsi pealkirja, tarnijat, objekti, materjali, silte…", en: "Search title, supplier, object, material, tags…", ru: "Поиск по названию, поставщику, объекту, материалу, тегам…", fi: "Hae otsikkoa, toimittajaa, kohdetta, materiaalia, tunnisteita…", lv: "Meklēt nosaukumu, piegādātāju, objektu, materiālu, tagus…" },
  "library.clearFilters": { et: "Tühjenda filtrid", en: "Clear filters", ru: "Сбросить фильтры", fi: "Tyhjennä suodattimet", lv: "Notīrīt filtrus" },
  "library.loadError": { et: "Dokumentide laadimine ebaõnnestus. Palun värskenda lehte.", en: "Couldn't load documents. Please refresh.", ru: "Не удалось загрузить документы. Обновите страницу.", fi: "Asiakirjoja ei voitu ladata. Päivitä sivu.", lv: "Neizdevās ielādēt dokumentus. Lūdzu, atsvaidziniet." },
  "library.empty": { et: "Dokumente veel pole. Lae üles esimene.", en: "No documents yet. Upload your first one.", ru: "Документов пока нет. Загрузите первый.", fi: "Ei asiakirjoja vielä. Lataa ensimmäinen.", lv: "Vēl nav dokumentu. Augšupielādējiet pirmo." },
  "library.noMatch": { et: "Ükski dokument ei vasta filtritele.", en: "No documents match your filters.", ru: "Нет документов, соответствующих фильтрам.", fi: "Mikään asiakirja ei vastaa suodattimia.", lv: "Neviens dokuments neatbilst filtriem." },
  "library.total": { et: "{total} dokumenti", en: "{total} documents", ru: "{total} документов", fi: "{total} asiakirjaa", lv: "{total} dokumenti" },
  "library.pageOf": { et: "Lk {page} / {pages}", en: "Page {page} of {pages}", ru: "Стр. {page} из {pages}", fi: "Sivu {page} / {pages}", lv: "Lpp. {page} no {pages}" },
  "library.prev": { et: "Eelmine", en: "Previous", ru: "Назад", fi: "Edellinen", lv: "Iepriekšējā" },
  "library.next": { et: "Järgmine", en: "Next", ru: "Вперёд", fi: "Seuraava", lv: "Nākamā" },

  // ---- Filters ----
  "filter.type": { et: "Tüüp", en: "Type", ru: "Тип", fi: "Tyyppi", lv: "Tips" },
  "filter.object": { et: "Objekt", en: "Object", ru: "Объект", fi: "Kohde", lv: "Objekts" },
  "filter.material": { et: "Materjal", en: "Material", ru: "Материал", fi: "Materiaali", lv: "Materiāls" },
  "filter.supplier": { et: "Tarnija", en: "Supplier", ru: "Поставщик", fi: "Toimittaja", lv: "Piegādātājs" },
  "filter.allType": { et: "Kõik tüübid", en: "All types", ru: "Все типы", fi: "Kaikki tyypit", lv: "Visi tipi" },
  "filter.allObject": { et: "Kõik objektid", en: "All objects", ru: "Все объекты", fi: "Kaikki kohteet", lv: "Visi objekti" },
  "filter.allMaterial": { et: "Kõik materjalid", en: "All materials", ru: "Все материалы", fi: "Kaikki materiaalit", lv: "Visi materiāli" },
  "filter.allSupplier": { et: "Kõik tarnijad", en: "All suppliers", ru: "Все поставщики", fi: "Kaikki toimittajat", lv: "Visi piegādātāji" },

  // ---- Upload ----
  "upload.title": { et: "Lae dokument üles", en: "Upload document", ru: "Загрузить документ", fi: "Lataa asiakirja", lv: "Augšupielādēt dokumentu" },
  "upload.fileCard": { et: "Fail", en: "File", ru: "Файл", fi: "Tiedosto", lv: "Fails" },
  "upload.fetchedFromLink": { et: " · lingilt toodud", en: " · fetched from link", ru: " · загружено по ссылке", fi: " · haettu linkistä", lv: " · iegūts no saites" },
  "upload.dropzone": { et: "Lohista või klõpsa faili valimiseks", en: "Drag & drop or click to choose a file", ru: "Перетащите или нажмите, чтобы выбрать файл", fi: "Vedä ja pudota tai napsauta valitaksesi tiedoston", lv: "Velciet vai noklikšķiniet, lai izvēlētos failu" },
  "upload.anyType": { et: "PDF, DWG, DOC, XLS, TXT, XML, OSD — mis tahes tüüp", en: "PDF, DWG, DOC, XLS, TXT, XML, OSD — any type", ru: "PDF, DWG, DOC, XLS, TXT, XML, OSD — любой тип", fi: "PDF, DWG, DOC, XLS, TXT, XML, OSD — mikä tahansa tyyppi", lv: "PDF, DWG, DOC, XLS, TXT, XML, OSD — jebkurš tips" },
  "upload.orViaUrl": { et: "või lae üles URL-i kaudu", en: "or upload via URL", ru: "или загрузите по URL", fi: "tai lataa URL-osoitteella", lv: "vai augšupielādējiet, izmantojot URL" },
  "upload.urlPlaceholder": { et: "Kleebi Google Drive'i, Dropboxi või otsene faililink…", en: "Paste a Google Drive, Dropbox, or direct file link…", ru: "Вставьте ссылку Google Drive, Dropbox или прямую ссылку на файл…", fi: "Liitä Google Drive-, Dropbox- tai suora tiedostolinkki…", lv: "Ielīmējiet Google Drive, Dropbox vai tiešu faila saiti…" },
  "upload.fetch": { et: "Too", en: "Fetch", ru: "Загрузить", fi: "Hae", lv: "Iegūt" },
  "upload.urlHint": { et: "Ainult üks fail. Fail peab olema avalikult jagatud (kõik, kellel on link). Max 100 MB.", en: "Single file only. The file must be shared publicly (anyone with the link). Max 100 MB.", ru: "Только один файл. Файл должен быть в открытом доступе (любой по ссылке). Макс. 100 МБ.", fi: "Vain yksi tiedosto. Tiedoston on oltava julkisesti jaettu (kuka tahansa linkillä). Enintään 100 Mt.", lv: "Tikai viens fails. Failam jābūt publiski koplietotam (jebkurš ar saiti). Maks. 100 MB." },
  "upload.previewImage": { et: "Eelvaate pilt (valikuline)", en: "Preview image (optional)", ru: "Изображение предпросмотра (необязательно)", fi: "Esikatselukuva (valinnainen)", lv: "Priekšskatījuma attēls (neobligāti)" },
  "upload.previewImageHint": { et: "Lisa väike ekraanipilt või foto (PNG, JPG, WEBP, GIF). Kuvatakse pisipildina. Max 10 MB.", en: "Attach a small screenshot or photo (PNG, JPG, WEBP, GIF). Shown as a thumbnail. Max 10 MB.", ru: "Прикрепите небольшой скриншот или фото (PNG, JPG, WEBP, GIF). Показывается как миниатюра. Макс. 10 МБ.", fi: "Liitä pieni kuvakaappaus tai valokuva (PNG, JPG, WEBP, GIF). Näytetään pikkukuvana. Enintään 10 Mt.", lv: "Pievienojiet nelielu ekrānuzņēmumu vai fotoattēlu (PNG, JPG, WEBP, GIF). Tiek rādīts kā sīktēls. Maks. 10 MB." },
  "upload.addImage": { et: "Lisa pilt", en: "Add image", ru: "Добавить изображение", fi: "Lisää kuva", lv: "Pievienot attēlu" },
  "upload.details": { et: "Üksikasjad", en: "Details", ru: "Сведения", fi: "Tiedot", lv: "Detaļas" },
  "upload.upload": { et: "Lae üles", en: "Upload", ru: "Загрузить", fi: "Lataa", lv: "Augšupielādēt" },

  // ---- Fields (shared by upload + edit) ----
  "field.title": { et: "Pealkiri", en: "Title", ru: "Название", fi: "Otsikko", lv: "Nosaukums" },
  "field.type": { et: "Tüüp", en: "Type", ru: "Тип", fi: "Tyyppi", lv: "Tips" },
  "field.typePlaceholder": { et: "Vali või sisesta uus tüüp…", en: "Choose or type a new type…", ru: "Выберите или введите новый тип…", fi: "Valitse tai kirjoita uusi tyyppi…", lv: "Izvēlieties vai ierakstiet jaunu tipu…" },
  "field.orderConfirmation": { et: "Tellimuse kinnitus", en: "Order confirmation", ru: "Подтверждение заказа", fi: "Tilausvahvistus", lv: "Pasūtījuma apstiprinājums" },
  "field.date": { et: "Kuupäev", en: "Date", ru: "Дата", fi: "Päivämäärä", lv: "Datums" },
  "field.object": { et: "Objekt", en: "Object", ru: "Объект", fi: "Kohde", lv: "Objekts" },
  "field.material": { et: "Materjal", en: "Material", ru: "Материал", fi: "Materiaali", lv: "Materiāls" },
  "field.supplier": { et: "Tarnija", en: "Supplier", ru: "Поставщик", fi: "Toimittaja", lv: "Piegādātājs" },
  "field.tags": { et: "Sildid (komaga eraldatud)", en: "Tags (comma separated)", ru: "Теги (через запятую)", fi: "Tunnisteet (pilkulla eroteltuna)", lv: "Tagi (atdalīti ar komatu)" },
  "field.folder": { et: "Kaust", en: "Folder", ru: "Папка", fi: "Kansio", lv: "Mape" },
  "field.description": { et: "Kirjeldus", en: "Description", ru: "Описание", fi: "Kuvaus", lv: "Apraksts" },
  "field.noFolder": { et: "Kaustata", en: "No folder", ru: "Без папки", fi: "Ei kansiota", lv: "Bez mapes" },
  "field.noFolderUnfiled": { et: "Kaustata (Sorteerimata)", en: "No folder (Unfiled)", ru: "Без папки", fi: "Ei kansiota (Lajittelematon)", lv: "Bez mapes (Nešķiroti)" },

  // ---- Upload toasts ----
  "toast.imageType": { et: "Palun vali PNG-, JPG-, WEBP- või GIF-pilt.", en: "Please choose a PNG, JPG, WEBP or GIF image.", ru: "Выберите изображение PNG, JPG, WEBP или GIF.", fi: "Valitse PNG-, JPG-, WEBP- tai GIF-kuva.", lv: "Lūdzu, izvēlieties PNG, JPG, WEBP vai GIF attēlu." },
  "toast.imageTooBig": { et: "Eelvaate pilt peab olema alla 10 MB.", en: "Preview image must be under 10 MB.", ru: "Изображение предпросмотра должно быть меньше 10 МБ.", fi: "Esikatselukuvan on oltava alle 10 Mt.", lv: "Priekšskatījuma attēlam jābūt mazākam par 10 MB." },
  "toast.pasteLink": { et: "Kleebi esmalt link.", en: "Paste a link first.", ru: "Сначала вставьте ссылку.", fi: "Liitä ensin linkki.", lv: "Vispirms ielīmējiet saiti." },
  "toast.fileFetched": { et: "Fail lingilt toodud.", en: "File fetched from link.", ru: "Файл загружен по ссылке.", fi: "Tiedosto haettu linkistä.", lv: "Fails iegūts no saites." },
  "toast.fetchErr": { et: "Seda linki ei õnnestunud tuua.", en: "Couldn't fetch that link.", ru: "Не удалось загрузить по ссылке.", fi: "Linkkiä ei voitu hakea.", lv: "Neizdevās iegūt šo saiti." },
  "toast.chooseFile": { et: "Palun vali fail või too see lingilt.", en: "Please choose a file or fetch one from a link.", ru: "Выберите файл или загрузите по ссылке.", fi: "Valitse tiedosto tai hae se linkistä.", lv: "Lūdzu, izvēlieties failu vai iegūstiet to no saites." },
  "toast.enterTitle": { et: "Palun sisesta pealkiri.", en: "Please enter a title.", ru: "Введите название.", fi: "Anna otsikko.", lv: "Lūdzu, ievadiet nosaukumu." },
  "toast.uploaded": { et: "Dokument üles laaditud.", en: "Document uploaded.", ru: "Документ загружен.", fi: "Asiakirja ladattu.", lv: "Dokuments augšupielādēts." },
  "toast.uploadFailed": { et: "Üleslaadimine ebaõnnestus", en: "Upload failed", ru: "Загрузка не удалась", fi: "Lataus epäonnistui", lv: "Augšupielāde neizdevās" },

  // ---- Document detail ----
  "doc.notFound": { et: "Dokumenti ei leitud.", en: "Document not found.", ru: "Документ не найден.", fi: "Asiakirjaa ei löytynyt.", lv: "Dokuments nav atrasts." },
  "doc.loadError": { et: "Selle dokumendi laadimine ebaõnnestus.", en: "Couldn't load this document.", ru: "Не удалось загрузить этот документ.", fi: "Asiakirjaa ei voitu ladata.", lv: "Neizdevās ielādēt šo dokumentu." },
  "doc.backToLibrary": { et: "Tagasi raamatukokku", en: "Back to library", ru: "Назад в библиотеку", fi: "Takaisin kirjastoon", lv: "Atpakaļ uz bibliotēku" },
  "doc.uploadedBy": { et: " · üles laadinud {name}", en: " · uploaded by {name}", ru: " · загрузил {name}", fi: " · latasi {name}", lv: " · augšupielādēja {name}" },
  "doc.edit": { et: "Muuda", en: "Edit", ru: "Редактировать", fi: "Muokkaa", lv: "Rediģēt" },
  "doc.close": { et: "Sulge", en: "Close", ru: "Закрыть", fi: "Sulje", lv: "Aizvērt" },
  "doc.print": { et: "Prindi", en: "Print", ru: "Печать", fi: "Tulosta", lv: "Drukāt" },
  "doc.send": { et: "Saada", en: "Send", ru: "Отправить", fi: "Lähetä", lv: "Sūtīt" },
  "doc.download": { et: "Laadi alla", en: "Download", ru: "Скачать", fi: "Lataa", lv: "Lejupielādēt" },
  "doc.deleteTitle": { et: "Kustutada see dokument?", en: "Delete this document?", ru: "Удалить этот документ?", fi: "Poistetaanko tämä asiakirja?", lv: "Dzēst šo dokumentu?" },
  "doc.deleteDesc": { et: "See eemaldab faili ja selle metaandmed jäädavalt. Seda ei saa tagasi võtta.", en: "This permanently removes the file and its metadata. This can't be undone.", ru: "Это навсегда удалит файл и его метаданные. Отменить нельзя.", fi: "Tämä poistaa tiedoston ja sen metatiedot pysyvästi. Tätä ei voi kumota.", lv: "Tas neatgriezeniski noņem failu un tā metadatus. To nevar atsaukt." },
  "doc.shareTitle": { et: "Privaatne jagamislink", en: "Private share link", ru: "Приватная ссылка для доступа", fi: "Yksityinen jakolinkki", lv: "Privāta koplietošanas saite" },
  "doc.shareDesc": { et: "Igaüks, kellel on see link, saab faili vaadata. Link töötab 24 tundi ja aegub seejärel automaatselt.", en: "Anyone with this link can view the file. It works for 24 hours, then expires automatically.", ru: "Любой, у кого есть ссылка, может просмотреть файл. Действует 24 часа, затем истекает автоматически.", fi: "Kuka tahansa, jolla on tämä linkki, voi tarkastella tiedostoa. Toimii 24 tuntia ja vanhenee sitten automaattisesti.", lv: "Ikviens, kam ir šī saite, var skatīt failu. Tā darbojas 24 stundas, pēc tam automātiski beidzas." },
  "doc.copiedClipboard": { et: "Kopeeritud lõikelauale.", en: "Copied to your clipboard.", ru: "Скопировано в буфер обмена.", fi: "Kopioitu leikepöydälle.", lv: "Kopēts starpliktuvē." },
  "doc.metadata": { et: "Metaandmed", en: "Metadata", ru: "Метаданные", fi: "Metatiedot", lv: "Metadati" },
  "doc.tags": { et: "Sildid", en: "Tags", ru: "Теги", fi: "Tunnisteet", lv: "Tagi" },
  "doc.preview": { et: "Eelvaade", en: "Preview", ru: "Предпросмотр", fi: "Esikatselu", lv: "Priekšskatījums" },
  "doc.noPreview": { et: "Selle failitüübi jaoks pole brauseris eelvaadet. Avamiseks kasuta Laadi alla.", en: "No in-browser preview for this file type. Use Download to open it.", ru: "Для этого типа файла нет предпросмотра в браузере. Используйте «Скачать».", fi: "Tälle tiedostotyypille ei ole esikatselua selaimessa. Avaa Lataa-toiminnolla.", lv: "Šim faila tipam nav priekšskatījuma pārlūkā. Atveriet, izmantojot Lejupielādēt." },
  "doc.editMetadata": { et: "Muuda metaandmeid", en: "Edit metadata", ru: "Редактировать метаданные", fi: "Muokkaa metatietoja", lv: "Rediģēt metadatus" },
  "doc.saveChanges": { et: "Salvesta muudatused", en: "Save changes", ru: "Сохранить изменения", fi: "Tallenna muutokset", lv: "Saglabāt izmaiņas" },

  // ---- Document detail toasts ----
  "toast.downloadErr": { et: "Allalaadimislingi loomine ebaõnnestus.", en: "Couldn't generate download link.", ru: "Не удалось создать ссылку для скачивания.", fi: "Latauslinkkiä ei voitu luoda.", lv: "Neizdevās izveidot lejupielādes saiti." },
  "toast.popupPrint": { et: "Printimiseks luba hüpikaknad.", en: "Allow pop-ups to print this document.", ru: "Разрешите всплывающие окна для печати.", fi: "Salli ponnahdusikkunat tulostaaksesi.", lv: "Atļaujiet uznirstošos logus, lai drukātu." },
  "toast.openedNewTab": { et: "Avatud uuel kaardil — kasuta brauseri printimist (Ctrl/⌘+P).", en: "Opened in a new tab — use your browser's Print (Ctrl/⌘+P).", ru: "Открыто в новой вкладке — используйте печать браузера (Ctrl/⌘+P).", fi: "Avattu uudessa välilehdessä — käytä selaimen tulostusta (Ctrl/⌘+P).", lv: "Atvērts jaunā cilnē — izmantojiet pārlūka drukāšanu (Ctrl/⌘+P)." },
  "toast.printErr": { et: "Dokumendi printimiseks ettevalmistamine ebaõnnestus.", en: "Couldn't prepare the document for printing.", ru: "Не удалось подготовить документ к печати.", fi: "Asiakirjaa ei voitu valmistella tulostusta varten.", lv: "Neizdevās sagatavot dokumentu drukāšanai." },
  "toast.linkCopied": { et: "Link kopeeritud.", en: "Link copied.", ru: "Ссылка скопирована.", fi: "Linkki kopioitu.", lv: "Saite kopēta." },
  "toast.copyErr": { et: "Kopeerimine ebaõnnestus. Vali ja kopeeri link käsitsi.", en: "Couldn't copy. Select and copy the link manually.", ru: "Не удалось скопировать. Выделите и скопируйте ссылку вручную.", fi: "Kopiointi epäonnistui. Valitse ja kopioi linkki käsin.", lv: "Neizdevās nokopēt. Atlasiet un kopējiet saiti manuāli." },
  "toast.shareErr": { et: "Jagamislingi loomine ebaõnnestus.", en: "Couldn't create a share link.", ru: "Не удалось создать ссылку.", fi: "Jakolinkkiä ei voitu luoda.", lv: "Neizdevās izveidot koplietošanas saiti." },
  "toast.docDeleted": { et: "Dokument kustutatud.", en: "Document deleted.", ru: "Документ удалён.", fi: "Asiakirja poistettu.", lv: "Dokuments dzēsts." },
  "toast.deleteFailed": { et: "Kustutamine ebaõnnestus", en: "Delete failed", ru: "Удаление не удалось", fi: "Poisto epäonnistui", lv: "Dzēšana neizdevās" },
  "toast.saved": { et: "Salvestatud.", en: "Saved.", ru: "Сохранено.", fi: "Tallennettu.", lv: "Saglabāts." },
  "toast.saveFailed": { et: "Salvestamine ebaõnnestus", en: "Save failed", ru: "Сохранение не удалось", fi: "Tallennus epäonnistui", lv: "Saglabāšana neizdevās" },

  // ---- Auth ----
  "auth.teamAccess": { et: "Meeskonna juurdepääs", en: "Team access", ru: "Доступ для команды", fi: "Tiimin käyttöoikeus", lv: "Komandas piekļuve" },
  "auth.signInDesc": { et: "Logi sisse ühekordse sisselogimislingiga, mis saadetakse sinu {domain} e-posti aadressile — parooli pole vaja.", en: "Sign in with a one-time login link sent to your {domain} email — no password needed.", ru: "Войдите по одноразовой ссылке, отправленной на вашу почту {domain} — пароль не нужен.", fi: "Kirjaudu sisään kertakäyttöisellä linkillä, joka lähetetään {domain}-sähköpostiisi — salasanaa ei tarvita.", lv: "Pierakstieties ar vienreizēju saiti, kas nosūtīta uz jūsu {domain} e-pastu — parole nav nepieciešama." },
  "auth.checkEmail": { et: "Kontrolli oma e-posti", en: "Check your email", ru: "Проверьте почту", fi: "Tarkista sähköpostisi", lv: "Pārbaudiet e-pastu" },
  "auth.sentTo": { et: "Saatsime sisselogimislingi aadressile {email}. Ava see sellel seadmel sisselogimiseks.", en: "We sent a login link to {email}. Open it on this device to sign in.", ru: "Мы отправили ссылку на {email}. Откройте её на этом устройстве для входа.", fi: "Lähetimme kirjautumislinkin osoitteeseen {email}. Avaa se tällä laitteella kirjautuaksesi.", lv: "Mēs nosūtījām pieteikšanās saiti uz {email}. Atveriet to šajā ierīcē, lai pieteiktos." },
  "auth.differentEmail": { et: "Kasuta teist e-posti", en: "Use a different email", ru: "Использовать другую почту", fi: "Käytä toista sähköpostia", lv: "Izmantot citu e-pastu" },
  "auth.workEmail": { et: "Töömeil", en: "Work email", ru: "Рабочая почта", fi: "Työsähköposti", lv: "Darba e-pasts" },
  "auth.onlyDomain": { et: "Lubatud on ainult {domain} aadressid.", en: "Only {domain} addresses are allowed.", ru: "Разрешены только адреса {domain}.", fi: "Vain {domain}-osoitteet ovat sallittuja.", lv: "Atļautas tikai {domain} adreses." },
  "auth.sendLink": { et: "Saada sisselogimislink", en: "Send login link", ru: "Отправить ссылку для входа", fi: "Lähetä kirjautumislinkki", lv: "Sūtīt pieteikšanās saiti" },
  "auth.onlyDomainSignIn": { et: "Sisse saavad logida ainult {domain} e-posti aadressid.", en: "Only {domain} email addresses can sign in.", ru: "Войти могут только адреса {domain}.", fi: "Vain {domain}-sähköpostiosoitteet voivat kirjautua sisään.", lv: "Pieteikties var tikai {domain} e-pasta adreses." },
  "auth.linkSent": { et: "Sisselogimislink saadetud. Kontrolli oma postkasti.", en: "Login link sent. Check your inbox.", ru: "Ссылка отправлена. Проверьте почту.", fi: "Kirjautumislinkki lähetetty. Tarkista postilaatikkosi.", lv: "Pieteikšanās saite nosūtīta. Pārbaudiet iesūtni." },
  "auth.sendErr": { et: "Linki ei õnnestunud saata", en: "Couldn't send the link", ru: "Не удалось отправить ссылку", fi: "Linkkiä ei voitu lähettää", lv: "Neizdevās nosūtīt saiti" },
};
