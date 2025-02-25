async function get_player(id){
    const response = await fetch(`https://playerdb.co/api/player/minecraft/${id}`)
    if (response.ok){
        let player = await response.json()
        return [player.data.player.id, player.data.player.username]
    } else {
        throw new Error(`Spieler ${id} nicht gefunden`)
    }
}

function to_page(page){
    let other = page === "rank" ? "stats" : "rank"
    if (page === "stats" && icon){
        document.getElementById("favicon").href = icon
    } else {
        document.getElementById("favicon").href = "image/hglabor.png"
    }
    document.getElementById(page).classList.remove("d-none")
    document.getElementById(other).classList.add("d-none")
    document.getElementById(`to_${page}`).classList.add("active")
    document.getElementById(`to_${other}`).classList.remove("active")
    document.title = page === "rank" ? "HeroFFA Rangliste" : "HeroFFA Spielersuche"
}

function color_scheme(value){
    if (value.matches){
        document.documentElement.setAttribute("data-bs-theme", "dark")
    } else {
        document.documentElement.setAttribute("data-bs-theme", "light")
    }
}

// global variables
const dark_mode = window.matchMedia('(prefers-color-scheme: dark)')
// rank
let rank_item_number = 0
let page = 1
let list
let sort = "kills"
// stats
let heroes = {}
let icon

document.addEventListener("DOMContentLoaded", () => {
    color_scheme(dark_mode)

    dark_mode.addEventListener("change", value => color_scheme(value))

    document.getElementById("input").addEventListener("keypress", event => {
        if (event.key === "Enter") {
            load_stats()
        }
    })

    to_page("rank")

    loading_rank(fill_rank)()
    
    load_heroes()
})
