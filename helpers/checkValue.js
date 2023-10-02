function checkValueInt(valor) {
    if (valor == null || valor == NaN || valor == undefined) {
        valor = 0
    } else {
        valor = parseInt(valor)
    }
    return valor
}

function checkValueFloat(valor) {
    if (valor == null || valor == NaN || valor == undefined) {
        valor = 0
    } else {
        valor = parseFloat(valor).toFixed(2)
    }
    return valor
}

module.export = {
    checkValueFloat, checkValueInt
}