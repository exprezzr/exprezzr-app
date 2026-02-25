alert("¡El script está conectado!");
const slider = document.getElementById('carSlider');
let index = 0;

function rotateCars() {
    index++;
    if (index > 6) { // 10 total - 4 visible = 6 movements
        index = 0;
    }
    const movePercentage = index * 25; 
    slider.style.transform = `translateX(-${movePercentage}%)`;
}

setInterval(rotateCars, 3000);