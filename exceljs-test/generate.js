const { Workbook } = require("exceljs");

async function main() {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");

  worksheet.columns = [
    { header: "ID", key: "id", width: 20 },
    { header: "姓名", key: "name", width: 20 },
    { header: "生日", key: "birthday", width: 50 },
    { header: "手机号", key: "phone", width: 20 },
  ];

  const data = [
    {
      id: 1,
      name: "张三",
      birthday: "1990-01-01",
      phone: "12345678901",
    },
    {
      id: 2,
      name: "李四",
      birthday: "1990-01-01",
      phone: "12345678902",
    },
    {
      id: 3,
      name: "王五",
      birthday: "1990-01-01",
      phone: "12345678903",
    },
  ];
  worksheet.addRows(data);
  worksheet.eachRow((row, rowIndex) => {
    row.eachCell((cell) => {
      if (rowIndex === 1) {
        cell.style = {
          font: {
            size: 10,
            bold: true,
            color: { argb: "ffffff" },
          },
          alignment: { vertical: "middle", horizontal: "center" },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "000000" },
          },
          border: {
            top: { style: "dashed", color: { argb: "0000ff" } },
            left: { style: "dashed", color: { argb: "0000ff" } },
            bottom: { style: "dashed", color: { argb: "0000ff" } },
            right: { style: "dashed", color: { argb: "0000ff" } },
          },
        };
      } else {
        cell.style = {
          font: {
            size: 10,
            bold: true,
          },
          alignment: { vertical: "middle", horizontal: "left" },
          border: {
            top: { style: "dashed", color: { argb: "0000ff" } },
            left: { style: "dashed", color: { argb: "0000ff" } },
            bottom: { style: "dashed", color: { argb: "0000ff" } },
            right: { style: "dashed", color: { argb: "0000ff" } },
          },
        };
      }
    });
  });

  workbook.xlsx.writeFile("./new.xlsx");
}

main();
