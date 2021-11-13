---
title: "Pokeapi"
date: 2021-11-13T12:14:47+01:00
draft: true
---

# Pokeapi

Voor het maken van mijn Discord bot [Diamond](diamond/) is data gebruikt van [https://pokeapi.co/](https://pokeapi.co/).
Om ergonomisch met deze data in Rust te kunnen werken heb ik een wrapper library geschreven [pokeapi-rs](https://gitlab.com/King_Inktvis/pokeapi-rs).
Deze library cached en parsed alle gemaakte requests zodat deze direct beschikbaar zijn bij het vaker aanvragen van dezelfde resource.
De cachen is gedaan zowel om niet te wachten bij herhaling requests en om de pokeapi server minder te belasten.<br/>
Het tweede voordeel van het gebruikt van de library is het ergonomisch kunnen volgen van referentie links via function calls.<br/>

Alle data wordt deserialized naar structs met behulp van [serde](https://serde.rs/).
Alle netwerk requests worden gedaan met de library [reqwest](https://github.com/seanmonstar/reqwest).
Het gebruik van reqwest limiteert de library tot gebruik met de [tokio](https://tokio.rs/) async runtime en dus niet met [async-std](https://async.rs/).
Voor het controleren van de data structs zijn er integratie testen. Deze testen laden de alle data van de api en zullen errors tonen wanneer de api niet overeenkomt met de struct.
Deze integratietesten worden gedraaid bij elke commit in de CI pipeline.