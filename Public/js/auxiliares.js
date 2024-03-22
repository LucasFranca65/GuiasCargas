function downloadPDF() {
    const content = document.querySelector('#content')
    var opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: "relatorio.pdf",
        jsPDF: { unit: 'in', format: "a4", orientation: 'landscape', }
    }
    html2pdf().set(opt).from(content).save()
}

function confirmDell(event, form) {
    event.preventDefault()
    var decision = confirm("Confirmar Exclusão ?")
    if (decision) {
        form.submit()
    }
}

function confirmAdd(event, form) {
    event.preventDefault()
    var decision = confirm("Confirmar Adição ?")
    if (decision) {
        form.submit()
    }
}

function confirmAction(event, form) {
    event.preventDefault()
    var decision = confirm("Confirmar Ação ?")
    if (decision) {
        form.submit()
    }
}

function confirmBaixa(event, form) {
    event.preventDefault()
    var decision = confirm("Confirmar Pagamento e Baixar Guia ?")
    if (decision) {
        form.submit()
    }
}

function confirmBaixaLote(event, form) {
    event.preventDefault()
    var decision = confirm("Confirmar baixa do bilhete ?")
    if (decision) {
        form.submit()
    }
}

function confirmEdditParams(event, form) {
    event.preventDefault()
    var decision = confirm("Confirmar Alterações ?")
    if (decision) {
        form.submit()
    }
}

const tableRows = document.querySelectorAll('#table-rowns')
const exportBtn = document.getElementById('btn-export-csv')
exportBtn.addEventListener('click', () => {

    const csvString = Array.from(tableRows)
        .map(row => Array.from(row.cells)
            .map(cell => cell.textContent).join(';')
        ).join('\n')
    exportBtn.setAttribute('href',
        `data:text/csvcharset=utf-8,${encodeURIComponent(csvString)}`
    )
    exportBtn.setAttribute('download', 'table.csv')
})

// Graficos

const ctx = document.getElementById('grafico');
const ctx2 = document.getElementById('grafico2');

let valores = []
let lbl = "Quantidade"

let grafico1 = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Vendidos', 'Cancelados', 'Pagos', 'Pendentes', 'Vencidos'],
        datasets: [{
            label: lbl,
            data: valores,
            backgroundColor: [
                'rgba(75, 192, 192, 0.2)',
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(255, 159, 64, 0.2)',


            ],
            borderColor: [
                'rgb(75, 192, 192)',
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
                'rgb(255, 159, 64)',

            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

let valores2 = []
let lbl2 = "Valores"
let grafico2 = new Chart(ctx2, {
    type: 'bar',
    data: {
        labels: ['Vendidos', 'Cancelados', 'Pagos', 'Pendentes', 'Vencidos'],
        datasets: [{
            label: lbl2,
            data: valores2,
            backgroundColor: [
                'rgba(75, 192, 192, 0.2)',
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(255, 159, 64, 0.2)',


            ],
            borderColor: [
                'rgb(75, 192, 192)',
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
                'rgb(255, 159, 64)',

            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});


const obterDados = () => {
    const endpoint = "http://localhost:1056/graficos/grafico_vendas"
    fetch(endpoint).then(res => res.json()).then(res => {
        valores[0] = res.vendidos
        valores[1] = res.cancelados
        valores[2] = res.pagos
        valores[3] = res.pendentes
        valores[4] = res.vencidos
        lbl = res.periodo
        grafico1.update()
    }).catch(erro => {
        console.log("Erro encontrado: ", erro)
    })

    const endpoint2 = "http://localhost:1056/graficos/grafico_valores"
    fetch(endpoint2).then(res => res.json()).then(res => {
        valores2[0] = res.vendidos
        valores2[1] = res.canceladoss
        valores2[2] = res.pagos
        valores2[3] = res.pendentes
        valores2[4] = res.vencidos
        lbl2 = res.periodo
        grafico2.update()
    }).catch(erro => {
        console.log("Erro encontrado: ", erro)
    })
}

const interval = setInterval(obterDados, 3000)


/*const btn_imp = document.getElementById('btn_imp')

btn_imp.addEventListener("click", (evt) => {

    const conteudo = document.getElementById('pagina').innerHTML

    let estilo = "<style> "
    estilo += ".pagina {justify-content: start;align-items: start;margin: 0mm;border: none;width: 210mm;display: flex;flex-wrap: wrap;} "
    estilo += "table,thead,tbody,tfoot,tr,th,td,p {font-size: small;font-weight: bold;} "
    estilo += ".vale { width: 70mm; height: 28.7mm; padding-top: 1mm; padding-left: 7mm;} "
    estilo += " </style>"

    const win = window.open('', '', '')

    win.document.write('<html><head>')
    win.document.write('<title>Pagina de Impressao</title>')
    win.document.write(estilo)
    win.document.write('</head><body>')
    win.document.write(conteudo)
    win.document.write('</body></html>')

    win.print()

})*/
