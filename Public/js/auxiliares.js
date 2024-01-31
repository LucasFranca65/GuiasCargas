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

function confirmReprint(event, form) {
    event.preventDefault()
    var decision = confirm("Confirmar reimpressão ?")
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
            .map(cell => cell.textContent).join(',')
        ).join('\n')
    exportBtn.setAttribute('href',
        `data:text/csvcharset=utf-8,${encodeURIComponent(csvString)}`
    )
    exportBtn.setAttribute('download', 'table.csv')
})


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