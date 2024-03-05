require("dotenv").config();
const express = require("express");
const app = express();
const fs = require("fs").promises; // Using promises-based FS module
const path = require("path");

const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");

// Read from .env if not available then defaults to 4000
const port = process.env.PORT || 4000;

//middleware
// use json you need import this
app.use(express.json());

app.use(cors());
const subfolder = "vinayak"; // Specify the subfolder name
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("database conected ");
  })
  .catch((error) => {
    console.log(error);
  });

// log request methode in console
app.use("/", (req, res, next) => {
  console.log(req.path, req.method);
  next();
});

app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.params.folder || ""; // Get the folder from the request parameters
    const uploadPath = path.join("uploads", folder);
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch((err) => cb(err, null));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Handle file uploads to a specific folder
app.post("/upload/:folder", upload.single("file"), (req, res) => {
  res.send("File uploaded successfully!");
});



app.post("/createFolder", async (req, res) => {
  const folderName = req.body.folderName;

  try {
    await fs.mkdir(`uploads/${folderName}`);
    res.status(200).json({ message: "Folder created successfully" });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Delete Folder
app.post("/deleteFolder", async (req, res) => {
  const folderName = req.body.folderName;

  try {
    // Use recursive option to delete the folder and its contents
    await fs.rmdir(`uploads/${folderName}`, { recursive: true });
    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Get all folders and their contents
app.get("/allFolders", async (req, res) => {
  const uploadsPath = path.join(__dirname, "uploads");

  try {
    const folders = await fs.readdir(uploadsPath);
    const folderData = await Promise.all(
      folders.map(async (folder) => {
        const folderPath = path.join(uploadsPath, folder);
        const files = await fs.readdir(folderPath);
        return { folder, files };
      })
    );

    res.status(200).json({ folders: folderData });
  } catch (error) {
    console.error("Error fetching all folders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// New endpoint for deleting a file
app.delete("/deleteFile/:folder/:filename", async (req, res) => {
  const folder = req.params.folder;
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", folder, filename);

  try {
    await fs.unlink(filePath);
    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Handle file downloads
app.get("/download/:folder/:filename", (req, res) => {
  try {
    const fileName = req.params.filename;
    const folder = req.params.folder;

    // Sanitize file and folder names
    const sanitizedFileName = path.basename(fileName);
    const sanitizedFolder = path.basename(folder);

    const filePath = path.join("uploads", sanitizedFolder, sanitizedFileName);

    res.download(filePath, (err) => {
      if (err) {
        // Handle errors (e.g., file not found)
        res.status(404).send("File not found");
      }
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port http://127.0.0.1:${port}`);
});
