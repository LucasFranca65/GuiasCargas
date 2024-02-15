
let textoComQuebraLinha = "Olá, mundo!\\nBem-vindo ao JavaScript.";
let textoFormatado = textoComQuebraLinha.replace(/\\n/g, '\n');
const os = require('os')
console.log(textoFormatado);
//console.log(minhaString)
//console.log(substring)
const ips = os.networkInterfaces()
const Ethernet = ips.Ethernet
var iPv4 = []
for (let i = 0; i < Ethernet.length; i++) {
    if (Ethernet[i].family == "IPv4") {
        iPv4.push(Ethernet[i])
    }

}

for (let i = 0; i < iPv4.length; i++) {
    console.log(iPv4[i].address)

}   
