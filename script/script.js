async function get_player(id){
    const response = await fetch(`https://playerdb.co/api/player/minecraft/${id}`)
    if (response.ok){
        let player = await response.json()
        return [player.data.player.id, player.data.player.username]
    } else {
        throw new Error(`Spieler ${id} nicht gefunden`)
    }
}

async function fill_rank(){
    if (!list || (page === Math.floor((rank_item_number)/100))){
        list = await load_top(sort)
    }
    var start = rank_item_number - (page - 1) * 100
    let rows_html = await Promise.all(
        list.slice(start, start + 10).map(async (item, index) => {
            html = await add_rank_item(index + 1 + rank_item_number, item)
            return html
        })
    )
    let table = document.getElementById("rank_table")
    rows_html.forEach(row_html => {
        let row = table.insertRow(-1)
        row.className = "rank_row"
        row.innerHTML = row_html
    })
    document.querySelectorAll(".rank_name").forEach(name => { name.addEventListener("click", event => {
        if (event.target.innerText){
            var field = event.target
        } else {
            var field = event.target.parentElement
        }
        document.getElementById("input").value = field.innerText
        to_page("stats")
        load_stats(field.dataset.id)
    })})
    rank_item_number += 10
}

async function add_rank_item(number, player){
    let name = await get_player(player.playerId)
    let color = "class='badge'"
    switch(number){
        case 1:
            color = "class='badge text-bg-warning'"
            break
        case 2:
            color = "class='badge text-bg-secondary'"
            break
        case 3:
            color = "class='badge' style='background-color: #cd7f32;'"
    }
    html = `
    <tr>
        <td class="align-middle"><span ${color}>${number}</span></td>
        <td class="rank_name align-middle text-start" data-id="${name[0]}">
            <image class="rounded d-inline" alt="Minecraft Kopf von ${name[1]}"
                   src="https://www.mc-heads.net/avatar/${name[0]}/35"
                   style="margin-right: 6pt;"
            >${name[1]}
        </td>
        <td class="align-middle">${player.kills}</td>
        <td class="align-middle">${player.xp}</td>
        <td class="align-middle">${player.currentKillStreak}</td>
        <td class="align-middle">${player.bounty}</td>
    <tr>
    `
    return html
}

async function load_stats(id=""){
    if (id){
        var input = id
    } else {
        var input = document.getElementById("input").value
    }
    if (input){
        document.getElementById("stats_data").classList.add("d-none")
        document.getElementById("stats_error").classList.add("d-none")
        document.getElementById("stats_spinner").classList.remove("d-none")

        try {
            var [id, name] = await get_player(input)
            const response = await fetch(`https://api.hglabor.de/stats/ffa/${id}`)
            if (!response.ok) throw new Error(`Stats für ${input} nicht gefunden`)
            var player = await response.json()
        } catch {
            document.getElementById("stats_spinner").classList.add("d-none")
            document.getElementById("stats_error").innerText = `${input}
            existiert nicht
            oder hat noch nie
            HeroFFA gespielt.`
            document.getElementById("stats_error").classList.remove("d-none")
            return
        }
    
        document.getElementById("stats_name").innerText = name
        document.getElementById("stats_xp").innerText = player.xp
        document.getElementById("stats_kills").innerText = player.kills
        document.getElementById("stats_streak").innerText = player.currentKillStreak
        document.getElementById("stats_max_streak").innerText = player.highestKillStreak
        document.getElementById("stats_deaths").innerText = player.deaths
        document.getElementById("stats_bounty").innerText = player.bounty

        document.getElementById("stats_head").src = `https://www.mc-heads.net/avatar/${id}/100`
        document.getElementById("stats_head").alt = `Minecraft Kopf von ${name}`

        // hero abilities
        var roman_numerals = {
            0: "",
            1: "I",
            2: "II",
            3: "III",
            4: "IV",
            5: "V",
            6: "VI",
            7: "VII",
            8: "VIII",
            9: "IX",
            10: "X"
        }
        for (const hero in heroes){
            var current = heroes[hero]
            var abilities = current.properties
            var table = document.getElementById(`${hero}_table`)
            table.innerHTML = ""
            for (const ability in abilities){
                var attributes = abilities[ability]

                var ability_display = ability.split("_").map(part => {
                    return part.charAt(0).toUpperCase() + part.slice(1)
                }).join(" ")
                if (!player.heroes[hero][ability]){
                    ability_display += " - Nicht freigeschaltet"
                }
                let row = table.insertRow(-1)
                row.innerHTML = `
                    <td>${ability_display}</td>
                    <td></td>
                `
                for (const attribute of attributes){
                    if (attribute.maxLevel != 0){
                        try {
                            var attribute_name = attribute.name.replace(/ /g, "_").toLowerCase()
                            var level_raw = Math.cbrt(player.heroes[hero][ability][attribute_name].experiencePoints / attribute.levelScale)
                            var level = Math.trunc(level_raw)
                            var level_string =  roman_numerals[level]
                            if (attribute.maxLevel > level){
                                var to_next = (level_raw - level) * 100
                                var next_level_string = roman_numerals[level+1]
                            } else {
                                var to_next = 100
                                var next_level_string = level_string + " <span class='badge text-bg-warning'>maximal</span>"
                                level_string = ""
                            }
                        } catch (undefined) {
                            var to_next = 0
                            var next_level_string = roman_numerals[1]
                            var level_string = ""
                        }

                        let row = table.insertRow(-1)
                        row.innerHTML = `
                            <td></td>
                            <td>
                                <div>${attribute.name}</div>
                                <div class="d-flex">
                                    <span class"text-start">${level_string}</span>
                                    <span class="text-end" style="width: 100%;">${next_level_string}</span>
                                </div>
                                <div class="progress" role="progressbar" aria-label="${attribute.name} Fortschritt" aria-valuenow="${to_next}" aria-valuemin="0" aria-valuemax="100">
                                    <div class="progress-bar" style="width: ${to_next}%">${Math.round(to_next)}%</div>
                                </div>
                            </td>
                        `
                    }
                }
            }
        } 

        document.getElementById("stats_spinner").classList.add("d-none")
        document.getElementById("stats_data").classList.remove("d-none")
    }
}

