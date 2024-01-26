const { Workbook } = require("exceljs");

async function main() {
  const workbook = new Workbook();
  const workbook2 = await workbook.xlsx.readFile('./data.xlsx')

  workbook2.eachSheet((sheet, index) => {
    console.log('工作表' + index);
    const value = sheet.getSheetValues()
    console.log(value);

    // sheet.eachRow((row, rowIndex) => {
    //   const rowData = []

    //   row.eachCell((cell, colIndex) => {
    //     rowData.push(cell.value)
    //   })

    //   console.log('行' + rowIndex, rowData);
    // })
  })
}

main()