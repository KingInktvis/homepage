---
title: "Json Log"
date: 2022-01-24T15:13:22+01:00
draft: false
---
# Json Log

## Probleem
Deze applicatie ben ik begonnen met maken omdat er geen andere tool was die de functionaliteit bood die ik zocht.
De gewenste functionaliteit is om bij het ontwikkelen van een webserver de logs makkelijk te kunnen lezen terwijl deze in JSON formaat zijn.
Om de logs makkelijk te kunnen lezen wil ik overbodige/ nu niet interessante velden verbergen om beter te kunnen zoeken voor de velden die wel relevant zijn.
Naast het filteren van velden wil ik kunnen zoeken op logs die bepaalde data bevatten zoals het interne request id om alleen alle logs geassocieerd met  één http request te zien.

## Eind resultaat

![Json log data view](/images/json-log-data.webp#img-sm)
![Json log input view](/images/json-log-input.webp#img-sm)
![Json log settings view](/images/json-log-settings.webp#img-sm)

## Technologie
Met als doel om een GUI met maken is de technologie keuze bepaald door wat het beste GUI framework te bieden heeft. C# valt duidelijk af omdat de GUI's Windows exclusief zijn.
De voorkeur is om het crossplatform te maken. De eerste meest voor de hand liggende keuze was gebruik maken van Electron. Dit is omdat JSON makkelijk te gebruiken is vanuit JavaScript.
Nadeel hiervan is dat je een volledige webbrowser verpakt. Het tweede nadeel is dat de prestaties lager zullen uitvallen dan van native apps en dit kan belangrijk zijn als er veel data moet worden verwerkt.

De uiteindelijk gekozen taal is Kotlin dat als voordeel heeft dat het crossplatform is, gebruik kan maken van het bestaande Java ecosysteem en beschikking heeft tot coroutines wanneer nodig.
De hoofdreden voor het kiezen van Kotlin was om gebruik te maken van het nieuwe GUI framework Jetpack Compose.
Naar mijn mening bied Jetpack Compose een evolutie in de manier van applicaties schrijven voor de desktop die we in de voorgaande jaren voornamelijk op het web hebben gezien.

## Architectuur
De architectuur van de applicatie is veranderd over de verschillende iteraties.
In de eerste instantie was er een aparte thread die luistert op stdin en een mutable state update waarna Compose op basis van de verandering de UI opnieuw rendered.
Deze UI is daarna uitgebreid met de mogelijkheid om niet alle velden weer te geven en te zoeken op logs waar keys bepaalde waarden bevatten.
Hierna kwam de eerste grote verandering, namelijk het uitvoeren van shell commands vanuit de applicatie.
Om dat te faciliteren wordt voor elk commando een nieuwe thread gestart die de state veranderd.

Op dit punt heeft de applicatie aangetoond dat de basis functionaliteit te realiseren is. De volgende stap is om de architectuur op de schop te gooien.
De applicatie heeft last van performance problemen met een compleet bevroren UI bij het ontvangen van grote hoeveelheden logs.
Een tweede performance probleem bij een grote hoeveelheid logs is het filteren hiervan. 
Het filteren van de lijst gebeurd op de GUI thread wat een merkbare input delay geeft bij het typen.

### Refactor

Na de refactor zijn er objecten toegevoegd en is er een duidelijkere datastroom gevormd. 
In de hieronderstaande afbeelding id de datastroom te zien.

![Architecture](/images/json-log-architecture.svg#img-lg)

Elk van deze objecten heeft een runner die draait los van de anderen.
Het doel van het opdelen van taken is om beter bottlenecks te kunnen verhelpen.
De communicatie tussen alle objecten met uitzondering van de GUI gaat via channels.
#### Datacollector
Als eerst de datacollector heeft als taak om te wachten op de logs en deze daarna door te geven om verwerkt te worden.
Elk commando start een coroutine op met de global dispatcher.
Data over de taak (locatie, naam, status) wordt bijgehouden binnen het collector object.
Dit kan later worden gebruikt om het gestarte process te stoppen.

#### IngestQueue
Het volgende object is de IngestQueue. Alle collectors zenden de strings naar IngestQueue via een channel.
Deze IngestQueue convert de string naar een JSON object.
Als het succesvol een JSON object deserialized dan wordt deze doorgestuurd naar de store. 
Als dit vaalt dan wordt de string genegeerd.

#### Datastore

De deserialized JSON wordt ontvangen op een channel door een datastore process.
Er wordt hier gebruik gemaakt van een channel in plaats van een add methode om eerder ontstaande dataraces te voorkomen.
De dataraces kunnen ontstaan doordat de ingester kan worden opgeschaald om strings parralel te verwerken.
Na het bijwerken van de list met het nieuwe JSON object wordt een boolean over een channel verstuurd naar de viewdata.

#### Viewdata
De viewdata luistert naar een channel voor wanneer het de gegevens moet bijwerken. Deze channel heeft een buffer zodat updates kunnen opstapelen zonder dat het de andere coroutines blokkeert.
Bij het opnieuw genereren van de data wordt als eerst de channel buffer geleegd.
Dit is gedaan zodat er geen nieuwe renders wordt gequeued zonder dat de data is aangepast.
Op basis van data uit de profiler bleek dat in de eerste versie het grootste cpu verbruik kwam door het renderen van de GUI.
Wanneer de loop weer draait gebruikt het al de nieuwste beschikbare data.
Dit betekend dat alle oudere update notificaties naar een verouderde staat verwijzen, niet meer relevant zijn, en daarom zonder problemen weggegooid kunnen worden.

De bestaande keys en bijbehorende waarden worden bijgehouden in een map.
Deze map wordt elke keer bijgewerkt met nieuwe keys mochten deze er zijn.
In een eerdere iteratie werd de map elke keer opnieuw gegenereerd.
Tijdens het profilen bleek dat er veel tijd werd bestaat bij het toevoegen van elementen aan een map.
Hierom is de interne logica aangepast om de bestaande bij te werken in plaats van de hele map elke keer opnieuw op te bouwen.
Na de keys wordt een list opgebouwd met alle JSON die weergegeven kan worden.
Alle JSON wordt gefilterd op de ingevulde filters.
Verder als alle velden van een entry zijn weggefilterd dan wordt deze uit de lijst gehaald.
