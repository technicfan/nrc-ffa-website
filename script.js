async function get_player(id){
    const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${id}`)
    if (response.ok){
        let player = await response.json()
        return [player.uuid, player.username]
    } else {
        throw new Error("nicht gefunden")
    }
}

async function fill_rank(){
    if (!list){
        list = await load_top(sort)
    }
    var start = 15 * new_loads
    var button = document.getElementById("load_more")
    button.disabled = true
    button.innerText = "Lade gerade ..."
    let rows_html = await Promise.all(
        list.slice(start, start + 15).map(async (item, index) => {
            html = await add_rank_item(index + 1 + start, item)
            return html
        })
    )
    let table = document.getElementById("ranks_table")
    rows_html.forEach(row_html => {
        let row = table.insertRow(-1)
        row.className = "rank_row"
        row.innerHTML = row_html
    })
    document.getElementById("load_more").disabled = false
    if (start + 15 >= list.length){
        button.style.display = "none"
    }
    button.disabled = false
    button.innerText = "Mehr laden"
    document.querySelectorAll(".rank_name").forEach(name => { name.addEventListener("click", event => {
            if (event.target.innerText){
                var field = event.target
            } else {
                var field = event.target.parentElement
            }
            document.getElementById("input").value = field.innerText.slice(1)
            switch_view()
            load_stats(field.dataset.id)
        })
    })
    new_loads += 1
}

async function add_rank_item(id, player){
    let name = await get_player(player.playerId)
    html = `
    <tr>
        <td class="border border-grey-300">${id}</td>
        <td class="rank_name border border-grey-300" data-id="${name[0]}">
            <image src="https://www.mc-heads.net/avatar/${name[0]}/35" style="display: inline;"> ${name[1]}
        </td>
        <td class="border border-grey-300">${player.kills}</td>
        <td class="border border-grey-300">${player.xp}</td>
        <td class="border border-grey-300">${player.currentKillStreak}</td>
        <td class="border border-grey-300">${player.bounty}</td>
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
        let [id, name] = await get_player(input)
        const response = await fetch(`https://api.hglabor.de/stats/ffa/${id}`)
        if (!response.ok) throw Error("nicht gefunden")
        const player = await response.json()
        document.getElementById("stats_name").innerText = name
        document.getElementById("stats_xp").innerText = player.xp
        document.getElementById("stats_kills").innerText = player.kills
        document.getElementById("stats_streak").innerText = player.currentKillStreak
        document.getElementById("stats_max_streak").innerText = player.highestKillStreak
        document.getElementById("stats_deaths").innerText = player.deaths
        document.getElementById("stats_bounty").innerText = player.bounty
    }
}

function switch_view(){
    const rank = document.getElementById("rank")
    const stats = document.getElementById("stats")
    if (rank.style.display == "none"){
        rank.style.display = "block"
        stats.style.display = "none"
        document.getElementById("page").innerText = "zu Stats"
    } else {
        stats.style.display = "block"
        rank.style.display = "none"
        document.getElementById("page").innerText = "zu Rank"
    }
}

async function load_top(sort_by){
    const response = await fetch(`https://api.hglabor.de/stats/ffa/top?sort=${sort_by}`)
    if (response.ok){
        const top = await response.json()
        return top
    } else {
        throw new Error("fehler beim fetchen der top liste")
    }
}

async function new_sort_rank(e){
    document.querySelectorAll(".rank_row").forEach(row => { 
        document.getElementById("ranks_table").deleteRow(row.rowIndex)
    })
    document.querySelectorAll(".rank_col").forEach(element => {
        element.style.setProperty("text-decoration", "none")
    })
    e.style.setProperty("text-decoration", "underline")
    
    new_loads = 0
    if (e.id != sort){
        list = await load_top(e.id)
        sort = e.id
    }
    fill_rank()
}

let new_loads = 0
let list = null
let sort = "kills"
fill_rank()
