const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const excel = require("exceljs");

const app = express();
const port = 3000;

// Middleware for JSON Base64 uploads
app.use(bodyParser.json({ limit: "50mb" }));

// Middleware for multipart/form-data uploads
const upload = multer({ dest: "uploads/" });

// Endpoint for JSON Base64 uploads
// Endpoint for JSON Base64 uploads
app.post("/convert-base64", async (req, res) => {
  const { fileName, fileContent } = req.body;

  if (!fileName || !fileContent) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  // Decode the Base64 encoded file
  const buffer = Buffer.from(fileContent, "base64");

  // Temporary file path
  const tempFilePath = `uploads/${fileName}`;

  // Save the buffer as a file
  fs.writeFile(tempFilePath, buffer, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to write file" });
    }

    try {
      // Convert the Excel file to CSV
      const csvOutput = await convertExcelToCSV(tempFilePath);

      // Set headers and send the CSV output
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}.csv`
      );
      res.send(csvOutput);
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
    }
  });
});

// Endpoint for multipart/form-data uploads
app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    const csvOutput = await convertExcelToCSV(req.file.path);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=output.csv");
    res.send(csvOutput);
  } catch (error) {
    res.status(500).send({ error: error.message });
  } finally {
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
  }
});

async function convertExcelToCSV(filePath) {
  const workbook = new excel.Workbook();
  await workbook.xlsx.readFile(filePath);

  let csvOutput = "";

  workbook.worksheets.forEach((worksheet) => {
    let rowCount = 0;

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      rowCount++;

      if (rowCount <= 2) {
        return; // skip the header and the second row
      }

      const firstCellValue = row.getCell(1).value;

      if (
        firstCellValue &&
        !isNaN(firstCellValue) &&
        typeof firstCellValue !== "object"
      ) {
        csvOutput +=
          row.values
            .slice(1, 8) // Only use the first 7 columns
            .map((cell) => {
              if (cell && typeof cell === "object") {
                if (cell.richText) {
                  // Concatenate rich text segments and remove commas
                  return cell.richText
                    .map((segment) => segment.text.replace(/,/g, ""))
                    .join("");
                }
                // Attempt to convert other types of objects
                return JSON.stringify(cell);
              }
              return String(cell).replace(/,/g, ""); // Remove commas
            })
            .join(",") + "\n";
      }
    });
  });

  return csvOutput;
}

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