function to_page(page){
    let other = page === "rank" ? "stats" : "rank"
    document.getElementById(page).classList.remove("d-none")
    document.getElementById(other).classList.add("d-none")
    document.getElementById(`to_${page}`).classList.add("active")
    document.getElementById(`to_${other}`).classList.remove("active")
    document.title = page === "rank" ? "HeroFFA Rangliste" : "HeroFFA Spielersuche"
}

async function load_top(sort_by){
    page = Math.floor(rank_item_number/100)+1
    const response = await fetch(`https://api.hglabor.de/stats/ffa/top?sort=${sort_by}&page=${page}`)
    if (response.ok){
        const top = await response.json()
        return top
    } else {
        throw new Error("Fehler beim Fetchen der Top Liste")
    }
}

async function new_sort_rank(e){
    document.querySelectorAll(".rank_row").forEach(row => { 
        document.getElementById("rank_table").deleteRow(row.parentElement.rowIndex)
    })
    document.querySelectorAll(".rank_col").forEach(element => {
        element.style.setProperty("text-decoration", "none")
    })
    e.style.setProperty("text-decoration", "underline")
    
    rank_item_number = 0
    document.getElementById("load_more").classList.remove("d-none")
    if (e.id != sort || page > 1){
        list = await load_top(e.id)
        sort = e.id
    }
    await fill_rank()
}

function loading_rank(fn){
    return async function(){
        var button = document.getElementById("load_more")
        let spinner = "<span class='spinner-border spinner-border-sm' aria-hidden='true'></span>"
        button.disabled = true
        button.innerHTML = `${spinner} Lade gerade...`

        await fn.apply(this, arguments)

        if (rank_item_number >= 10){
            document.querySelector("footer").style.removeProperty("positon")
            document.querySelector("footer").style.removeProperty("bottom")
        }
        button.disabled = false
        button.innerHTML = "Mehr laden"
    }
}

async function load_hero(hero){
    const response = await fetch(`https://api.hglabor.de/ffa/hero/${hero}`)
    if (!response.ok) throw new Error("Konnte Held*in nicht fetchen")
    heroes[hero] = await response.json()
}

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches){
    document.documentElement.setAttribute("data-bs-theme", "light")
}
let rank_item_number = 0
let page = 1
let list = null
let sort = "kills"
let heroes = {}

document.getElementById("input").addEventListener("keypress", event => {
    if (event.key === "Enter") {
        load_stats()
    }
})

loading_rank(fill_rank)()

load_hero("aang")
load_hero("katara")
load_hero("toph")
